import { supabase, supabaseAdmin } from '@vpn-enterprise/database';
import { AppUser } from '@vpn-enterprise/database';
import type { AppUserRow } from '@vpn-enterprise/database';
import { SubscriptionRepository } from '@vpn-enterprise/database';

export interface AuthUser {
  id: string;
  email: string;
  role: AppUser["role"];
  subscription?: any;
  last_login?: string;
}

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('User creation failed');

    // Wait for user to be created in public.users (trigger should handle this)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create free subscription for new user
    try {
      await SubscriptionRepository.create({
        user_id: data.user.id,
        plan_type: 'free',
        status: 'active',
        max_devices: 1,
        started_at: new Date().toISOString(),
        auto_renew: false,
      });
    } catch (subError) {
      console.warn('Subscription creation warning:', subError);
      // Don't fail signup if subscription creation fails
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      role: 'user', // Default role
    };
  }

  /**
   * Sign in an existing user
   */
  static async signIn(email: string, password: string): Promise<{ user: AuthUser; session: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign in failed');

    // Update last login timestamp
    try {
      await supabaseAdmin
        .from('users')
        // @ts-ignore Supabase generated types are too restrictive for update
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    } catch (e) {
      console.warn('Failed to update last login:', e);
    }

    // Get user subscription and application role
    const subscription = await SubscriptionRepository.getByUserId(data.user.id);

    let appRole: AppUser["role"] = 'user';
    try {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      const userRow = userData as AppUserRow | null;
      if (!userError && userRow && typeof userRow.role === 'string') {
        appRole = userRow.role as AppUser["role"];
      }
    } catch (e) {
      console.warn('Failed to fetch user role:', e);
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      role: appRole,
      subscription,
      last_login: new Date().toISOString(),
    };

    return { user, session: data.session };
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current user session
   */
  static async getSession(): Promise<any> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getUser();
    
    if (!data.user) return null;

    const subscription = await SubscriptionRepository.getByUserId(data.user.id);

    let appRole: AppUser["role"] = 'user';
    try {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      const userRow = userData as AppUserRow | null;
      if (userRow && typeof userRow.role === 'string') {
        appRole = userRow.role as AppUser["role"];
      }
    } catch (e) {
      console.warn('Failed to fetch user role:', e);
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      role: appRole,
      subscription,
    };
  }

  /**
   * Refresh session - simplified version
   */
  static async refreshSession(refreshToken?: string): Promise<any> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Verify token validity
   */
  static async verifyToken(token: string): Promise<boolean> {
    const { data } = await supabase.auth.getUser(token);
    return !!data.user;
  }
}