import type { Router } from 'express'
import {
  authMiddleware,
  adminMiddleware,
  type AuthRequest,
} from '@vpn-enterprise/auth'
import { supabaseAdmin } from '@vpn-enterprise/database'
import { DatabasePlatformClient } from '../../database-platform-client'

const TENANTS_TABLE = process.env.TENANTS_TABLE || 'tenants'

export function registerTenantsRootRoutes(router: Router) {
  // Create tenant (minimal scaffold)
  router.post(
    '/',
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { name, subdomain, plan_type } = req.body
        if (!name || !subdomain) {
          return res.status(400).json({ error: 'name and subdomain required' })
        }

        const { data, error } = await (supabaseAdmin as any)
          .from('tenants')
          .insert({ name, subdomain, plan_type: plan_type || 'free' })
          .select()
          .single()

        if (error) {
          return res
            .status(500)
            .json({ error: 'DB error', message: error.message })
        }

        res.json({ tenant: data })
      } catch (e: any) {
        res
          .status(500)
          .json({ error: 'Failed to create tenant', message: e.message })
      }
    },
  )

  // List tenants (with development mode bypass)
  router.get(
    '/',
    (req, res, next) => {
      if (process.env.NODE_ENV === 'development') return next()
      return authMiddleware(req, res, next)
    },
    (req, res, next) => {
      if (process.env.NODE_ENV === 'development') return next()
      return adminMiddleware(req, res, next)
    },
    async (req: AuthRequest, res) => {
      try {
        if (process.env.NODE_ENV === 'development') {
          const mockTenants = [
            {
              tenant_id: '123e4567-e89b-12d3-a456-426614174000',
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Development Tenant',
              subdomain: 'dev',
              plan_type: 'free',
              created_at: new Date().toISOString(),
              status: 'active',
            },
          ]
          return res.json({ tenants: mockTenants })
        }

        const tenantsSource = String(process.env.TENANTS_SOURCE || '')
          .trim()
          .toLowerCase()
        if (tenantsSource === 'platform' || tenantsSource === 'local') {
          const db = new DatabasePlatformClient()
          const result = await db.platformPool.query(
            'SELECT id as tenant_id, id, name, created_at FROM tenants ORDER BY created_at DESC',
          )
          return res.json({ tenants: result.rows || [] })
        }

        const hasSupabaseEnv =
          !!process.env.SUPABASE_URL &&
          (!!process.env.SUPABASE_SERVICE_ROLE_KEY ||
            !!process.env.SUPABASE_ANON_KEY)

        if (!hasSupabaseEnv) {
          const db = new DatabasePlatformClient()
          const result = await db.platformPool.query(
            'SELECT id as tenant_id, id, name, created_at FROM tenants ORDER BY created_at DESC',
          )
          return res.json({ tenants: result.rows || [] })
        }

        const { data, error } = await (supabaseAdmin as any)
          .from(TENANTS_TABLE)
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[tenants:list] supabase error', error)
          return res
            .status(500)
            .json({ error: 'DB error', message: error.message })
        }

        res.json({ tenants: data || [] })
      } catch (e: any) {
        console.error('[tenants:list] exception', e)
        res
          .status(500)
          .json({ error: 'Failed to list tenants', message: e.message })
      }
    },
  )
}
