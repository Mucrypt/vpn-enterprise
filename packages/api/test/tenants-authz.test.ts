import express from 'express'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const uuid = '123e4567-e89b-12d3-a456-426614174000'

type UserRecord = { id: string; email?: string; role?: string }
const membershipByTenantAndUser = new Map<string, string>()
function membershipKey(tenantId: string, userId: string) {
  return `${tenantId}:${userId}`
}

vi.mock('@vpn-enterprise/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    const raw = String(req.headers?.authorization || '')
    const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : ''
    if (!token) {
      return res
        .status(401)
        .json({ error: 'unauthorized', message: 'Missing auth token' })
    }

    // Allow tests to provide a user id via token.
    const user: UserRecord = {
      id: token,
      email: `${token}@example.com`,
      role: 'user',
    }
    req.user = user
    return next()
  },
  adminMiddleware: (_req: any, _res: any, next: any) => next(),
}))

vi.mock('@vpn-enterprise/database', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => ({ data: [], error: null }),
        }),
        order: () => ({ data: [], error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => ({ data: null, error: null }),
        }),
      }),
    }),
  },
}))

vi.mock('../src/controllers/tableDataController', () => ({
  getTableData: (_req: any, res: any) => res.json({ ok: true }),
  updateTableData: (_req: any, res: any) => res.json({ ok: true }),
  insertTableData: (_req: any, res: any) => res.json({ ok: true }),
  deleteTableData: (_req: any, res: any) => res.json({ ok: true }),
}))

vi.mock('../src/controllers/tableStructureController', () => ({
  getTableStructure: (_req: any, res: any) => res.json({ ok: true }),
  updateTableStructure: (_req: any, res: any) => res.json({ ok: true }),
}))

vi.mock('../src/database-platform-client', () => ({
  DatabasePlatformClient: class DatabasePlatformClient {
    platformPool = {
      query: async (_sql: string, params?: any[]) => {
        // Membership check: SELECT role FROM tenant_members WHERE tenant_id=$1 AND user_id=$2
        if (Array.isArray(params) && params.length >= 2) {
          const tenantId = String(params?.[0] || '')
          const userId = String(params?.[1] || '')
          const role = membershipByTenantAndUser.get(
            membershipKey(tenantId, userId),
          )
          if (!role) return { rows: [] }
          return { rows: [{ role }] }
        }

        // Tenant list: SELECT ... FROM tenant_members JOIN tenants ... WHERE tm.user_id=$1
        if (Array.isArray(params) && params.length === 1) {
          const userId = String(params?.[0] || '')
          const rows: any[] = []
          for (const [key, role] of membershipByTenantAndUser.entries()) {
            const [tenantId, memberUserId] = key.split(':')
            if (memberUserId !== userId) continue
            rows.push({
              tenant_id: tenantId,
              id: tenantId,
              name: 'Tenant',
              role,
            })
          }
          return { rows }
        }

        return { rows: [] }
      },
    }

    async getTenantConnection(_tenantId: string, _mode: 'ro' | 'rw') {
      return {
        query: async () => ({ rows: [] }),
      }
    }

    async executeQuery(
      _tenantId: string,
      _sql: string,
      _params: any[],
      _mode: 'ro' | 'rw',
    ) {
      return { data: [], rowCount: 0, fields: [] }
    }
  },
}))

describe('tenant route authz (401 vs 403)', () => {
  const originalNodeEnv = process.env.NODE_ENV

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
    membershipByTenantAndUser.clear()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('returns 401 when unauthenticated (tenant-scoped)', async () => {
    const app = await makeApp()
    await request(app).get(`/api/v1/tenants/${uuid}/schemas`).expect(401)
  })

  it('returns 403 when authenticated but not a member', async () => {
    const app = await makeApp()
    await request(app)
      .get(`/api/v1/tenants/${uuid}/schemas`)
      .set('Authorization', 'Bearer user-not-member')
      .expect(403)
  })

  it('allows viewer to read', async () => {
    const app = await makeApp()
    membershipByTenantAndUser.set(membershipKey(uuid, 'user-viewer'), 'viewer')
    await request(app)
      .get(`/api/v1/tenants/${uuid}/schemas`)
      .set('Authorization', 'Bearer user-viewer')
      .expect(200)
  })

  it('returns 403 for viewer attempting write', async () => {
    const app = await makeApp()
    membershipByTenantAndUser.set(membershipKey(uuid, 'user-viewer'), 'viewer')
    await request(app)
      .put(`/api/v1/tenants/${uuid}/tables/public.users/structure`)
      .set('Authorization', 'Bearer user-viewer')
      .send({})
      .expect(403)
  })

  it('allows editor to write', async () => {
    const app = await makeApp()
    membershipByTenantAndUser.set(membershipKey(uuid, 'user-editor'), 'editor')
    await request(app)
      .put(`/api/v1/tenants/${uuid}/tables/public.users/structure`)
      .set('Authorization', 'Bearer user-editor')
      .send({})
      .expect(200)
  })

  it('returns 401 for /me when unauthenticated', async () => {
    const app = await makeApp()
    await request(app).get('/api/v1/tenants/me').expect(401)
  })

  it('returns 200 for /me when authenticated', async () => {
    const app = await makeApp()
    membershipByTenantAndUser.set(membershipKey(uuid, 'user-viewer'), 'viewer')

    await request(app)
      .get('/api/v1/tenants/me')
      .set('Authorization', 'Bearer user-viewer')
      .expect(200)
  })
})
