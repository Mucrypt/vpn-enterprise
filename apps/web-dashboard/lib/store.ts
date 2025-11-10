import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  lastSuccessfulAuth: number;
  setUser: (user: User | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      lastSuccessfulAuth: 0,
      setUser: (user: User | null) => set((state) => ({ ...state, user, lastSuccessfulAuth: Date.now() })),
      setAccessToken: (accessToken: string | null) => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try {
            if (accessToken) {
              localStorage.setItem('access_token', accessToken);
            } else {
              localStorage.removeItem('access_token');
            }
          } catch (e) {
            // ignore storage errors
          }
        }
        set((state) => ({ ...state, accessToken, lastSuccessfulAuth: accessToken ? Date.now() : state.lastSuccessfulAuth }));
      },
      logout: () => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try {
            localStorage.removeItem('access_token');
          } catch (e) {
            // ignore
          }
        }
        try {
          document.cookie = 'access_token=; path=/; max-age=0';
        } catch (e) {
          // ignore
        }
        set({ user: null, accessToken: null });
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/login')) {
          window.location.href = '/auth/login';
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist serializable state (user, lastSuccessfulAuth)
      partialize: (state) => ({
        user: state.user,
        lastSuccessfulAuth: state.lastSuccessfulAuth,
      }),
      storage: {
        getItem: (name: string) => {
          if (typeof window === 'undefined') return null;
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name: string, value: any) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(name);
        },
      },
    }
  )
);

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
