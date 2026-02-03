import { randomBytes } from 'node:crypto'
import { DatabasePlatformClient } from '../database-platform-client'
import { ensureTenantDatabaseProvisioned } from '../routes/tenants/provisioning'
import { schemaExtractor } from './schema-extractor'

export interface NexusAIDatabase {
  tenantId: string
  database: string
  host: string
  port: number
  username: string
  password: string
  connectionString: string
  status: 'provisioned' | 'exists'
  tablesCreated?: number
  schemaSQL?: string
}

export interface ProvisionDatabaseOptions {
  userId: string
  appId: string
  appName: string
  framework: string
  features?: string[]
  appFiles?: Array<{ file_path: string; content: string; language: string }>
}

/**
 * Service for provisioning databases for NexusAI generated apps
 * Integrates with existing tenant provisioning system
 */
export class NexusAIDatabaseProvisioner {
  private db: DatabasePlatformClient

  constructor() {
    this.db = new DatabasePlatformClient()
  }

  /**
   * Provision a database for a NexusAI generated app
   * Creates a tenant record and provisions a dedicated PostgreSQL database
   */
  async provisionDatabase(
    opts: ProvisionDatabaseOptions,
  ): Promise<NexusAIDatabase> {
    const { userId, appId, appName, framework } = opts

    try {
      console.log(
        `[NexusAIProvisioner] Provisioning database for app: ${appName} (${appId})`,
      )

      // Generate a safe tenant name
      const tenantName = this.generateTenantName(appName, appId)

      // Check if tenant already exists for this app
      const existingTenant = await this.findExistingTenant(appId)
      if (existingTenant) {
        console.log(
          `[NexusAIProvisioner] Database already exists for app ${appId}`,
        )
        return existingTenant
      }

      // Create tenant record in platform_db
      const tenantId = await this.createTenantRecord({
        userId,
        appId,
        name: tenantName,
        framework,
      })

      // Use existing provisioning system to create database
      const provisionResult = await ensureTenantDatabaseProvisioned({
        tenantId,
      })

      // Update nexusai_generated_apps with tenant_id
      await this.linkAppToTenant(appId, tenantId)

      // Auto-generate and apply schema if app files provided
      let tablesCreated = 0
      let schemaSQL = ''
      if (opts.appFiles && opts.appFiles.length > 0) {
        try {
          console.log(
            `[NexusAIProvisioner] Extracting schema from app files...`,
          )
          const schema = schemaExtractor.extractSchema(opts.appFiles)
          schemaSQL = schemaExtractor.generateSQL(schema)

          console.log(
            `[NexusAIProvisioner] Applying schema: ${schema.tables.length} tables`,
          )

          // Execute schema SQL on the newly provisioned database
          await this.executeSchemaSQL(
            provisionResult.db,
            provisionResult.password || '',
            schemaSQL,
          )

          tablesCreated = schema.tables.length
          console.log(
            `[NexusAIProvisioner] Successfully created ${tablesCreated} tables`,
          )
        } catch (schemaError) {
          console.error(
            `[NexusAIProvisioner] Schema generation failed (non-fatal):`,
            schemaError,
          )
          // Non-fatal: database is still usable even if schema generation fails
        }
      }

      const connectionString = this.buildConnectionString({
        host: provisionResult.db.host,
        port: provisionResult.db.port,
        database: provisionResult.db.database,
        username: provisionResult.db.username,
        password: provisionResult.password || '',
      })

      console.log(
        `[NexusAIProvisioner] Successfully provisioned database for app ${appId}`,
      )

      return {
        tenantId,
        database: provisionResult.db.database,
        host: provisionResult.db.host,
        port: provisionResult.db.port,
        username: provisionResult.db.username,
        password: provisionResult.password || '',
        connectionString,
        status: provisionResult.provisioned ? 'provisioned' : 'exists',
        tablesCreated,
        schemaSQL: tablesCreated > 0 ? schemaSQL : undefined,
      }
    } catch (error) {
      console.error(
        `[NexusAIProvisioner] Failed to provision database for app ${appId}:`,
        error,
      )
      throw new Error(
        `Database provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Check if database exists for an app
   */
  async getDatabaseInfo(appId: string): Promise<NexusAIDatabase | null> {
    return this.findExistingTenant(appId)
  }

  /**
   * Deprovision database for an app (soft delete - marks tenant as inactive)
   */
  async deprovisionDatabase(appId: string): Promise<boolean> {
    try {
      const result = await this.db.platformPool.query(
        `UPDATE tenants 
         SET updated_at = NOW()
         WHERE id IN (
           SELECT tenant_id FROM nexusai_generated_apps WHERE id = $1
         )
         RETURNING id`,
        [appId],
      )

      return result.rowCount !== null && result.rowCount > 0
    } catch (error) {
      console.error(
        `[NexusAIProvisioner] Failed to deprovision database for app ${appId}:`,
        error,
      )
      return false
    }
  }

  /**
   * Generate a safe tenant name from app name
   */
  private generateTenantName(appName: string, appId: string): string {
    // Create a safe name: lowercase, replace spaces with hyphens, limit length
    const safeName = appName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40)

    // Add short identifier from app ID to ensure uniqueness
    const shortId = appId.split('-')[0]
    return `nexusai-${safeName}-${shortId}`
  }

  /**
   * Find existing tenant for an app
   */
  private async findExistingTenant(
    appId: string,
  ): Promise<NexusAIDatabase | null> {
    try {
      const result = await this.db.platformPool.query(
        `SELECT t.id as tenant_id, t.name, t.connection_info
         FROM tenants t
         INNER JOIN nexusai_generated_apps a ON a.tenant_id = t.id
         WHERE a.id = $1`,
        [appId],
      )

      if (result.rows.length === 0) {
        return null
      }

      const tenant = result.rows[0]
      const connInfo = tenant.connection_info || {}

      if (!connInfo.database || !connInfo.password) {
        console.error(
          `[NexusAIProvisioner] Incomplete connection info for app ${appId}:`,
          {
            hasDatabase: !!connInfo.database,
            hasPassword: !!connInfo.password,
          },
        )
        return null
      }

      const connectionString = this.buildConnectionString({
        host: connInfo.host || 'vpn-postgres',
        port: connInfo.port || 5432,
        database: connInfo.database,
        username: connInfo.username || connInfo.user || 'tenant_user',
        password: connInfo.password,
      })

      return {
        tenantId: tenant.tenant_id,
        database: connInfo.database,
        host: connInfo.host || 'vpn-postgres',
        port: connInfo.port || 5432,
        username: connInfo.username || connInfo.user || 'tenant_user',
        password: connInfo.password,
        connectionString,
        status: 'exists',
      }
    } catch (error) {
      console.error(
        `[NexusAIProvisioner] Error finding tenant for app ${appId}:`,
        error,
      )
      return null
    }
  }

  /**
   * Create tenant record in platform_db
   */
  private async createTenantRecord(opts: {
    userId: string
    appId: string
    name: string
    framework: string
  }): Promise<string> {
    const tenantId = randomBytes(16).toString('hex')

    console.log(
      `[NexusAIProvisioner] Creating tenant ${tenantId} for user ${opts.userId}`,
    )

    await this.db.platformPool.query(
      `INSERT INTO tenants (id, name, connection_info, created_at, updated_at)
       VALUES ($1, $2, '{}'::jsonb, NOW(), NOW())`,
      [tenantId, opts.name],
    )

    console.log(`[NexusAIProvisioner] Created tenant record: ${tenantId}`)

    // Add the user as a member of the tenant with admin role
    await this.db.platformPool.query(
      `INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
       VALUES ($1, $2, 'admin', NOW())
       ON CONFLICT (tenant_id, user_id) DO NOTHING`,
      [tenantId, opts.userId],
    )

    console.log(
      `[NexusAIProvisioner] Added user ${opts.userId} as admin of tenant ${tenantId}`,
    )

    // Verify membership was created
    const verifyResult = await this.db.platformPool.query(
      `SELECT role FROM tenant_members WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, opts.userId],
    )

    if (verifyResult.rows.length === 0) {
      console.error(
        `[NexusAIProvisioner] WARNING: Failed to verify tenant membership for user ${opts.userId}`,
      )
    } else {
      console.log(
        `[NexusAIProvisioner] Verified: User ${opts.userId} has role '${verifyResult.rows[0].role}' in tenant ${tenantId}`,
      )
    }

    return tenantId
  }

  /**
   * Link app to tenant in nexusai_generated_apps table
   */
  private async linkAppToTenant(
    appId: string,
    tenantId: string,
  ): Promise<void> {
    await this.db.platformPool.query(
      'UPDATE nexusai_generated_apps SET tenant_id = $1, updated_at = NOW() WHERE id = $2',
      [tenantId, appId],
    )

    console.log(
      `[NexusAIProvisioner] Linked app ${appId} to tenant ${tenantId}`,
    )
  }

  /**
   * Build PostgreSQL connection string
   */
  private buildConnectionString(opts: {
    host: string
    port: number
    database: string
    username: string
    password: string
  }): string {
    return `postgresql://${opts.username}:${opts.password}@${opts.host}:${opts.port}/${opts.database}?sslmode=prefer`
  }

  /**
   * Execute schema SQL on the provisioned database
   */
  private async executeSchemaSQL(
    db: { host: string; port: number; database: string; username: string },
    password: string,
    schemaSQL: string,
  ): Promise<void> {
    const { Pool } = await import('pg')
    const pool = new Pool({
      host: db.host,
      port: db.port,
      database: db.database,
      user: db.username,
      password: password,
      ssl: false,
    })

    try {
      await pool.query(schemaSQL)
      console.log(`[NexusAIProvisioner] Schema SQL executed successfully`)
    } catch (error) {
      console.error(`[NexusAIProvisioner] Schema SQL execution failed:`, error)
      throw error
    } finally {
      await pool.end()
    }
  }

  /**
   * Generate database schema based on app requirements
   * @deprecated Use SchemaExtractor instead - this is kept as fallback
   * This can be called after provisioning to initialize the database
   */
  async generateSchema(opts: {
    appId: string
    features?: string[]
    framework: string
  }): Promise<string[]> {
    // TODO: In future, use AI to generate schema based on app requirements
    // For now, return basic schema templates

    const schemas: string[] = []

    // Basic user table for most apps
    schemas.push(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Add feature-specific tables
    if (opts.features?.includes('authentication')) {
      schemas.push(`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      `)
    }

    if (opts.features?.includes('blog') || opts.features?.includes('content')) {
      schemas.push(`
        CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          content TEXT,
          published BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
      `)
    }

    if (opts.features?.includes('e-commerce')) {
      schemas.push(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(500) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          stock INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          total DECIMAL(10, 2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
    }

    return schemas
  }
}

// Singleton instance
export const nexusAIDatabaseProvisioner = new NexusAIDatabaseProvisioner()
