import { supabase, supabaseAdmin, supabaseAdminUntyped } from '@vpn-enterprise/database/src/client';
import { Database, ClientConfiguration, Platform } from '@vpn-enterprise/database/src/types';

type ClientConfigurationInsert = Database['public']['Tables']['client_configurations']['Insert'];

export class ClientConfigRepository {
  /**
   * Get user configurations
   */
  static async getUserConfigs(userId: string, platform?: Platform): Promise<ClientConfiguration[]> {
    let query = supabase
      .from('client_configurations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get configuration by ID
   */
  static async getById(configId: string): Promise<ClientConfiguration | null> {
    const { data, error } = await supabase
      .from('client_configurations')
      .select('*')
      .eq('id', configId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create a new client configuration
   */
  static async create(config: ClientConfigurationInsert): Promise<ClientConfiguration> {
    const { data, error } = await supabaseAdminUntyped
      .from('client_configurations')
      .insert(config)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update last used timestamp
   */
  static async updateLastUsed(configId: string): Promise<void> {
    const { error } = await supabaseAdminUntyped
      .from('client_configurations')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', configId);

    if (error) throw error;
  }

  /**
   * Delete configuration
   */
  static async delete(configId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('client_configurations')
      .delete()
      .eq('id', configId);

    if (error) throw error;
  }

  /**
   * Get configuration for device
   */
  static async getForDevice(
    userId: string,
    deviceId: string,
    platform: Platform
  ): Promise<ClientConfiguration | null> {
    const { data, error } = await supabase
      .from('client_configurations')
      .select('*')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .eq('platform', platform)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Deactivate old configurations
   */
  static async deactivateOld(userId: string, platform: Platform): Promise<void> {
    const { error } = await supabaseAdminUntyped
      .from('client_configurations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) throw error;
  }
}
