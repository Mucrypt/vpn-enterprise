import { supabase, supabaseAdminUntyped } from '@vpn-enterprise/database/src/client';
import { Database, SecurityAuditLog, KillSwitchEvent } from '@vpn-enterprise/database/src/types';

type SecurityAuditLogInsert = Database['public']['Tables']['security_audit_log']['Insert'];
type KillSwitchEventInsert = Database['public']['Tables']['kill_switch_events']['Insert'];

export class AuditRepository {
  /**
   * Log a security event
   */
  static async logSecurityEvent(event: SecurityAuditLogInsert): Promise<SecurityAuditLog> {
    const { data, error } = await supabaseAdminUntyped
      .from('security_audit_log')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user audit logs
   */
  static async getUserLogs(
    userId: string,
    limit: number = 50
  ): Promise<SecurityAuditLog[]> {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get logs by severity
   */
  static async getLogsBySeverity(
    severity: 'info' | 'warning' | 'critical',
    limit: number = 100
  ): Promise<SecurityAuditLog[]> {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('severity', severity)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Log kill switch event
   */
  static async logKillSwitchEvent(event: KillSwitchEventInsert): Promise<KillSwitchEvent> {
    const { data, error } = await supabaseAdminUntyped
      .from('kill_switch_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user kill switch events
   */
  static async getUserKillSwitchEvents(
    userId: string,
    limit: number = 50
  ): Promise<KillSwitchEvent[]> {
    const { data, error } = await supabase
      .from('kill_switch_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get recent critical events
   */
  static async getRecentCriticalEvents(hours: number = 24): Promise<SecurityAuditLog[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('severity', 'critical')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
