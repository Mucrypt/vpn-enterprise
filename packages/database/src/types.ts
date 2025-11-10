// Database Type Definitions for VPN Enterprise
// Custom AppUser type for local usage (not overwritten by supabase codegen)
export type AppUserRole = 'user' | 'admin' | 'super_admin';
export interface AppUser {
  id: string;
  email: string;
  role: AppUserRole;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

// Type alias for generated Supabase user row
import type { Database as SupabaseDatabase } from './supabase-types';
export type AppUserRow = SupabaseDatabase["public"]["Tables"]["users"]["Row"];

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';
export type ConnectionStatus = 'connected' | 'disconnected' | 'failed';

// Phase 4: Enterprise Features Types
export type SplitTunnelRuleType = 'app' | 'domain' | 'ip';
export type SplitTunnelAction = 'bypass' | 'force_vpn';
export type Platform = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'web' | 'all';
export type ConfigType = 'wireguard' | 'openvpn';
export type ProtocolType = 'wireguard' | 'openvpn' | 'ikev2';
export type SecurityLevel = 'standard' | 'high' | 'maximum';
export type KillSwitchEventType = 'activated' | 'deactivated' | 'triggered';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface Server {
  id: string;
  name: string;
  country: string;
  country_code: string;
  city?: string;
  host: string;
  public_key: string;
  port: number;
  load: number;
  max_clients: number;
  current_clients: number;
  is_active: boolean;
  protocol: string;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: SubscriptionPlan;
  status: SubscriptionStatus;
  max_devices: number;
  data_limit_gb?: number;
  bandwidth_limit_mbps?: number;
  started_at: string;
  expires_at?: string;
  auto_renew: boolean;
  payment_method_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_name: string;
  public_key: string;
  private_key: string;
  assigned_ip: string;
  is_active: boolean;
  last_connected_at?: string;
  os_type?: string;
  device_fingerprint?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionLog {
  id: string;
  user_id: string;
  device_id?: string;
  server_id: string;
  status: ConnectionStatus;
  connected_at: string;
  disconnected_at?: string;
  duration_minutes?: number;
  data_uploaded_mb: number;
  data_downloaded_mb: number;
  ip_address?: string;
  disconnect_reason?: string;
  created_at: string;
}

export interface ServerStatistics {
  id: string;
  server_id: string;
  timestamp: string;
  cpu_usage?: number;
  memory_usage?: number;
  bandwidth_in_mbps?: number;
  bandwidth_out_mbps?: number;
  active_connections: number;
  total_data_transferred_gb: number;
  created_at: string;
}

// =============================================
// PHASE 4: ENTERPRISE FEATURES INTERFACES
// =============================================

export interface UserSecuritySettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  backup_codes?: string[];
  kill_switch_enabled: boolean;
  auto_connect: boolean;
  preferred_protocol: string;
  dns_leak_protection: boolean;
  ipv6_leak_protection: boolean;
  created_at: string;
  updated_at: string;
}

export interface SplitTunnelRule {
  id: string;
  user_id: string;
  rule_type: SplitTunnelRuleType;
  rule_value: string;
  action: SplitTunnelAction;
  is_active: boolean;
  platform?: Platform;
  created_at: string;
  updated_at: string;
}

export interface ClientConfiguration {
  id: string;
  user_id: string;
  device_id?: string;
  platform: Platform;
  config_type: ConfigType;
  config_data: string;
  encryption_level: string;
  dns_servers?: string[];
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KillSwitchEvent {
  id: string;
  user_id: string;
  device_id?: string;
  event_type: KillSwitchEventType;
  reason?: string;
  ip_address?: string;
  created_at: string;
}

export interface SecurityAuditLog {
  id: string;
  user_id?: string;
  event_type: string;
  event_description?: string;
  ip_address?: string;
  user_agent?: string;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EncryptionProtocol {
  id: string;
  name: string;
  protocol_type: ProtocolType;
  cipher: string;
  key_size: number;
  is_default: boolean;
  is_active: boolean;
  security_level: SecurityLevel;
  description?: string;
  created_at: string;
}

// Database Schema
export interface Database {
  public: {
    Tables: {
      servers: {
        Row: Server;
        Insert: Omit<Server, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Server, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_subscriptions: {
        Row: UserSubscription;
        Insert: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_devices: {
        Row: UserDevice;
        Insert: Omit<UserDevice, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserDevice, 'id' | 'created_at' | 'updated_at'>>;
      };
      connection_logs: {
        Row: ConnectionLog;
        Insert: Omit<ConnectionLog, 'id' | 'created_at' | 'duration_minutes'>;
        Update: Partial<Omit<ConnectionLog, 'id' | 'created_at' | 'duration_minutes'>>;
      };
      server_statistics: {
        Row: ServerStatistics;
        Insert: Omit<ServerStatistics, 'id' | 'created_at'>;
        Update: Partial<Omit<ServerStatistics, 'id' | 'created_at'>>;
      };
      user_security_settings: {
        Row: UserSecuritySettings;
        Insert: Omit<UserSecuritySettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSecuritySettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      split_tunnel_rules: {
        Row: SplitTunnelRule;
        Insert: Omit<SplitTunnelRule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SplitTunnelRule, 'id' | 'created_at' | 'updated_at'>>;
      };
      client_configurations: {
        Row: ClientConfiguration;
        Insert: Omit<ClientConfiguration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ClientConfiguration, 'id' | 'created_at' | 'updated_at'>>;
      };
      kill_switch_events: {
        Row: KillSwitchEvent;
        Insert: Omit<KillSwitchEvent, 'id' | 'created_at'>;
        Update: never;
      };
      security_audit_log: {
        Row: SecurityAuditLog;
        Insert: Omit<SecurityAuditLog, 'id' | 'created_at'>;
        Update: never;
      };
      encryption_protocols: {
        Row: EncryptionProtocol;
        Insert: Omit<EncryptionProtocol, 'id' | 'created_at'>;
        Update: Partial<Omit<EncryptionProtocol, 'id' | 'created_at'>>;
      };
    };
  };
}
