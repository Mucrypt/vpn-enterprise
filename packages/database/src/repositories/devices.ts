import { supabase, supabaseAdmin, supabaseUntyped } from '@vpn-enterprise/database/src/client';
import { Database } from '@vpn-enterprise/database/src/types';

type UserDevice = Database['public']['Tables']['user_devices']['Row'];
type UserDeviceInsert = Database['public']['Tables']['user_devices']['Insert'];

export class DeviceRepository {
  /**
   * Get all devices for a user
   */
  static async getUserDevices(userId: string): Promise<UserDevice[]> {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get device by ID
   */
  static async getById(deviceId: string): Promise<UserDevice | null> {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('id', deviceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create a new device
   */
  static async create(device: UserDeviceInsert): Promise<UserDevice> {
    const { data, error } = await supabase
      .from('user_devices')
      .insert(device as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update device
   */
  static async update(
    deviceId: string,
    updates: Partial<UserDeviceInsert>
  ): Promise<UserDevice> {
    const { data, error } = await supabaseUntyped
      .from('user_devices')
      .update(updates)
      .eq('id', deviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete device
   */
  static async delete(deviceId: string): Promise<void> {
    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId);

    if (error) throw error;
  }

  /**
   * Update last connected timestamp
   */
  static async updateLastConnected(deviceId: string): Promise<void> {
    const { error } = await supabaseUntyped
      .from('user_devices')
      .update({ last_connected_at: new Date().toISOString() })
      .eq('id', deviceId);

    if (error) throw error;
  }

  /**
   * Check if user has reached device limit
   */
  static async hasReachedDeviceLimit(userId: string, maxDevices: number): Promise<boolean> {
    const devices = await this.getUserDevices(userId);
    const activeDevices = devices.filter((d) => d.is_active);
    return activeDevices.length >= maxDevices;
  }
}
