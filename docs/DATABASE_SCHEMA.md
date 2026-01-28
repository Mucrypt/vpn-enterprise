# Database Schema Documentation

## Platform Database (`platform_db`)

The platform database is the control plane for the Database-as-a-Service platform. It manages tenant metadata, user memberships, and platform configuration.

### Tables

#### `tenants`

Stores all database projects (tenants) created by users.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Display name of the project
  subdomain TEXT,                         -- Optional subdomain for the project
  status TEXT NOT NULL DEFAULT 'active',  -- Status: 'active', 'suspended', 'deleted'
  plan_type TEXT,                         -- Plan: 'free', 'premium', 'enterprise'
  region TEXT DEFAULT 'us-east-1',        -- AWS-style region identifier
  connection_info JSONB NOT NULL DEFAULT '{}'::jsonb,  -- DB connection details
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tenants_created_at_idx ON tenants (created_at DESC);
CREATE INDEX tenants_region_idx ON tenants(region);
```

**Columns:**

- `id`: UUID primary key for the tenant
- `name`: Human-readable project name
- `subdomain`: Optional subdomain (e.g., `myapp.database.com`)
- `status`: Current status (active/suspended/deleted)
- `plan_type`: Subscription plan level
- `region`: Geographic region for deployment (us-east-1, eu-central-1, etc.)
- `connection_info`: JSON object containing database connection details:
  ```json
  {
    "host": "vpn-postgres",
    "port": 5432,
    "database": "tenant_abc123",
    "username": "tenant_abc123_owner"
  }
  ```
- `created_at`: Timestamp when project was created
- `updated_at`: Timestamp of last update

#### `tenant_members`

Maps users to tenants with role-based access control.

```sql
CREATE TABLE tenant_members (
  tenant_id UUID NOT NULL,               -- References tenants(id)
  user_id UUID NOT NULL,                 -- References users in auth system
  role TEXT NOT NULL DEFAULT 'viewer',   -- Role: 'owner', 'admin', 'member', 'viewer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX tenant_members_user_idx ON tenant_members (user_id);
```

**Columns:**

- `tenant_id`: The project UUID
- `user_id`: The Supabase Auth user UUID
- `role`: Access level:
  - `owner`: Full control, can delete project
  - `admin`: Manage settings, invite users
  - `member`: Read/write database access
  - `viewer`: Read-only database access
- `created_at`: When user was added to the project

---

## Tenant Databases (`tenant_*`)

Each tenant gets a dedicated PostgreSQL database. The database name format is `tenant_{uuid}` (hyphens removed from UUID).

### Standard Schema

Each tenant database includes:

#### System Tables

- PostgreSQL catalog tables (`pg_catalog`)
- Information schema (`information_schema`)

#### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- Cryptographic functions
```

#### Default Schemas

- `public`: Default schema for user tables
- Custom schemas created by users via SQL Editor

### User-Created Objects

Users can create:

- **Tables**: Via SQL Editor or Tables UI
- **Schemas**: Organize tables into namespaces
- **Functions**: Custom PL/pgSQL functions
- **Triggers**: Automated actions on table events
- **Indexes**: Performance optimization
- **Views**: Virtual tables
- **Policies**: Row-level security rules

---

## Future Enhancements

### Planned Tables

#### `tenant_analytics`

Track usage metrics per tenant:

- Query count
- Storage usage
- Connection count
- CPU/memory usage

```sql
CREATE TABLE tenant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  metric_type TEXT NOT NULL,  -- 'query_count', 'storage_mb', etc.
  metric_value NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `tenant_backups`

Automated backup tracking:

```sql
CREATE TABLE tenant_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  backup_type TEXT NOT NULL,  -- 'full', 'incremental'
  backup_size_bytes BIGINT,
  backup_location TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

#### `tenant_invitations`

Pending user invitations:

```sql
CREATE TABLE tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `platform_settings`

Global configuration:

```sql
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `audit_logs`

Platform-wide audit trail:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,  -- 'tenant.create', 'tenant.delete', 'user.invite'
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_tenant_idx ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX audit_logs_user_idx ON audit_logs(user_id, created_at DESC);
```

---

## Queries for Admin Dashboard

### Get all tenants with stats

```sql
SELECT
  t.id,
  t.name,
  t.region,
  t.plan_type,
  t.created_at,
  COUNT(tm.user_id) as member_count
FROM tenants t
LEFT JOIN tenant_members tm ON t.id = tm.tenant_id
WHERE t.status = 'active'
GROUP BY t.id
ORDER BY t.created_at DESC;
```

### Get tenant count by region

```sql
SELECT
  region,
  COUNT(*) as project_count
FROM tenants
WHERE status = 'active'
GROUP BY region
ORDER BY project_count DESC;
```

### Get tenant count by plan

```sql
SELECT
  plan_type,
  COUNT(*) as project_count
FROM tenants
WHERE status = 'active'
GROUP BY plan_type;
```

### Get user's tenants

```sql
SELECT
  t.*,
  tm.role
FROM tenants t
JOIN tenant_members tm ON t.id = tm.tenant_id
WHERE tm.user_id = $1 AND t.status = 'active'
ORDER BY t.created_at DESC;
```

---

## Database Provisioning Flow

1. **User creates project** → POST `/api/v1/tenants/self`
2. **Platform creates tenant record** → INSERT INTO `tenants`
3. **Platform provisions database**:
   - Creates PostgreSQL database: `tenant_{uuid}`
   - Creates database role/user: `tenant_{uuid}_owner`
   - Sets password for role
   - Grants all privileges
4. **Stores connection info** → UPDATE `tenants.connection_info`
5. **Adds user as owner** → INSERT INTO `tenant_members`

---

## Security Considerations

### Platform Database

- Only API server has access
- User credentials: `platform_admin` / secure password
- No direct user access
- All access through API endpoints

### Tenant Databases

- Each tenant has isolated database
- Each tenant has dedicated role/user
- Password set by user during creation
- No cross-tenant data access
- Row-level security can be enabled by users

---

## Backup Strategy

### Platform Database

- Daily full backups
- Point-in-time recovery enabled
- Retention: 30 days

### Tenant Databases

**Free Plan:**

- Daily backups
- 7-day retention

**Premium Plan:**

- Hourly backups
- 30-day retention
- Point-in-time recovery

**Enterprise Plan:**

- Continuous backup
- 90-day retention
- Cross-region replication
