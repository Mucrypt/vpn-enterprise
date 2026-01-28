#!/bin/bash
# Database Platform Initialization Script

set -e

resolve_password() {
    local value="$1"
    local filePath="$2"

    if [ -n "$value" ]; then
        printf '%s' "$value"
        return 0
    fi

    if [ -n "$filePath" ] && [ -f "$filePath" ]; then
        tr -d '\r\n' < "$filePath"
        return 0
    fi

    return 1
}

# Resolve admin password in a secrets-friendly way.
# Priority:
# 1) POSTGRES_ADMIN_PASSWORD
# 2) POSTGRES_ADMIN_PASSWORD_FILE
# 3) POSTGRES_PASSWORD (plain env)
# 4) POSTGRES_PASSWORD_FILE
# 5) /run/secrets/db_password
if [ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]; then
    POSTGRES_ADMIN_PASSWORD="$(
        resolve_password "${POSTGRES_ADMIN_PASSWORD:-}" "${POSTGRES_ADMIN_PASSWORD_FILE:-}" ||
        resolve_password "${POSTGRES_PASSWORD:-}" "${POSTGRES_PASSWORD_FILE:-}" ||
        resolve_password "" "/run/secrets/db_password" ||
        echo ""
    )"
    export POSTGRES_ADMIN_PASSWORD
fi

# ==============================================
# PLATFORM DATABASE SETUP
# ==============================================

echo "🚀 Initializing Database Platform..."

# Create platform administration database
echo "📦 Creating platform database and users..."

# Platform admin user (full privileges)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Create/update platform roles (idempotent)
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_admin') THEN
                CREATE ROLE platform_admin WITH LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD '$POSTGRES_ADMIN_PASSWORD';
            ELSE
                ALTER ROLE platform_admin WITH PASSWORD '$POSTGRES_ADMIN_PASSWORD';
            END IF;

            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tenant_admin') THEN
                CREATE ROLE tenant_admin WITH LOGIN CREATEDB PASSWORD 'tenant_admin_password';
            END IF;

            IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly_user') THEN
                CREATE ROLE readonly_user WITH LOGIN PASSWORD 'readonly_password';
            END IF;
        END
        $$;
    
    -- Grant necessary privileges
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO platform_admin;
    
    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOSQL

# ==============================================
# PLATFORM SCHEMA SETUP
# ==============================================

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

-- ==============================================
-- PLATFORM MANAGEMENT TABLES
-- ==============================================

-- Organizations (Multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    max_databases INTEGER DEFAULT 2,
    max_storage_gb INTEGER DEFAULT 1,
    max_connections INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Databases
CREATE TABLE IF NOT EXISTS tenant_databases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    connection_string TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    storage_used_mb INTEGER DEFAULT 0,
    connection_count INTEGER DEFAULT 0,
    last_backup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name),
    UNIQUE(database_name)
);

-- Database Users
CREATE TABLE IF NOT EXISTS database_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_database_id UUID NOT NULL REFERENCES tenant_databases(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    permissions JSONB DEFAULT '{"read": true, "write": false, "admin": false}',
    max_connections INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_database_id, username)
);

-- API Keys for tenant access
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tenant_database_id UUID REFERENCES tenant_databases(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{"read": true, "write": false}',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Usage Metrics
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_database_id UUID NOT NULL REFERENCES tenant_databases(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'queries', 'storage', 'connections'
    value BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    -- indexes are created below via CREATE INDEX
);

-- Backup History
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_database_id UUID NOT NULL REFERENCES tenant_databases(id) ON DELETE CASCADE,
    backup_type VARCHAR(20) NOT NULL, -- 'full', 'incremental'
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    status VARCHAR(20) DEFAULT 'in_progress',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Query Logs (for monitoring and analytics)
CREATE TABLE IF NOT EXISTS query_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_database_id UUID NOT NULL REFERENCES tenant_databases(id) ON DELETE CASCADE,
    user_id UUID,
    query_hash TEXT NOT NULL,
    query_text TEXT,
    execution_time_ms INTEGER,
    status VARCHAR(20), -- 'success', 'error'
    error_message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_tenant_databases_org_id ON tenant_databases(organization_id);
CREATE INDEX IF NOT EXISTS idx_database_users_tenant_db_id ON database_users(tenant_database_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_db_id ON api_keys(tenant_database_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_db_time ON usage_metrics(tenant_database_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_backup_history_tenant_db ON backup_history(tenant_database_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_tenant_db_time ON query_logs(tenant_database_id, executed_at);

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on all tenant tables
ALTER TABLE tenant_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;

-- Policies for organization isolation
CREATE POLICY tenant_databases_isolation ON tenant_databases 
    USING (organization_id = current_setting('app.current_organization')::UUID);

CREATE POLICY database_users_isolation ON database_users 
    USING (tenant_database_id IN (
        SELECT id FROM tenant_databases 
        WHERE organization_id = current_setting('app.current_organization')::UUID
    ));

CREATE POLICY api_keys_isolation ON api_keys 
    USING (organization_id = current_setting('app.current_organization')::UUID);

-- ==============================================
-- FUNCTIONS FOR TENANT MANAGEMENT
-- ==============================================

-- Function to create tenant database
CREATE OR REPLACE FUNCTION create_tenant_database(
    org_id UUID,
    db_name VARCHAR,
    db_display_name VARCHAR
) RETURNS UUID AS \$\$
DECLARE
    new_db_id UUID;
    connection_str TEXT;
BEGIN
    -- Generate unique database name
    db_name := 'tenant_' || replace(db_name, '-', '_');
    
    -- Create database
    EXECUTE format('CREATE DATABASE %I', db_name);
    
    -- Create connection string
    connection_str := format('postgresql://tenant_admin:tenant_admin_password@postgres-primary:5432/%s', db_name);
    
    -- Insert record
    INSERT INTO tenant_databases (organization_id, name, database_name, connection_string)
    VALUES (org_id, db_display_name, db_name, connection_str)
    RETURNING id INTO new_db_id;
    
    RETURN new_db_id;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to drop tenant database
CREATE OR REPLACE FUNCTION drop_tenant_database(db_id UUID) RETURNS BOOLEAN AS \$\$
DECLARE
    db_name VARCHAR;
BEGIN
    SELECT database_name INTO db_name FROM tenant_databases WHERE id = db_id;
    
    IF db_name IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Terminate connections
    PERFORM pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = db_name;
    
    -- Drop database
    EXECUTE format('DROP DATABASE IF EXISTS %I', db_name);
    
    -- Remove records
    DELETE FROM tenant_databases WHERE id = db_id;
    
    RETURN TRUE;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- TRIGGERS FOR AUDIT LOGGING
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tenant_databases_updated_at BEFORE UPDATE ON tenant_databases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER database_users_updated_at BEFORE UPDATE ON database_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================
-- SAMPLE DATA
-- ==============================================

-- Insert default organization for development
INSERT INTO organizations (name, slug, plan, max_databases, max_storage_gb, max_connections) 
VALUES ('Development', 'dev-org', 'pro', 10, 10, 100)
ON CONFLICT (slug) DO NOTHING;

-- Minimal tenant registry used by the dashboard Database editor
-- connection_info is intentionally stored WITHOUT a password; API reads password via env/secrets.
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    connection_info JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant membership table (control-plane) used by the API to authorize access.
-- User ids are Supabase auth user UUIDs.
CREATE TABLE IF NOT EXISTS tenant_members (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON tenant_members(user_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = '123e4567-e89b-12d3-a456-426614174000') THEN
        INSERT INTO tenants (id, name, connection_info)
        VALUES (
            '123e4567-e89b-12d3-a456-426614174000',
            'Primary Database',
            jsonb_build_object(
                'database', 'platform_db',
                'user', 'platform_admin',
                'port', 5432
            )
        );
    END IF;
END
$$;

EOSQL

echo "✅ Database Platform initialization completed!"