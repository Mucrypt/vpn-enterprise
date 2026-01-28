import type { Router } from 'express'
import { authMiddleware, type AuthRequest } from '@vpn-enterprise/auth'
import { DatabasePlatformClient } from '../../database-platform-client'
import { randomBytes, randomUUID } from 'node:crypto'
import { ensureTenantDatabaseProvisioned } from './provisioning'
import { supabaseAdmin } from '@vpn-enterprise/database'

function slugify(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function defaultProjectName(email?: string): string {
  const local = String(email || '').split('@')[0]
  const base = local ? local.replace(/[._-]+/g, ' ').trim() : 'Personal'
  return `${base || 'Personal'} Project`
}

function randomSuffix(length = 6): string {
  // Base32-ish without confusing chars; good enough for uniqueness.
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

function normalizeRole(role: string | undefined | null): string {
  if (!role) return 'user'
  return role.toLowerCase().replace(/[\s\-_]/g, '')
}

function parseAdminEmailsFromEnv(): Set<string> {
  const raw = process.env.ADMIN_EMAILS
  if (!raw) return new Set()
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

function isAdminActor(user: { role?: string | null; email?: string | null }) {
  const roleKey = normalizeRole(user.role)
  const byRole = [
    'admin',
    'superadmin',
    'super_admin',
    'administrator',
  ].includes(roleKey)
  if (byRole) return true
  const email = String(user.email || '')
    .trim()
    .toLowerCase()
  if (!email) return false
  return parseAdminEmailsFromEnv().has(email)
}

async function getUserSubscriptionPlan(userId: string): Promise<string> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .select('plan_type')
      .eq('user_id', userId)
      .single()

    if (error) return 'free'
    const plan = String((data as any)?.plan_type || '')
      .trim()
      .toLowerCase()
    return plan || 'free'
  } catch {
    return 'free'
  }
}

function isPaidPlan(plan: string): boolean {
  const p = String(plan || '')
    .trim()
    .toLowerCase()
  return p !== '' && p !== 'free'
}

async function ensureSelfTenant(params: {
  userId: string
  email?: string
  name?: string
  subdomain?: string
  planType?: string
  region?: string
}): Promise<{ tenant: any; created: boolean }> {
  const db = new DatabasePlatformClient()
  const client = await db.platformPool.connect()

  try {
    await client.query('BEGIN')
    // Prevent double-provisioning if the client retries in parallel.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      params.userId,
    ])

    const existing = await client.query(
      `
      SELECT t.id, t.name, t.subdomain, tm.role, t.created_at
      FROM tenant_members tm
      JOIN tenants t ON t.id = tm.tenant_id
      WHERE tm.user_id = $1
      ORDER BY t.created_at ASC
      LIMIT 1
      `,
      [params.userId],
    )

    if (existing.rows?.[0]) {
      await client.query('COMMIT')
      return { tenant: existing.rows[0], created: false }
    }

    const tenantId = randomUUID()
    const name = (params.name || '').trim() || defaultProjectName(params.email)
    const planType = (params.planType || '').trim() || 'free'

    const baseSub =
      slugify(params.subdomain || '') || slugify(name) || 'project'
    const subdomain = `${baseSub}-${randomSuffix()}`.slice(0, 60)

    const region = (params.region || 'us-east-1').trim()

    await client.query(
      `
      INSERT INTO tenants (id, name, subdomain, plan_type, region, status, connection_info)
      VALUES ($1, $2, $3, $4, $5, 'active', '{}'::jsonb)
      `,
      [tenantId, name, subdomain, planType, region],
    )

    await client.query(
      `
      INSERT INTO tenant_members (tenant_id, user_id, role)
      VALUES ($1, $2, 'owner')
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role
      `,
      [tenantId, params.userId],
    )

    const created = await client.query(
      `
      SELECT t.id, t.name, t.subdomain, tm.role, t.created_at
      FROM tenant_members tm
      JOIN tenants t ON t.id = tm.tenant_id
      WHERE tm.user_id = $1 AND tm.tenant_id = $2
      LIMIT 1
      `,
      [params.userId, tenantId],
    )

    await client.query('COMMIT')
    return { tenant: created.rows[0], created: true }
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch {}
    throw e
  } finally {
    client.release()
  }
}

export function registerTenantSelfProvisionRoutes(router: Router) {
  // POST /api/v1/tenants/self — self-serve project creation.
  // If the user has no tenants yet, create a first one and make them owner.
  router.post(
    '/self',
    (req, res, next) => {
      if (process.env.NODE_ENV === 'development') return next()
      return authMiddleware(req, res, next)
    },
    async (req: AuthRequest, res) => {
      try {
        if (process.env.NODE_ENV === 'development') {
          return res.status(501).json({
            error: 'not_implemented',
            message:
              'Self-provisioning is disabled in development (use mock tenants).',
          })
        }

        if ((process.env.TENANTS_SOURCE || 'platform') !== 'platform') {
          return res.status(400).json({
            error: 'bad_request',
            message:
              'Self-provisioning requires TENANTS_SOURCE=platform in the API environment.',
          })
        }

        const user = (req as any).user
        if (!user?.id) {
          return res
            .status(401)
            .json({ error: 'unauthorized', message: 'User not authenticated' })
        }

        const { name, subdomain, plan_type, db_password, region } = (req.body ||
          {}) as {
          name?: string
          subdomain?: string
          plan_type?: string
          db_password?: string
          region?: string
        }

        // Do not trust client-supplied plan_type. Derive from subscription unless admin.
        const isAdmin = isAdminActor(user)
        const subscriptionPlan = isAdmin
          ? String(plan_type || 'premium')
          : await getUserSubscriptionPlan(user.id)
        const enforcedPlanType = subscriptionPlan || 'free'

        const { tenant, created } = await ensureSelfTenant({
          userId: user.id,
          email: user.email,
          name,
          subdomain,
          planType: enforcedPlanType,
          region,
        })

        // Ensure the tenant has a real database to connect to.
        // This makes the SQL editor behave like Supabase: after project creation, the DB is ready.
        const provision = await ensureTenantDatabaseProvisioned({
          tenantId: tenant?.tenant_id || tenant?.id,
          desiredPassword: db_password,
        })

        return res.status(created ? 201 : 200).json({
          created,
          tenant,
          database: provision.db,
          // Return the password only if we created/provisioned it now.
          // If the user supplied a password, they already know it.
          database_password:
            provision.provisioned && !db_password
              ? provision.password
              : undefined,
        })
      } catch (e: any) {
        const msg = String(e?.message || 'Unknown error')
        console.error('[tenants:self] error', e)
        return res.status(500).json({ error: 'server_error', message: msg })
      }
    },
  )

  // POST /api/v1/tenants/projects — create an additional project (premium/admin)
  router.post(
    '/projects',
    (req, res, next) => {
      if (process.env.NODE_ENV === 'development') return next()
      return authMiddleware(req, res, next)
    },
    async (req: AuthRequest, res) => {
      try {
        if (process.env.NODE_ENV === 'development') {
          return res.status(501).json({
            error: 'not_implemented',
            message:
              'Project creation is disabled in development (use mock tenants).',
          })
        }

        if ((process.env.TENANTS_SOURCE || 'platform') !== 'platform') {
          return res.status(400).json({
            error: 'bad_request',
            message:
              'Project creation requires TENANTS_SOURCE=platform in the API environment.',
          })
        }

        const user = (req as any).user
        if (!user?.id) {
          return res
            .status(401)
            .json({ error: 'unauthorized', message: 'User not authenticated' })
        }

        const { name, subdomain, plan_type, db_password } = (req.body ||
          {}) as {
          name?: string
          subdomain?: string
          plan_type?: string
          db_password?: string
        }

        const isAdmin = isAdminActor(user)
        const subscriptionPlan = isAdmin
          ? String(plan_type || 'premium')
          : await getUserSubscriptionPlan(user.id)

        if (!isAdmin && !isPaidPlan(subscriptionPlan)) {
          // Free users get exactly 1 project: use /self to create the first.
          return res.status(402).json({
            error: 'payment_required',
            message:
              'Free plan includes 1 project. Upgrade to Premium to create additional projects.',
          })
        }

        const db = new DatabasePlatformClient()
        const client = await db.platformPool.connect()
        try {
          await client.query('BEGIN')

          const tenantId = randomUUID()
          const baseName = String(name || '').trim()
          if (!baseName || baseName.length < 2) {
            return res.status(400).json({
              error: 'bad_request',
              message: 'Project name is required (min 2 chars).',
            })
          }

          const baseSub =
            slugify(String(subdomain || '').trim()) ||
            slugify(baseName) ||
            'project'
          const finalSub = `${baseSub}-${randomSuffix()}`.slice(0, 60)

          await client.query(
            `
            INSERT INTO tenants (id, name, subdomain, plan_type, status, connection_info)
            VALUES ($1, $2, $3, $4, 'active', '{}'::jsonb)
            `,
            [tenantId, baseName, finalSub, subscriptionPlan || 'premium'],
          )

          await client.query(
            `
            INSERT INTO tenant_members (tenant_id, user_id, role)
            VALUES ($1, $2, 'owner')
            ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role
            `,
            [tenantId, user.id],
          )

          const created = await client.query(
            `
            SELECT t.id, t.name, t.subdomain, tm.role, t.created_at
            FROM tenant_members tm
            JOIN tenants t ON t.id = tm.tenant_id
            WHERE tm.user_id = $1 AND tm.tenant_id = $2
            LIMIT 1
            `,
            [user.id, tenantId],
          )

          await client.query('COMMIT')

          const provision = await ensureTenantDatabaseProvisioned({
            tenantId,
            desiredPassword: db_password,
          })

          return res.status(201).json({
            created: true,
            tenant: created.rows?.[0],
            database: provision.db,
            database_password:
              provision.provisioned && !db_password
                ? provision.password
                : undefined,
          })
        } catch (e) {
          try {
            await client.query('ROLLBACK')
          } catch {}
          throw e
        } finally {
          client.release()
        }
      } catch (e: any) {
        const msg = String(e?.message || 'Unknown error')
        console.error('[tenants:projects] error', e)
        return res.status(500).json({ error: 'server_error', message: msg })
      }
    },
  )
}
