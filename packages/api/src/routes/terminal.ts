/**
 * Terminal API Routes
 * Production-grade REST API for terminal workspace management
 * Integrated with NexusAI app generation and database provisioning
 * WebSocket connections are handled separately in TerminalWebSocketHandler
 */

import { Router, Request, Response, NextFunction } from 'express'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { containerManager } from '../services/ContainerManager'
import { previewProxyService } from '../services/PreviewProxyService'
import { authMiddleware, AuthRequest } from '@vpn-enterprise/auth'
import { resolveSecret } from '../utils/secrets'

const router = Router()

// Apply authentication to all terminal routes
router.use(authMiddleware)

// Database pool for platform_db
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

/**
 * Create a new workspace/container
 * POST /api/v1/terminal/workspaces
 * Body: { app_id?, name?, memoryLimit?, cpuLimit?, diskLimit?, timeoutMinutes? }
 */
router.post('/workspaces', async (req: AuthRequest, res: Response) => {
  const pool = getDbPool()
  try {
    const { app_id, name, memoryLimit, cpuLimit, diskLimit, timeoutMinutes } =
      req.body
    const userId = req.user?.id
    const userEmail = req.user?.email

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const workspaceId = randomUUID()
    let appFiles: any[] = []
    let envVars: Record<string, string> = {}
    let hasApp = false
    let hasDatabase = false
    let workspaceName = name || 'My Workspace'

    // If app_id provided, fetch app files and database info
    if (app_id) {
      console.log(`[TerminalAPI] Creating workspace for app: ${app_id}`)

      // Verify app ownership
      const appResult = await pool.query(
        'SELECT id, app_name, framework, user_id, tenant_id FROM nexusai_generated_apps WHERE id = $1',
        [app_id],
      )

      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'App not found' })
      }

      const app = appResult.rows[0]

      if (app.user_id !== userId) {
        return res
          .status(403)
          .json({ error: 'Access denied: You do not own this app' })
      }

      workspaceName = `${app.app_name} Workspace`
      hasApp = true

      // Fetch app files
      const filesResult = await pool.query(
        'SELECT file_path, content, language FROM nexusai_app_files WHERE app_id = $1 ORDER BY file_path',
        [app_id],
      )
      appFiles = filesResult.rows
      console.log(`[TerminalAPI] Fetched ${appFiles.length} files for app`)

      // If app has a provisioned database, fetch connection info
      if (app.tenant_id) {
        console.log(
          `[TerminalAPI] App has database, fetching connection info...`,
        )
        try {
          const tenantResult = await pool.query(
            'SELECT database_name, db_username, db_password FROM tenants WHERE id = $1',
            [app.tenant_id],
          )

          if (tenantResult.rows.length > 0) {
            const tenant = tenantResult.rows[0]
            const dbHost = process.env.POSTGRES_HOST || 'vpn-postgres'
            const dbPort = process.env.POSTGRES_PORT || '5432'

            envVars = {
              DATABASE_URL: `postgresql://${tenant.db_username}:${tenant.db_password}@${dbHost}:${dbPort}/${tenant.database_name}?sslmode=prefer`,
              DB_HOST: dbHost,
              DB_PORT: dbPort,
              DB_NAME: tenant.database_name,
              DB_USER: tenant.db_username,
              DB_PASSWORD: tenant.db_password,
            }
            hasDatabase = true
            console.log(`[TerminalAPI] Database environment variables injected`)
          }
        } catch (dbError) {
          console.error('[TerminalAPI] Failed to fetch database info:', dbError)
          // Continue without database - non-fatal
        }
      }
    }

    // Create container with app files and env vars
    const container = await containerManager.createContainer({
      workspaceId,
      userId,
      memoryLimit: memoryLimit || '512m',
      cpuLimit: cpuLimit || '1.0',
      diskLimit: diskLimit || '2G',
      timeoutMinutes: timeoutMinutes || 60,
      files: appFiles.length > 0 ? appFiles : undefined,
      env: Object.keys(envVars).length > 0 ? envVars : undefined,
    })

    // Save workspace record to database
    await pool.query(
      `INSERT INTO terminal_workspaces (id, user_id, app_id, container_id, name, status, created_at, updated_at, last_used_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW(), NOW())`,
      [
        workspaceId,
        userId,
        app_id || null,
        container.containerId,
        workspaceName,
      ],
    )

    console.log(`[TerminalAPI] Workspace created: ${workspaceId}`)

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace_id: workspaceId,
      name: workspaceName,
      status: 'active',
      has_app: hasApp,
      has_database: hasDatabase,
      file_count: appFiles.length,
      preview_url: `/api/v1/terminal/preview/${workspaceId}/`,
      websocket_url: `/terminal/ws/${workspaceId}`,
      container,
    })
  } catch (error: any) {
    console.error('[TerminalAPI] Error creating workspace:', error)
    res.status(500).json({
      error: 'Failed to create workspace',
      message: error.message,
    })
  }
})

/**
 * Get workspace info
 * GET /api/v1/terminal/workspaces/:workspaceId
 */
router.get(
  '/workspaces/:workspaceId',
  async (req: AuthRequest, res: Response) => {
    const pool = getDbPool()
    try {
      const { workspaceId } = req.params
      const userId = req.user?.id

      // Fetch workspace from database
      const workspaceResult = await pool.query(
        `SELECT tw.*, nga.app_name, nga.framework, nga.requires_database
       FROM terminal_workspaces tw
       LEFT JOIN nexusai_generated_apps nga ON tw.app_id = nga.id
       WHERE tw.id = $1`,
        [workspaceId],
      )

      if (workspaceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      const workspace = workspaceResult.rows[0]

      // Verify ownership
      if (workspace.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Get container info
      const container = containerManager.getContainer(workspaceId)

      // Get resource usage if container is running
      let usage = null
      if (container && workspace.status === 'active') {
        try {
          usage = await containerManager.getResourceUsage(workspaceId)
        } catch (e) {
          console.warn('[TerminalAPI] Failed to get resource usage:', e)
        }
      }

      // Get preview URL
      const previewUrl = previewProxyService.getPreviewUrl(
        workspaceId,
        `${req.protocol}://${req.get('host')}`,
      )

      res.json({
        workspace_id: workspace.id,
        name: workspace.name,
        status: workspace.status,
        has_app: !!workspace.app_id,
        app_name: workspace.app_name,
        framework: workspace.framework,
        command_count: workspace.command_count,
        created_at: workspace.created_at,
        last_used_at: workspace.last_used_at,
        container: container || null,
        usage,
        preview_url: previewUrl,
      })
    } catch (error: any) {
      console.error('[TerminalAPI] Error getting workspace:', error)
      res.status(500).json({
        error: 'Failed to get workspace info',
        message: error.message,
      })
    }
  },
)

/**
 * List user's workspaces
 * GET /api/v1/terminal/workspaces
 */
router.get('/workspaces', async (req: AuthRequest, res: Response) => {
  const pool = getDbPool()
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Fetch workspaces from database with app info
    const workspacesResult = await pool.query(
      `SELECT tw.id, tw.name, tw.status, tw.command_count, tw.created_at, tw.last_used_at,
              nga.app_name, nga.framework, nga.requires_database,
              (tw.app_id IS NOT NULL) as has_app
       FROM terminal_workspaces tw
       LEFT JOIN nexusai_generated_apps nga ON tw.app_id = nga.id
       WHERE tw.user_id = $1 AND tw.status = 'active'
       ORDER BY tw.last_used_at DESC`,
      [userId],
    )

    const workspaces = workspacesResult.rows.map((w) => ({
      workspace_id: w.id,
      name: w.name,
      status: w.status,
      has_app: w.has_app,
      app_name: w.app_name,
      framework: w.framework,
      command_count: w.command_count,
      created_at: w.created_at,
      last_used_at: w.last_used_at,
      preview_url: `/api/v1/terminal/preview/${w.id}/`,
      websocket_url: `/terminal/ws/${w.id}`,
    }))

    res.json({
      count: workspaces.length,
      workspaces,
    })
  } catch (error: any) {
    console.error('[TerminalAPI] Error listing workspaces:', error)
    res.status(500).json({
      error: 'Failed to list workspaces',
      message: error.message,
    })
  }
})

/**
 * Stop and remove a workspace
 * DELETE /api/v1/terminal/workspaces/:workspaceId
 */
router.delete(
  '/workspaces/:workspaceId',
  async (req: AuthRequest, res: Response) => {
    const pool = getDbPool()
    try {
      const { workspaceId } = req.params
      const userId = req.user?.id

      // Fetch workspace from database
      const workspaceResult = await pool.query(
        'SELECT id, user_id, status FROM terminal_workspaces WHERE id = $1',
        [workspaceId],
      )

      if (workspaceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      const workspace = workspaceResult.rows[0]

      // Verify ownership
      if (workspace.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Stop the container
      await containerManager.stopContainer(workspaceId)

      // Close preview session
      previewProxyService.closeSession(workspaceId)

      // Update database status
      await pool.query(
        "UPDATE terminal_workspaces SET status = 'stopped', updated_at = NOW() WHERE id = $1",
        [workspaceId],
      )

      console.log(`[TerminalAPI] Workspace stopped: ${workspaceId}`)

      res.json({ message: 'Workspace stopped successfully' })
    } catch (error: any) {
      console.error('[TerminalAPI] Error stopping workspace:', error)
      res.status(500).json({
        error: 'Failed to stop workspace',
        message: error.message,
      })
    }
  },
)

/**
 * Execute command in workspace (REST fallback for non-WebSocket clients)
 * POST /api/v1/terminal/workspaces/:workspaceId/exec
 */
router.post(
  '/workspaces/:workspaceId/exec',
  async (req: AuthRequest, res: Response) => {
    try {
      const { workspaceId } = req.params
      const { command, timeout, cwd } = req.body
      const userId = req.user?.id

      if (!command) {
        return res.status(400).json({ error: 'Command required' })
      }

      const container = containerManager.getContainer(workspaceId)

      if (!container) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      // Verify ownership
      if (container.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const result = await containerManager.executeCommand(
        workspaceId,
        command,
        {
          timeout,
          cwd,
        },
      )

      res.json({
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      })
    } catch (error: any) {
      console.error('[TerminalAPI] Error executing command:', error)
      res.status(500).json({
        error: 'Failed to execute command',
        message: error.message,
      })
    }
  },
)

/**
 * Preview proxy - handles requests to running dev servers
 * ALL /api/v1/terminal/preview/:workspaceId/*
 */
router.all(
  '/preview/:workspaceId/*',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    await previewProxyService.handleRequest(req, res, next)
  },
)

/**
 * Get preview session info
 * GET /api/v1/terminal/preview/:workspaceId/info
 */
router.get(
  '/preview/:workspaceId/info',
  async (req: AuthRequest, res: Response) => {
    try {
      const { workspaceId } = req.params
      const userId = req.user?.id

      const container = containerManager.getContainer(workspaceId)

      if (!container) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      if (container.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const session = previewProxyService.getSession(workspaceId)
      const baseUrl = `${req.protocol}://${req.get('host')}`
      const previewUrl = previewProxyService.getPreviewUrl(workspaceId, baseUrl)

      res.json({
        available: !!session,
        url: previewUrl,
        session,
      })
    } catch (error: any) {
      console.error('[TerminalAPI] Error getting preview info:', error)
      res.status(500).json({
        error: 'Failed to get preview info',
        message: error.message,
      })
    }
  },
)

/**
 * Health check
 * GET /api/v1/terminal/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

export default router
