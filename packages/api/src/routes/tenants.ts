import { Router } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '@vpn-enterprise/auth';
import { supabaseAdmin } from '@vpn-enterprise/database';

export const tenantsRouter = Router();

// Use Supabase for all database operations
const TENANTS_TABLE = process.env.TENANTS_TABLE || 'tenants';

// In-memory storage for development mode schemas and tables
const devSchemas = new Set<string>();
interface TableInfo {
  table_name: string;
  table_type: string;
}
const devTables = new Map<string, TableInfo[]>();

// Create tenant (minimal scaffold)
tenantsRouter.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, subdomain, plan_type } = req.body;
    if (!name || !subdomain) return res.status(400).json({ error: 'name and subdomain required' });
    const { data, error } = await (supabaseAdmin as any)
      .from('tenants')
      .insert({ name, subdomain, plan_type: plan_type || 'free' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: 'DB error', message: error.message });
    res.json({ tenant: data });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create tenant', message: e.message });
  }
});

// List tenants (with development mode bypass)
tenantsRouter.get('/', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, (req, res, next) => {
  // Skip admin check in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  adminMiddleware(req, res, next);
}, async (req: AuthRequest, res) => {
  try {
    // In development mode, return mock tenants if database is empty
    if (process.env.NODE_ENV === 'development') {
      const mockTenants = [
        {
          tenant_id: 'dev-tenant-1',
          name: 'Development Tenant',
          subdomain: 'dev',
          plan_type: 'free',
          created_at: new Date().toISOString(),
          status: 'active'
        }
      ];
      return res.json({ tenants: mockTenants });
    }

    const { data, error } = await (supabaseAdmin as any)
      .from(TENANTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[tenants:list] supabase error', error);
      return res.status(500).json({ error: 'DB error', message: error.message });
    }
    res.json({ tenants: data || [] });
  } catch (e: any) {
    console.error('[tenants:list] exception', e);
    res.status(500).json({ error: 'Failed to list tenants', message: e.message });
  }
});

// List tenant databases
tenantsRouter.get('/:tenantId/databases', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await (supabaseAdmin as any)
      .from('tenant_databases')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'DB error', message: error.message });
    res.json({ databases: data || [] });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to list databases', message: e.message });
  }
});

// Provision a tenant database (using Supabase)
tenantsRouter.post('/:tenantId/databases', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { databaseName, engine = 'postgres' } = req.body || {};
    if (!databaseName) return res.status(400).json({ error: 'databaseName required' });
    
    // For now, create a virtual database entry since we're using Supabase
    const created = { 
      databaseName, 
      status: 'active',
      message: 'Virtual database created in Supabase infrastructure' 
    };
    const connString = process.env.SUPABASE_URL || '';

    const { error } = await (supabaseAdmin as any)
      .from('tenant_databases')
      .insert({ 
        tenant_id: tenantId, 
        database_name: created.databaseName, 
        connection_string: connString, 
        status: created.status, 
        engine 
      });
    if (error) return res.status(500).json({ error: 'DB error', message: error.message });
    res.json({ database: { ...created, engine } });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create database', message: e.message });
  }
});

// Enhanced SQL executor supporting DDL, DML, and DQL operations (like Supabase)
tenantsRouter.post('/:tenantId/query', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, (req, res, next) => {
  // Skip admin check in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  adminMiddleware(req, res, next);
}, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { sql } = req.body || {};
    if (!sql || typeof sql !== 'string') return res.status(400).json({ error: 'sql required' });
    
    const trimmed = sql.trim();
    const lowered = trimmed.toLowerCase();
    
    // Enhanced security: Allow most SQL operations but block dangerous ones
    const blockedOperations = ['drop database', 'drop schema', 'truncate', 'delete from pg_', 'alter system'];
    const isDangerous = blockedOperations.some(op => lowered.includes(op));
    if (isDangerous) {
      return res.status(400).json({ error: 'Dangerous SQL operations are not allowed' });
    }
    
    // Split multiple statements for execution
    const statements = trimmed.split(';').filter(s => s.trim().length > 0);
    if (statements.length > 10) {
      return res.status(400).json({ error: 'Too many statements. Maximum 10 allowed per request' });
    }
    
    const start = Date.now();
    const results = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      try {
        // Determine query type for appropriate handling
        const statementType = getQueryType(statement.toLowerCase());
        let result;
        
        if (statementType === 'SELECT') {
          // Use RPC for SELECT queries
          const { data, error } = await (supabaseAdmin as any).rpc('execute_sql', { 
            sql_query: statement 
          });
          if (error) throw error;
          result = { 
            rows: data || [], 
            rowCount: data?.length || 0, 
            command: 'SELECT',
            statement: i + 1 
          };
        } else {
          // Use direct SQL execution for DDL/DML operations
          const { data, error } = await (supabaseAdmin as any).rpc('execute_ddl', { 
            sql_query: statement 
          });
          if (error) throw error;
          result = { 
            message: `${statementType} executed successfully`, 
            command: statementType,
            statement: i + 1,
            affectedRows: data?.affectedRows || 0
          };
        }
        
        results.push(result);
      } catch (error: any) {
        results.push({
          error: error.message || 'Query execution failed',
          command: getQueryType(statement.toLowerCase()),
          statement: i + 1
        });
        // Continue with other statements unless it's a critical error
        if (error.code === '42P01' || error.code === '42703') continue; // Table/column not found
        break;
      }
    }
    
    const durationMs = Date.now() - start;
    res.json({ 
      results,
      totalStatements: statements.length,
      durationMs, 
      tenantId 
    });
  } catch (e: any) {
    console.error('[tenant:query] exception', e);
    res.status(500).json({ error: 'Failed to execute query', message: e.message });
  }
});

// Helper function to determine query type
function getQueryType(sql: string): string {
  const normalized = sql.trim().toLowerCase();
  if (normalized.startsWith('select')) return 'SELECT';
  if (normalized.startsWith('insert')) return 'INSERT';
  if (normalized.startsWith('update')) return 'UPDATE';
  if (normalized.startsWith('delete')) return 'DELETE';
  if (normalized.startsWith('create table')) return 'CREATE TABLE';
  if (normalized.startsWith('create database')) return 'CREATE DATABASE';
  if (normalized.startsWith('create schema')) return 'CREATE SCHEMA';
  if (normalized.startsWith('create index')) return 'CREATE INDEX';
  if (normalized.startsWith('alter table')) return 'ALTER TABLE';
  if (normalized.startsWith('drop table')) return 'DROP TABLE';
  if (normalized.startsWith('drop index')) return 'DROP INDEX';
  if (normalized.includes('create') && normalized.includes('table')) return 'CREATE TABLE';
  if (normalized.includes('insert') && normalized.includes('into')) return 'INSERT';
  return 'DDL/DML';
}

// Helper: fetch tenant associations for a given userId using Supabase
async function fetchUserTenantAssociations(userId: string) {
  // Try multiple table patterns that might exist
  const candidates = [
    'tenant_members',
    'tenant_users', 
    'user_tenants'
  ];
  
  for (const tableName of candidates) {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from(tableName)
        .select(`
          tenant_id,
          tenants!inner(name)
        `)
        .eq('user_id', userId)
        .limit(200);
        
      if (!error && data && Array.isArray(data)) {
        return data.map((r: any) => ({ 
          tenant_id: r.tenant_id, 
          name: r.tenants?.name || null 
        }));
      }
    } catch (err: any) {
      console.log(`Table ${tableName} not found, trying next...`);
      continue;
    }
  }
  
  // Fallback: just return empty array if no associations table exists
  return [];
}

// GET /api/v1/tenants/me/associations — current user (auth required)
tenantsRouter.get('/me/associations', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, async (req: AuthRequest, res) => {
  try {
    // In development mode, return mock tenant associations
    if (process.env.NODE_ENV === 'development') {
      const mockTenants = [
        {
          tenant_id: 'dev-tenant-1',
          name: 'Development Tenant',
          subdomain: 'dev',
          plan_type: 'free',
          created_at: new Date().toISOString(),
          status: 'active'
        }
      ];
      return res.json({ userId: 'dev-user', tenants: mockTenants });
    }

    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'unauthorized', message: 'User not authenticated' });
    
    const tenants = await fetchUserTenantAssociations(user.id);
    return res.json({ userId: user.id, tenants });
  } catch (e: any) {
    const msg = String(e?.message || 'Unknown error');
    console.error('[tenants:me:associations] error', e);
    return res.status(500).json({ error: 'server_error', message: msg });
  }
});

// GET /api/v1/tenants/associations?userId=... — admin-only
tenantsRouter.get('/associations', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId) return res.status(400).json({ error: 'bad_request', message: 'Query parameter `userId` is required' });
    
    const tenants = await fetchUserTenantAssociations(String(userId));
    return res.json({ userId: String(userId), tenants });
  } catch (e: any) {
    const msg = String(e?.message || 'Unknown error');
    console.error('[tenants:associations] error', e);
    return res.status(500).json({ error: 'server_error', message: msg });
  }
});

// Create a new schema/database for tenant
tenantsRouter.post('/:tenantId/schemas', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, (req, res, next) => {
  // Skip admin check in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  adminMiddleware(req, res, next);
}, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { schemaName } = req.body || {};
    if (!schemaName) return res.status(400).json({ error: 'schemaName required' });
    
    const { data, error } = await (supabaseAdmin as any).rpc('create_tenant_schema', { 
      schema_name: schemaName 
    });
    
    if (error) {
      console.error('[tenant:create-schema] supabase error', error);
      return res.status(500).json({ error: 'Failed to create schema', message: error.message });
    }
    
    res.json({ schema: data, tenantId });
  } catch (e: any) {
    console.error('[tenant:create-schema] exception', e);
    res.status(500).json({ error: 'Failed to create schema', message: e.message });
  }
});

// List all schemas for tenant
tenantsRouter.get('/:tenantId/schemas', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, (req, res, next) => {
  // Skip admin check in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  adminMiddleware(req, res, next);
}, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    
    const { data, error } = await (supabaseAdmin as any).rpc('list_schemas');
    
    if (error) {
      console.error('[tenant:list-schemas] supabase error', error);
      return res.status(500).json({ error: 'Failed to list schemas', message: error.message });
    }
    
    res.json({ schemas: data || [], tenantId });
  } catch (e: any) {
    console.error('[tenant:list-schemas] exception', e);
    res.status(500).json({ error: 'Failed to list schemas', message: e.message });
  }
});

// List tables in a schema
tenantsRouter.get('/:tenantId/schemas/:schemaName/tables', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, (req, res, next) => {
  // Skip admin check in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  adminMiddleware(req, res, next);
}, async (req: AuthRequest, res) => {
  try {
    const { tenantId, schemaName } = req.params;
    
    const { data, error } = await (supabaseAdmin as any).rpc('list_tables', { 
      schema_name: schemaName 
    });
    
    if (error) {
      console.error('[tenant:list-tables] supabase error', error);
      return res.status(500).json({ error: 'Failed to list tables', message: error.message });
    }
    
    res.json({ tables: data || [], schema: schemaName, tenantId });
  } catch (e: any) {
    console.error('[tenant:list-tables] exception', e);
    res.status(500).json({ error: 'Failed to list tables', message: e.message });
  }
});
