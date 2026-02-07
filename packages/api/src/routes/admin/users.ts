/**
 * Admin Users Management Routes
 *
 * Provides admin endpoints for managing platform users:
 * - GET /api/v1/admin/users - List all users
 * - DELETE /api/v1/admin/users/:userId - Delete a user
 */

import { Router } from 'express'
import { authMiddleware } from '@vpn-enterprise/auth'
import { DatabasePlatformClient } from '../../database-platform-client'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const dbPlatform = new DatabasePlatformClient()

// Initialize Supabase Admin client for auth.users access
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

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
 * GET /api/v1/admin/dashboard/stats
 * Get comprehensive dashboard statistics for admin panel
 */
router.get(
  '/dashboard/stats',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Get total users count
      const { data: usersData, error: usersError } =
        await supabaseAdmin.auth.admin.listUsers()

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`)
      }

      const totalUsers = usersData.users.length

      // Get database statistics
      const dbStatsResult = await dbPlatform.platformPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.tenants) as total_tenants,
        (SELECT COUNT(*) FROM public.generated_apps WHERE status = 'ready') as nexus_ai_apps,
        (SELECT COUNT(*) FROM public.tenants WHERE region = 'us-east-1') as us_east_tenants,
        (SELECT COUNT(*) FROM public.tenants WHERE region = 'eu-west-1') as eu_west_tenants
    `)

      const dbStats = dbStatsResult.rows[0]

      // Get subscription/billing stats if available
      let subscriptionStats = { total: 0, active: 0, trial: 0 }
      try {
        const subResult = await dbPlatform.platformPool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'trial' THEN 1 END) as trial
        FROM public.subscriptions
      `)
        if (subResult.rows.length > 0) {
          subscriptionStats = {
            total: parseInt(subResult.rows[0].total || '0'),
            active: parseInt(subResult.rows[0].active || '0'),
            trial: parseInt(subResult.rows[0].trial || '0'),
          }
        }
      } catch (err) {
        console.log('Subscriptions table might not exist:', err)
      }

      // Calculate additional metrics
      const dbPlatformStats = {
        databases: parseInt(dbStats.total_tenants || '0'),
        regions: 2, // us-east-1 and eu-west-1
      }

      const nexusAiStats = {
        apps: parseInt(dbStats.nexus_ai_apps || '0'),
      }

      res.json({
        users: {
          total: totalUsers,
          active: usersData.users.filter((u) => {
            const lastSignIn = u.last_sign_in_at
            if (!lastSignIn) return false
            const daysSinceSignIn =
              (Date.now() - new Date(lastSignIn).getTime()) /
              (1000 * 60 * 60 * 24)
            return daysSinceSignIn <= 30
          }).length,
          new_this_month: usersData.users.filter((u) => {
            const created = new Date(u.created_at)
            const now = new Date()
            return (
              created.getMonth() === now.getMonth() &&
              created.getFullYear() === now.getFullYear()
            )
          }).length,
        },
        database_platform: dbPlatformStats,
        nexus_ai: nexusAiStats,
        subscriptions: subscriptionStats,
        system: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
          node_version: process.version,
        },
      })
    } catch (error) {
      console.error('Get dashboard stats error:', error)
      res.status(500).json({
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)

/**
 * GET /api/v1/admin/users
 * List all platform users
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Use Supabase Admin API to list users
    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Supabase listUsers error:', usersError)
      return res.status(500).json({
        error: 'Failed to fetch users',
        message: usersError.message,
      })
    }

    // Get tenant counts for each user
    const usersWithTenants = await Promise.all(
      usersData.users.map(async (user) => {
        const tenantResult = await dbPlatform.platformPool.query(
          `SELECT COUNT(*) as tenant_count 
           FROM public.tenant_members 
           WHERE user_id = $1`,
          [user.id],
        )

        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          role: user.user_metadata?.role || 'user',
          tenant_count: parseInt(tenantResult.rows[0]?.tenant_count || '0'),
        }
      }),
    )

    res.json({
      users: usersWithTenants,
      total: usersData.users.length,
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/v1/admin/users
 * Create a new user in Supabase
 */
router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  const { email, password, role = 'user' } = req.body

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Email and password are required',
    })
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Invalid password',
      message: 'Password must be at least 8 characters',
    })
  }

  if (!['user', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role',
      message: 'Role must be one of: user, admin, super_admin',
    })
  }

  try {
    const adminUser = (req as any).user

    // Use Supabase Admin API to create user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
      },
    })

    if (error) {
      console.error('Supabase createUser error:', error)

      if (error.message.includes('already been registered')) {
        return res.status(409).json({
          error: 'User already exists',
          message: `A user with email ${email} already exists`,
        })
      }

      return res.status(500).json({
        error: 'Failed to create user',
        message: error.message,
      })
    }

    // Create audit log in platform_db
    const client = await dbPlatform.platformPool.connect()
    try {
      await client.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          adminUser.id,
          'CREATE_USER',
          'user',
          data.user.id,
          JSON.stringify({
            created_user_email: email,
            created_user_role: role,
            timestamp: new Date().toISOString(),
          }),
          req.ip || req.socket.remoteAddress,
          req.headers['user-agent'] || 'unknown',
        ],
      )
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
    } finally {
      client.release()
    }

    console.log(
      `[CREATE USER] ${adminUser.email} created new user: ${email} with role: ${role}`,
    )

    res.status(201).json({
      success: true,
      message: `User ${email} created successfully`,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        role,
      },
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * DELETE /api/v1/admin/users/:userId
 * Delete a user and cascade cleanup
 */
router.delete(
  '/users/:userId',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { userId } = req.params
    const adminUser = (req as any).user
    const client = await dbPlatform.platformPool.connect()

    try {
      await client.query('BEGIN')

      // Get user details from Supabase Admin API
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(userId)

      if (userError || !userData?.user) {
        await client.query('ROLLBACK')
        return res.status(404).json({
          error: 'User not found',
          message: `User with ID ${userId} does not exist`,
        })
      }

      const userEmail = userData.user.email
      const userRole = userData.user.user_metadata?.role

      // Prevent deletion of admin users
      if (userRole === 'admin' || userRole === 'super_admin') {
        await client.query('ROLLBACK')
        return res.status(403).json({
          error: 'Cannot delete admin user',
          message: 'Admin users cannot be deleted through this endpoint',
        })
      }

      // Prevent self-deletion
      if (adminUser.id === userId) {
        await client.query('ROLLBACK')
        return res.status(403).json({
          error: 'Cannot delete yourself',
          message: 'You cannot delete your own account',
        })
      }

      console.log(
        `[DELETE USER] ${adminUser.email} is deleting user: ${userEmail}`,
      )

      // Find tenants owned by this user
      const tenantsResult = await client.query(
        `SELECT t.id, t.name
       FROM public.tenants t
       JOIN public.tenant_members tm ON t.id = tm.tenant_id
       WHERE tm.user_id = $1 AND tm.role = 'owner'`,
        [userId],
      )

      const ownedTenants = tenantsResult.rows
      console.log(`[DELETE USER] Found ${ownedTenants.length} owned tenants`)

      // Delete tenant memberships
      const membershipResult = await client.query(
        'DELETE FROM public.tenant_members WHERE user_id = $1 RETURNING tenant_id',
        [userId],
      )

      console.log(
        `[DELETE USER] Removed ${membershipResult.rowCount} memberships`,
      )

      // Delete orphaned tenants and their databases (tenants with no owner)
      for (const tenant of ownedTenants) {
        const remainingMembers = await client.query(
          'SELECT COUNT(*) as count FROM public.tenant_members WHERE tenant_id = $1',
          [tenant.id],
        )

        if (parseInt(remainingMembers.rows[0].count) === 0) {
          // No members left, delete the tenant and its database
          const tenantDetails = await client.query(
            'SELECT connection_info FROM public.tenants WHERE id = $1',
            [tenant.id],
          )

          const connectionInfo = tenantDetails.rows[0]?.connection_info
          const dbName = connectionInfo?.database
          const dbUser = connectionInfo?.username || connectionInfo?.user

          // Delete tenant from metadata
          await client.query('DELETE FROM public.tenants WHERE id = $1', [
            tenant.id,
          ])

          // Drop the actual database if it exists
          if (dbName) {
            try {
              // Terminate existing connections
              await client.query(
                `SELECT pg_terminate_backend(pg_stat_activity.pid)
                 FROM pg_stat_activity
                 WHERE pg_stat_activity.datname = $1
                 AND pid <> pg_backend_pid()`,
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

              console.log(
                `[DELETE USER] Deleted tenant database: ${tenant.name} (${dbName})`,
              )
            } catch (dbError) {
              console.error(
                `[DELETE USER] Error dropping database ${dbName}:`,
                dbError,
              )
              // Continue even if database drop fails
            }
          } else {
            console.log(`[DELETE USER] Deleted tenant metadata: ${tenant.name}`)
          }
        }
      }

      // Commit the transaction BEFORE deleting from Supabase (in case Supabase fails)
      await client.query('COMMIT')

      // Delete user from Supabase using Admin API
      const { error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error('Supabase deleteUser error:', deleteError)
        return res.status(500).json({
          error: 'Failed to delete user',
          message: deleteError.message,
        })
      }

      // Create comprehensive audit log (non-blocking, after commit)
      const auditClient = await dbPlatform.platformPool.connect()
      try {
        await auditClient.query(
          `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            adminUser.id,
            'DELETE_USER',
            'user',
            userId,
            JSON.stringify({
              deleted_user_email: userEmail,
              deleted_user_role: userRole,
              tenants_deleted: ownedTenants.length,
              memberships_removed: membershipResult.rowCount,
              orphaned_tenants: ownedTenants.map((t: any) => ({
                id: t.id,
                name: t.name,
              })),
              timestamp: new Date().toISOString(),
            }),
            req.ip || req.socket.remoteAddress,
            req.headers['user-agent'] || 'unknown',
          ],
        )
      } catch (auditError) {
        console.warn('Audit log failed (non-critical):', auditError)
      } finally {
        auditClient.release()
      }

      console.log(
        `[DELETE USER] Successfully deleted user ${userEmail} and cleaned up ${ownedTenants.length} tenants`,
      )

      res.json({
        success: true,
        message: `User ${userEmail} deleted successfully`,
        deletedTenantMemberships: membershipResult.rowCount,
        orphanedTenants: ownedTenants.map((t: any) => ({
          id: t.id,
          name: t.name,
        })),
      })
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Delete user error:', error)
      res.status(500).json({
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      client.release()
    }
  },
)

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Update a user's role in Supabase
 */
router.patch(
  '/users/:userId/role',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { userId } = req.params
    const { role } = req.body
    const adminUser = (req as any).user

    if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be one of: user, admin, super_admin',
      })
    }

    try {
      // Get current user data before update
      const { data: currentUser, error: fetchError } =
        await supabaseAdmin.auth.admin.getUserById(userId)

      if (fetchError || !currentUser?.user) {
        return res.status(404).json({
          error: 'User not found',
          message: `User with ID ${userId} does not exist`,
        })
      }

      const oldRole = currentUser.user.user_metadata?.role || 'user'

      // Prevent changing your own role to non-admin
      if (
        adminUser.id === userId &&
        role !== 'admin' &&
        role !== 'super_admin'
      ) {
        return res.status(403).json({
          error: 'Cannot demote yourself',
          message: 'You cannot remove your own admin privileges',
        })
      }

      // Update user role in Supabase using Admin API
      const { data, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { role },
        })

      if (updateError) {
        console.error('Supabase updateUserById error:', updateError)
        return res.status(500).json({
          error: 'Failed to update user role',
          message: updateError.message,
        })
      }

      // Create audit log in platform_db
      const client = await dbPlatform.platformPool.connect()
      try {
        await client.query(
          `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            adminUser.id,
            'UPDATE_USER_ROLE',
            'user',
            userId,
            JSON.stringify({
              user_email: currentUser.user.email,
              old_role: oldRole,
              new_role: role,
              timestamp: new Date().toISOString(),
            }),
            req.ip || req.socket.remoteAddress,
            req.headers['user-agent'] || 'unknown',
          ],
        )
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      } finally {
        client.release()
      }

      console.log(
        `[UPDATE USER ROLE] ${adminUser.email} updated ${currentUser.user.email} from ${oldRole} to ${role}`,
      )

      res.json({
        success: true,
        message: `User role updated to ${role}`,
        user: {
          id: userId,
          email: data.user.email,
          role,
        },
        changes: {
          oldRole,
          newRole: role,
        },
      })
    } catch (error) {
      console.error('Update user role error:', error)
      res.status(500).json({
        error: 'Failed to update user role',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)

/**
 * GET /api/v1/admin/users/:userId
 * Get detailed information about a specific user
 */
router.get(
  '/users/:userId',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { userId } = req.params

    try {
      // Get user details from Supabase Admin API
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(userId)

      if (userError || !userData?.user) {
        return res.status(404).json({
          error: 'User not found',
          message: `User with ID ${userId} does not exist`,
        })
      }

      const user = userData.user

      // Get user's tenants from platform_db
      const tenantsResult = await dbPlatform.platformPool.query(
        `SELECT 
        t.id,
        t.name,
        t.subdomain,
        t.plan_type,
        t.region,
        t.created_at,
        tm.role
      FROM public.tenants t
      JOIN public.tenant_members tm ON t.id = tm.tenant_id
      WHERE tm.user_id = $1
      ORDER BY tm.created_at DESC`,
        [userId],
      )

      res.json({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          role: user.user_metadata?.role || 'user',
        },
        tenants: tenantsResult.rows,
        tenantCount: tenantsResult.rowCount || 0,
      })
    } catch (error) {
      console.error('Get user details error:', error)
      res.status(500).json({
        error: 'Failed to fetch user details',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)

export default router
