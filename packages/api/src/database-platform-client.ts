import { Pool } from 'pg'
import { resolveSecret } from './utils/secrets'

export class DatabasePlatformClient {
  private pgPool: Pool
  public tenantConnections: Map<string, Pool> = new Map()
  private platformSchemaEnsured = false

  constructor() {
    // Main platform database connection
    const postgresPassword = resolveSecret({
      valueEnv: 'POSTGRES_PASSWORD',
      fileEnv: 'POSTGRES_PASSWORD_FILE',
      defaultFilePath: '/run/secrets/db_password',
    })

    if (!postgresPassword) {
      console.warn(
        '[DatabasePlatformClient] POSTGRES password not resolved. ' +
          'Ensure POSTGRES_PASSWORD or POSTGRES_PASSWORD_FILE is set and readable (e.g. /run/secrets/db_password).',
      )
    }

    const config = {
      host: process.env.POSTGRES_HOST || 'postgres-primary',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'platform_db',
      user: process.env.POSTGRES_USER || 'platform_admin',
      password: postgresPassword,
      max: 20,
    }

    console.log('[DatabasePlatformClient] Platform pool config:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
    })

    this.pgPool = new Pool(config)

    // Best-effort bootstrap for platform tables required by the API.
    // This is intentionally idempotent (CREATE IF NOT EXISTS) to support
    // self-host deployments where migrations may not be run separately.
    this.ensurePlatformSchema().catch((e) => {
      console.warn('[DatabasePlatformClient] ensurePlatformSchema failed:', e)
    })
  }

  private async ensurePlatformSchema(): Promise<void> {
    if (this.platformSchemaEnsured) return

    const client = await this.pgPool.connect()
    try {
      // Enable UUID generation when available (best-effort).
      // If permissions disallow this, table creation below still works without defaults.
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
      } catch (e) {
        console.warn(
          '[DatabasePlatformClient] Could not create pgcrypto extension (continuing):',
          (e as any)?.message || e,
        )
      }

      // Tenants registry used by /api/v1/tenants, /api/v1/tenants/me, and tenant DB connections.
      // init scripts may not re-run on existing volumes, so keep this idempotent.
      await client.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          subdomain text,
          status text NOT NULL DEFAULT 'active',
          plan_type text,
          connection_info jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        );
      `)
      await client.query(
        'CREATE INDEX IF NOT EXISTS tenants_created_at_idx ON tenants (created_at DESC);',
      )

      await client.query(`
        CREATE TABLE IF NOT EXISTS tenant_members (
          tenant_id uuid NOT NULL,
          user_id uuid NOT NULL,
          role text NOT NULL DEFAULT 'viewer',
          created_at timestamptz NOT NULL DEFAULT NOW(),
          PRIMARY KEY (tenant_id, user_id)
        );
      `)
      await client.query(
        'CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON tenant_members (user_id);',
      )

      this.platformSchemaEnsured = true
    } finally {
      client.release()
    }
  }

  async clearCache(): Promise<void> {
    // Close all existing tenant connections safely
    for (const [tenantId, pool] of this.tenantConnections.entries()) {
      try {
        console.log(
          `[DatabasePlatformClient] Closing connection for tenant: ${tenantId}`,
        )
        if (!pool.ended) {
          await pool.end()
        }
      } catch (error) {
        console.warn(
          `[DatabasePlatformClient] Error closing pool for tenant ${tenantId}:`,
          error,
        )
      }
    }
    this.tenantConnections.clear()
    console.log('[DatabasePlatformClient] Connection cache cleared')
  }

  async getTenantConnection(
    tenantId: string,
    mode: 'ro' | 'rw' = 'rw',
  ): Promise<Pool> {
    console.log(
      '🔍 [DatabasePlatformClient] getTenantConnection called for tenant:',
      tenantId,
    )

    const cacheKey = `${tenantId}:${mode}`

    // Check if we already have a valid connection
    if (this.tenantConnections.has(cacheKey)) {
      const existingPool = this.tenantConnections.get(cacheKey)!
      if (!existingPool.ended) {
        console.log(
          '[DatabasePlatformClient] Reusing existing connection for tenant:',
          cacheKey,
        )
        return existingPool
      } else {
        // Remove ended pool from cache
        console.log(
          '[DatabasePlatformClient] Removing ended connection for tenant:',
          cacheKey,
        )
        this.tenantConnections.delete(cacheKey)
      }
    }

    if (this.tenantConnections.has(cacheKey)) {
      return this.tenantConnections.get(cacheKey)!
    }

    // Resolve a default password for tenant connections via env/secrets.
    const defaultTenantPassword = resolveSecret({
      valueEnv: 'POSTGRES_PASSWORD',
      fileEnv: 'POSTGRES_PASSWORD_FILE',
      defaultFilePath: '/run/secrets/db_password',
    })

    // Get tenant connection info from platform database
    const client = await this.pgPool.connect()
    try {
      const result = await client.query(
        'SELECT connection_info FROM tenants WHERE id = $1',
        [tenantId],
      )
      if (!result.rows[0]) {
        throw new Error(`Tenant ${tenantId} not found`)
      }

      const connectionInfo = result.rows[0].connection_info

      const resolveCred = (
        info: any,
        desired: 'ro' | 'rw',
      ): { user?: string; password?: string } => {
        const candidateUserKeys =
          desired === 'ro'
            ? ['ro_user', 'ro_username', 'username_ro', 'user_ro']
            : ['rw_user', 'rw_username', 'username_rw', 'user_rw']
        const candidatePassKeys =
          desired === 'ro'
            ? ['ro_password', 'password_ro', 'pass_ro']
            : ['rw_password', 'password_rw', 'pass_rw']

        const user =
          candidateUserKeys.map((k) => info?.[k]).find(Boolean) ||
          info?.user ||
          info?.username
        const password =
          candidatePassKeys.map((k) => info?.[k]).find(Boolean) ||
          info?.password
        return { user, password }
      }

      const { user: chosenUser, password: chosenPassword } = resolveCred(
        connectionInfo,
        mode,
      )

      const tenantConfig = {
        host:
          connectionInfo.host ||
          process.env.POSTGRES_HOST ||
          'postgres-primary',
        port: Number(connectionInfo.port || process.env.POSTGRES_PORT || 5432),
        database:
          connectionInfo.database || process.env.POSTGRES_DB || 'platform_db',
        user: chosenUser || process.env.POSTGRES_USER || 'platform_admin',
        password: chosenPassword || defaultTenantPassword,
        max: 10,
      }

      const redactSecrets = (value: any) => {
        if (!value || typeof value !== 'object') return value
        const out: Record<string, any> = Array.isArray(value)
          ? {}
          : { ...value }
        for (const key of Object.keys(out)) {
          if (/pass(word)?|secret|token/i.test(key)) out[key] = '[REDACTED]'
        }
        return out
      }

      const { password: _password, ...tenantConfigNoPassword } = tenantConfig
      console.log(
        '[DatabasePlatformClient] connection_info (redacted):',
        redactSecrets(connectionInfo),
      )
      console.log(
        '[DatabasePlatformClient] Final tenant config (no password):',
        tenantConfigNoPassword,
      )
      console.log('[DatabasePlatformClient] Environment fallbacks:', {
        POSTGRES_HOST: process.env.POSTGRES_HOST,
        POSTGRES_PORT: process.env.POSTGRES_PORT,
        POSTGRES_DB: process.env.POSTGRES_DB,
        POSTGRES_USER: process.env.POSTGRES_USER,
      })

      const tenantPool = new Pool(tenantConfig)

      // Test the connection and verify target database (when declared)
      try {
        const testClient = await tenantPool.connect()
        const testResult = await testClient.query(
          'SELECT current_database(), current_user, inet_server_port()',
        )
        console.log(
          '[DatabasePlatformClient] Tenant connection test result:',
          testResult.rows[0],
        )

        const actualDb = testResult.rows[0]?.current_database
        const actualUser = testResult.rows[0]?.current_user
        const actualPort = testResult.rows[0]?.inet_server_port

        if (tenantConfig.database && actualDb !== tenantConfig.database) {
          throw new Error(
            `WRONG DATABASE! Expected '${tenantConfig.database}', got '${actualDb}'. User: ${actualUser}, Port: ${actualPort}. Host: ${tenantConfig.host}`,
          )
        }

        testClient.release()
      } catch (error) {
        console.error(
          '[DatabasePlatformClient] Tenant connection test failed:',
          error,
        )
        // Safely end the pool
        try {
          if (!tenantPool.ended) {
            await tenantPool.end()
          }
        } catch (endError) {
          console.warn(
            '[DatabasePlatformClient] Error ending failed pool:',
            endError,
          )
        }
        throw error
      }

      this.tenantConnections.set(cacheKey, tenantPool)
      return tenantPool
    } finally {
      client.release()
    }
  }

  async executeQuery(
    tenantId: string,
    sql: string,
    params: any[] = [],
    mode: 'ro' | 'rw' = 'rw',
  ): Promise<any> {
    const pool = await this.getTenantConnection(tenantId, mode)
    const client = await pool.connect()
    try {
      // Defensive per-request session timeouts (tiering can be added later).
      // Use SET (not SET LOCAL) so it works without wrapping in an explicit transaction.
      await client.query("SET statement_timeout TO '15000ms'")
      await client.query("SET lock_timeout TO '3000ms'")
      await client.query("SET idle_in_transaction_session_timeout TO '15000ms'")

      const startTime = Date.now()
      const result = await client.query(sql, params)
      const executionTime = Date.now() - startTime

      return {
        data: result.rows,
        rowCount: result.rowCount,
        executionTime,
        fields: result.fields?.map((f) => ({
          name: f.name,
          dataTypeID: f.dataTypeID,
        })),
      }
    } finally {
      // Reset timeouts to avoid leaking config across pooled sessions.
      try {
        await client.query('RESET statement_timeout')
        await client.query('RESET lock_timeout')
        await client.query('RESET idle_in_transaction_session_timeout')
      } catch (_) {
        // ignore
      }
      client.release()
    }
  }

  async getSchemas(tenantId: string, mode: 'ro' | 'rw' = 'ro'): Promise<any[]> {
    const result = await this.executeQuery(
      tenantId,
      `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `,
      [],
      mode,
    )
    return result.data
  }

  async getTables(
    tenantId: string,
    schemaName: string = 'public',
    mode: 'ro' | 'rw' = 'ro',
  ): Promise<any[]> {
    console.log(
      `[DatabasePlatformClient] getTables called for tenant: ${tenantId}, schema: ${schemaName}`,
    )

    try {
      const result = await this.executeQuery(
        tenantId,
        `
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
      `,
        [schemaName],
        mode,
      )

      console.log(
        `[DatabasePlatformClient] getTables result for schema '${schemaName}':`,
        {
          count: result.data?.length || 0,
          tables: result.data?.map((t: any) => t.table_name),
        },
      )

      return result.data || []
    } catch (error) {
      console.error(
        `[DatabasePlatformClient] Error getting tables for schema '${schemaName}':`,
        error,
      )
      throw error
    }
  }

  async getTableColumns(
    tenantId: string,
    schemaName: string,
    tableName: string,
    mode: 'ro' | 'rw' = 'ro',
  ): Promise<any[]> {
    const result = await this.executeQuery(
      tenantId,
      `
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
    `,
      [schemaName, tableName],
      mode,
    )
    return result.data
  }

  async createSchema(tenantId: string, schemaName: string): Promise<void> {
    await this.executeQuery(
      tenantId,
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
      [],
      'rw',
    )
  }

  async createTable(
    tenantId: string,
    schemaName: string,
    tableName: string,
    columns: any[],
  ): Promise<void> {
    const columnDefs = columns
      .map((col) => {
        let def = `"${col.name}" ${col.type}`
        if (!col.nullable) def += ' NOT NULL'
        if (col.primary_key) def += ' PRIMARY KEY'
        if (col.default) def += ` DEFAULT ${col.default}`
        return def
      })
      .join(', ')

    const sql = `CREATE TABLE "${schemaName}"."${tableName}" (${columnDefs})`
    await this.executeQuery(tenantId, sql, [], 'rw')
  }

  async getTenants(userId?: string): Promise<any[]> {
    const client = await this.pgPool.connect()
    try {
      let query = `
        SELECT t.*, o.name as organization_name 
        FROM tenants t 
        LEFT JOIN organizations o ON t.organization_id = o.id 
        WHERE t.status = 'active'
      `
      const params: any[] = []

      if (userId) {
        query += ` AND t.organization_id IN (
          SELECT organization_id FROM organization_users WHERE user_id = $1
        )`
        params.push(userId)
      }

      query += ' ORDER BY t.created_at DESC'

      const result = await client.query(query, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  async createTenant(
    organizationId: string,
    name: string,
    plan: string = 'free',
  ): Promise<any> {
    // Call tenant provisioner service
    const response = await fetch('http://tenant-provisioner:3003/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, name, plan }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create tenant: ${response.statusText}`)
    }

    return response.json()
  }

  // Platform database access
  get platformPool(): Pool {
    return this.pgPool
  }

  // Cleanup method for graceful shutdown
  async cleanup(): Promise<void> {
    console.log('[DatabasePlatformClient] Starting cleanup...')

    // Close all tenant connections
    await this.clearCache()

    // Close platform connection
    try {
      if (!this.pgPool.ended) {
        await this.pgPool.end()
        console.log('[DatabasePlatformClient] Platform pool closed')
      }
    } catch (error) {
      console.warn(
        '[DatabasePlatformClient] Error closing platform pool:',
        error,
      )
    }

    console.log('[DatabasePlatformClient] Cleanup completed')
  }

  async getUserById(userId: string): Promise<any> {
    const client = await this.pgPool.connect()
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [
        userId,
      ])
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async getUserMembership(userId: string): Promise<any> {
    const client = await this.pgPool.connect()
    try {
      const result = await client.query(
        'SELECT * FROM organization_users WHERE user_id = $1',
        [userId],
      )
      return result.rows[0]
    } finally {
      client.release()
    }
  }
}
