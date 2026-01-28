#!/usr/bin/env bash
set -euo pipefail

# Bootstraps a tenant + memberships in the platform DB (idempotent).
#
# Usage examples:
#   TENANT_ID="11111111-1111-1111-1111-111111111111" \
#   TENANT_NAME="Primary Tenant" \
#   TENANT_SUBDOMAIN="primary" \
#   ADMIN_USER_ID="8a8f52ac-2f0f-4249-9bad-2175d04dd001" \
#   USER_ID="26bbdda1-3c1b-43f9-85f4-dc1a83761674" \
#   ./scripts/bootstrap-platform-tenant.sh
#
# Defaults assume the Docker Compose production stack in infrastructure/docker.

TENANT_ID="${TENANT_ID:-}"
TENANT_NAME="${TENANT_NAME:-Primary Tenant}"
TENANT_SUBDOMAIN="${TENANT_SUBDOMAIN:-primary}"

ADMIN_USER_ID="${ADMIN_USER_ID:-}"
ADMIN_ROLE="${ADMIN_ROLE:-owner}"

USER_ID="${USER_ID:-}"
USER_ROLE="${USER_ROLE:-editor}"

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-vpn-postgres}"
PLATFORM_DB_USER="${PLATFORM_DB_USER:-platform_admin}"
PLATFORM_DB_NAME="${PLATFORM_DB_NAME:-platform_db}"

if [[ -z "$TENANT_ID" ]]; then
  echo "TENANT_ID is required" >&2
  exit 1
fi

if [[ -z "$ADMIN_USER_ID" ]]; then
  echo "ADMIN_USER_ID is required" >&2
  exit 1
fi

if [[ -z "$USER_ID" ]]; then
  echo "USER_ID is required" >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || {
  echo "docker is required" >&2
  exit 1
}

echo "Bootstrapping tenant + memberships in $PLATFORM_DB_NAME (container: $POSTGRES_CONTAINER)"

docker exec -i "$POSTGRES_CONTAINER" psql -U "$PLATFORM_DB_USER" -d "$PLATFORM_DB_NAME" <<SQL
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  subdomain text,
  status text DEFAULT 'active',
  plan_type text DEFAULT 'free',
  connection_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

INSERT INTO tenants (id, name, subdomain, connection_info)
VALUES ('$TENANT_ID', '$TENANT_NAME', '$TENANT_SUBDOMAIN', '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subdomain = EXCLUDED.subdomain,
  updated_at = now();

INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES
  ('$TENANT_ID', '$ADMIN_USER_ID', '$ADMIN_ROLE'),
  ('$TENANT_ID', '$USER_ID', '$USER_ROLE')
ON CONFLICT (tenant_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = now();

COMMIT;
SQL

echo "Done. Next: verify via GET /api/v1/tenants/me in the dashboard session(s)."
