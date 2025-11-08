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
} from './client';
export * from './types';
export { ServerRepository } from './repositories/servers';
export { SubscriptionRepository } from './repositories/subscriptions';
export { ConnectionRepository } from './repositories/connections';
export { DeviceRepository } from './repositories/devices';
// Phase 4: Enterprise Features
export { SecurityRepository } from './repositories/security';
export { SplitTunnelRepository } from './repositories/split-tunnel';
export { ClientConfigRepository } from './repositories/client-config';
export { AuditRepository } from './repositories/audit';
