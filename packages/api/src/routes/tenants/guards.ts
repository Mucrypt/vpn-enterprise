import type { RequestHandler } from 'express'
import { requireTenantAccess } from '../../middleware/tenant-access'

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export const tenantUuidGuard: RequestHandler = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') return next()

  const tenantId = String((req as any).params?.tenantId || '')
  if (!UUID_RE.test(tenantId)) return next()

  return requireTenantAccess({ minRole: 'viewer' })(
    req as any,
    res as any,
    next,
  )
}

export const requireTenantEditor: RequestHandler[] = [
  (req, res, next) => {
    if (process.env.NODE_ENV === 'development') return next()
    return requireTenantAccess({ minRole: 'editor' })(
      req as any,
      res as any,
      next,
    )
  },
]

export const requireTenantAdminRole: RequestHandler[] = [
  (req, res, next) => {
    if (process.env.NODE_ENV === 'development') return next()
    return requireTenantAccess({ minRole: 'admin' })(
      req as any,
      res as any,
      next,
    )
  },
]
