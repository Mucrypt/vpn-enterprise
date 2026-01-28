import { supabaseAdmin } from '@vpn-enterprise/database'
import type { AppUser } from '@vpn-enterprise/database'
import type { Pool } from 'pg'
import type { TenantRole } from '../types/tenant-access'

const ROLE_ORDER: Record<TenantRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
}

export function isRoleAtLeast(
  actual: TenantRole,
  required: TenantRole,
): boolean {
  return ROLE_ORDER[actual] >= ROLE_ORDER[required]
}

function normalizeTenantRole(value: unknown): TenantRole {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
  if (raw === 'owner') return 'owner'
  if (raw === 'admin') return 'admin'
  if (raw === 'editor' || raw === 'write' || raw === 'rw') return 'editor'
  return 'viewer'
}

export class TenantMembershipService {
  constructor(private platformPool: Pool) {}

  /**
   * Resolve a user's role in a tenant.
   *
   * Order of precedence:
   * 1) Platform DB table `tenant_members` (preferred for self-host / TENANTS_SOURCE=platform)
   * 2) Supabase association tables (best-effort fallback)
   */
  async getUserRoleForTenant(params: {
    tenantId: string
    user: Pick<AppUser, 'id' | 'email' | 'role'>
    allowGlobalAdminBypass?: boolean
  }): Promise<TenantRole | null> {
    const { tenantId, user, allowGlobalAdminBypass = true } = params

    if (!user?.id) return null

    // Global admin bypass is intentionally supported for platform operators.
    // Admin bootstrap via ADMIN_EMAILS is handled by adminMiddleware in the auth package;
    // here we only check the resolved user.role.
    if (allowGlobalAdminBypass) {
      const globalRole = String(user.role || '').toLowerCase()
      if (globalRole.includes('admin')) return 'owner'
    }

    // 1) Platform DB membership table
    try {
      const result = await this.platformPool.query(
        'SELECT role FROM tenant_members WHERE tenant_id = $1 AND user_id = $2 LIMIT 1',
        [tenantId, user.id],
      )
      if (result.rows?.[0]?.role) {
        return normalizeTenantRole(result.rows[0].role)
      }
    } catch (e: any) {
      // If table doesn't exist yet (first deploy), fall back.
      // Postgres missing-relation error code is 42P01.
      if (String(e?.code) !== '42P01') {
        // Non-"table missing" errors should be surfaced to help ops.
        throw e
      }
    }

    // 2) Supabase fallback: try common association table patterns
    const candidates = [
      'tenant_members',
      'tenant_users',
      'user_tenants',
      'project_members',
    ]
    for (const tableName of candidates) {
      try {
        const { data, error } = await (supabaseAdmin as any)
          .from(tableName)
          .select('tenant_id, role')
          .eq('tenant_id', tenantId)
          .eq('user_id', user.id)
          .limit(1)

        if (!error && Array.isArray(data) && data[0]) {
          return normalizeTenantRole(data[0].role)
        }
      } catch (_err: any) {
        continue
      }
    }

    return null
  }
}
