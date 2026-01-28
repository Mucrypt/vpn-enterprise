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
  }
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
 * GET /api/v1/admin/users
 * List all platform users
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Use Supabase Admin API to list users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

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
          [user.id]
        )
        
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          role: user.user_metadata?.role || 'user',
          tenant_count: parseInt(tenantResult.rows[0]?.tenant_count || '0'),
        }
      })
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
    const client = await dbPlatform.platformPool.connect()

    try {
      await client.query('BEGIN')

      // Get user details from Supabase Admin API
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

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

      // Find tenants owned by this user
      const tenantsResult = await client.query(
        `SELECT t.id, t.name
       FROM public.tenants t
       JOIN public.tenant_members tm ON t.id = tm.tenant_id
       WHERE tm.user_id = $1 AND tm.role = 'owner'`,
        [userId],
      )

      const ownedTenants = tenantsResult.rows

      // Delete tenant memberships
      await client.query(
        'DELETE FROM public.tenant_members WHERE user_id = $1',
        [userId],
      )

      // Mark orphaned tenants for cleanup (tenants with no owner)
      for (const tenant of ownedTenants) {
        const remainingMembers = await client.query(
          'SELECT COUNT(*) as count FROM public.tenant_members WHERE tenant_id = $1',
          [tenant.id],
        )

        if (parseInt(remainingMembers.rows[0].count) === 0) {
          // No members left, mark tenant for deletion
          await client.query(
            `UPDATE public.tenants 
           SET status = 'deleted', 
               updated_at = NOW()
           WHERE id = $1`,
            [tenant.id],
          )
        }
      }

      // Delete user from Supabase using Admin API
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteError) {
        await client.query('ROLLBACK')
        console.error('Supabase deleteUser error:', deleteError)
        return res.status(500).json({
          error: 'Failed to delete user',
          message: deleteError.message,
        })
      }

      await client.query('COMMIT')

      res.json({
        success: true,
        message: `User ${userEmail} deleted successfully`,
        deletedTenantMemberships: ownedTenants.length,
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

    if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be one of: user, admin, super_admin',
      })
    }

    try {
      // Update user role in Supabase auth.users metadata
      const result = await dbPlatform.platformPool.query(
        `UPDATE auth.users 
       SET raw_user_meta_data = jsonb_set(
         COALESCE(raw_user_meta_data, '{}'::jsonb),
         '{role}',
         to_jsonb($1::text)
       ),
       updated_at = NOW()
       WHERE id = $2
       RETURNING email, raw_user_meta_data->>'role' as role`,
        [role, userId],
      )

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: `User with ID ${userId} does not exist`,
        })
      }

      res.json({
        success: true,
        message: `User role updated to ${role}`,
        user: {
          id: userId,
          email: result.rows[0].email,
          role: result.rows[0].role,
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
      // Get user details
      const userResult = await dbPlatform.platformPool.query(
        `SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        u.raw_user_meta_data->>'role' as role
      FROM auth.users u
      WHERE u.id = $1`,
        [userId],
      )

      if (userResult.rowCount === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: `User with ID ${userId} does not exist`,
        })
      }

      // Get user's tenants
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
        user: userResult.rows[0],
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
