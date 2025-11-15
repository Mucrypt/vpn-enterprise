import { supabase, supabaseAdmin, supabaseAdminUntyped } from '../client';
import { Database } from '../types';

type ConnectionLog = Database['public']['Tables']['connection_logs']['Row'];
type ConnectionLogInsert = Database['public']['Tables']['connection_logs']['Insert'];
type ConnectionLogUpdate = Database['public']['Tables']['connection_logs']['Update'];

export class ConnectionRepository {
  /**
   * Create a new connection log
   */
  static async create(connection: ConnectionLogInsert): Promise<ConnectionLog> {
    const { data, error } = await supabaseAdmin
      .from('connection_logs')
      .insert(connection as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * End a connection (set disconnected_at)
   */
  static async endConnection(
    connectionId: string,
    disconnectReason?: string
  ): Promise<void> {
    const updates: Partial<ConnectionLog> = {
      disconnected_at: new Date().toISOString(),
      status: 'disconnected',
      disconnect_reason: disconnectReason,
    };
    
    const { error } = await supabaseAdminUntyped
      .from('connection_logs')
      .update(updates)
      .eq('id', connectionId);

    if (error) throw error;
  }

  /**
   * Get user's connection history
   */
  static async getUserHistory(
    userId: string,
    limit: number = 50
  ): Promise<ConnectionLog[]> {
    const { data, error } = await supabase
      .from('connection_logs')
      .select('*, servers(*)')
      .eq('user_id', userId)
      .order('connected_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get active connections for a user
   */
  static async getActiveConnections(userId: string): Promise<ConnectionLog[]> {
    const { data, error } = await supabase
      .from('connection_logs')
      .select('*, servers(*)')
      .eq('user_id', userId)
      .eq('status', 'connected')
      .is('disconnected_at', null);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get total data usage for a user
   */
  static async getUserDataUsage(userId: string): Promise<{
    total_uploaded_mb: number;
    total_downloaded_mb: number;
    total_mb: number;
  }> {
    const { data, error } = await supabase
      .from('connection_logs')
      .select('data_uploaded_mb, data_downloaded_mb')
      .eq('user_id', userId);

    if (error) throw error;

    const totalUploaded = data?.reduce((sum: number, log: any) => sum + (log.data_uploaded_mb || 0), 0) || 0;
    const totalDownloaded = data?.reduce((sum: number, log: any) => sum + (log.data_downloaded_mb || 0), 0) || 0;

    return {
      total_uploaded_mb: totalUploaded,
      total_downloaded_mb: totalDownloaded,
      total_mb: totalUploaded + totalDownloaded,
    };
  }

  /**
   * Update connection data usage
   */
  static async updateDataUsage(
    connectionId: string,
    uploadedMb: number,
    downloadedMb: number
  ): Promise<void> {
    const updates: Partial<ConnectionLog> = {
      data_uploaded_mb: uploadedMb,
      data_downloaded_mb: downloadedMb,
    };
    
    const { error } = await supabaseAdminUntyped
      .from('connection_logs')
      .update(updates)
      .eq('id', connectionId);

    if (error) throw error;
  }

  /**
   * Get server connection statistics
   */
  static async getServerStats(serverId: string, hours: number = 24): Promise<any> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('connection_logs')
      .select('*')
      .eq('server_id', serverId)
      .gte('connected_at', since);

    if (error) throw error;

    const totalConnections = data?.length || 0;
    const activeConnections = data?.filter((log: any) => log.status === 'connected' && !log.disconnected_at).length || 0;

    return {
      total_connections: totalConnections,
      active_connections: activeConnections,
      data: data || [],
    };
  }
}
