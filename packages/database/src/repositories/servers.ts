import { supabase, supabaseAdmin, supabaseAdminUntyped } from '../client';
import { Database } from '../types';

type Server = Database['public']['Tables']['servers']['Row'];
type ServerInsert = Database['public']['Tables']['servers']['Insert'];
type ServerUpdate = Database['public']['Tables']['servers']['Update'];

export class ServerRepository {
  /**
   * Get all active servers
   */
  static async getAllActive(): Promise<Server[]> {
    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .eq('is_active', true)
      .order('load', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get servers by country
   */
  static async getByCountry(countryCode: string): Promise<Server[]> {
    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .order('load', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get server by ID
   */
  static async getById(id: string): Promise<Server | null> {
    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get best available server (lowest load)
   */
  static async getBestAvailable(countryCode?: string): Promise<Server | null> {
    let query = supabase
      .from('servers')
      .select('*')
      .eq('is_active', true)
      .lt('load', 90)
      .order('load', { ascending: true })
      .limit(1);

    if (countryCode) {
      query = query.eq('country_code', countryCode);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.[0] || null;
  }

  /**
   * Create a new server (admin only)
   */
  static async create(server: ServerInsert): Promise<Server> {
    const { data, error } = await supabaseAdminUntyped
      .from('servers')
      .insert(server)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update server (admin only)
   */
  static async update(id: string, updates: ServerUpdate): Promise<Server> {
    const { data, error } = await supabaseAdminUntyped
      .from('servers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update server load
   */
  static async updateLoad(id: string, load: number): Promise<void> {
    const { error } = await supabaseAdminUntyped
      .from('servers')
      .update({ load })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete server (admin only)
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('servers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get server statistics
   */
  static async getStatistics(serverId: string, hours: number = 24): Promise<any[]> {
    const { data, error } = await supabase
      .from('server_statistics')
      .select('*')
      .eq('server_id', serverId)
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
