import type { Router } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { Pool } from 'pg'
import { resolveSecret } from '../utils/secrets'
import { nexusAIDatabaseProvisioner } from '../services/nexusai-database-provisioner'
import {
  requireCreditsForAI,
  requireCreditsForDatabase,
} from '../middleware/billing'
import { rateLimitPresets } from '../middleware/rate-limit'

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
): Promise<string> {
  try {
    // First check if user exists by ID
    const checkById = await pool.query(
      'SELECT id, email FROM "user" WHERE id = $1',
      [userId],
    )

    if (checkById.rows.length > 0) {
      // User exists with this ID
      return checkById.rows[0].id
    }

    // Check if user exists by email
    const checkByEmail = await pool.query(
      'SELECT id, email FROM "user" WHERE email = $1',
      [userEmail],
    )

    if (checkByEmail.rows.length > 0) {
      // User exists with this email but different ID
      // Return the existing user's ID to use for the app
      console.log(
        `[GeneratedApps] Found existing user with email ${userEmail}, using ID: ${checkByEmail.rows[0].id}`,
      )
      return checkByEmail.rows[0].id
    }

    // User doesn't exist by ID or email, create new user
    const insertResult = await pool.query(
      `INSERT INTO "user" (id, email, "roleSlug", "createdAt", "updatedAt", disabled, "mfaEnabled")
       VALUES ($1, $2, 'global:member', NOW(), NOW(), false, false)
       RETURNING id`,
      [userId, userEmail],
    )
    console.log(
      `[GeneratedApps] Created user in platform_db: ${userEmail} (${userId})`,
    )
    return insertResult.rows[0].id
  } catch (error) {
    console.error('[GeneratedApps] Error ensuring user exists:', error)
    // Return the original userId and let the foreign key constraint handle it
    return userId
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
  router.post(
    '/',
    rateLimitPresets.aiGeneration,
    requireCreditsForAI,
    async (req: AuthRequest, res) => {
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

        // Ensure user exists in platform_db and get the actual user ID to use
        const actualUserId = await ensureUserExists(pool, userId, userEmail)
        console.log(
          `[GeneratedApps] Using user ID: ${actualUserId} to save app`,
        )

        const client = await pool.connect()
        try {
          await client.query('BEGIN')

          // Insert app with the actual user ID
          console.log(
            '[GeneratedApps] Inserting app into nexusai_generated_apps...',
          )
          const appResult = await client.query(
            `
          INSERT INTO nexusai_generated_apps (
            user_id, tenant_id, app_name, description, framework, styling,
            features, dependencies, requires_database, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'generated')
          RETURNING *
          `,
            [
              actualUserId,
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
          console.log(`[GeneratedApps] App saved with ID: ${app.id}`)

          // Insert files
          if (files.length > 0) {
            console.log(`[GeneratedApps] Inserting ${files.length} files...`)
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
            console.log(`[GeneratedApps] Files saved successfully`)
          }

          await client.query('COMMIT')
          console.log(`[GeneratedApps] Transaction committed successfully`)

          res.json({ app, message: 'App saved successfully' })
        } catch (e) {
          await client.query('ROLLBACK')
          console.error(
            '[GeneratedApps] Transaction rolled back due to error:',
            e,
          )
          throw e
        } finally {
          client.release()
        }
      } catch (e: any) {
        console.error('[GeneratedApps] Failed to save app:', e)
        res
          .status(500)
          .json({ error: 'Failed to save app', message: e.message })
      }
    },
  )

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
  router.post(
    '/:appId/database/provision',
    rateLimitPresets.databaseProvisioning,
    requireCreditsForDatabase,
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user?.id
        const userEmail = req.user?.email
        if (!userId || !userEmail) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const { appId } = req.params
        const { initialize_schema = false } = req.body

        // Get app details with files (and the actual user_id stored in the app record)
        const appResult = await pool.query(
          'SELECT id, app_name, framework, features, requires_database, user_id FROM nexusai_generated_apps WHERE id = $1',
          [appId],
        )

        if (appResult.rows.length === 0) {
          return res.status(404).json({ error: 'App not found' })
        }

        const app = appResult.rows[0]
        const appUserId = app.user_id // The actual user ID from ensureUserExists

        // Verify the authenticated user owns this app (or find the actual user ID)
        const actualUserId = await ensureUserExists(
          pool,
          userId,
          req.user?.email || '',
        )

        // Check if the authenticated user is the app owner (handles Supabase ID vs platform_db ID mismatch)
        if (appUserId !== actualUserId && appUserId !== userId) {
          return res
            .status(403)
            .json({ error: 'Forbidden: You do not own this app' })
        }

        // Get app files for schema extraction
        const filesResult = await pool.query(
          'SELECT file_path, content, language FROM nexusai_app_files WHERE app_id = $1 ORDER BY file_path',
          [appId],
        )
        const appFiles = filesResult.rows

        // Check if database already exists
        const existingDb =
          await nexusAIDatabaseProvisioner.getDatabaseInfo(appId)
        if (existingDb) {
          return res.json({
            database: existingDb,
            message: 'Database already exists',
            already_exists: true,
          })
        }

        console.log(
          `[GeneratedApps] Provisioning database for app: ${app.app_name}`,
        )
        console.log(
          `[GeneratedApps] Analyzing ${appFiles.length} files for schema extraction`,
        )

        // Provision the database with app files for auto-schema generation
        // Use the appUserId (from ensureUserExists) for tenant membership
        const database = await nexusAIDatabaseProvisioner.provisionDatabase({
          userId: appUserId,
          appId,
          appName: app.app_name,
          framework: app.framework,
          features: app.features || [],
          appFiles: appFiles.length > 0 ? appFiles : undefined,
        })

        // Update app status
        await pool.query(
          'UPDATE nexusai_generated_apps SET requires_database = true, updated_at = NOW() WHERE id = $1',
          [appId],
        )

        res.json({
          database: {
            ...database,
            password: '***REDACTED***', // Don't send password in response
          },
          connection_string: database.connectionString,
          tables_created: database.tablesCreated || 0,
          schema_generated: (database.tablesCreated || 0) > 0,
          message: database.tablesCreated
            ? `Database provisioned with ${database.tablesCreated} tables created automatically`
            : 'Database provisioned successfully',
        })
      } catch (e: any) {
        console.error('Failed to provision database:', e)
        res.status(500).json({
          error: 'Failed to provision database',
          message: e.message,
        })
      }
    },
  )

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
        connection_string: database.connectionString
          ? database.connectionString.replace(/:([^:@]+)@/, ':***@')
          : undefined, // Redact password from connection string
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

      const success =
        await nexusAIDatabaseProvisioner.deprovisionDatabase(appId)

      if (!success) {
        return res.status(404).json({ error: 'No database found for this app' })
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
