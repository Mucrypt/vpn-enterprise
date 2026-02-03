import type { Router } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { Pool } from 'pg'
import { resolveSecret } from '../utils/secrets'
import { nexusAIDatabaseProvisioner } from '../services/nexusai-database-provisioner'

// Use platform database pool
let dbPool: Pool

function getDbPool(): Pool {
  if (!dbPool) {
    const postgresPassword = resolveSecret({
      valueEnv: 'POSTGRES_PASSWORD',
      fileEnv: 'POSTGRES_PASSWORD_FILE',
      defaultFilePath: '/run/secrets/db_password',
    })

    dbPool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'platform_db',
      user: process.env.POSTGRES_USER || 'platform_admin',
      password: postgresPassword,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return dbPool
}

// Ensure user exists in platform_db (for users authenticated via Supabase)
async function ensureUserExists(
  pool: Pool,
  userId: string,
  userEmail: string,
): Promise<void> {
  try {
    // Check if user exists
    const checkResult = await pool.query(
      'SELECT id FROM "user" WHERE id = $1',
      [userId],
    )

    if (checkResult.rows.length === 0) {
      // User doesn't exist, create them
      await pool.query(
        `INSERT INTO "user" (id, email, "roleSlug", "createdAt", "updatedAt", disabled, "mfaEnabled")
         VALUES ($1, $2, 'global:member', NOW(), NOW(), false, false)
         ON CONFLICT (id) DO NOTHING`,
        [userId, userEmail],
      )
      console.log(
        `[GeneratedApps] Created user in platform_db: ${userEmail} (${userId})`,
      )
    }
  } catch (error) {
    console.error('[GeneratedApps] Error ensuring user exists:', error)
    // Don't throw - let the foreign key constraint handle it if creation fails
  }
}

export function registerGeneratedAppsRoutes(router: Router) {
  const pool = getDbPool()

  // List user's generated apps
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const result = await pool.query(
        `
        SELECT 
          a.*,
          COUNT(f.id) as file_count
        FROM nexusai_generated_apps a
        LEFT JOIN nexusai_app_files f ON f.app_id = a.id
        WHERE a.user_id = $1
        GROUP BY a.id
        ORDER BY a.created_at DESC
        `,
        [userId],
      )

      res.json({ apps: result.rows || [] })
    } catch (e: any) {
      console.error('Failed to list apps:', e)
      res.status(500).json({ error: 'Failed to list apps', message: e.message })
    }
  })

  // Get a specific generated app with files
  router.get('/:appId', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { appId } = req.params

      // Get app details
      const appResult = await pool.query(
        'SELECT * FROM nexusai_generated_apps WHERE id = $1 AND user_id = $2',
        [appId, userId],
      )

      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'App not found' })
      }

      // Get app files
      const filesResult = await pool.query(
        'SELECT * FROM nexusai_app_files WHERE app_id = $1 ORDER BY file_path',
        [appId],
      )

      res.json({
        app: {
          ...appResult.rows[0],
          files: filesResult.rows || [],
        },
      })
    } catch (e: any) {
      console.error('Failed to get app:', e)
      res.status(500).json({ error: 'Failed to get app', message: e.message })
    }
  })

  // Save a newly generated app
  router.post('/', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      const userEmail = req.user?.email
      if (!userId || !userEmail) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const {
        app_name,
        description,
        framework,
        styling,
        features = [],
        dependencies = {},
        requires_database = false,
        files = [],
        tenant_id,
      } = req.body

      if (!app_name || !description || !framework) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Ensure user exists in platform_db before inserting app
      await ensureUserExists(pool, userId, userEmail)

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Insert app
        const appResult = await client.query(
          `
          INSERT INTO nexusai_generated_apps (
            user_id, tenant_id, app_name, description, framework, styling,
            features, dependencies, requires_database, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'generated')
          RETURNING *
          `,
          [
            userId,
            tenant_id || null,
            app_name,
            description,
            framework,
            styling || null,
            JSON.stringify(features),
            JSON.stringify(dependencies),
            requires_database,
          ],
        )

        const app = appResult.rows[0]

        // Insert files
        if (files.length > 0) {
          const fileValues = files.map((file: any) => [
            app.id,
            file.file_path || file.path || 'unknown',
            file.content || '',
            file.language || 'text',
            (file.content || '').length,
            file.is_entry_point || false,
          ])

          const fileQuery = `
            INSERT INTO nexusai_app_files (
              app_id, file_path, content, language, file_size, is_entry_point
            ) VALUES ${fileValues
              .map((_: any, i: number) => {
                const base = i * 6
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
              })
              .join(', ')}
          `

          await client.query(fileQuery, fileValues.flat())
        }

        await client.query('COMMIT')

        res.json({ app, message: 'App saved successfully' })
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    } catch (e: any) {
      console.error('Failed to save app:', e)
      res.status(500).json({ error: 'Failed to save app', message: e.message })
    }
  })

  // Delete a generated app
  router.delete('/:appId', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { appId } = req.params

      const result = await pool.query(
        'DELETE FROM nexusai_generated_apps WHERE id = $1 AND user_id = $2 RETURNING id',
        [appId, userId],
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'App not found' })
      }

      res.json({ message: 'App deleted successfully' })
    } catch (e: any) {
      console.error('Failed to delete app:', e)
      res
        .status(500)
        .json({ error: 'Failed to delete app', message: e.message })
    }
  })

  // Get app versions/history
  router.get('/:appId/versions', async (req: AuthRequest, res) => {
    try {
      res.json({ versions: [], message: 'Versions feature coming soon' })
    } catch (e: any) {
      res
        .status(500)
        .json({ error: 'Failed to get versions', message: e.message })
    }
  })

  // ==========================================
  // DATABASE PROVISIONING ENDPOINTS
  // ==========================================

  // Provision database for an app
  router.post('/:appId/database/provision', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      const userEmail = req.user?.email
      if (!userId || !userEmail) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { appId } = req.params
      const { initialize_schema = false } = req.body

      // Get app details
      const appResult = await pool.query(
        'SELECT id, app_name, framework, features, requires_database FROM nexusai_generated_apps WHERE id = $1 AND user_id = $2',
        [appId, userId],
      )

      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'App not found' })
      }

      const app = appResult.rows[0]

      // Check if database already exists
      const existingDb = await nexusAIDatabaseProvisioner.getDatabaseInfo(appId)
      if (existingDb) {
        return res.json({
          database: existingDb,
          message: 'Database already exists',
          already_exists: true,
        })
      }

      console.log(`[GeneratedApps] Provisioning database for app: ${app.app_name}`)

      // Provision the database
      const database = await nexusAIDatabaseProvisioner.provisionDatabase({
        userId,
        appId,
        appName: app.app_name,
        framework: app.framework,
        features: app.features || [],
      })

      // Optionally initialize schema
      let schemas: string[] = []
      if (initialize_schema) {
        schemas = await nexusAIDatabaseProvisioner.generateSchema({
          appId,
          features: app.features || [],
          framework: app.framework,
        })
        console.log(`[GeneratedApps] Generated ${schemas.length} schema statements`)
      }

      // Update app status
      await pool.query(
        'UPDATE nexusai_generated_apps SET requires_database = true, updated_at = NOW() WHERE id = $1',
        [appId],
      )

      res.json({
        database: {
          ...database,
          password: '***REDACTED***', // Don't send password in response, user gets it once
        },
        connection_string: database.connectionString,
        schemas: initialize_schema ? schemas : undefined,
        message: 'Database provisioned successfully',
      })
    } catch (e: any) {
      console.error('Failed to provision database:', e)
      res.status(500).json({
        error: 'Failed to provision database',
        message: e.message,
      })
    }
  })

  // Get database info for an app
  router.get('/:appId/database', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { appId } = req.params

      // Verify app ownership
      const appResult = await pool.query(
        'SELECT id FROM nexusai_generated_apps WHERE id = $1 AND user_id = $2',
        [appId, userId],
      )

      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'App not found' })
      }

      const database = await nexusAIDatabaseProvisioner.getDatabaseInfo(appId)

      if (!database) {
        return res.json({
          has_database: false,
          message: 'No database provisioned for this app',
        })
      }

      res.json({
        has_database: true,
        database: {
          ...database,
          password: '***REDACTED***', // Security: don't expose password
        },
        connection_string: database.connectionString.replace(
          /:([^:@]+)@/,
          ':***@',
        ), // Redact password from connection string
      })
    } catch (e: any) {
      console.error('Failed to get database info:', e)
      res.status(500).json({
        error: 'Failed to get database info',
        message: e.message,
      })
    }
  })

  // Delete database for an app (soft delete)
  router.delete('/:appId/database', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { appId } = req.params

      // Verify app ownership
      const appResult = await pool.query(
        'SELECT id FROM nexusai_generated_apps WHERE id = $1 AND user_id = $2',
        [appId, userId],
      )

      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'App not found' })
      }

      const success = await nexusAIDatabaseProvisioner.deprovisionDatabase(appId)

      if (!success) {
        return res
          .status(404)
          .json({ error: 'No database found for this app' })
      }

      res.json({ message: 'Database deprovisioned successfully' })
    } catch (e: any) {
      console.error('Failed to deprovision database:', e)
      res.status(500).json({
        error: 'Failed to deprovision database',
        message: e.message,
      })
    }
  })
}
