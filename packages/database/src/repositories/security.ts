import { supabase, supabaseAdmin, supabaseAdminUntyped } from '../client';
import { Database, UserSecuritySettings } from '../types';

type UserSecuritySettingsInsert = Database['public']['Tables']['user_security_settings']['Insert'];
type UserSecuritySettingsUpdate = Database['public']['Tables']['user_security_settings']['Update'];

export class SecurityRepository {
  /**
   * Get user security settings
   */
  static async getByUserId(userId: string): Promise<UserSecuritySettings | null> {
    const { data, error } = await supabase
      .from('user_security_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create or update security settings
   */
  static async upsert(settings: UserSecuritySettingsInsert): Promise<UserSecuritySettings> {
    const { data, error } = await supabaseAdminUntyped
      .from('user_security_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Enable two-factor authentication
   */
  static async enable2FA(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<UserSecuritySettings> {
    const { data, error} = await supabaseAdminUntyped
      .from('user_security_settings')
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret,
        backup_codes: backupCodes,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Disable two-factor authentication
   */
  static async disable2FA(userId: string): Promise<UserSecuritySettings> {
    const { data, error } = await supabaseAdminUntyped
      .from('user_security_settings')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: null,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Toggle kill switch
   */
  static async toggleKillSwitch(userId: string, enabled: boolean): Promise<UserSecuritySettings> {
    const { data, error } = await supabaseAdminUntyped
      .from('user_security_settings')
      .update({ kill_switch_enabled: enabled })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update DNS leak protection
   */
  static async updateDNSProtection(
    userId: string,
    dnsLeakProtection: boolean,
    ipv6LeakProtection: boolean
  ): Promise<UserSecuritySettings> {
    const { data, error } = await supabaseAdminUntyped
      .from('user_security_settings')
      .update({
        dns_leak_protection: dnsLeakProtection,
        ipv6_leak_protection: ipv6LeakProtection,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Set preferred protocol
   */
  static async setPreferredProtocol(
    userId: string,
    protocol: string
  ): Promise<UserSecuritySettings> {
    const { data, error } = await supabaseAdminUntyped
      .from('user_security_settings')
      .update({ preferred_protocol: protocol })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
