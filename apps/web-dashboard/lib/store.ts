import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Basic user shape stored in auth state
export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  last_login?: string;
  subscription?: any;
}

// Auth store interface
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  lastSuccessfulAuth: number;
  setAuth: (user: AuthUser | null, token: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void; // alias
}

// Create the auth store with persistence + hydration flag
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      hasHydrated: false,
      lastSuccessfulAuth: 0,

      setAuth: (user, token) => {
        // Update local storage + cookies (best effort)
        if (typeof window !== 'undefined') {
          try {
            if (token) localStorage.setItem('access_token', token);
          } catch (e) {
            console.warn('[AuthStore] Failed to store access token:', e);
          }
          try {
            if (token) {
              const isHttps = window.location.protocol === 'https:'
              const sameSite = isHttps ? 'None' : 'Lax'
              const cookieBits = [
                `access_token=${token}`,
                'path=/',
                `max-age=${60 * 60}`,
                `SameSite=${sameSite}`,
                ...(isHttps ? ['Secure'] : []),
              ]
              document.cookie = cookieBits.join('; ');
            }
            if (user?.role) {
              const isHttps = window.location.protocol === 'https:'
              const sameSite = isHttps ? 'None' : 'Lax'
              const roleBits = [
                `user_role=${user.role}`,
                'path=/',
                `max-age=${60 * 60}`,
                `SameSite=${sameSite}`,
                ...(isHttps ? ['Secure'] : []),
              ]
              document.cookie = roleBits.join('; ');
            }
          } catch (e) {
            console.warn('[AuthStore] Failed to set cookies:', e);
          }
        }
        set({
          user,
          accessToken: token,
          isAuthenticated: !!user && !!token,
          isLoading: false,
          lastSuccessfulAuth: user && token ? Date.now() : get().lastSuccessfulAuth
        });
      },

      setAccessToken: (token) => {
        if (typeof window !== 'undefined') {
          try {
            if (token) localStorage.setItem('access_token', token);
          } catch (e) {
            console.warn('[AuthStore] Failed to update access token:', e);
          }
          try {
            if (token) {
              const isHttps = window.location.protocol === 'https:'
              const sameSite = isHttps ? 'None' : 'Lax'
              const cookieBits = [
                `access_token=${token}`,
                'path=/',
                `max-age=${60 * 60}`,
                `SameSite=${sameSite}`,
                ...(isHttps ? ['Secure'] : []),
              ]
              document.cookie = cookieBits.join('; ');
            }
          } catch (e) {
            console.warn('[AuthStore] Failed to update access cookie:', e);
          }
        }
        set({
          accessToken: token,
          isAuthenticated: !!get().user && !!token,
          lastSuccessfulAuth: token ? Date.now() : get().lastSuccessfulAuth
        });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user && !!get().accessToken,
          lastSuccessfulAuth: user ? Date.now() : get().lastSuccessfulAuth
        });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          try { localStorage.removeItem('access_token'); } catch {}
          ['access_token', 'user_role', 'refresh_token'].forEach(name => {
            try {
              document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
            } catch {}
          });
        }
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      logout: () => get().clearAuth()
    }),
    {
      name: 'vpn-enterprise-auth-storage',
      version: 1,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastSuccessfulAuth: state.lastSuccessfulAuth
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          // Mark hydrated after rehydrate pass
          useAuthStore.setState({ hasHydrated: true, isLoading: false });
        }
      }
    }
  )
);

// Convenience helpers
export const authHelpers = {
  hasRole: (required: string | string[]) => {
    const { user } = useAuthStore.getState();
    if (!user?.role) return false;
    const list = Array.isArray(required) ? required : [required];
    return list.includes(user.role);
  },
  isAdmin: () => {
    const { user } = useAuthStore.getState();
    if (!user?.role) return false;
    const role = user.role.toLowerCase();
    return ['admin', 'super_admin', 'superadmin'].includes(role);
  },
  getAuthState: () => {
    const s = useAuthStore.getState();
    return {
      isAuthenticated: s.isAuthenticated,
      userId: s.user?.id,
      role: s.user?.role,
      hasToken: !!s.accessToken,
      hydrated: s.hasHydrated
    };
  }
};

// Simple dashboard UI store (unchanged pattern)
interface DashboardState {
  sidebarOpen: boolean;
  selectedServerId: string | null;
  toggleSidebar: () => void;
  setSelectedServer: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Start with sidebar closed on mobile (< 768px), open on desktop
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  selectedServerId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSelectedServer: (id) => set({ selectedServerId: id })
}));