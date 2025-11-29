import { Router } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '@vpn-enterprise/auth';
import { supabaseAdmin } from '@vpn-enterprise/database';

export const tenantsRouter = Router();

// Use Supabase for all database operations
const TENANTS_TABLE = process.env.TENANTS_TABLE || 'tenants';

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

// List tenants
tenantsRouter.get('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
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

// Query runner (SELECT-only) for tenant database using Supabase
tenantsRouter.post('/:tenantId/query', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { sql } = req.body || {};
    if (!sql || typeof sql !== 'string') return res.status(400).json({ error: 'sql required' });
    const trimmed = sql.trim();
    const lowered = trimmed.toLowerCase();
    
    // Basic safety checks: single statement, SELECT-only.
    if (!lowered.startsWith('select')) return res.status(400).json({ error: 'Only SELECT queries allowed' });
    if (trimmed.split(';').filter(Boolean).length > 1) return res.status(400).json({ error: 'Multiple statements not allowed' });
    
    // OPTIONAL simple row limit enforcement if query lacks LIMIT
    let finalSql = trimmed;
    if (!/\blimit\s+\d+/i.test(trimmed)) {
      finalSql = trimmed.replace(/;$/,'') + ' LIMIT 100';
    }
    
    const start = Date.now();
    // Use Supabase's RPC function to execute raw SQL
    const { data, error } = await (supabaseAdmin as any).rpc('execute_sql', { 
      sql_query: finalSql 
    });
    
    if (error) {
      console.error('[tenant:query] supabase error', error);
      return res.status(500).json({ error: 'Failed to execute query', message: error.message });
    }
    
    const durationMs = Date.now() - start;
    res.json({ 
      rows: data || [], 
      rowCount: data?.length || 0, 
      durationMs, 
      tenantId 
    });
  } catch (e: any) {
    console.error('[tenant:query] exception', e);
    res.status(500).json({ error: 'Failed to execute query', message: e.message });
  }
});

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
tenantsRouter.get('/me/associations', authMiddleware, async (req: AuthRequest, res) => {
  try {
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
