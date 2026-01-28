import type { Router } from 'express'
import {
  authMiddleware,
  adminMiddleware,
  type AuthRequest,
} from '@vpn-enterprise/auth'
import { supabaseAdmin } from '@vpn-enterprise/database'
import { DatabasePlatformClient } from '../../database-platform-client'

async function fetchUserTenantAssociations(userId: string) {
  const candidates = ['tenant_members', 'tenant_users', 'user_tenants']

  for (const tableName of candidates) {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from(tableName)
        .select(
          `
          tenant_id,
          tenants!inner(name)
        `,
        )
        .eq('user_id', userId)
        .limit(200)

      if (!error && data && Array.isArray(data)) {
        return data.map((r: any) => ({
          tenant_id: r.tenant_id,
          name: r.tenants?.name || null,
        }))
      }
    } catch (_err: any) {
      console.log(`Table ${tableName} not found, trying next...`)
      continue
    }
  }

  return []
}

export function registerTenantAssociationRoutes(router: Router) {
  // GET /api/v1/tenants/me — list tenants for the current user (platform DB)
  // This aligns with the production authorization source of truth: platform_db.tenant_members.
  router.get(
    '/me',
    (req, res, next) => {
      if (process.env.NODE_ENV === 'development') return next()
      return authMiddleware(req, res, next)
    },
    async (req: AuthRequest, res) => {
      try {
        if (process.env.NODE_ENV === 'development') {
          const mockTenants = [
            {
              tenant_id: '123e4567-e89b-12d3-a456-426614174000',
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Development Tenant',
              role: 'owner',
            },
          ]
          return res.json({ userId: 'dev-user', tenants: mockTenants })
        }

        const user = (req as any).user
        if (!user?.id) {
          return res
            .status(401)
            .json({ error: 'unauthorized', message: 'User not authenticated' })
        }

        const db = new DatabasePlatformClient()
        const result = await db.platformPool.query(
          `
          SELECT
            t.id as tenant_id,
            t.id,
            t.name,
            tm.role,
            t.created_at
          FROM tenant_members tm
          JOIN tenants t ON t.id = tm.tenant_id
          WHERE tm.user_id = $1
          ORDER BY t.created_at DESC
        `,
          [user.id],
        )

        return res.json({ userId: user.id, tenants: result.rows || [] })
      } catch (e: any) {
        const msg = String(e?.message || 'Unknown error')
        console.error('[tenants:me] error', e)
        return res.status(500).json({ error: 'server_error', message: msg })
      }
    },
  )

  // GET /api/v1/tenants/me/associations — current user (auth required)
  router.get(
    '/me/associations',
    (req, res, next) => {
      if (process.env.NODE_ENV === 'development') return next()
      return authMiddleware(req, res, next)
    },
    async (req: AuthRequest, res) => {
      try {
        if (process.env.NODE_ENV === 'development') {
          const mockTenants = [
            {
              tenant_id: 'dev-tenant-1',
              name: 'Development Tenant',
              subdomain: 'dev',
              plan_type: 'free',
              created_at: new Date().toISOString(),
              status: 'active',
            },
          ]
          return res.json({ userId: 'dev-user', tenants: mockTenants })
        }

        const user = (req as any).user
        if (!user?.id) {
          return res
            .status(401)
            .json({ error: 'unauthorized', message: 'User not authenticated' })
        }

        const tenants = await fetchUserTenantAssociations(user.id)
        return res.json({ userId: user.id, tenants })
      } catch (e: any) {
        const msg = String(e?.message || 'Unknown error')
        console.error('[tenants:me:associations] error', e)
        return res.status(500).json({ error: 'server_error', message: msg })
      }
    },
  )

  // GET /api/v1/tenants/associations?userId=... — admin-only
  router.get(
    '/associations',
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { userId } = req.query as { userId?: string }
        if (!userId) {
          return res.status(400).json({
            error: 'bad_request',
            message: 'Query parameter `userId` is required',
          })
        }

        const tenants = await fetchUserTenantAssociations(String(userId))
        return res.json({ userId: String(userId), tenants })
      } catch (e: any) {
        const msg = String(e?.message || 'Unknown error')
        console.error('[tenants:associations] error', e)
        return res.status(500).json({ error: 'server_error', message: msg })
      }
    },
  )
}
