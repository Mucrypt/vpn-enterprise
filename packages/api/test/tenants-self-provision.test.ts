import express from 'express'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const memberships = new Map<string, { role: string }>()
const tenants = new Map<
  string,
  {
    id: string
    name: string
    subdomain: string
    plan_type: string
    connection_info: any
    created_at: string
  }
>()

function membershipKey(tenantId: string, userId: string) {
  return `${tenantId}:${userId}`
}

// Mock auth: treat bearer token as user id
vi.mock('@vpn-enterprise/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    const raw = String(req.headers?.authorization || '')
    const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : ''
    if (!token) {
      return res
        .status(401)
        .json({ error: 'unauthorized', message: 'Missing auth token' })
    }
    req.user = { id: token, email: `${token}@example.com`, role: 'user' }
    return next()
  },
  adminMiddleware: (_req: any, _res: any, next: any) => next(),
}))

// Mock pg Pool used by self-provisioning to create role/db
vi.mock('pg', () => {
  const roles = new Set<string>()
  const dbs = new Set<string>()

  class Pool {
    async connect() {
      return {
        query: async (sql: string, params?: any[]) => {
          const text = String(sql)
          if (text.includes('FROM pg_roles')) {
            const roleName = String(params?.[0] || '')
            return { rows: roles.has(roleName) ? [{ ok: 1 }] : [] }
          }
          if (text.startsWith('CREATE ROLE')) {
            const m = text.match(/CREATE ROLE\s+"?([a-zA-Z0-9_]+)"?/)
            if (m?.[1]) roles.add(m[1])
            return { rows: [] }
          }
          if (text.startsWith('ALTER ROLE')) {
            const m = text.match(/ALTER ROLE\s+"?([a-zA-Z0-9_]+)"?/)
            if (m?.[1]) roles.add(m[1])
            return { rows: [] }
          }
          if (text.includes('FROM pg_database')) {
            const dbName = String(params?.[0] || '')
            return { rows: dbs.has(dbName) ? [{ ok: 1 }] : [] }
          }
          if (text.startsWith('CREATE DATABASE')) {
            const m = text.match(/CREATE DATABASE\s+"?([a-zA-Z0-9_]+)"?/)
            if (m?.[1]) dbs.add(m[1])
            return { rows: [] }
          }
          return { rows: [] }
        },
        release: () => {},
      }
    }

    async end() {
      return
    }
  }

  return { Pool }
})

vi.mock('../src/database-platform-client', () => ({
  DatabasePlatformClient: class DatabasePlatformClient {
    platformPool = {
      connect: async () => {
        return {
          query: async (sql: string, params?: any[]) => {
            const text = String(sql)

            if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
              return { rows: [] }
            }

            if (text.includes('pg_advisory_xact_lock')) {
              return { rows: [] }
            }

            if (
              text.includes('SELECT t.id, t.name') &&
              text.includes('LIMIT 1')
            ) {
              const userId = String(params?.[0] || '')
              const found = [...memberships.entries()].find(([_k, v]) => {
                const [_tenantId, memberUserId] = _k.split(':')
                return memberUserId === userId && !!v
              })
              if (!found) return { rows: [] }
              const [key, m] = found
              const [tenantId] = key.split(':')
              const t = tenants.get(tenantId)
              return {
                rows: [
                  {
                    id: tenantId,
                    name: t?.name || 'Tenant',
                    subdomain: t?.subdomain || 'tenant',
                    role: m.role,
                    created_at: t?.created_at || new Date().toISOString(),
                  },
                ],
              }
            }

            if (text.includes('INSERT INTO tenants')) {
              const [id, name, subdomain, planType] = params as any[]
              tenants.set(String(id), {
                id: String(id),
                name: String(name),
                subdomain: String(subdomain),
                plan_type: String(planType),
                connection_info: {},
                created_at: new Date().toISOString(),
              })
              return { rows: [] }
            }

            if (text.includes('INSERT INTO tenant_members')) {
              const [tenantId, userId] = params as any[]
              memberships.set(membershipKey(String(tenantId), String(userId)), {
                role: 'owner',
              })
              return { rows: [] }
            }

            if (text.includes('SELECT connection_info FROM tenants')) {
              const tenantId = String(params?.[0] || '')
              return {
                rows: [
                  {
                    connection_info:
                      tenants.get(tenantId)?.connection_info || {},
                  },
                ],
              }
            }

            if (text.includes('UPDATE tenants SET connection_info')) {
              const raw = String(params?.[0] || '{}')
              const tenantId = String(params?.[1] || '')
              const parsed = JSON.parse(raw)
              const current = tenants.get(tenantId)
              if (current) {
                current.connection_info = parsed
                tenants.set(tenantId, current)
              }
              return { rows: [] }
            }

            // tenants/me list query
            if (
              text.includes('FROM tenant_members tm') &&
              text.includes('WHERE tm.user_id = $1')
            ) {
              const userId = String(params?.[0] || '')
              const rows: any[] = []
              for (const [key, m] of memberships.entries()) {
                const [tenantId, memberUserId] = key.split(':')
                if (memberUserId !== userId) continue
                const t = tenants.get(tenantId)
                if (!t) continue
                rows.push({
                  tenant_id: tenantId,
                  id: tenantId,
                  name: t.name,
                  role: m.role,
                  created_at: t.created_at,
                })
              }
              return { rows }
            }

            return { rows: [] }
          },
          release: () => {},
        }
      },
      query: async (sql: string, params?: any[]) => {
        const c = await (this as any).platformPool.connect()
        try {
          return await c.query(sql, params)
        } finally {
          c.release()
        }
      },
    }
  },
}))

describe('self-provision first tenant project', () => {
  const originalEnv = { ...process.env }

  function makeApp() {
    const app = express()
    app.use(express.json())
    return import('../src/routes/tenants').then(({ tenantsRouter }) => {
      app.use('/api/v1/tenants', tenantsRouter)
      return app
    })
  }

  beforeEach(() => {
    process.env.NODE_ENV = 'production'
    process.env.POSTGRES_PASSWORD = 'pw'
    process.env.POSTGRES_USER = 'postgres'
    process.env.POSTGRES_HOST = 'postgres-primary'
    process.env.POSTGRES_PORT = '5432'
    memberships.clear()
    tenants.clear()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('creates a first project and returns it via /me', async () => {
    const app = await makeApp()

    const create = await request(app)
      .post('/api/v1/tenants/self')
      .set('Authorization', 'Bearer user-1')
      .send({ name: 'My Project', plan_type: 'free', db_password: 'secret123' })
      .expect(201)

    expect(create.body?.created).toBe(true)
    expect(
      create.body?.tenant?.id || create.body?.tenant?.tenant_id,
    ).toBeTruthy()
    expect(create.body?.database?.database).toMatch(/^tenant_/)

    const list = await request(app)
      .get('/api/v1/tenants/me')
      .set('Authorization', 'Bearer user-1')
      .expect(200)

    expect(Array.isArray(list.body?.tenants)).toBe(true)
    expect(list.body.tenants.length).toBe(1)
    expect(list.body.tenants[0].name).toBe('My Project')
  })
})
