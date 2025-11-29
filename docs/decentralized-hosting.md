# Decentralized Hosting — Foundation Plan

Goal: Combine Hostinger-like ease of use with Supabase-like DX, while adding blockchain security (attestation, audit trails) and edge computing for performance.

## Pillars
- Node Registry: discover and manage edge nodes/providers
- Service Attestation: cryptographic proofs for service state & actions
- Edge Distribution: deploy workloads or static assets near users
- Secure Storage: content-addressed artifacts (e.g., IPFS/S3) with verifiable hashes
- Observability: per-node metrics, logs, SLA checks

## Minimal MVP (Phase 1)
- API stubs for
  - `GET /api/v1/hosting/network/nodes` — list registered nodes
  - `POST /api/v1/hosting/services/:id/attest` — emit attest event (returns attestationId)
  - `POST /api/v1/hosting/services/:id/distribute` — record intent to distribute workload to edges
- Client methods in web to call these
- UI buttons on Service Detail for Attest + Distribute (with toasts)

## Data Model (logical)
- `hosting_nodes`: id, name, region, capabilities, public_key, status
- `service_attestations`: id, service_id, type, hash, signer, tx_ref, created_at
- `edge_distributions`: id, service_id, target_regions[], artifact_hash, created_at

## Security & Blockchain
- Sign attestation payloads with server key; optionally submit to chain (later)
- Store immutable event logs (hashes) for audit; anchor periodically on-chain

## Edge Computing
- Start with regional distribution records; later integrate Cloudflare Workers/Fly.io/Edge runtimes
- Static artifacts: upload to storage, verify SHA-256, replicate via CDN/edge

## Roadmap
- Phase 2: IPFS integration for artifacts; lightweight on-chain anchoring
- Phase 3: Policy engine for node selection and SLA
- Phase 4: Real edge deployments with health checks and rollback

## Dev Notes
- Keep stubs in existing `hosting.ts` to avoid churn
- Expand repositories under `packages/database` as tables are added
- Use feature flags via env (e.g., `DECENTRAL_HOSTING_ENABLED=true`) to toggle UI actions