import type { AuthRequest } from '@vpn-enterprise/auth'

export type TenantRole = 'viewer' | 'editor' | 'admin' | 'owner'
export type DbAccessMode = 'ro' | 'rw'

export interface TenantAccess {
  tenantId: string
  role: TenantRole
  dbMode: DbAccessMode
}

export interface TenantAuthRequest extends AuthRequest {
  tenantAccess?: TenantAccess
}
