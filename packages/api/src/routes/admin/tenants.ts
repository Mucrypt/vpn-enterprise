/**
 * Admin Tenants Management Routes
 * 
 * Provides admin endpoints for viewing all tenants:
 * - GET /api/v1/admin/tenants - List all tenants
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
        u.email as owner_email,
        tm.user_id as owner_id
      FROM public.tenants t
      LEFT JOIN public.tenant_members tm ON t.id = tm.tenant_id AND tm.role = 'owner'
      LEFT JOIN auth.users u ON tm.user_id = u.id::text
      ORDER BY t.created_at DESC
    `);

    // Parse connection_info JSON
    const tenants = tenantsResult.rows.map((tenant: any) => ({
      ...tenant,
      db_host: tenant.connection_info?.host,
      db_port: tenant.connection_info?.port,
      db_name: tenant.connection_info?.database,
      tenant_id: tenant.id,
    }));

    res.json({
      tenants,
      total: tenantsResult.rowCount || 0,
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      error: 'Failed to fetch tenants',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
