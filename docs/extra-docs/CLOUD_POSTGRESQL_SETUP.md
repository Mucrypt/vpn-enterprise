# Cloud PostgreSQL Setup Guide
## Immediate Implementation for VPN Enterprise DBaaS

### 🎯 Quick Start: Neon PostgreSQL Integration

This guide focuses on the immediate steps to set up cloud PostgreSQL for your SQL Editor and multi-tenant database platform.

---

## 🚀 Option 1: Neon Database (Recommended)

### Why Neon?
- **Serverless PostgreSQL**: Auto-scaling and instant provisioning
- **Database Branching**: Perfect for development workflows
- **Generous Free Tier**: Great for MVP launch
- **Modern Developer Experience**: API-first architecture
- **Cost Effective**: Pay only for what you use

### 1.1 Neon Account Setup

1. **Create Neon Account**
   ```bash
   # Visit https://neon.tech and sign up
   # Create your first project
   ```

2. **Get API Key and Database URL**
   ```bash
   # From Neon Dashboard → Settings → API Keys
   NEON_API_KEY=neon_api_xxxxxxxxxxxxx
   
   # From Neon Dashboard → Connection Details
   NEON_DATABASE_URL=postgresql://username:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 1.2 Enhanced Database Platform Client

Create the new Neon-powered database client:

```typescript
// packages/database-platform-client/src/neon-database-client.ts
import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { Client } from 'pg';

export interface NeonConfig {
  apiKey: string;
  defaultRegion: string;
  organizationId?: string;
}

export interface TenantDatabase {
  id: string;
  name: string;
  connectionString: string;
  branch: string;
  createdAt: Date;
  status: 'creating' | 'active' | 'suspended';
}

export class NeonDatabaseClient {
  private apiKey: string;
  private baseUrl = 'https://console.neon.tech/api/v2';
  private tenantConnections: Map<string, Pool> = new Map();

  constructor(config: NeonConfig) {
    this.apiKey = config.apiKey;
    neonConfig.fetchConnectionCache = true;
  }

  async createTenantProject(tenantId: string, tenantName: string): Promise<TenantDatabase> {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: {
          name: `vpn-enterprise-${tenantName}`,
          region_id: 'aws-us-east-1',
          settings: {
            compute_provisioner: 'k8s-pod',
            pg_version: 15,
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create tenant project: ${response.statusText}`);
    }

    const project = await response.json();
    
    // Create main database in the project
    const database = await this.createDatabase(project.project.id, 'main');
    
    // Get connection string
    const connectionString = await this.getConnectionString(project.project.id, database.id);

    return {
      id: project.project.id,
      name: tenantName,
      connectionString,
      branch: 'main',
      createdAt: new Date(),
      status: 'active'
    };
  }

  async createDatabase(projectId: string, databaseName: string) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/databases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        database: {
          name: databaseName,
          owner_name: 'neondb_owner'
        }
      })
    });

    return response.json();
  }

  async getConnectionString(projectId: string, databaseId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/connection_uri`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      }
    });

    const data = await response.json();
    return data.uri;
  }

  async getTenantConnection(tenantId: string): Promise<Pool> {
    if (!this.tenantConnections.has(tenantId)) {
      // Get tenant's database connection string from your database
      const tenant = await this.getTenantInfo(tenantId);
      
      if (!tenant?.connectionString) {
        throw new Error(`No database found for tenant: ${tenantId}`);
      }

      const sql = neon(tenant.connectionString);
      this.tenantConnections.set(tenantId, sql);
    }

    return this.tenantConnections.get(tenantId)!;
  }

  async executeQuery(tenantId: string, query: string, params: any[] = []): Promise<any[]> {
    const sql = await this.getTenantConnection(tenantId);
    
    try {
      const result = await sql(query, params);
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error(`Query execution error for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async createBranch(projectId: string, branchName: string, fromBranch: string = 'main'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/branches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: {
          name: branchName,
          parent_id: fromBranch
        }
      })
    });

    return response.json();
  }

  private async getTenantInfo(tenantId: string): Promise<TenantDatabase | null> {
    // Query your main database for tenant info
    // This should be stored in your Supabase database
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data, error } = await supabase
      .from('platform_tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching tenant info:', error);
      return null;
    }

    return data;
  }
}
```

### 1.3 Enhanced Tenant Provisioner

Update your tenant provisioner to use Neon:

```typescript
// packages/tenant-provisioner/src/services/neon-tenant-provisioning-service.ts
import { NeonDatabaseClient } from '../../database-platform-client/src/neon-database-client';
import { createClient } from '@supabase/supabase-js';

export interface TenantProvisioningConfig {
  name: string;
  planType: 'free' | 'pro' | 'team' | 'enterprise';
  userId: string;
  organizationId?: string;
}

export class NeonTenantProvisioningService {
  private neonClient: NeonDatabaseClient;
  private supabase: any;

  constructor(neonConfig: any) {
    this.neonClient = new NeonDatabaseClient(neonConfig);
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async provisionTenant(config: TenantProvisioningConfig): Promise<TenantDatabase> {
    try {
      // 1. Create Neon project and database
      const tenantDb = await this.neonClient.createTenantProject(
        `tenant-${Date.now()}`,
        config.name
      );

      // 2. Store tenant info in your main database
      const { data: tenant, error } = await this.supabase
        .from('platform_tenants')
        .insert({
          id: tenantDb.id,
          name: config.name,
          connection_string: tenantDb.connectionString,
          plan_type: config.planType,
          user_id: config.userId,
          organization_id: config.organizationId,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store tenant info: ${error.message}`);
      }

      // 3. Initialize tenant database schema
      await this.initializeTenantSchema(tenantDb.id);

      // 4. Set up default permissions
      await this.setupDefaultPermissions(tenantDb.id, config.userId);

      return tenantDb;

    } catch (error) {
      console.error('Tenant provisioning failed:', error);
      throw error;
    }
  }

  async initializeTenantSchema(tenantId: string): Promise<void> {
    const initQueries = [
      // Create default schemas
      `CREATE SCHEMA IF NOT EXISTS public;`,
      `CREATE SCHEMA IF NOT EXISTS auth;`,
      `CREATE SCHEMA IF NOT EXISTS storage;`,
      
      // Create sample tables for demo
      `CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS public.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        owner_id UUID REFERENCES public.profiles(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Enable RLS
      `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;`,
    ];

    for (const query of initQueries) {
      await this.neonClient.executeQuery(tenantId, query);
    }
  }

  async setupDefaultPermissions(tenantId: string, userId: string): Promise<void> {
    // Set up Row Level Security policies
    const policies = [
      `CREATE POLICY "Users can view own profile" ON public.profiles 
       FOR SELECT USING (auth.uid() = id);`,
       
      `CREATE POLICY "Users can update own profile" ON public.profiles 
       FOR UPDATE USING (auth.uid() = id);`,
       
      `CREATE POLICY "Users can view own projects" ON public.projects 
       FOR SELECT USING (auth.uid() = owner_id);`,
       
      `CREATE POLICY "Users can create projects" ON public.projects 
       FOR INSERT WITH CHECK (auth.uid() = owner_id);`,
    ];

    for (const policy of policies) {
      try {
        await this.neonClient.executeQuery(tenantId, policy);
      } catch (error) {
        // Policy might already exist, continue
        console.warn(`Policy creation warning:`, error);
      }
    }
  }

  async deleteTenant(tenantId: string): Promise<void> {
    // This would delete the entire Neon project
    // Be very careful with this in production
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${tenantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.NEON_API_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete tenant project: ${response.statusText}`);
    }

    // Remove from your tracking database
    await this.supabase
      .from('platform_tenants')
      .delete()
      .eq('id', tenantId);
  }
}
```

### 1.4 Update Your API Routes

Update the tenant routes to use the new provisioning service:

```typescript
// packages/api/src/routes/tenants.ts
import { NeonTenantProvisioningService } from '../../tenant-provisioner/src/services/neon-tenant-provisioning-service';

const neonTenantService = new NeonTenantProvisioningService({
  apiKey: process.env.NEON_API_KEY!,
  defaultRegion: 'aws-us-east-1'
});

// Create new tenant with dedicated database
app.post('/api/v1/tenants', async (req, res) => {
  try {
    const { name, planType = 'free' } = req.body;
    const userId = req.user.id; // From auth middleware
    
    const tenant = await neonTenantService.provisionTenant({
      name,
      planType,
      userId
    });
    
    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Tenant creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute SQL queries on tenant database
app.post('/api/v1/tenants/:tenantId/query', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { query } = req.body;
    
    // Security: Validate user has access to this tenant
    const hasAccess = await validateTenantAccess(req.user.id, tenantId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const neonClient = new NeonDatabaseClient({
      apiKey: process.env.NEON_API_KEY!,
      defaultRegion: 'aws-us-east-1'
    });
    
    const startTime = Date.now();
    const result = await neonClient.executeQuery(tenantId, query);
    const executionTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: result,
      executionTime,
      rowCount: result.length
    });
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 🌐 Option 2: DigitalOcean Managed PostgreSQL

If you prefer a more traditional managed database:

### 2.1 Setup DigitalOcean Database Cluster

```typescript
// packages/database-platform-client/src/digitalocean-database-client.ts
import { Pool, Client } from 'pg';
import axios from 'axios';

export class DigitalOceanDatabaseClient {
  private apiKey: string;
  private clusterId: string;
  private masterPool: Pool;

  constructor(config: { apiKey: string; clusterId: string; connectionString: string }) {
    this.apiKey = config.apiKey;
    this.clusterId = config.clusterId;
    this.masterPool = new Pool({
      connectionString: config.connectionString,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }

  async createTenantDatabase(tenantId: string, tenantName: string): Promise<TenantDatabase> {
    const client = await this.masterPool.connect();
    
    try {
      // Create database
      await client.query(`CREATE DATABASE "tenant_${tenantId}"`);
      
      // Create user
      const password = this.generateSecurePassword();
      await client.query(`CREATE USER "tenant_${tenantId}_user" WITH PASSWORD '${password}'`);
      
      // Grant permissions
      await client.query(`GRANT ALL PRIVILEGES ON DATABASE "tenant_${tenantId}" TO "tenant_${tenantId}_user"`);
      
      // Build connection string
      const connectionString = this.buildConnectionString(tenantId, password);
      
      return {
        id: tenantId,
        name: tenantName,
        connectionString,
        branch: 'main',
        createdAt: new Date(),
        status: 'active'
      };
    } finally {
      client.release();
    }
  }

  private generateSecurePassword(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private buildConnectionString(tenantId: string, password: string): string {
    const host = process.env.DO_POSTGRES_HOST;
    const port = process.env.DO_POSTGRES_PORT || 25060;
    
    return `postgresql://tenant_${tenantId}_user:${password}@${host}:${port}/tenant_${tenantId}?sslmode=require`;
  }
}
```

---

## 📝 Environment Variables Setup

### For Vercel (Production)

Add these environment variables to both your API and Web Dashboard projects in Vercel:

```bash
# Neon Configuration
NEON_API_KEY=your_neon_api_key_here
NEON_DEFAULT_REGION=aws-us-east-1

# Supabase (for platform metadata)
SUPABASE_URL=https://wgmgtxlodyxbhxfpnwwm.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=https://vpn-enterprise-dashboard.vercel.app,https://vpn-enterprise-api.vercel.app

# Platform Configuration
PLATFORM_NAME=VPN Enterprise DBaaS
PLATFORM_URL=https://vpn-enterprise-dashboard.vercel.app
SUPPORT_EMAIL=support@vpn-enterprise.com

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=1000

# Feature Flags
ENABLE_REAL_TIME=true
ENABLE_BRANCHES=true
ENABLE_API_GENERATION=true
```

### For Local Development

Update your local `.env` file:

```bash
# Add to your existing .env file

# Neon Configuration
NEON_API_KEY=your_neon_api_key_here
NEON_DEFAULT_REGION=aws-us-east-1

# Platform Configuration
PLATFORM_NAME=VPN Enterprise DBaaS (Dev)
PLATFORM_URL=http://localhost:3000
SUPPORT_EMAIL=dev@vpn-enterprise.com

# Development specific
ENABLE_DEBUG_LOGS=true
SKIP_AUTH_IN_DEV=false
```

---

## 🗄️ Database Schema Setup

### Platform Metadata Tables

Create these tables in your main Supabase database:

```sql
-- packages/database/migrations/001_platform_tenants.sql

-- Platform tenants table (stores info about each tenant's database)
CREATE TABLE IF NOT EXISTS platform_tenants (
  id TEXT PRIMARY KEY, -- Neon project ID or custom ID
  name TEXT NOT NULL,
  connection_string TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'team', 'enterprise')),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('creating', 'active', 'suspended', 'deleted')),
  
  -- Resource limits
  max_databases INTEGER DEFAULT 1,
  max_storage_mb INTEGER DEFAULT 100,
  max_requests_per_day INTEGER DEFAULT 10000,
  
  -- Billing
  subscription_id TEXT,
  billing_email TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant access permissions
CREATE TABLE IF NOT EXISTS tenant_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES platform_tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'viewer')),
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES platform_tenants(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  api_requests INTEGER DEFAULT 0,
  query_executions INTEGER DEFAULT 0,
  storage_used_mb DECIMAL DEFAULT 0,
  bandwidth_used_mb DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, date)
);

-- Enable RLS
ALTER TABLE platform_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tenants" ON platform_tenants
  FOR SELECT USING (user_id = auth.uid() OR id IN (
    SELECT tenant_id FROM tenant_permissions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create tenants" ON platform_tenants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can update their tenants" ON platform_tenants
  FOR UPDATE USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_tenants_user_id ON platform_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_permissions_tenant_id ON tenant_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_permissions_user_id ON tenant_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_date ON tenant_usage(tenant_id, date);
```

---

## 🚀 Immediate Next Steps

### 1. Choose and Set Up Cloud PostgreSQL

**Recommended: Neon** (for MVP and scaling)
1. Sign up at https://neon.tech
2. Create your first project
3. Get API key from dashboard
4. Add environment variables to Vercel

### 2. Update Your Codebase

1. **Install Dependencies**
   ```bash
   cd packages/database-platform-client
   npm install @neondatabase/serverless pg @types/pg axios
   ```

2. **Create New Client Files**
   - Copy the `NeonDatabaseClient` code above
   - Update your existing database client to use Neon
   - Test connection with a simple query

3. **Update API Routes**
   - Modify tenant creation to provision Neon databases
   - Update query execution to use tenant-specific connections
   - Add proper error handling and logging

### 3. Test the Integration

```typescript
// Test script: test-neon-integration.ts
import { NeonDatabaseClient } from './packages/database-platform-client/src/neon-database-client';

async function testNeonIntegration() {
  const client = new NeonDatabaseClient({
    apiKey: process.env.NEON_API_KEY!,
    defaultRegion: 'aws-us-east-1'
  });

  try {
    // Test creating a tenant database
    const tenant = await client.createTenantProject('test-tenant-123', 'Test Tenant');
    console.log('Tenant created:', tenant);

    // Test executing a query
    const result = await client.executeQuery(tenant.id, 'SELECT version()');
    console.log('Query result:', result);

    console.log('✅ Neon integration working correctly!');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

testNeonIntegration();
```

### 4. Deploy to Production

1. **Add Environment Variables to Vercel**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all the Neon and platform variables listed above

2. **Deploy**
   ```bash
   ./scripts/auto-deploy.sh "feat: Add Neon PostgreSQL integration for multi-tenant databases"
   ```

3. **Test Production**
   - Create a test tenant through your UI
   - Execute SQL queries in the SQL editor
   - Verify database isolation between tenants

---

This implementation gives you:
- ✅ **True Multi-Tenancy**: Each tenant gets their own PostgreSQL database
- ✅ **Scalability**: Neon handles auto-scaling and resource management
- ✅ **Cost Efficiency**: Pay only for what you use
- ✅ **Developer Experience**: Branch-based development workflows
- ✅ **Production Ready**: Built-in backup, security, and monitoring

Start with Neon for the MVP, then expand to other providers as you grow!