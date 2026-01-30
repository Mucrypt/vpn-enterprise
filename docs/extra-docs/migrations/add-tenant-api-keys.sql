-- Migration: Add API keys columns to tenants table
-- Description: Adds anon_key and service_role_key columns for Database-as-a-Service API authentication
-- Date: 2026-01-30

-- Add API key columns to tenants table if they don't exist
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS anon_key TEXT,
ADD COLUMN IF NOT EXISTS service_role_key TEXT,
ADD COLUMN IF NOT EXISTS api_keys_generated_at TIMESTAMP WITH TIME ZONE;

-- Add comment to columns
COMMENT ON COLUMN tenants.anon_key IS 'JWT token for anon role - safe for client-side use with RLS';
COMMENT ON COLUMN tenants.service_role_key IS 'JWT token for service_role - bypasses RLS, server-side only';
COMMENT ON COLUMN tenants.api_keys_generated_at IS 'Timestamp when API keys were last generated';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_api_keys ON tenants(tenant_id) WHERE anon_key IS NOT NULL;

-- Grant appropriate permissions
-- Note: Adjust these based on your security requirements
GRANT SELECT ON tenants TO authenticated;
GRANT UPDATE (anon_key, service_role_key, api_keys_generated_at) ON tenants TO authenticated;
