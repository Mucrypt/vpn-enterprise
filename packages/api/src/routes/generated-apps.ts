import type { Router } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { Pool } from 'pg'

// Use platform database pool
let dbPool: Pool

function getDbPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'platform_db',
      user: process.env.POSTGRES_USER || 'platform_admin',
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return dbPool
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
        [userId]
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
        [appId, userId]
      )

      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'App not found' })
      }

      // Get app files
      const filesResult = await pool.query(
        'SELECT * FROM nexusai_app_files WHERE app_id = $1 ORDER BY file_path',
        [appId]
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
      if (!userId) {
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
          ]
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
            ) VALUES ${fileValues.map((_: any, i: number) => {
              const base = i * 6
              return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
            }).join(', ')}
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
        [appId, userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'App not found' })
      }

      res.json({ message: 'App deleted successfully' })
    } catch (e: any) {
      console.error('Failed to delete app:', e)
      res.status(500).json({ error: 'Failed to delete app', message: e.message })
    }
  })

  // Get app versions/history
  router.get('/:appId/versions', async (req: AuthRequest, res) => {
    try {
      res.json({ versions: [], message: 'Versions feature coming soon' })
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to get versions', message: e.message })
    }
  })
}
