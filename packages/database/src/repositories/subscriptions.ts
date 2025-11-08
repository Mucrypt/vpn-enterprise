import { supabase, supabaseAdmin, supabaseAdminUntyped } from '../client';
import { Database } from '../types';

type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];
type UserSubscriptionInsert = Database['public']['Tables']['user_subscriptions']['Insert'];
type UserSubscriptionUpdate = Database['public']['Tables']['user_subscriptions']['Update'];

export class SubscriptionRepository {
  /**
   * Get user subscription
   */
  static async getByUserId(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }

  /**
   * Create subscription for user
   */
  static async create(subscription: UserSubscriptionInsert): Promise<UserSubscription> {
    const { data, error } = await supabaseAdminUntyped
      .from('user_subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user subscription
   */
  static async update(
    userId: string,
    updates: UserSubscriptionUpdate
  ): Promise<UserSubscription> {
    const { data, error } = await supabaseAdminUntyped
      .from('user_subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if subscription is active
   */
  static async isActive(userId: string): Promise<boolean> {
    const subscription = await this.getByUserId(userId);
    
    if (!subscription) return false;
    
    if (subscription.status !== 'active') return false;
    
    if (subscription.expires_at) {
      const expirationDate = new Date(subscription.expires_at);
      if (expirationDate < new Date()) return false;
    }
    
    return true;
  }

  /**
   * Get expiring subscriptions (for renewal reminders)
   */
  static async getExpiringSoon(days: number = 7): Promise<UserSubscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('expires_at', futureDate.toISOString())
      .gte('expires_at', new Date().toISOString());

    if (error) throw error;
    return data || [];
  }

  /**
   * Cancel subscription
   */
  static async cancel(userId: string): Promise<void> {
    const { error } = await supabaseAdminUntyped
      .from('user_subscriptions')
      .update({ status: 'cancelled', auto_renew: false })
      .eq('user_id', userId);

    if (error) throw error;
  }
}
