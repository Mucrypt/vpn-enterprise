import type { Router } from 'express'
import {
  authMiddleware,
  adminMiddleware,
  type AuthRequest,
} from '@vpn-enterprise/auth'
import { DatabasePlatformClient } from '../../database-platform-client'

export function registerTenantMemberBootstrapRoutes(router: Router) {
  // GET /api/v1/tenants/:tenantId/members
  router.get(
    '/:tenantId/members',
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params
        const db = new DatabasePlatformClient()
        const result = await db.platformPool.query(
          'SELECT tenant_id, user_id, role, created_at FROM tenant_members WHERE tenant_id = $1 ORDER BY created_at ASC',
          [tenantId],
        )
        return res.json({ tenantId, members: result.rows || [] })
      } catch (e: any) {
        const msg = String(e?.message || 'Failed to list members')
        console.error('[tenants:members:list] error', e)
        return res.status(500).json({ error: 'server_error', message: msg })
      }
    },
  )

  // POST /api/v1/tenants/:tenantId/members
  // body: { userId: string, role?: 'viewer'|'editor'|'admin'|'owner' }
  router.post(
    '/:tenantId/members',
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params
        const { userId, role } = req.body || {}

        if (!userId) {
          return res
            .status(400)
            .json({ error: 'bad_request', message: 'userId is required' })
        }

        const normalizedRole = String(role || 'viewer')
          .trim()
          .toLowerCase()
        const allowed = new Set(['viewer', 'editor', 'admin', 'owner'])
        const finalRole = allowed.has(normalizedRole)
          ? normalizedRole
          : 'viewer'

        const db = new DatabasePlatformClient()
        await db.platformPool.query(
          `
            INSERT INTO tenant_members (tenant_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (tenant_id, user_id)
            DO UPDATE SET role = EXCLUDED.role
          `,
          [tenantId, userId, finalRole],
        )

        return res.json({ success: true, tenantId, userId, role: finalRole })
      } catch (e: any) {
        const msg = String(e?.message || 'Failed to upsert member')
        console.error('[tenants:members:upsert] error', e)
        return res.status(500).json({ error: 'server_error', message: msg })
      }
    },
  )
}
