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
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      // Track a lastSuccessfulAuth timestamp to avoid immediate logout
      // after a fresh login/hydration which can be triggered by HMR or
      // brief cookie races in development. This is defensive and only
      // skips logout if the last successful setUser was very recent.
      lastSuccessfulAuth: 0 as number,
      setUser: (user) => set((state: any) => {
        return { ...state, user, lastSuccessfulAuth: Date.now() };
      }),
      setAccessToken: (accessToken) => {
        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
        } else {
          localStorage.removeItem('access_token');
        }
        set((state: any) => ({ ...state, accessToken, lastSuccessfulAuth: accessToken ? Date.now() : state.lastSuccessfulAuth }));
      },
      logout: () => {
        // Debug: trace when logout is triggered to help find the caller
        try {
          console.debug('AuthStore.logout called at', new Date().toISOString());
          console.trace();
        } catch (e) {
          // ignore console errors in hostile environments
        }
        // If we just successfully authenticated within the last few
        // seconds, skip the logout to avoid an immediate bounce caused by
        // races (HMR, cookie being set slightly later, etc). This is a
        // defensive measure for development workflows.
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const _state = (require('./store') as any).useAuthStore?.getState?.() as any;
          const last = _state?.lastSuccessfulAuth || 0;
          if (Date.now() - last < 5000) {
            console.debug('AuthStore.logout: skipping because lastSuccessfulAuth was recent', Date.now() - last);
            return;
          }
        } catch (e) {
          // ignore errors when trying to read state
        }
        localStorage.removeItem('access_token');
        // Clear cookie
        document.cookie = 'access_token=; path=/; max-age=0';
        set({ user: null, accessToken: null });
        // Redirect to login unless we're already on the login page (prevents
        // a redirect loop when logout is triggered repeatedly while already
        // on the login route).
        try {
          if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login';
          } else {
            console.debug('logout: already on /auth/login, skipping redirect');
          }
        } catch (e) {
          // If accessing window fails for some reason, fall back to setting
          // location (best-effort). This is very defensive for SSR edge-cases.
          try {
            // eslint-disable-next-line no-undef
            window.location.href = '/auth/login';
          } catch (err) {
            // ignore
          }
        }
      },
    }),
    {
      name: 'auth-storage',
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
