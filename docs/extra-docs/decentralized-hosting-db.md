# Decentralized Hosting — Database Blueprint

Proposed tables (Supabase/Postgres), aligned with repositories in `packages/database`.

## hosting_nodes
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `region` TEXT NOT NULL
- `capabilities` TEXT[] NOT NULL
- `public_key` TEXT
- `status` TEXT CHECK (status IN ('healthy','degraded','down')) DEFAULT 'healthy'
- `created_at` TIMESTAMP DEFAULT NOW()

RLS: Read allowed to authenticated users; write restricted to admins.

## service_attestations
- `id` TEXT PRIMARY KEY
- `service_id` TEXT NOT NULL REFERENCES hosted_services(id) ON DELETE CASCADE
- `type` TEXT NOT NULL CHECK (type IN ('attest','deploy','backup','scale'))
- `hash` TEXT NOT NULL
- `signer` TEXT
- `tx_ref` TEXT
- `created_at` TIMESTAMP DEFAULT NOW()

RLS: Row owner is derived from `service_id` owner; only owner/admin may read.

## edge_distributions
- `id` TEXT PRIMARY KEY
- `service_id` TEXT NOT NULL REFERENCES hosted_services(id) ON DELETE CASCADE
- `target_regions` TEXT[] NOT NULL
- `artifact_hash` TEXT
- `created_at` TIMESTAMP DEFAULT NOW()

RLS: Same as `service_attestations`.

---

## Repository Interfaces (sketch)
```ts
// packages/database/src/repositories/HostingNodeRepository.ts
export class HostingNodeRepository {
  static async list(): Promise<any[]> { /* ... */ }
  static async upsert(node: any): Promise<void> { /* ... */ }
}

// packages/database/src/repositories/ServiceAttestationRepository.ts
export class ServiceAttestationRepository {
  static async create(att: any): Promise<any> { /* ... */ }
  static async listByService(serviceId: string): Promise<any[]> { /* ... */ }
}

// packages/database/src/repositories/EdgeDistributionRepository.ts
export class EdgeDistributionRepository {
  static async create(dist: any): Promise<any> { /* ... */ }
  static async listByService(serviceId: string): Promise<any[]> { /* ... */ }
}
```

Add migrations in `docs/extra-docs/` and wire repositories incrementally.