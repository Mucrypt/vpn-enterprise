import { supabase } from '@vpn-enterprise/database';
import { SubscriptionRepository } from '@vpn-enterprise/database';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  subscription?: any;
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

    // Create free subscription for new user
    // Wait a bit for the trigger to create the public.users record
    try {
      // Retry logic for subscription creation (trigger might take a moment)
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await SubscriptionRepository.create({
            user_id: data.user.id,
            plan_type: 'free',
            status: 'trial',
            max_devices: 1,
            started_at: new Date().toISOString(),
            auto_renew: false,
          });
          break; // Success!
        } catch (subError: any) {
          attempts++;
          if (attempts < maxAttempts) {
            // Wait 500ms before retry (gives trigger time to complete)
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.error('Failed to create subscription after retries:', subError);
          }
        }
      }
    } catch (err) {
      console.error('Subscription creation error:', err);
      // Don't fail signup if subscription creation fails
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      role: data.user.role,
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

    // Get user subscription
    const subscription = await SubscriptionRepository.getByUserId(data.user.id);

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      role: data.user.role,
      subscription,
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
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    if (!data.user) return null;

    const subscription = await SubscriptionRepository.getByUserId(data.user.id);

    return {
      id: data.user.id,
      email: data.user.email!,
      role: data.user.role,
      subscription,
    };
  }

  /**
   * Refresh session
   */
  static async refreshSession(refreshToken?: string): Promise<any> {
    // If a refresh token is provided, pass it to supabase to exchange for a new session.
    const opts = refreshToken ? { refresh_token: refreshToken } : undefined;
    const { data, error } = await supabase.auth.refreshSession(opts as any);
    if (error) throw error;
    return data.session;
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL}/auth/reset-password`,
    });
    if (error) throw error;
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  /**
   * Verify if user has active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    return await SubscriptionRepository.isActive(userId);
  }
}
