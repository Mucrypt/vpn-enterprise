import { supabase, supabaseAdmin, supabaseAdminUntyped } from '@vpn-enterprise/database';
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
   * Normalize role for consistent comparison
   */
  private static normalizeRole(role: string | undefined | null): AppUser["role"] {
    if (!role) return 'user';
    
    const normalized = role.toLowerCase().replace(/[\s\-_]/g, '');
    
    // Map common role variations to standard roles
    if (normalized.includes('superadmin') || normalized.includes('super_admin')) {
      return 'super_admin';
    } else if (normalized.includes('admin') || normalized.includes('administrator')) {
      return 'admin';
    } else if (normalized.includes('viewer') || normalized.includes('readonly')) {
      return 'user'; // fallback to 'user' if 'viewer' is not a valid AppUserRole
    }
    
    return 'user'; // Default role
  }

  /**
   * Get user role from database with proper error handling
   */
  private static async getUserRoleFromDatabase(userId: string): Promise<AppUser["role"]> {
    try {
      const { data: userData, error } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('[AuthService] Database error fetching user role:', error);
        return 'user'; // Default role on error
      }

      if (!userData) {
        console.warn('[AuthService] User not found in database:', userId);
        return 'user'; // Default role if user not found
      }

      // Handle different possible response formats
      const userRow = userData as any;
      let roleValue: string | undefined;

      if (typeof userRow === 'object' && userRow !== null) {
        // Try different possible role property names
        roleValue = userRow.role || userRow.user_role || userRow.role_type;
      }

      if (roleValue && typeof roleValue === 'string') {
        return this.normalizeRole(roleValue);
      }

      console.warn('[AuthService] Invalid or missing role for user:', userId, { userData });
      return 'user'; // Default role if invalid format
    } catch (error) {
      console.error('[AuthService] Unexpected error fetching user role:', error);
      return 'user'; // Default role on unexpected error
    }
  }

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
    // Retry mechanism for database propagation
    let retries = 3;
    while (retries > 0) {
      try {
        const userRole = await this.getUserRoleFromDatabase(data.user.id);
        if (userRole) {
          break; // User found in database, continue
        }
      } catch (e) {
        // User might not be propagated to database yet
        console.log(`[AuthService] Waiting for user propagation (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
    }

    // Create free subscription for new user in both tables
    try {
      // Legacy table (for backward compatibility)
      await SubscriptionRepository.create({
        user_id: data.user.id,
        plan_type: 'free',
        status: 'active',
        max_devices: 1,
        started_at: new Date().toISOString(),
        auto_renew: false,
      });

      // New service_subscriptions table with credits
      await (supabaseAdminUntyped as any).from('service_subscriptions').insert({
        user_id: data.user.id,
        tier_name: 'free',
        tier_price: 0,
        monthly_credits: 100,
        credits_remaining: 100,
        purchased_credits_balance: 0,
        vpn_enabled: true,
        database_enabled: true,
        nexusai_enabled: true,
        hosting_enabled: true,
        status: 'active',
      });
    } catch (subError) {
      console.warn('[AuthService] Subscription creation warning:', subError);
      // Don't fail signup if subscription creation fails
    }

    const userRole = await this.getUserRoleFromDatabase(data.user.id);

    return {
      id: data.user.id,
      email: data.user.email!,
      role: userRole,
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
      await (supabaseAdmin as any)
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user.id);
    } catch (e) {
      console.warn('[AuthService] Failed to update last login:', e);
    }

    // Get user subscription and application role in parallel for better performance
    const [subscription, appRole] = await Promise.all([
      SubscriptionRepository.getByUserId(data.user.id).catch(error => {
        console.warn('[AuthService] Failed to fetch subscription:', error);
        return undefined;
      }),
      this.getUserRoleFromDatabase(data.user.id)
    ]);

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      role: appRole,
      subscription,
      last_login: new Date().toISOString(),
    };

    console.log('[AuthService] User signed in successfully:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      hasSubscription: !!subscription
    });

    return { user, session: data.session };
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthService] Sign out error:', error);
      throw error;
    }
    console.log('[AuthService] User signed out successfully');
  }

  /**
   * Get current user session
   */
  static async getSession(): Promise<any> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[AuthService] Get session error:', error);
      throw error;
    }
    return data.session;
  }

  /**
   * Get current user with proper role handling
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn('[AuthService] Get current user error:', error);
      return null;
    }

    if (!data.user) return null;

    // Get user data in parallel for better performance
    const [subscription, appRole] = await Promise.all([
      SubscriptionRepository.getByUserId(data.user.id).catch(error => {
        console.warn('[AuthService] Failed to fetch subscription:', error);
        return undefined;
      }),
      this.getUserRoleFromDatabase(data.user.id)
    ]);

    return {
      id: data.user.id,
      email: data.user.email!,
      role: appRole,
      subscription,
    };
  }

  /**
   * Refresh session with role synchronization
   */
  static async refreshSession(refreshToken?: string): Promise<any> {
    // Prefer explicit refresh token when provided (server-side cookie flow)
    const { data, error } = refreshToken
      ? await (supabase as any).auth.refreshSession({ refresh_token: refreshToken })
      : await (supabase as any).auth.refreshSession();
    
    if (error) {
      console.error('[AuthService] Refresh session error:', error);
      throw error;
    }

    if (data.session?.user?.id) {
      // Update user role in the session if needed
      try {
        const currentRole = await this.getUserRoleFromDatabase(data.session.user.id);
        console.log('[AuthService] Session refreshed with role:', currentRole);
      } catch (roleError) {
        console.warn('[AuthService] Failed to fetch role during refresh:', roleError);
      }
    }

    return data.session;
  }

  /**
   * Verify token validity and get user info
   */
  static async verifyToken(token: string): Promise<{ isValid: boolean; user?: AuthUser }> {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        console.warn('[AuthService] Token verification failed:', error);
        return { isValid: false };
      }

      const appRole = await this.getUserRoleFromDatabase(data.user.id);

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        role: appRole,
      };

      return { 
        isValid: true, 
        user 
      };
    } catch (error) {
      console.error('[AuthService] Token verification error:', error);
      return { isValid: false };
    }
  }

  /**
   * Update user role (admin function)
   */
  static async updateUserRole(userId: string, newRole: AppUser["role"]): Promise<void> {
    try {
      const { error } = await (supabaseAdmin as any)
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('[AuthService] Update user role error:', error);
        throw new Error(`Failed to update user role: ${error.message}`);
      }

      console.log('[AuthService] User role updated:', { userId, newRole });
    } catch (error) {
      console.error('[AuthService] Update user role failed:', error);
      throw error;
    }
  }

  /**
   * Check if user has admin privileges
   */
  static isAdmin(user: AuthUser): boolean {
    const normalizedRole = this.normalizeRole(user.role);
    return normalizedRole === 'admin' || normalizedRole === 'super_admin';
  }

  /**
   * Check if user has specific role
   */
  static hasRole(user: AuthUser, requiredRole: AppUser["role"] | AppUser["role"][]): boolean {
    const userRole = this.normalizeRole(user.role);
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    return requiredRoles.some(role => 
      this.normalizeRole(role) === userRole
    );
  }
}