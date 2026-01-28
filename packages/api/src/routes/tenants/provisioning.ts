import { randomBytes } from 'node:crypto'
import { Pool } from 'pg'
import { DatabasePlatformClient } from '../../database-platform-client'
import { resolveSecret } from '../../utils/secrets'

function safeIdent(raw: string): string {
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
  return randomBytes(32).toString('base64url')
}

export async function ensureTenantDatabaseProvisioned(opts: {
  tenantId: string
  desiredPassword?: string
}): Promise<{
  provisioned: boolean
  db: { host: string; port: number; database: string; username: string }
  password?: string
}> {
  const db = new DatabasePlatformClient()

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
        // Use pg's escaping for password literal
        const escapedPassword = password.replace(/'/g, "''")
        await admin.query(
          `CREATE ROLE ${safeIdent(tenantRole)} WITH LOGIN PASSWORD '${escapedPassword}'`,
        )
      } else if (opts.desiredPassword) {
        const escapedPassword = password.replace(/'/g, "''")
        await admin.query(
          `ALTER ROLE ${safeIdent(tenantRole)} WITH PASSWORD '${escapedPassword}'`,
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
    password,
  }
}
