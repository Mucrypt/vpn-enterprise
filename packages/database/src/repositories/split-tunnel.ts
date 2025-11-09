import { supabase, supabaseAdmin, supabaseAdminUntyped } from '@vpn-enterprise/database/src/client';
import { Database, SplitTunnelRule, Platform } from '@vpn-enterprise/database/src/types';

type SplitTunnelRuleInsert = Database['public']['Tables']['split_tunnel_rules']['Insert'];
type SplitTunnelRuleUpdate = Database['public']['Tables']['split_tunnel_rules']['Update'];

export class SplitTunnelRepository {
  /**
   * Get all split tunnel rules for a user
   */
  static async getUserRules(userId: string, platform?: Platform): Promise<SplitTunnelRule[]> {
    let query = supabase
      .from('split_tunnel_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (platform) {
      query = query.or(`platform.eq.${platform},platform.eq.all`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new split tunnel rule
   */
  static async create(rule: SplitTunnelRuleInsert): Promise<SplitTunnelRule> {
    const { data, error } = await supabaseAdminUntyped
      .from('split_tunnel_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a split tunnel rule
   */
  static async update(ruleId: string, updates: SplitTunnelRuleUpdate): Promise<SplitTunnelRule> {
    const { data, error } = await supabaseAdminUntyped
      .from('split_tunnel_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a split tunnel rule
   */
  static async delete(ruleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('split_tunnel_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  }

  /**
   * Toggle rule active status
   */
  static async toggleActive(ruleId: string, isActive: boolean): Promise<SplitTunnelRule> {
    const { data, error } = await supabaseAdminUntyped
      .from('split_tunnel_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get rules by type
   */
  static async getRulesByType(
    userId: string,
    ruleType: 'app' | 'domain' | 'ip'
  ): Promise<SplitTunnelRule[]> {
    const { data, error } = await supabase
      .from('split_tunnel_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('rule_type', ruleType)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Bulk create rules
   */
  static async bulkCreate(rules: SplitTunnelRuleInsert[]): Promise<SplitTunnelRule[]> {
    const { data, error } = await supabaseAdminUntyped
      .from('split_tunnel_rules')
      .insert(rules)
      .select();

    if (error) throw error;
    return data || [];
  }
}
