import { Router } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '@vpn-enterprise/auth';
import { supabaseAdmin } from '@vpn-enterprise/database';
import { PostgresDatabaseManager } from '@vpn-enterprise/database/src/postgres-manager';
import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import { MySQLDatabaseManager } from '@vpn-enterprise/database/src/mysql-manager';

export const tenantsRouter = Router();

// Shared Postgres pool for direct query execution (SELECT-only)
const queryPool = new Pool({ connectionString: process.env.POSTGRES_ADMIN_URL || process.env.DATABASE_URL });
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

// Provision a tenant database (Postgres)
tenantsRouter.post('/:tenantId/databases', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { databaseName, engine = 'postgres' } = req.body || {};
    if (!databaseName) return res.status(400).json({ error: 'databaseName required' });
    let created: any = null;
    let connString = '';

    if (engine === 'postgres') {
      const adminPool = new Pool({ connectionString: process.env.POSTGRES_ADMIN_URL || process.env.DATABASE_URL });
      const mgr = new PostgresDatabaseManager(adminPool as any);
      created = await mgr.createTenantDatabase(tenantId, databaseName);
      connString = process.env.DATABASE_URL || '';
    } else if (engine === 'mysql') {
      const adminPool = await mysql.createPool({ uri: process.env.MYSQL_ADMIN_URL || '' });
      const mgr = new MySQLDatabaseManager(adminPool as any);
      created = await mgr.createMySQLDatabase(tenantId, { databaseName });
      connString = process.env.MYSQL_ADMIN_URL || '';
    } else if (engine === 'nosql') {
      // TODO: provision Scylla keyspace and return API endpoint
      created = { databaseName, status: 'active' };
      connString = process.env.SCYLLA_URL || '';
    } else {
      return res.status(400).json({ error: 'Unsupported engine' });
    }
    const { error } = await (supabaseAdmin as any)
      .from('tenant_databases')
      .insert({ tenant_id: tenantId, database_name: created.databaseName || created.database, connection_string: connString, status: created.status, engine });
    if (error) return res.status(500).json({ error: 'DB error', message: error.message });
    res.json({ database: { ...created, engine } });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create database', message: e.message });
  }
});

// Query runner (SELECT-only) for tenant database (scaffold)
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
    const result = await queryPool.query(finalSql);
    const durationMs = Date.now() - start;
    res.json({ rows: result.rows, rowCount: result.rowCount, durationMs, tenantId });
  } catch (e: any) {
    console.error('[tenant:query] exception', e);
    res.status(500).json({ error: 'Failed to execute query', message: e.message });
  }
});

// Helper: fetch tenant associations for a given userId using direct pool
async function fetchUserTenantAssociations(pool: Pool, userId: string) {
  const candidates = [
    {
      sql:
        'SELECT m.tenant_id, t.name FROM platform_meta.tenant_members m LEFT JOIN platform_meta.tenants t ON t.tenant_id = m.tenant_id WHERE m.user_id = $1 LIMIT 200',
      params: [userId],
    },
    {
      sql:
        'SELECT u.tenant_id, t.name FROM platform_meta.tenant_users u LEFT JOIN platform_meta.tenants t ON t.tenant_id = u.tenant_id WHERE u.user_id = $1 LIMIT 200',
      params: [userId],
    },
  ];
  for (const q of candidates) {
    try {
      const res = await pool.query(q.sql, q.params as any[]);
      if (res && Array.isArray(res.rows)) {
        return res.rows.map((r: any) => ({ tenant_id: r.tenant_id, name: r.name || null }));
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (/(relation|table) .* does not exist/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }
  return [];
}

// GET /api/v1/tenants/me/associations — current user (auth required)
tenantsRouter.get('/me/associations', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'unauthorized', message: 'User not authenticated' });
    if (!process.env.POSTGRES_ADMIN_URL && !process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'database_unavailable',
        message: 'No Postgres connection configured (set POSTGRES_ADMIN_URL or DATABASE_URL)'
      });
    }
    const tenants = await fetchUserTenantAssociations(queryPool, user.id);
    return res.json({ userId: user.id, tenants });
  } catch (e: any) {
    const msg = String(e?.message || 'Unknown error');
    if (/ECONNREFUSED/.test(msg)) {
      return res.status(503).json({ error: 'database_unavailable', message: msg });
    }
    return res.status(500).json({ error: 'server_error', message: msg });
  }
});

// GET /api/v1/tenants/associations?userId=... — admin-only
tenantsRouter.get('/associations', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId) return res.status(400).json({ error: 'bad_request', message: 'Query parameter `userId` is required' });
    if (!process.env.POSTGRES_ADMIN_URL && !process.env.DATABASE_URL) {
      return res.status(503).json({
        error: 'database_unavailable',
        message: 'No Postgres connection configured (set POSTGRES_ADMIN_URL or DATABASE_URL)'
      });
    }
    const tenants = await fetchUserTenantAssociations(queryPool, String(userId));
    return res.json({ userId: String(userId), tenants });
  } catch (e: any) {
    const msg = String(e?.message || 'Unknown error');
    if (/ECONNREFUSED/.test(msg)) {
      return res.status(503).json({ error: 'database_unavailable', message: msg });
    }
    return res.status(500).json({ error: 'server_error', message: msg });
  }
});
