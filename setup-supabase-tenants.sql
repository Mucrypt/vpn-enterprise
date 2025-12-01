-- =============================================
-- SUPABASE TENANTS TABLE SETUP
-- Execute this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PUBLIC TENANTS TABLE (for the web dashboard)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
  max_connections INTEGER DEFAULT 100,
  max_storage_gb INTEGER DEFAULT 10,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PLATFORM_META SCHEMA (for SQL editor functionality)
-- =============================================
CREATE SCHEMA IF NOT EXISTS platform_meta;

CREATE TABLE IF NOT EXISTS platform_meta.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  max_connections INTEGER DEFAULT 100,
  max_storage_gb INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_meta.tenant_databases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES platform_meta.tenants(id) ON DELETE CASCADE,
  database_name VARCHAR(100) NOT NULL,
  database_owner VARCHAR(100) DEFAULT 'postgres',
  connection_string TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, database_name)
);

-- =============================================
-- INSERT SAMPLE DATA
-- =============================================
INSERT INTO public.tenants (name, subdomain, plan_type, max_connections, max_storage_gb) 
VALUES 
  ('Demo Company', 'demo', 'enterprise', 500, 100),
  ('Test Corp', 'test', 'premium', 200, 50),
  ('Startup Ltd', 'startup', 'basic', 50, 10)
ON CONFLICT (subdomain) DO NOTHING;

INSERT INTO platform_meta.tenants (name, subdomain, plan_type, max_connections, max_storage_gb) 
VALUES 
  ('Demo Company', 'demo', 'enterprise', 500, 100),
  ('Test Corp', 'test', 'premium', 200, 50),
  ('Startup Ltd', 'startup', 'basic', 50, 10)
ON CONFLICT (subdomain) DO NOTHING;

-- =============================================
-- CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_platform_tenants_subdomain ON platform_meta.tenants(subdomain);

-- =============================================
-- ENABLE RLS (Row Level Security)
-- =============================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_meta.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_meta.tenant_databases ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (Allow access for authenticated users)
-- =============================================
CREATE POLICY "Allow authenticated users to read tenants" 
  ON public.tenants FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to read platform tenants" 
  ON platform_meta.tenants FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to read tenant databases" 
  ON platform_meta.tenant_databases FOR SELECT 
  TO authenticated 
  USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA platform_meta TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA platform_meta TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Tenants tables created successfully! You can now run your application.' as result;