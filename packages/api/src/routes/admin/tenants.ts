/**
 * Admin Tenants Management Routes
 *
 * Provides admin endpoints for viewing all tenants:
 * - GET /api/v1/admin/tenants - List all tenants
 */

import { Router } from 'express'
import { authMiddleware } from '@vpn-enterprise/auth'
import { DatabasePlatformClient } from '../../database-platform-client'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

const router = Router()
const dbPlatform = new DatabasePlatformClient()

// Admin middleware - checks if user has admin role
const adminMiddleware = async (req: any, res: any, next: any) => {
  try {
    const userRole = req.user?.user_metadata?.role || req.user?.role

    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      })
    }

    next()
  } catch (error) {
    console.error('Admin middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/v1/admin/tenants
 * List all tenants with owner information
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tenantsResult = await dbPlatform.platformPool.query(`
      SELECT 
        t.id,
        t.name,
        t.subdomain,
        t.region,
        t.plan_type,
        t.status,
        t.created_at,
        t.updated_at,
        t.connection_info,
        tm.user_id as owner_id
      FROM public.tenants t
      LEFT JOIN public.tenant_members tm ON t.id = tm.tenant_id AND tm.role = 'owner'
      ORDER BY t.created_at DESC
    `)

    // Fetch owner emails from Supabase for each tenant
    const tenantsWithOwners = await Promise.all(
      tenantsResult.rows.map(async (tenant: any) => {
        let owner_email = null
        let owner_name = null

        if (tenant.owner_id) {
          try {
            const { data: userData } =
              await supabaseAdmin.auth.admin.getUserById(tenant.owner_id)
            if (userData?.user) {
              owner_email = userData.user.email
              owner_name =
                userData.user.user_metadata?.full_name ||
                userData.user.email?.split('@')[0]
            }
          } catch (err) {
            console.error(`Error fetching user ${tenant.owner_id}:`, err)
          }
        }

        return {
          ...tenant,
          owner_email,
          owner_name,
          db_host: tenant.connection_info?.host,
          db_port: tenant.connection_info?.port,
          db_name: tenant.connection_info?.database,
          tenant_id: tenant.id,
        }
      }),
    )

    res.json({
      tenants: tenantsWithOwners,
      total: tenantsResult.rowCount || 0,
    })
  } catch (error) {
    console.error('Get tenants error:', error)
    res.status(500).json({
      error: 'Failed to fetch tenants',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * DELETE /api/v1/admin/tenants/:tenantId
 * Delete a database project (tenant) and cleanup associated resources
 */
router.delete(
  '/:tenantId',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { tenantId } = req.params
    const client = await dbPlatform.platformPool.connect()

    try {
      await client.query('BEGIN')

      // Get tenant details before deletion
      const tenantResult = await client.query(
        'SELECT name, connection_info FROM public.tenants WHERE id = $1',
        [tenantId],
      )

      if (tenantResult.rowCount === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({
          error: 'Tenant not found',
          message: `Tenant with ID ${tenantId} does not exist`,
        })
      }

      const tenant = tenantResult.rows[0]
      const connectionInfo = tenant.connection_info
      const dbName = connectionInfo?.database
      const dbUser = connectionInfo?.username || connectionInfo?.user

      // Delete tenant memberships
      await client.query(
        'DELETE FROM public.tenant_members WHERE tenant_id = $1',
        [tenantId],
      )

      // Delete tenant record
      await client.query('DELETE FROM public.tenants WHERE id = $1', [tenantId])

      // Drop the actual database if it exists
      if (dbName) {
        try {
          // Terminate existing connections to the database
          await client.query(
            `
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
        `,
            [dbName],
          )

          // Drop the database
          await client.query(
            `DROP DATABASE IF EXISTS "${dbName.replace(/"/g, '""')}"`,
          )

          // Drop the database user/role
          if (dbUser) {
            await client.query(
              `DROP ROLE IF EXISTS "${dbUser.replace(/"/g, '""')}"`,
            )
          }
        } catch (dbError) {
          console.error('Error dropping database:', dbError)
          // Continue even if database drop fails - metadata is cleaned up
        }
      }

      await client.query('COMMIT')

      res.json({
        success: true,
        message: `Project "${tenant.name}" deleted successfully`,
        deletedDatabase: dbName,
        deletedUser: dbUser,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Delete tenant error:', error)
      res.status(500).json({
        error: 'Failed to delete tenant',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      client.release()
    }
  },
)

export default router
