-- Migration: Add region column to tenants table
-- Purpose: Store user-selected region for tenant projects
-- Run this on your production database before deploying the new code

-- Add region column with default value
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'us-east-1';

-- Create index for filtering by region (useful for multi-region deployments)
CREATE INDEX IF NOT EXISTS tenants_region_idx ON tenants(region);

-- Update existing tenants to have the default region
UPDATE tenants SET region = 'us-east-1' WHERE region IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN tenants.region IS 'AWS-style region identifier for tenant deployment location (e.g., us-east-1, eu-central-1)';
