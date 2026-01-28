/**
 * Admin Users Management Routes
 * 
 * Provides admin endpoints for managing platform users:
 * - GET /api/v1/admin/users - List all users
 * - DELETE /api/v1/admin/users/:userId - Delete a user
 */

import { Router } from 'express';
import { authMiddleware } from '@vpn-enterprise/auth';
import { DatabasePlatformClient } from '../../database-platform-client';

const router = Router();
const dbPlatform = new DatabasePlatformClient();

// Admin middleware - checks if user has admin role
const adminMiddleware = async (req: any, res: any, next: any) => {
  try {
    const userRole = req.user?.user_metadata?.role || req.user?.role;
    
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/v1/admin/users
 * List all platform users
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Query users from auth.users table
    const usersResult = await dbPlatform.platformPool.query(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        u.raw_user_meta_data->>'role' as role,
        COUNT(DISTINCT tm.tenant_id) as tenant_count
      FROM auth.users u
      LEFT JOIN public.tenant_members tm ON u.id::text = tm.user_id
      GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, u.raw_user_meta_data
      ORDER BY u.created_at DESC
    `);

    res.json({
      users: usersResult.rows,
      total: usersResult.rowCount || 0,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/v1/admin/users/:userId
 * Delete a user and cascade cleanup
 */
router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  const { userId } = req.params;
  const client = await dbPlatform.platformPool.connect();

  try {
    await client.query('BEGIN');

    // Get user details before deletion
    const userResult = await client.query(
      'SELECT email FROM auth.users WHERE id = $1',
      [userId]
    );

    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`,
      });
    }

    const userEmail = userResult.rows[0].email;

    // Prevent deletion of admin users
    const adminCheck = await client.query(
      `SELECT raw_user_meta_data->>'role' as role FROM auth.users WHERE id = $1`,
      [userId]
    );
    
    const userRole = adminCheck.rows[0]?.role;
    if (userRole === 'admin' || userRole === 'super_admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Cannot delete admin user',
        message: 'Admin users cannot be deleted through this endpoint',
      });
    }

    // Find tenants owned by this user
    const tenantsResult = await client.query(
      `SELECT t.id, t.name, t.db_name
       FROM public.tenants t
       JOIN public.tenant_members tm ON t.id = tm.tenant_id
       WHERE tm.user_id = $1 AND tm.role = 'owner'`,
      [userId]
    );

    const ownedTenants = tenantsResult.rows;

    // Delete tenant memberships
    await client.query(
      'DELETE FROM public.tenant_members WHERE user_id = $1',
      [userId]
    );

    // Mark orphaned tenants for cleanup (tenants with no owner)
    for (const tenant of ownedTenants) {
      const remainingMembers = await client.query(
        'SELECT COUNT(*) as count FROM public.tenant_members WHERE tenant_id = $1',
        [tenant.id]
      );

      if (parseInt(remainingMembers.rows[0].count) === 0) {
        // No members left, mark tenant for deletion
        await client.query(
          `UPDATE public.tenants 
           SET status = 'deleted', 
               updated_at = NOW()
           WHERE id = $1`,
          [tenant.id]
        );
      }
    }

    // Delete user from auth.users
    await client.query('DELETE FROM auth.users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `User ${userEmail} deleted successfully`,
      deletedTenantMemberships: ownedTenants.length,
      orphanedTenants: ownedTenants.map((t: any) => ({
        id: t.id,
        name: t.name,
        db_name: t.db_name,
      })),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Update a user's role in Supabase
 */
router.patch('/users/:userId/role', authMiddleware, adminMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role',
      message: 'Role must be one of: user, admin, super_admin',
    });
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
      [role, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`,
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: userId,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      error: 'Failed to update user role',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/admin/users/:userId
 * Get detailed information about a specific user
 */
router.get('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  const { userId } = req.params;

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
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`,
      });
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
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      tenants: tenantsResult.rows,
      tenantCount: tenantsResult.rowCount || 0,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      error: 'Failed to fetch user details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
