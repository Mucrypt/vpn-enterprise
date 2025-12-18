import { Pool } from 'pg';

export class DatabasePlatformClient {
  private pgPool: Pool;
  public tenantConnections: Map<string, Pool> = new Map();

  constructor() {
    // Main platform database connection
    const config = {
      host: process.env.POSTGRES_HOST || 'postgres-primary',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'platform_db',
      user: process.env.POSTGRES_USER || 'platform_admin',
      password: process.env.POSTGRES_PASSWORD,
      max: 20
    };
    
    console.log('[DatabasePlatformClient] Platform pool config:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user
    });
    
    this.pgPool = new Pool(config);
  }

  async clearCache(): Promise<void> {
    // Close all existing tenant connections safely
    for (const [tenantId, pool] of this.tenantConnections.entries()) {
      try {
        console.log(`[DatabasePlatformClient] Closing connection for tenant: ${tenantId}`);
        if (!pool.ended) {
          await pool.end();
        }
      } catch (error) {
        console.warn(`[DatabasePlatformClient] Error closing pool for tenant ${tenantId}:`, error);
      }
    }
    this.tenantConnections.clear();
    console.log('[DatabasePlatformClient] Connection cache cleared');
  }

  async getTenantConnection(tenantId: string): Promise<Pool> {
    console.log('🔍 [DatabasePlatformClient] getTenantConnection called for tenant:', tenantId);
    
    // Check if we already have a valid connection
    if (this.tenantConnections.has(tenantId)) {
      const existingPool = this.tenantConnections.get(tenantId)!;
      if (!existingPool.ended) {
        console.log('[DatabasePlatformClient] Reusing existing connection for tenant:', tenantId);
        return existingPool;
      } else {
        // Remove ended pool from cache
        console.log('[DatabasePlatformClient] Removing ended connection for tenant:', tenantId);
        this.tenantConnections.delete(tenantId);
      }
    }
    
    if (this.tenantConnections.has(tenantId)) {
      return this.tenantConnections.get(tenantId)!;
    }

    // In development mode, use direct connection without looking up tenant info
    if (process.env.NODE_ENV === 'development' && tenantId === '123e4567-e89b-12d3-a456-426614174000') {
      console.log('[DatabasePlatformClient] Using development mode direct connection');
      const tenantConfig = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'postgres',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'password',
        max: 10
      };
      
      console.log('[DatabasePlatformClient] Development tenant config:', tenantConfig);
      
      const tenantPool = new Pool(tenantConfig);
      this.tenantConnections.set(tenantId, tenantPool);
      return tenantPool;
    }

    // Get tenant connection info from platform database
    const client = await this.pgPool.connect();
    try {
      const result = await client.query('SELECT connection_info FROM tenants WHERE id = $1', [tenantId]);
      if (!result.rows[0]) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const connectionInfo = result.rows[0].connection_info;
      const tenantConfig = {
        host: connectionInfo.host || process.env.POSTGRES_HOST,
        port: parseInt(connectionInfo.port) || parseInt(process.env.POSTGRES_PORT || '5433'),
        database: connectionInfo.database || process.env.POSTGRES_DB,
        user: connectionInfo.user || connectionInfo.username || process.env.POSTGRES_USER,
        password: connectionInfo.password || process.env.POSTGRES_PASSWORD,
        max: 10
      };
      
      console.log('[DatabasePlatformClient] Raw connection_info:', connectionInfo);
      console.log('[DatabasePlatformClient] Final tenant config:', tenantConfig);
      console.log('[DatabasePlatformClient] Environment fallbacks:', {
        POSTGRES_HOST: process.env.POSTGRES_HOST,
        POSTGRES_PORT: process.env.POSTGRES_PORT,
        POSTGRES_DB: process.env.POSTGRES_DB,
        POSTGRES_USER: process.env.POSTGRES_USER
      });
      
      const tenantPool = new Pool(tenantConfig);
      
      // Test the connection to verify it's connecting to the right database
      try {
        const testClient = await tenantPool.connect();
        const testResult = await testClient.query('SELECT current_database(), current_user, inet_server_port()');
        console.log('[DatabasePlatformClient] Tenant connection test result:', testResult.rows[0]);
        
        const actualDb = testResult.rows[0]?.current_database;
        const actualUser = testResult.rows[0]?.current_user;
        const actualPort = testResult.rows[0]?.inet_server_port;
        
        if (actualDb !== 'platform_db') {
          throw new Error(`WRONG DATABASE! Expected 'platform_db', got '${actualDb}'. User: ${actualUser}, Port: ${actualPort}. Host: ${connectionInfo.host}, DB: ${connectionInfo.database}`);
        }
        
        testClient.release();
      } catch (error) {
        console.error('[DatabasePlatformClient] Tenant connection test failed:', error);
        // Safely end the pool
        try {
          if (!tenantPool.ended) {
            await tenantPool.end();
          }
        } catch (endError) {
          console.warn('[DatabasePlatformClient] Error ending failed pool:', endError);
        }
        throw error;
      }

      this.tenantConnections.set(tenantId, tenantPool);
      return tenantPool;
    } finally {
      client.release();
    }
  }

  async executeQuery(tenantId: string, sql: string, params: any[] = []): Promise<any> {
    const pool = await this.getTenantConnection(tenantId);
    const client = await pool.connect();
    try {
      const startTime = Date.now();
      const result = await client.query(sql, params);
      const executionTime = Date.now() - startTime;
      
      return { 
        data: result.rows, 
        rowCount: result.rowCount,
        executionTime,
        fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID }))
      };
    } finally {
      client.release();
    }
  }

  async getSchemas(tenantId: string): Promise<any[]> {
    const result = await this.executeQuery(tenantId, `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    return result.data;
  }

  async getTables(tenantId: string, schemaName: string = 'public'): Promise<any[]> {
    console.log(`[DatabasePlatformClient] getTables called for tenant: ${tenantId}, schema: ${schemaName}`);
    
    try {
      const result = await this.executeQuery(tenantId, `
        SELECT 
          t.table_name,
          t.table_type,
          obj_description(c.oid) as comment,
          (
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = t.table_schema 
            AND table_name = t.table_name
          ) as column_count
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `, [schemaName]);
      
      console.log(`[DatabasePlatformClient] getTables result for schema '${schemaName}':`, {
        count: result.data?.length || 0,
        tables: result.data?.map((t: any) => t.table_name)
      });
      
      return result.data || [];
    } catch (error) {
      console.error(`[DatabasePlatformClient] Error getting tables for schema '${schemaName}':`, error);
      throw error;
    }
  }

  async getTableColumns(tenantId: string, schemaName: string, tableName: string): Promise<any[]> {
    const result = await this.executeQuery(tenantId, `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN true ELSE false END as primary_key,
        CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN true ELSE false END as foreign_key,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale
      FROM information_schema.columns c
      LEFT JOIN information_schema.key_column_usage kcu 
        ON c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
        AND c.table_schema = kcu.table_schema
      LEFT JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
        AND kcu.table_schema = tc.table_schema
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position
    `, [schemaName, tableName]);
    return result.data;
  }

  async createSchema(tenantId: string, schemaName: string): Promise<void> {
    await this.executeQuery(tenantId, `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  }

  async createTable(tenantId: string, schemaName: string, tableName: string, columns: any[]): Promise<void> {
    const columnDefs = columns.map(col => {
      let def = `"${col.name}" ${col.type}`;
      if (!col.nullable) def += ' NOT NULL';
      if (col.primary_key) def += ' PRIMARY KEY';
      if (col.default) def += ` DEFAULT ${col.default}`;
      return def;
    }).join(', ');

    const sql = `CREATE TABLE "${schemaName}"."${tableName}" (${columnDefs})`;
    await this.executeQuery(tenantId, sql);
  }

  async getTenants(userId?: string): Promise<any[]> {
    const client = await this.pgPool.connect();
    try {
      let query = `
        SELECT t.*, o.name as organization_name 
        FROM tenants t 
        LEFT JOIN organizations o ON t.organization_id = o.id 
        WHERE t.status = 'active'
      `;
      const params: any[] = [];

      if (userId) {
        query += ` AND t.organization_id IN (
          SELECT organization_id FROM organization_users WHERE user_id = $1
        )`;
        params.push(userId);
      }

      query += ' ORDER BY t.created_at DESC';

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createTenant(organizationId: string, name: string, plan: string = 'free'): Promise<any> {
    // Call tenant provisioner service
    const response = await fetch('http://tenant-provisioner:3003/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, name, plan })
    });

    if (!response.ok) {
      throw new Error(`Failed to create tenant: ${response.statusText}`);
    }

    return response.json();
  }

  // Platform database access
  get platformPool(): Pool {
    return this.pgPool;
  }

  // Cleanup method for graceful shutdown
  async cleanup(): Promise<void> {
    console.log('[DatabasePlatformClient] Starting cleanup...');
    
    // Close all tenant connections
    await this.clearCache();
    
    // Close platform connection
    try {
      if (!this.pgPool.ended) {
        await this.pgPool.end();
        console.log('[DatabasePlatformClient] Platform pool closed');
      }
    } catch (error) {
      console.warn('[DatabasePlatformClient] Error closing platform pool:', error);
    }
    
    console.log('[DatabasePlatformClient] Cleanup completed');
  }

  async getUserById(userId: string): Promise<any> {
    const client = await this.pgPool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getUserMembership(userId: string): Promise<any> {
    const client = await this.pgPool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM organization_users WHERE user_id = $1', 
        [userId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}