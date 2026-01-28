# Database Platform System Design (DBaaS)

This document describes the long-term architecture for a Supabase-like Database-as-a-Service inside this repo (VPN Enterprise), with **multi-user projects**, **secure tenant isolation**, and **arbitrary SQL execution** through a controlled gateway.

## Goals

- **Strong isolation** between customer projects (tenants) so arbitrary SQL can’t cross boundaries.
- **Central control-plane** for projects, membership, billing, quotas, audit.
- **Safe data-plane access** via a gateway that enforces authz, rate limits, timeouts, and logging.
- **Operational longevity**: backups, restore, migrations, and predictable scaling.

## Non-goals (for MVP)

- Full Postgres hosting automation across multiple clusters/regions.
- Full Supabase feature parity (realtime, edge functions, storage) unless added explicitly.

## Recommended Isolation Model

**Default: per-project database isolation** on a shared Postgres cluster.

Why this is the best “lifetime” choice:

- Database boundaries are a hard line that’s difficult to accidentally bypass.
- Limits blast radius (extensions, functions, `search_path`, temp objects, locks) to one tenant.
- Makes “arbitrary SQL” viable without relying on perfect query parsing.

Optional tiering (already matches existing `packages/tenant-provisioner` intent):

- `free`: schema isolation (with strict role and search_path controls)
- `pro`: database isolation
- `enterprise`: container isolation / dedicated cluster

## Current Repo Components (how it maps)

- **API (control + data gateway)**: `packages/api`
  - `DatabasePlatformClient` manages platform DB + per-tenant connections.
  - `UnifiedDataAPI` exposes `/api/v1/tenants/:tenantId/query`, `/schemas`, etc.
- **Tenant Provisioner**: `packages/tenant-provisioner`
  - Has plan→isolation selection and provisioning workflows.
- **Web dashboard**: `apps/web-dashboard`
  - Database UI calls `/api/v1/tenants/*` and query endpoints.
- **Infra / DB stack**: `infrastructure/docker` and root compose files.

## Two-Plane Architecture

### Control plane (metadata)

Stores:

- users, orgs/projects
- memberships & roles
- plans/quotas
- tenant DB connection metadata (encrypted secrets)
- audit logs and usage

Runs:

- API endpoints for project CRUD, keys, members
- provisioning orchestration (enqueue jobs)

### Data plane (customer databases)

Stores:

- the actual Postgres databases (one per project)

Runs:

- Postgres cluster (+ optional PgBouncer)
- query gateway in `packages/api` (or a dedicated gateway service later)

## Control Plane Data Model (platform_db)

You already have a `tenants` registry table in platform DB. For multi-user projects, the minimal durable model looks like:

- `projects` (aka tenants)
  - `id` (uuid)
  - `organization_id`
  - `name`
  - `plan`
  - `status`
  - `isolation_type`
  - `created_at`

- `project_members`
  - `project_id`
  - `user_id` (Supabase user id)
  - `role` (`owner|admin|editor|viewer`)
  - `created_at`

- `project_db_credentials` (encrypted)
  - `project_id`
  - `host`, `port`, `database`, `username`
  - `password_enc` (encrypted at rest)
  - `rotation_version`

- `audit_events`
  - `id`
  - `project_id`
  - `user_id`
  - `type` (query/schema/change/auth)
  - `meta` (jsonb)
  - `created_at`

- `usage_daily`
  - `project_id`
  - `date`
  - `queries_count`
  - `rows_scanned_estimate`
  - `cpu_ms`, `wall_ms`
  - `storage_bytes`

Notes:

- You can keep using `tenants.connection_info` as the “resolved” connection object, but long-term you should not store raw passwords unencrypted.
- For MVP, encryption can be symmetric using an application key (Docker secret), rotated later.

## AuthN/AuthZ

### Identity

- Continue using Supabase auth for identity (JWT verification).

### Authorization (critical)

The gateway must enforce:

- The caller is authenticated (valid JWT).
- The caller is a member of `tenantId` (project) with sufficient role.
  - `viewer`: read-only queries
  - `editor`: write queries + schema changes
  - `admin/owner`: provisioning, secrets rotation, destructive ops

**Important current gap:** `UnifiedDataAPI` still contains TODOs and temporary header-based identity (`x-user-id`). That’s fine for local dev, but it must be replaced with JWT-based membership checks before exposing it publicly.

## Query Gateway Rules (data plane guardrails)

Even with per-project DBs, you need guardrails to prevent self-DoS and abusive workloads.

Minimum set:

- Set server-side timeouts per request:
  - `SET LOCAL statement_timeout = '5s'` (tier-based)
  - `SET LOCAL lock_timeout = '2s'`
  - `SET LOCAL idle_in_transaction_session_timeout = '10s'`
- Rate limit by user + project (token bucket).
- Enforce maximum result sizes (rows/bytes) and paginate by default.
- Allowlist/denylist for dangerous statements by tier:
  - deny `COPY ... TO PROGRAM`, `CREATE EXTENSION` (unless allowlisted), `ALTER SYSTEM`, etc.
- Audit every query (metadata + timings). Consider storing a SHA-256 of SQL rather than raw text for lower sensitivity (or store encrypted raw SQL for enterprise).

## Provisioning Flow (MVP)

1. User creates a project from the dashboard.
2. API writes `projects` row and `project_members` owner entry.
3. API enqueues `provision-tenant` job (Redis/Bull is already used in provisioner).
4. Provisioner creates the tenant database + role, then writes connection info to platform DB.
5. UI can now list the tenant and run queries.

For database isolation, recommended resource layout:

- `db name`: `tenant_<uuid_underscore>`
- roles:
  - `<db>_owner` (owns the database)
  - `<db>_rw` (used by gateway for editor role)
  - `<db>_ro` (used by gateway for viewer role)

The gateway selects credentials based on membership role. This avoids trying to “parse SQL” to decide read vs write.

## Backups & Restore (operational longevity)

Minimum viable backup strategy:

- Enable WAL archiving + daily base backup.
- Retain 7–30 days for pro; longer for enterprise.
- Provide per-project restore:
  - point-in-time restore into a _new database_, then swap connection mapping.

## Scaling Strategy

- Start with one Postgres cluster + PgBouncer.
- Introduce “project placement” metadata:
  - `projects.cluster_id`
- When scaling out, provision new projects into new clusters; migrate old ones via logical replication or dump/restore.

## Implementation Roadmap (repo-scoped)

### Phase 0: Safety hardening (do this before wide exposure)

- Add proper auth + membership enforcement for all `/api/v1/tenants/:tenantId/*` endpoints.
- Remove header-based identity paths.

### Phase 1: Multi-user projects

- Add `projects` and `project_members` tables (or extend existing `tenants` table with membership relations).
- Add API endpoints:
  - create/list projects
  - invite members
  - set roles

### Phase 2: Tiered isolation

- Align `packages/tenant-provisioner` with your selected default (database isolation).
- Ensure provisioner writes a clean `connection_info` object per tenant.

### Phase 3: Quotas + billing gates

- Track usage and enforce plan limits in gateway.
- Integrate `packages/billing` for upgrades/downgrades.

## Design Choices That Protect You Long-Term

- Per-project DB isolation as the default for any plan that allows arbitrary SQL.
- Role-based DB credentials (`ro` vs `rw`) to enforce permissions without SQL parsing.
- Audit logs + timeouts + rate limits as non-negotiable guardrails.
- Treat platform DB as the source of truth for tenant registry (avoid environment-driven ambiguity).
