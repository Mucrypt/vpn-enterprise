import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  role: string;
  last_login?: string;
  subscription?: any;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastSuccessfulAuth: number;
  // Core methods
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  // Legacy compatibility methods
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      lastSuccessfulAuth: 0,

      setAuth: (user: User, token: string) => {
        if (typeof window !== 'undefined') {
          // Store token in localStorage as primary storage
          try {
            localStorage.setItem('access_token', token);
          } catch (e) {
            console.warn('Failed to store access token in localStorage:', e);
          }

          // Set cookies for server-side usage and compatibility
          try {
            const cookieOptions = [
              `access_token=${token}`,
              'path=/',
              `max-age=${60 * 60}`, // 1 hour
              'SameSite=Lax',
              ...(window.location.protocol === 'https:' ? ['Secure'] : [])
            ];
            document.cookie = cookieOptions.join('; ');
            
            // Also set user role cookie for middleware compatibility
            if (user.role) {
              const roleCookieOptions = [
                `user_role=${user.role}`,
                'path=/',
                `max-age=${60 * 60}`, // 1 hour
                'SameSite=Lax',
                ...(window.location.protocol === 'https:' ? ['Secure'] : [])
              ];
              document.cookie = roleCookieOptions.join('; ');
            }
          } catch (e) {
            console.warn('Failed to set auth cookies:', e);
          }
        }
        
        set({ 
          user, 
          accessToken: token, 
          isAuthenticated: true,
          isLoading: false,
          lastSuccessfulAuth: Date.now()
        });

        console.debug('[AuthStore] User authenticated:', { 
          userId: user.id, 
          role: user.role,
          timestamp: new Date().toISOString() 
        });
      },

      setAccessToken: (token: string) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('access_token', token);
            
            // Update access token cookie
            const cookieOptions = [
              `access_token=${token}`,
              'path=/',
              `max-age=${60 * 60}`,
              'SameSite=Lax',
              ...(window.location.protocol === 'https:' ? ['Secure'] : [])
            ];
            document.cookie = cookieOptions.join('; ');
          } catch (e) {
            console.warn('Failed to update access token storage:', e);
          }
        }
        
        set({ 
          accessToken: token,
          lastSuccessfulAuth: Date.now()
        });
      },

      setUser: (user: User | null) => {
        set({ 
          user,
          lastSuccessfulAuth: user ? Date.now() : get().lastSuccessfulAuth
        });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          // Clear all storage locations
          try {
            localStorage.removeItem('access_token');
          } catch (e) {
            console.warn('Failed to clear localStorage:', e);
          }

          // Clear all auth-related cookies
          const cookiesToClear = ['access_token', 'refresh_token', 'user_role'];
          cookiesToClear.forEach(cookieName => {
            try {
              document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
            } catch (e) {
              console.warn(`Failed to clear cookie ${cookieName}:`, e);
            }
          });
        }
        
        const previousState = get();
        
        set({ 
          user: null, 
          accessToken: null, 
          isAuthenticated: false,
          isLoading: false 
        });

        console.debug('[AuthStore] Auth cleared', {
          previousUser: previousState.user?.id,
          hadToken: !!previousState.accessToken,
          timestamp: new Date().toISOString()
        });

        // Redirect to login if not already there (with safety check)
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath.startsWith('/auth/');
          const isLoginPage = currentPath === '/auth/login';
          
          if (!isAuthPage && !isLoginPage) {
            console.debug('[AuthStore] Redirecting to login from:', currentPath);
            // Use setTimeout to avoid React state update during render
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 100);
          } else {
            console.debug('[AuthStore] Already on auth page, skipping redirect');
          }
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Legacy compatibility method - alias for clearAuth
      logout: () => {
        console.debug('[AuthStore] Legacy logout method called');
        get().clearAuth();
      }
    }),
    {
      name: 'vpn-enterprise-auth-storage',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastSuccessfulAuth: state.lastSuccessfulAuth,
      }),
      migrate: (persistedState: any, version: number) => {
        console.debug('[AuthStore] Migration running:', { fromVersion: version });
        
        // Handle future migrations if needed
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            lastSuccessfulAuth: persistedState.lastSuccessfulAuth || 0
          };
        }
        
        return persistedState;
      },
      storage: {
        getItem: (name: string) => {
          if (typeof window === 'undefined') return null;
          try {
            const item = localStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.warn('[AuthStore] Failed to get item from storage:', error);
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('[AuthStore] Failed to set item in storage:', error);
          }
        },
        removeItem: (name: string) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('[AuthStore] Failed to remove item from storage:', error);
          }
        },
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[AuthStore] Rehydration error:', error);
          } else {
            console.debug('[AuthStore] Store rehydrated successfully', {
              hasUser: !!state?.user,
              isAuthenticated: state?.isAuthenticated,
              timestamp: new Date().toISOString()
            });
            
            // Sync token from localStorage on rehydration
            if (state && typeof window !== 'undefined') {
              try {
                const storedToken = localStorage.getItem('access_token');
                if (storedToken && !state.accessToken) {
                  console.debug('[AuthStore] Syncing token from localStorage');
                  state.accessToken = storedToken;
                }
              } catch (e) {
                console.warn('[AuthStore] Failed to sync token from localStorage:', e);
              }
            }
          }
        };
      }
    }
  )
);

// Optional: Export helper functions for common auth operations
export const authHelpers = {
  // Check if user has required role
  hasRole: (requiredRole: string | string[]): boolean => {
    const { user } = useAuthStore.getState();
    if (!user) return false;
    
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return requiredRoles.includes(user.role);
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    const { user } = useAuthStore.getState();
    return user ? ['admin', 'super_admin'].includes(user.role) : false;
  },

  // Get current auth state for debugging
  getAuthState: () => {
    const state = useAuthStore.getState();
    return {
      isAuthenticated: state.isAuthenticated,
      userId: state.user?.id,
      userRole: state.user?.role,
      hasToken: !!state.accessToken,
      lastAuth: state.lastSuccessfulAuth,
      age: state.lastSuccessfulAuth ? Date.now() - state.lastSuccessfulAuth : null
    };
  },

  // Validate if auth is still fresh (less than 5 minutes old)
  isAuthFresh: (maxAge: number = 5 * 60 * 1000): boolean => {
    const { lastSuccessfulAuth } = useAuthStore.getState();
    return lastSuccessfulAuth ? Date.now() - lastSuccessfulAuth < maxAge : false;
  }
};

// Dashboard store remains the same
interface DashboardState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedServerId: string | null;
  setSelectedServer: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  selectedServerId: null,
  setSelectedServer: (id) => set({ selectedServerId: id }),
}));