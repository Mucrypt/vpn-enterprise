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
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => {
        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
        } else {
          localStorage.removeItem('access_token');
        }
        set({ accessToken });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        // Clear cookie
        document.cookie = 'access_token=; path=/; max-age=0';
        set({ user: null, accessToken: null });
        // Redirect to login
        window.location.href = '/auth/login';
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
