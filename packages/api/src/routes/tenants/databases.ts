import type { Router } from 'express'
import { supabaseAdmin } from '@vpn-enterprise/database'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { requireTenantAdminRole } from './guards'

export function registerTenantDatabaseRoutes(router: Router) {
  // List tenant databases
  router.get(
    '/:tenantId/databases',
    ...requireTenantAdminRole,
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params
        const { data, error } = await (supabaseAdmin as any)
          .from('tenant_databases')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })

        if (error) {
          return res
            .status(500)
            .json({ error: 'DB error', message: error.message })
        }

        res.json({ databases: data || [] })
      } catch (e: any) {
        res
          .status(500)
          .json({ error: 'Failed to list databases', message: e.message })
      }
    },
  )

  // Provision a tenant database (using Supabase)
  router.post(
    '/:tenantId/databases',
    ...requireTenantAdminRole,
    async (req: AuthRequest, res) => {
      try {
        const { tenantId } = req.params
        const { databaseName, engine = 'postgres' } = req.body || {}
        if (!databaseName) {
          return res.status(400).json({ error: 'databaseName required' })
        }

        const created = {
          databaseName,
          status: 'active',
          message: 'Virtual database created in Supabase infrastructure',
        }
        const connString = process.env.SUPABASE_URL || ''

        const { error } = await (supabaseAdmin as any)
          .from('tenant_databases')
          .insert({
            tenant_id: tenantId,
            database_name: created.databaseName,
            connection_string: connString,
            status: created.status,
            engine,
          })

        if (error) {
          return res
            .status(500)
            .json({ error: 'DB error', message: error.message })
        }

        res.json({ database: { ...created, engine } })
      } catch (e: any) {
        res
          .status(500)
          .json({ error: 'Failed to create database', message: e.message })
      }
    },
  )
}
