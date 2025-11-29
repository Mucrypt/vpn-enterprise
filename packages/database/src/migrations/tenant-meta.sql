-- Multi-tenant meta schema (initial scaffold)
CREATE SCHEMA IF NOT EXISTS platform_meta;

CREATE TABLE IF NOT EXISTS platform_meta.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  max_connections INTEGER DEFAULT 100,
  max_storage_gb INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_meta.tenant_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES platform_meta.tenants(id) ON DELETE CASCADE,
  database_name VARCHAR(100) NOT NULL,
  database_owner VARCHAR(100) DEFAULT 'postgres',
  connection_string TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, database_name)
);

-- RLS placeholder (enable when using separate Postgres cluster)
-- ALTER TABLE platform_meta.tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE platform_meta.tenant_databases ENABLE ROW LEVEL SECURITY;
