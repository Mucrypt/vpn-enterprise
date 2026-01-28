import type { Response, NextFunction } from 'express'
import { authMiddleware } from '@vpn-enterprise/auth'
import type { TenantAuthRequest, TenantRole } from '../types/tenant-access'
import {
  TenantMembershipService,
  isRoleAtLeast,
} from '../services/tenant-membership-service'
import { DatabasePlatformClient } from '../database-platform-client'

export interface RequireTenantAccessOptions {
  minRole: TenantRole
  /**
   * When true, global admin users can access any tenant (operator bypass).
   * Defaults to true.
   */
  allowGlobalAdminBypass?: boolean
}

function roleToDbMode(role: TenantRole): 'ro' | 'rw' {
  return role === 'viewer' ? 'ro' : 'rw'
}

export function requireTenantAccess(options: RequireTenantAccessOptions) {
  const { minRole, allowGlobalAdminBypass = true } = options

  return async (req: TenantAuthRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure auth is present; if the caller already ran authMiddleware earlier,
      // this is cheap (cached) and ensures req.user is set.
      if (!req.user) {
        // authMiddleware is async and will either:
        // - set req.user and call next() (we pass a no-op), or
        // - end the response with 401/500 (no next call).
        await authMiddleware(req as any, res as any, () => {})
      }

      // If authMiddleware rejected the request, it already wrote the response.
      if (res.headersSent || (res as any).writableEnded) return

      const tenantId = String((req as any).params?.tenantId || '').trim()
      if (!tenantId) {
        return res.status(400).json({
          error: 'bad_request',
          message: 'Missing tenantId in route params',
        })
      }

      if (!req.user?.id) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Authentication required',
        })
      }

      // If we already resolved access earlier in the chain, just enforce required role.
      if (req.tenantAccess?.tenantId === tenantId) {
        if (!isRoleAtLeast(req.tenantAccess.role, minRole)) {
          return res.status(403).json({
            error: 'forbidden',
            message: 'Insufficient tenant permissions',
            requiredRole: minRole,
          })
        }
        return next()
      }

      const db = new DatabasePlatformClient()
      const membership = new TenantMembershipService(db.platformPool)
      const role = await membership.getUserRoleForTenant({
        tenantId,
        user: req.user,
        allowGlobalAdminBypass,
      })

      if (!role) {
        return res.status(403).json({
          error: 'forbidden',
          message: 'You are not a member of this tenant',
        })
      }

      if (!isRoleAtLeast(role, minRole)) {
        return res.status(403).json({
          error: 'forbidden',
          message: 'Insufficient tenant permissions',
          requiredRole: minRole,
        })
      }

      req.tenantAccess = {
        tenantId,
        role,
        dbMode: roleToDbMode(role),
      }

      next()
    } catch (e: any) {
      const message = String(e?.message || 'Tenant access check failed')
      console.error('[requireTenantAccess] error', e)
      res.status(500).json({ error: 'server_error', message })
    }
  }
}
