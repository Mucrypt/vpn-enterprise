export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_preview: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          organization_id: string | null
          revoked_at: string | null
          scopes: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_preview: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          organization_id?: string | null
          revoked_at?: string | null
          scopes?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_preview?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          revoked_at?: string | null
          scopes?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bandwidth_logs: {
        Row: {
          bytes_received: number
          bytes_sent: number
          duration_seconds: number | null
          id: string
          measured_at: string | null
          session_end: string | null
          session_start: string
          user_id: string | null
          vpn_config_id: string | null
        }
        Insert: {
          bytes_received?: number
          bytes_sent?: number
          duration_seconds?: number | null
          id?: string
          measured_at?: string | null
          session_end?: string | null
          session_start: string
          user_id?: string | null
          vpn_config_id?: string | null
        }
        Update: {
          bytes_received?: number
          bytes_sent?: number
          duration_seconds?: number | null
          id?: string
          measured_at?: string | null
          session_end?: string | null
          session_start?: string
          user_id?: string | null
          vpn_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bandwidth_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bandwidth_logs_vpn_config_id_fkey"
            columns: ["vpn_config_id"]
            isOneToOne: false
            referencedRelation: "vpn_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_configurations: {
        Row: {
          config_data: string
          config_type: string
          created_at: string | null
          device_id: string | null
          dns_servers: string[] | null
          encryption_level: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config_data: string
          config_type: string
          created_at?: string | null
          device_id?: string | null
          dns_servers?: string[] | null
          encryption_level?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config_data?: string
          config_type?: string
          created_at?: string | null
          device_id?: string | null
          dns_servers?: string[] | null
          encryption_level?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_configurations_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_configurations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_logs: {
        Row: {
          connected_at: string | null
          created_at: string | null
          data_downloaded_mb: number | null
          data_uploaded_mb: number | null
          device_id: string | null
          disconnect_reason: string | null
          disconnected_at: string | null
          duration_minutes: number | null
          id: string
          ip_address: unknown
          server_id: string
          status: Database["public"]["Enums"]["connection_status"] | null
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          data_downloaded_mb?: number | null
          data_uploaded_mb?: number | null
          device_id?: string | null
          disconnect_reason?: string | null
          disconnected_at?: string | null
          duration_minutes?: number | null
          id?: string
          ip_address?: unknown
          server_id: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          user_id: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          data_downloaded_mb?: number | null
          data_uploaded_mb?: number | null
          device_id?: string | null
          disconnect_reason?: string | null
          disconnected_at?: string | null
          duration_minutes?: number | null
          id?: string
          ip_address?: unknown
          server_id?: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_logs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_protocols: {
        Row: {
          cipher: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          key_size: number
          name: string
          protocol_type: string
          security_level: string | null
        }
        Insert: {
          cipher: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          key_size: number
          name: string
          protocol_type: string
          security_level?: string | null
        }
        Update: {
          cipher?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          key_size?: number
          name?: string
          protocol_type?: string
          security_level?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string
          metadata: Json | null
          organization_id: string | null
          paid_at: string | null
          pdf_url: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          metadata?: Json | null
          organization_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          metadata?: Json | null
          organization_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      kill_switch_events: {
        Row: {
          created_at: string | null
          device_id: string | null
          event_type: string
          id: string
          ip_address: unknown
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kill_switch_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kill_switch_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_tier: string | null
          created_at: string | null
          deleted_at: string | null
          features: Json | null
          id: string
          max_devices_per_user: number | null
          max_servers: number | null
          max_users: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          billing_tier?: string | null
          created_at?: string | null
          deleted_at?: string | null
          features?: Json | null
          id?: string
          max_devices_per_user?: number | null
          max_servers?: number | null
          max_users?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          billing_tier?: string | null
          created_at?: string | null
          deleted_at?: string | null
          features?: Json | null
          id?: string
          max_devices_per_user?: number | null
          max_servers?: number | null
          max_users?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          event_description: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_description?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_description?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      server_statistics: {
        Row: {
          active_connections: number | null
          bandwidth_in_mbps: number | null
          bandwidth_out_mbps: number | null
          cpu_usage: number | null
          created_at: string | null
          id: string
          memory_usage: number | null
          server_id: string
          timestamp: string | null
          total_data_transferred_gb: number | null
        }
        Insert: {
          active_connections?: number | null
          bandwidth_in_mbps?: number | null
          bandwidth_out_mbps?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          id?: string
          memory_usage?: number | null
          server_id: string
          timestamp?: string | null
          total_data_transferred_gb?: number | null
        }
        Update: {
          active_connections?: number | null
          bandwidth_in_mbps?: number | null
          bandwidth_out_mbps?: number | null
          cpu_usage?: number | null
          created_at?: string | null
          id?: string
          memory_usage?: number | null
          server_id?: string
          timestamp?: string | null
          total_data_transferred_gb?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "server_statistics_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          city: string | null
          country: string
          country_code: string
          created_at: string | null
          current_clients: number | null
          features: Json | null
          host: string
          id: string
          is_active: boolean | null
          latitude: number | null
          load: number | null
          longitude: number | null
          max_clients: number | null
          name: string
          port: number
          protocol: string | null
          public_key: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country: string
          country_code: string
          created_at?: string | null
          current_clients?: number | null
          features?: Json | null
          host: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          load?: number | null
          longitude?: number | null
          max_clients?: number | null
          name: string
          port?: number
          protocol?: string | null
          public_key: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string
          country_code?: string
          created_at?: string | null
          current_clients?: number | null
          features?: Json | null
          host?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          load?: number | null
          longitude?: number | null
          max_clients?: number | null
          name?: string
          port?: number
          protocol?: string | null
          public_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      split_tunnel_rules: {
        Row: {
          action: string
          created_at: string | null
          id: string
          is_active: boolean | null
          platform: string | null
          rule_type: string
          rule_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string | null
          rule_type: string
          rule_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string | null
          rule_type?: string
          rule_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_tunnel_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          access_level: string | null
          can_access_premium_servers: boolean | null
          created_at: string | null
          data_limit_mb: number | null
          id: string
          max_concurrent_connections: number | null
          max_devices: number
          name: string
          price_monthly: number
          price_yearly: number | null
          priority_support: boolean | null
        }
        Insert: {
          access_level?: string | null
          can_access_premium_servers?: boolean | null
          created_at?: string | null
          data_limit_mb?: number | null
          id?: string
          max_concurrent_connections?: number | null
          max_devices: number
          name: string
          price_monthly: number
          price_yearly?: number | null
          priority_support?: boolean | null
        }
        Update: {
          access_level?: string | null
          can_access_premium_servers?: boolean | null
          created_at?: string | null
          data_limit_mb?: number | null
          id?: string
          max_concurrent_connections?: number | null
          max_devices?: number
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          priority_support?: boolean | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          organization_id: string | null
          plan_type: string
          price_amount: number | null
          price_currency: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          plan_type: string
          price_amount?: number | null
          price_currency?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          plan_type?: string
          price_amount?: number | null
          price_currency?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          assigned_ip: string
          created_at: string | null
          device_fingerprint: string | null
          device_name: string
          id: string
          is_active: boolean | null
          last_connected_at: string | null
          os_type: string | null
          private_key: string
          public_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_ip: string
          created_at?: string | null
          device_fingerprint?: string | null
          device_name: string
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          os_type?: string | null
          private_key: string
          public_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_ip?: string
          created_at?: string | null
          device_fingerprint?: string | null
          device_name?: string
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          os_type?: string | null
          private_key?: string
          public_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security_settings: {
        Row: {
          auto_connect: boolean | null
          backup_codes: string[] | null
          created_at: string | null
          dns_leak_protection: boolean | null
          id: string
          ipv6_leak_protection: boolean | null
          kill_switch_enabled: boolean | null
          preferred_protocol: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_connect?: boolean | null
          backup_codes?: string[] | null
          created_at?: string | null
          dns_leak_protection?: boolean | null
          id?: string
          ipv6_leak_protection?: boolean | null
          kill_switch_enabled?: boolean | null
          preferred_protocol?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_connect?: boolean | null
          backup_codes?: string[] | null
          created_at?: string | null
          dns_leak_protection?: boolean | null
          id?: string
          ipv6_leak_protection?: boolean | null
          kill_switch_enabled?: boolean | null
          preferred_protocol?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_security_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          expires_at: string
          id: string
          ip_address: unknown
          last_activity: string | null
          os: string | null
          refresh_token_hash: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          last_activity?: string | null
          os?: string | null
          refresh_token_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_activity?: string | null
          os?: string | null
          refresh_token_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          bandwidth_limit_mbps: number | null
          created_at: string | null
          data_limit_gb: number | null
          expires_at: string | null
          id: string
          max_devices: number | null
          payment_method_id: string | null
          plan_type: Database["public"]["Enums"]["subscription_plan"] | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          bandwidth_limit_mbps?: number | null
          created_at?: string | null
          data_limit_gb?: number | null
          expires_at?: string | null
          id?: string
          max_devices?: number | null
          payment_method_id?: string | null
          plan_type?: Database["public"]["Enums"]["subscription_plan"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          bandwidth_limit_mbps?: number | null
          created_at?: string | null
          data_limit_gb?: number | null
          expires_at?: string | null
          id?: string
          max_devices?: number | null
          payment_method_id?: string | null
          plan_type?: Database["public"]["Enums"]["subscription_plan"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_locked_until: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          login_attempts: number | null
          metadata: Json | null
          mfa_enabled: boolean | null
          mfa_secret: string | null
          organization_id: string | null
          phone: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role_enum"] | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_locked_until?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          login_attempts?: number | null
          metadata?: Json | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          organization_id?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_locked_until?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          login_attempts?: number | null
          metadata?: Json | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          organization_id?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_subscription_tier_id_fkey"
            columns: ["subscription_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      vpn_configs: {
        Row: {
          allocated_ip: unknown
          bytes_received: number | null
          bytes_sent: number | null
          client_private_key_encrypted: string
          client_public_key: string
          created_at: string | null
          data_limit_mb: number | null
          device_name: string | null
          dns_servers: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_handshake: string | null
          server_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allocated_ip: unknown
          bytes_received?: number | null
          bytes_sent?: number | null
          client_private_key_encrypted: string
          client_public_key: string
          created_at?: string | null
          data_limit_mb?: number | null
          device_name?: string | null
          dns_servers?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_handshake?: string | null
          server_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allocated_ip?: unknown
          bytes_received?: number | null
          bytes_sent?: number | null
          client_private_key_encrypted?: string
          client_public_key?: string
          created_at?: string | null
          data_limit_mb?: number | null
          device_name?: string | null
          dns_servers?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_handshake?: string | null
          server_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vpn_configs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vpn_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_data_limit: { Args: { p_user_id: string }; Returns: boolean }
      log_security_event: {
        Args: {
          p_description: string
          p_event_type: string
          p_ip_address?: unknown
          p_severity?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      connection_status: "connected" | "disconnected" | "failed"
      subscription_plan: "free" | "basic" | "premium" | "enterprise"
      subscription_status: "active" | "expired" | "cancelled" | "trial"
      user_role_enum:
        | "super_admin"
        | "admin"
        | "user"
        | "viewer"
        | "superadmin"
        | "administrator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      connection_status: ["connected", "disconnected", "failed"],
      subscription_plan: ["free", "basic", "premium", "enterprise"],
      subscription_status: ["active", "expired", "cancelled", "trial"],
      user_role_enum: [
        "super_admin",
        "admin",
        "user",
        "viewer",
        "superadmin",
        "administrator",
      ],
    },
  },
} as const
