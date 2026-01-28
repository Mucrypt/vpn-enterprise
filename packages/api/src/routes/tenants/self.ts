import type { Router } from 'express'
import { authMiddleware, type AuthRequest } from '@vpn-enterprise/auth'
import { DatabasePlatformClient } from '../../database-platform-client'
import { randomBytes, randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { resolveSecret } from '../../utils/secrets'

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

async function ensureSelfTenant(params: {
  userId: string
  email?: string
  name?: string
  subdomain?: string
  planType?: string
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

    await client.query(
      `
      INSERT INTO tenants (id, name, subdomain, plan_type, status, connection_info)
      VALUES ($1, $2, $3, $4, 'active', '{}'::jsonb)
      `,
      [tenantId, name, subdomain, planType],
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

function safeIdent(raw: string): string {
  // We generate role/db names ourselves; keep this strict to avoid injection.
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw)) {
    throw new Error('Invalid identifier')
  }
  return `"${raw.replace(/"/g, '""')}"`
}

function tenantDbName(tenantId: string): string {
  return `tenant_${tenantId.replace(/-/g, '_')}`
}

function tenantOwnerRole(tenantId: string): string {
  return `${tenantDbName(tenantId)}_owner`
}

function randomPassword(): string {
  // 32 bytes -> ~43 chars base64url, strong enough.
  return randomBytes(32).toString('base64url')
}

async function ensureTenantDatabaseProvisioned(opts: {
  tenantId: string
  desiredPassword?: string
}): Promise<{
  provisioned: boolean
  db: { host: string; port: number; database: string; username: string }
  password?: string
}> {
  const db = new DatabasePlatformClient()

  // 1) If connection_info already declares a database+username, do nothing.
  const existing = await db.platformPool.query(
    'SELECT connection_info FROM tenants WHERE id = $1',
    [opts.tenantId],
  )
  const info = existing.rows?.[0]?.connection_info || {}
  if (info?.database && (info?.username || info?.user) && info?.password) {
    return {
      provisioned: false,
      db: {
        host: info.host || process.env.POSTGRES_HOST || 'postgres-primary',
        port: Number(info.port || process.env.POSTGRES_PORT || 5432),
        database: String(info.database),
        username: String(info.username || info.user),
      },
    }
  }

  // 2) Provision: create role + database and persist connection_info.
  const host = process.env.POSTGRES_HOST || 'postgres-primary'
  const port = parseInt(process.env.POSTGRES_PORT || '5432', 10)

  const provisionUser =
    process.env.POSTGRES_PROVISION_USER ||
    process.env.POSTGRES_USER ||
    'postgres'
  const provisionPassword =
    resolveSecret({
      valueEnv: 'POSTGRES_PROVISION_PASSWORD',
      fileEnv: 'POSTGRES_PROVISION_PASSWORD_FILE',
    }) ||
    resolveSecret({
      valueEnv: 'POSTGRES_PASSWORD',
      fileEnv: 'POSTGRES_PASSWORD_FILE',
      defaultFilePath: '/run/secrets/db_password',
    })

  if (!provisionPassword) {
    throw new Error(
      'Postgres provisioning password not configured. Set POSTGRES_PASSWORD(_FILE) or POSTGRES_PROVISION_PASSWORD(_FILE).',
    )
  }

  const maintenanceDb = process.env.POSTGRES_MAINTENANCE_DB || 'postgres'

  const tenantDatabase = tenantDbName(opts.tenantId)
  const tenantRole = tenantOwnerRole(opts.tenantId)
  const password = (opts.desiredPassword || '').trim() || randomPassword()

  const adminPool = new Pool({
    host,
    port,
    database: maintenanceDb,
    user: provisionUser,
    password: provisionPassword,
    max: 2,
  })

  try {
    const admin = await adminPool.connect()
    try {
      const roleExists = await admin.query(
        'SELECT 1 FROM pg_roles WHERE rolname = $1 LIMIT 1',
        [tenantRole],
      )
      if (!roleExists.rows?.length) {
        await admin.query(
          `CREATE ROLE ${safeIdent(tenantRole)} WITH LOGIN PASSWORD $1`,
          [password],
        )
      } else if (opts.desiredPassword) {
        // If the caller explicitly provided a password, rotate/update it.
        await admin.query(
          `ALTER ROLE ${safeIdent(tenantRole)} WITH PASSWORD $1`,
          [password],
        )
      }

      const dbExists = await admin.query(
        'SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1',
        [tenantDatabase],
      )
      if (!dbExists.rows?.length) {
        await admin.query(
          `CREATE DATABASE ${safeIdent(tenantDatabase)} OWNER ${safeIdent(tenantRole)}`,
        )
      }
    } finally {
      admin.release()
    }
  } finally {
    await adminPool.end().catch(() => {})
  }

  const connectionInfo = {
    host,
    port,
    database: tenantDatabase,
    username: tenantRole,
    password,
  }

  await db.platformPool.query(
    'UPDATE tenants SET connection_info = $1::jsonb, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(connectionInfo), opts.tenantId],
  )

  return {
    provisioned: true,
    db: { host, port, database: tenantDatabase, username: tenantRole },
    // Only return the password to the caller when we just provisioned (or rotated).
    password,
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

        const { name, subdomain, plan_type, db_password } = (req.body ||
          {}) as {
          name?: string
          subdomain?: string
          plan_type?: string
          db_password?: string
        }

        const { tenant, created } = await ensureSelfTenant({
          userId: user.id,
          email: user.email,
          name,
          subdomain,
          planType: plan_type,
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
}
