// Main database exports
export { 
  supabase, 
  supabaseAdmin, 
  supabaseUntyped,
  supabaseAdminUntyped,
  SupabaseDatabase,
  getSupabase,
  getSupabaseAdmin,
  getSupabaseUntyped,
  getSupabaseAdminUntyped
} from '@vpn-enterprise/database/src/client';
export * from '@vpn-enterprise/database/src/types';
export { ServerRepository } from '@vpn-enterprise/database/src/repositories/servers';
export { SubscriptionRepository } from '@vpn-enterprise/database/src/repositories/subscriptions';
export { ConnectionRepository } from '@vpn-enterprise/database/src/repositories/connections';
export { DeviceRepository } from '@vpn-enterprise/database/src/repositories/devices';
// Phase 4: Enterprise Features
export { SecurityRepository } from '@vpn-enterprise/database/src/repositories/security';
export { SplitTunnelRepository } from '@vpn-enterprise/database/src/repositories/split-tunnel';
export { ClientConfigRepository } from '@vpn-enterprise/database/src/repositories/client-config';
export { AuditRepository } from '@vpn-enterprise/database/src/repositories/audit';
