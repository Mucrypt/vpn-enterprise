import { Router } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '@vpn-enterprise/auth';
import { supabaseAdmin } from '@vpn-enterprise/database';
import { 
  getTableData, 
  updateTableData, 
  insertTableData, 
  deleteTableData 
} from '../controllers/tableDataController';
import { 
  getTableStructure, 
  updateTableStructure 
} from '../controllers/tableStructureController';
import { DatabasePlatformClient } from '../database-platform-client';

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
          tenant_id: '123e4567-e89b-12d3-a456-426614174000',
          id: '123e4567-e89b-12d3-a456-426614174000',
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

// Table Data Endpoints
tenantsRouter.get('/:tenantId/tables/:schema.:tableName/data', getTableData);
tenantsRouter.put('/:tenantId/tables/:schema.:tableName/data', updateTableData);
tenantsRouter.post('/:tenantId/tables/:schema.:tableName/data', insertTableData);
tenantsRouter.delete('/:tenantId/tables/:schema.:tableName/data', deleteTableData);

// Table Structure Endpoints
tenantsRouter.get('/:tenantId/tables/:schema.:tableName/structure', getTableStructure);
tenantsRouter.put('/:tenantId/tables/:schema.:tableName/structure', updateTableStructure);

// Enhanced SQL executor supporting DDL, DML, and DQL operations (like Supabase)
// DISABLED: Legacy route - now handled by UnifiedDataAPI with DatabasePlatformClient
/*
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
}); // END of disabled legacy route
*/

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

// DISABLED: Legacy create schema route - now handled by UnifiedDataAPI
/*
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
*/

// DISABLED: Legacy schemas route - now handled by UnifiedDataAPI with DatabasePlatformClient
/*
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
*/

// DISABLED: Legacy tables listing route - now handled by UnifiedDataAPI
/*
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
*/

// Table Data Management Routes
tenantsRouter.get('/:tenantId/tables/:schema.:tableName/data', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, getTableData);

tenantsRouter.put('/:tenantId/tables/:schema.:tableName/data', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, updateTableData);

tenantsRouter.post('/:tenantId/tables/:schema.:tableName/data', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, insertTableData);

tenantsRouter.delete('/:tenantId/tables/:schema.:tableName/data', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, deleteTableData);

// Table Structure Management Routes
tenantsRouter.get('/:tenantId/tables/:schema.:tableName/structure', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, getTableStructure);

tenantsRouter.put('/:tenantId/tables/:schema.:tableName/structure', (req, res, next) => {
  // Skip auth in development for testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  authMiddleware(req, res, next);
}, updateTableStructure);

// Schema Management Endpoints
tenantsRouter.get('/:tenantId/schemas', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);
    
    if (!pool) {
      return res.status(400).json({ error: 'Unable to connect to database' });
    }

    const result = await pool.query(`
      SELECT schema_name as name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);

    res.json({ schemas: result.rows });
  } catch (error) {
    console.error('Error fetching schemas:', error);
    res.status(500).json({ error: 'Failed to fetch schemas' });
  }
});

// Tables listing for a schema
tenantsRouter.get('/:tenantId/schemas/:schemaName/tables', async (req, res) => {
  try {
    const { tenantId, schemaName } = req.params;
    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);
    
    if (!pool) {
      return res.status(400).json({ error: 'Unable to connect to database' });
    }

    const result = await pool.query(`
      SELECT 
        t.table_name as name,
        t.table_type as type,
        obj_description(c.oid) as comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE t.table_schema = $1
      ORDER BY t.table_name
    `, [schemaName]);

    res.json({ tables: result.rows });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// SQL Query Execution Endpoint
tenantsRouter.post('/:tenantId/query', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);
    
    if (!pool) {
      return res.status(400).json({ error: 'Unable to connect to database' });
    }

    // Security check - block dangerous operations
    const loweredSql = sql.toLowerCase().trim();
    const dangerousKeywords = ['drop database', 'drop schema', 'truncate', 'delete from pg_'];
    const isDangerous = dangerousKeywords.some(keyword => loweredSql.includes(keyword));
    
    if (isDangerous) {
      return res.status(400).json({ error: 'Dangerous SQL operations are not allowed' });
    }

    const start = Date.now();
    
    try {
      const result = await pool.query(sql);
      const executionTime = Date.now() - start;
      
      // Determine if this was a SELECT query or modification
      const isSelect = loweredSql.startsWith('select') || loweredSql.startsWith('with');
      
      res.json({
        success: true,
        data: result.rows,
        rowCount: result.rowCount,
        executionTime,
        command: result.command || (isSelect ? 'SELECT' : 'MODIFY'),
        fields: result.fields?.map((f: any) => ({ name: f.name, type: f.dataTypeID })) || []
      });
    } catch (queryError: any) {
      const executionTime = Date.now() - start;
      res.status(400).json({
        success: false,
        error: queryError.message,
        executionTime,
        position: queryError.position,
        hint: queryError.hint
      });
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

// Enhanced Table Data Endpoints for Supabase-like functionality

// Bulk operations endpoint
tenantsRouter.post('/:tenantId/tables/:schema.:tableName/bulk', async (req, res) => {
  try {
    const { tenantId, schema, tableName } = req.params;
    const { operation, rows } = req.body;
    
    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);
    
    if (!pool) {
      return res.status(400).json({ error: 'Unable to connect to database' });
    }

    let result;
    switch (operation) {
      case 'delete':
        // Build WHERE conditions for multiple rows
        const deleteConditions = rows.map((row: any, index: number) => {
          const conditions = Object.entries(row).map(([key, value]) => `${key} = $${index * Object.keys(row).length + Object.keys(row).indexOf(key) + 1}`);
          return `(${conditions.join(' AND ')})`;
        }).join(' OR ');
        
        const deleteValues = rows.flatMap((row: any) => Object.values(row));
        const deleteQuery = `DELETE FROM ${schema}.${tableName} WHERE ${deleteConditions}`;
        
        result = await pool.query(deleteQuery, deleteValues);
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported bulk operation' });
    }
    
    res.json({ 
      success: true, 
      affected_rows: result.rowCount,
      operation 
    });
  } catch (error) {
    console.error('Error executing bulk operation:', error);
    res.status(500).json({ error: 'Failed to execute bulk operation' });
  }
});

// Export table data to CSV
tenantsRouter.get('/:tenantId/tables/:schema.:tableName/export', async (req, res) => {
  try {
    const { tenantId, schema, tableName } = req.params;
    const { format = 'csv' } = req.query;
    
    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);
    
    if (!pool) {
      return res.status(400).json({ error: 'Unable to connect to database' });
    }

    // Get all data from table
    const result = await pool.query(`SELECT * FROM ${schema}.${tableName} ORDER BY 1`);
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(result.rows[0] || {});
      const csvHeaders = headers.join(',');
      const csvRows = result.rows.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape CSV values
          if (value === null) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ).join('\n');
      
      const csvContent = `${csvHeaders}\n${csvRows}`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${schema}_${tableName}.csv"`);
      res.send(csvContent);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error exporting table data:', error);
    res.status(500).json({ error: 'Failed to export table data' });
  }
});

// Enhanced table columns endpoint with more metadata
tenantsRouter.get('/:tenantId/tables/:schema.:tableName/columns', async (req, res) => {
  try {
    const { tenantId, schema, tableName } = req.params;
    
    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);
    
    if (!pool) {
      return res.status(400).json({ error: 'Unable to connect to database' });
    }

    const result = await pool.query(`
      SELECT 
        c.column_name as name,
        c.data_type as type,
        c.is_nullable = 'YES' as nullable,
        c.column_default as default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as primary_key,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.ordinal_position,
        fk.foreign_table_schema,
        fk.foreign_table_name,
        fk.foreign_column_name
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.column_name = pk.column_name
      LEFT JOIN (
        SELECT
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1 AND tc.table_name = $2
      ) fk ON c.column_name = fk.column_name
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position
    `, [schema, tableName]);

    // Transform the result to include foreign key information
    const columns = result.rows.map(row => ({
      name: row.name,
      type: row.type,
      nullable: row.nullable,
      default: row.default,
      primary_key: row.primary_key,
      character_maximum_length: row.character_maximum_length,
      numeric_precision: row.numeric_precision,
      numeric_scale: row.numeric_scale,
      ordinal_position: row.ordinal_position,
      foreign_key: row.foreign_table_name ? {
        table: row.foreign_table_name,
        column: row.foreign_column_name,
        schema: row.foreign_table_schema
      } : null
    }));

    res.json({ columns });
  } catch (error) {
    console.error('Error fetching table columns:', error);
    res.status(500).json({ error: 'Failed to fetch table columns' });
  }
});

// Get schema relationships
tenantsRouter.get('/:tenantId/schemas/:schemaName/relationships', async (req, res) => {
  try {
    const { tenantId, schemaName } = req.params;
    
    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);
    
    if (!pool) {
      return res.status(400).json({ error: 'Unable to connect to database' });
    }

    const result = await pool.query(`
      SELECT
        tc.table_schema as from_schema,
        tc.table_name as from_table,
        kcu.column_name as from_column,
        ccu.table_schema as to_schema,
        ccu.table_name as to_table,
        ccu.column_name as to_column,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = $1
      ORDER BY tc.table_name, kcu.column_name
    `, [schemaName]);

    // Transform to relationships format
    const relationships = result.rows.map(row => ({
      from: {
        table: row.from_table,
        schema: row.from_schema,
        column: row.from_column
      },
      to: {
        table: row.to_table,
        schema: row.to_schema,
        column: row.to_column
      },
      type: 'one-to-many' as const, // Default relationship type
      constraint_name: row.constraint_name
    }));

    res.json({ relationships });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});
