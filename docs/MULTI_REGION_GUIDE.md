# Multi-Region Implementation Guide

## Overview

Your VPN Enterprise Database-as-a-Service now supports region selection during project creation. This guide explains the current implementation and how to expand to true multi-region deployment.

## Current Implementation (Single Hetzner Server)

### What's Implemented ✅

1. **Region Selection UI** - Users can select from 6 regions during project creation
2. **Region Storage** - Selected region is stored in the `tenants.region` column
3. **Region Display** - Region is shown in project details with flag emojis

### Database Schema

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT,
  region TEXT DEFAULT 'us-east-1',  -- NEW: User-selected region
  plan_type TEXT,
  status TEXT DEFAULT 'active',
  connection_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Available Regions

| Region ID        | Name                     | Flag | Status        |
| ---------------- | ------------------------ | ---- | ------------- |
| `us-east-1`      | US East (N. Virginia)    | 🇺🇸   | Default       |
| `us-west-1`      | US West (N. California)  | 🇺🇸   | Metadata only |
| `eu-central-1`   | EU Central (Frankfurt)   | 🇪🇺   | Metadata only |
| `eu-west-1`      | EU West (Ireland)        | 🇪🇺   | Metadata only |
| `ap-southeast-1` | Asia Pacific (Singapore) | 🇸🇬   | Metadata only |
| `ap-northeast-1` | Asia Pacific (Tokyo)     | 🇯🇵   | Metadata only |

**Note:** Currently, all tenant databases are provisioned on your single Hetzner server regardless of region selection. The region field is metadata for future use.

## Migration to Production Database

Run this SQL on your production database:

```bash
# Connect to your production database
docker exec -it vpn-postgres psql -U platform_admin -d platform_db

# Run the migration
\i /path/to/migration.sql
```

Or manually:

```sql
-- Add region column
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'us-east-1';

-- Create index
CREATE INDEX IF NOT EXISTS tenants_region_idx ON tenants(region);

-- Backfill existing tenants
UPDATE tenants SET region = 'us-east-1' WHERE region IS NULL;
```

## Production Deployment Steps

### 1. Apply Database Migration

```bash
# SSH into your Hetzner server
ssh root@your-server-ip

# Navigate to project
cd /opt/vpn-enterprise

# Pull latest code
git pull

# Apply migration
docker exec -i vpn-postgres psql -U platform_admin -d platform_db < infrastructure/migrations/add-region-to-tenants.sql
```

### 2. Rebuild and Deploy

```bash
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Verify Deployment

```bash
# Check API logs
docker logs vpn-api --tail=50

# Check web logs
docker logs vpn-web --tail=50

# Test health endpoint
curl https://chatbuilds.com/health
```

### 4. Test Region Selection

1. Go to: https://chatbuilds.com/databases/new
2. Create a new project
3. Select a region (note: database will still be on main server)
4. Verify region is stored in database:

```sql
SELECT id, name, region, created_at FROM tenants ORDER BY created_at DESC LIMIT 5;
```

## Future: True Multi-Region Architecture

To actually deploy databases in different regions, you have several options:

### Option 1: Multi-Server Hetzner Setup (Cost-Effective)

**Architecture:**

- Deploy additional Hetzner servers in different locations
- Each server runs PostgreSQL for its region
- Central API server routes requests based on tenant region

**Cost:** ~€40/month per region (Hetzner CX41 or AX41)

**Setup:**

```yaml
# Example architecture
regions:
  us-east-1:
    provider: hetzner-us
    server: vpn-db-us.yourdomain.com
    postgres_host: 10.0.1.10

  eu-central-1:
    provider: hetzner-de
    server: vpn-db-eu.yourdomain.com
    postgres_host: 10.0.2.10
```

**Implementation Steps:**

1. Deploy additional Hetzner servers in desired regions
2. Install PostgreSQL on each
3. Update `DatabasePlatformClient` to route connections by region
4. Implement cross-region backup/replication

### Option 2: Cloud Database Services (Easiest)

**Use managed services with built-in multi-region:**

#### Supabase (Recommended for MVP)

- Built-in multi-region support
- Automatic backups
- Easy integration
- **Cost:** ~$25/month per project

```typescript
// Provision tenant in specific region
const { data: project } = await supabase.auth.admin.createProject({
  name: 'My Project',
  region: 'us-east-1', // or 'eu-central-1'
})
```

#### Neon Database

- Serverless PostgreSQL
- Region selection per database
- **Cost:** Pay-per-use, ~$20-50/month

```typescript
// Create Neon project in specific region
const project = await neon.createProject({
  name: 'tenant-project',
  region_id: 'aws-us-east-1',
})
```

#### AWS RDS Multi-Region

- Full control
- Read replicas across regions
- **Cost:** ~$100+/month per region

### Option 3: Hybrid (Recommended)

**Primary:** Single Hetzner server for free tier
**Premium:** Provision in cloud provider based on region

```typescript
async function provisionTenant(region: string, planType: string) {
  if (planType === 'free') {
    // Use main Hetzner server
    return provisionOnPrimaryServer()
  } else {
    // Use cloud provider in selected region
    return provisionCloudDatabase(region)
  }
}
```

## Code Changes Needed for Multi-Region

### 1. Update Connection Routing

```typescript
// packages/api/src/database-platform-client.ts
async getTenantConnection(tenantId: string, mode: 'ro' | 'rw' = 'rw'): Promise<Pool> {
  // Get tenant info including region
  const tenant = await this.platformPool.query(
    'SELECT region, connection_info FROM tenants WHERE id = $1',
    [tenantId]
  )

  const region = tenant.rows[0]?.region || 'us-east-1'

  // Route to appropriate database server
  const dbHost = this.getRegionalHost(region)

  // Create connection pool for this region
  const pool = new Pool({
    host: dbHost,
    port: 5432,
    database: `tenant_${tenantId.replace(/-/g, '_')}`,
    // ... other config
  })

  return pool
}

private getRegionalHost(region: string): string {
  const regionHosts = {
    'us-east-1': process.env.POSTGRES_HOST_US_EAST || 'postgres-primary',
    'eu-central-1': process.env.POSTGRES_HOST_EU || 'postgres-eu',
    'ap-southeast-1': process.env.POSTGRES_HOST_APAC || 'postgres-apac',
  }

  return regionHosts[region] || regionHosts['us-east-1']
}
```

### 2. Add Region-Specific Environment Variables

```bash
# .env.production
POSTGRES_HOST_US_EAST=vpn-postgres  # Main server
POSTGRES_HOST_EU=db-eu.yourdomain.com  # EU server
POSTGRES_HOST_APAC=db-apac.yourdomain.com  # APAC server
```

### 3. Update Provisioning Logic

```typescript
// packages/api/src/routes/tenants/provisioning.ts
export async function ensureTenantDatabaseProvisioned(opts: {
  tenantId: string
  region: string  // NEW
  desiredPassword?: string
}): Promise<{...}> {
  // Determine host based on region
  const host = getRegionalPostgresHost(opts.region)
  const port = getRegionalPostgresPort(opts.region)

  // Provision on the regional server
  const adminPool = new Pool({
    host,
    port,
    database: 'postgres',
    user: getRegionalProvisionUser(opts.region),
    password: getRegionalProvisionPassword(opts.region),
  })

  // ... rest of provisioning logic
}
```

## Monitoring & Operations

### Check Region Distribution

```sql
-- See how many tenants per region
SELECT region, COUNT(*) as tenant_count,
       COUNT(*) FILTER (WHERE plan_type = 'free') as free_count,
       COUNT(*) FILTER (WHERE plan_type != 'free') as paid_count
FROM tenants
GROUP BY region
ORDER BY tenant_count DESC;
```

### Monitor Regional Performance

```sql
-- Track query performance by region
SELECT
  t.region,
  AVG(q.execution_time_ms) as avg_query_time_ms,
  COUNT(*) as query_count
FROM query_logs q
JOIN tenants t ON q.tenant_id = t.id
WHERE q.executed_at > NOW() - INTERVAL '24 hours'
GROUP BY t.region;
```

## Security Considerations

1. **Network Isolation:** Use private networks between regional servers
2. **Encrypted Connections:** Always use SSL for database connections
3. **Secrets Management:** Use different credentials per region
4. **Backup Strategy:** Implement cross-region backups

## Cost Estimates

### Current (Single Server)

- Hetzner server: ~€40/month
- Total: **€40/month**

### Multi-Region Expansion Options

**Option A: 3 Hetzner Servers**

- US: €40/month
- EU: €40/month
- APAC: €40/month
- **Total: €120/month (~$130)**

**Option B: Hybrid (Hetzner + Supabase)**

- Hetzner (free tier): €40/month
- Supabase (premium): $25/project
- **Scales per customer**

**Option C: Full Cloud (Neon/Supabase)**

- Per-tenant pricing
- ~$20-50 per active tenant database
- No infrastructure management

## Recommended Next Steps

1. ✅ Deploy current code (region metadata)
2. Monitor which regions users select
3. If 80%+ users pick one non-default region → deploy server there
4. For premium/enterprise → offer true multi-region with Supabase/Neon
5. Keep free tier on main Hetzner server

## Questions?

- **"Do users get actual multi-region now?"** No, region is stored but all DBs are on your main server.
- **"When should I expand to real multi-region?"** When you have 100+ users or paying customers requesting it.
- **"Cheapest multi-region option?"** Deploy 2-3 Hetzner servers in different datacenters (~€120/month total).

## Support

For issues or questions about multi-region deployment:

1. Check logs: `docker logs vpn-api`
2. Verify region: `SELECT region FROM tenants WHERE id = 'your-tenant-id'`
3. Test connectivity: `psql -h postgres-primary -U platform_admin -d platform_db`
