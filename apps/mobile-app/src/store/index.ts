/**
 * VPN Enterprise Mobile - Global State Management
 * Zustand store for managing app state
 */

import { create } from 'zustand';
import { 
  Server, 
  VPNConnection, 
  ConnectionStatus, 
  UserDevice, 
  SecuritySettings,
  UserStats,
  UserPreferences,
  ConnectionMetrics 
} from '@/src/types/vpn';
import { SecurityDashboard } from '@/src/types/security';

// Simple storage wrapper using async storage
const storage = {
  set: (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  getString: (key: string): string | undefined => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key) || undefined;
    }
    return undefined;
  },
  delete: (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

// ============================================
// AUTH STORE
// ============================================

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  accessToken: string | null;
  biometricEnabled: boolean;
  setAuth: (user: any, token: string) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  biometricEnabled: false,

  setAuth: (user, token) => {
    storage.set('user', JSON.stringify(user));
    storage.set('accessToken', token);
    set({ isAuthenticated: true, user, accessToken: token });
  },

  clearAuth: () => {
    storage.delete('user');
    storage.delete('accessToken');
    storage.delete('biometricEnabled');
    set({ isAuthenticated: false, user: null, accessToken: null, biometricEnabled: false });
  },

  login: async (email, password) => {
    // TODO: Integrate with Supabase Auth
    // Mock login for now
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockUser = { id: '1', email, full_name: 'Demo User' };
    const mockToken = 'mock-jwt-token';
    storage.set('user', JSON.stringify(mockUser));
    storage.set('accessToken', mockToken);
    set({ isAuthenticated: true, user: mockUser, accessToken: mockToken });
  },

  signup: async (email, password, fullName) => {
    // TODO: Integrate with Supabase Auth
    // Mock signup for now
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockUser = { id: '1', email, full_name: fullName || 'New User' };
    const mockToken = 'mock-jwt-token';
    storage.set('user', JSON.stringify(mockUser));
    storage.set('accessToken', mockToken);
    set({ isAuthenticated: true, user: mockUser, accessToken: mockToken });
  },

  setBiometricEnabled: (enabled) => {
    storage.set('biometricEnabled', enabled.toString());
    set({ biometricEnabled: enabled });
  },

  hydrate: () => {
    const user = storage.getString('user');
    const token = storage.getString('accessToken');
    const biometric = storage.getString('biometricEnabled');
    if (user && token) {
      set({ 
        isAuthenticated: true, 
        user: JSON.parse(user), 
        accessToken: token,
        biometricEnabled: biometric === 'true'
      });
    }
  },
}));

// ============================================
// VPN CONNECTION STORE
// ============================================

interface VPNState {
  // Connection state
  connection: VPNConnection | null;
  status: ConnectionStatus;
  currentServer: Server | null;
  
  // Metrics
  metrics: ConnectionMetrics | null;
  
  // Actions
  setConnection: (connection: VPNConnection | null) => void;
  setStatus: (status: ConnectionStatus) => void;
  setCurrentServer: (server: Server | null) => void;
  updateMetrics: (metrics: ConnectionMetrics) => void;
  disconnect: () => void;
}

export const useVPNStore = create<VPNState>((set) => ({
  connection: null,
  status: 'disconnected',
  currentServer: null,
  metrics: null,

  setConnection: (connection) => set({ connection }),
  setStatus: (status) => set({ status }),
  setCurrentServer: (server) => set({ currentServer: server }),
  updateMetrics: (metrics) => set({ metrics }),
  
  disconnect: () => set({ 
    connection: null, 
    status: 'disconnected', 
    currentServer: null,
    metrics: null 
  }),
}));

// ============================================
// SERVERS STORE
// ============================================

interface ServersState {
  servers: Server[];
  favoriteServers: string[];
  recentServers: string[];
  recommendedServer: Server | null;
  
  setServers: (servers: Server[]) => void;
  toggleFavorite: (serverId: string) => void;
  addRecentServer: (serverId: string) => void;
  setRecommendedServer: (server: Server | null) => void;
  getServerById: (id: string) => Server | undefined;
}

export const useServersStore = create<ServersState>((set, get) => ({
  servers: [
    // Initial mock servers for offline testing
    {
      id: '1',
      name: 'New York - US East',
      country: 'United States',
      city: 'New York',
      latitude: 40.7128,
      longitude: -74.0060,
      location: '40.7128,-74.0060',
      endpoint: '192.168.1.100:51820',
      publicKey: 'mock-key-1',
      load: 45,
      maxClients: 1000,
      currentClients: 450,
      ping: 12,
      bandwidth: 1000,
      status: 'online' as const,
      features: ['streaming', 'p2p'] as const,
      performanceScore: 95,
      recommendationScore: 0,
    },
    {
      id: '2',
      name: 'London - UK',
      country: 'United Kingdom',
      city: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      location: '51.5074,-0.1278',
      endpoint: '192.168.1.101:51820',
      publicKey: 'mock-key-2',
      load: 32,
      maxClients: 1000,
      currentClients: 320,
      ping: 25,
      bandwidth: 1000,
      status: 'online' as const,
      features: ['streaming'] as const,
      performanceScore: 88,
      recommendationScore: 0,
    },
    {
      id: '3',
      name: 'Tokyo - Japan',
      country: 'Japan',
      city: 'Tokyo',
      latitude: 35.6762,
      longitude: 139.6503,
      location: '35.6762,139.6503',
      endpoint: '192.168.1.102:51820',
      publicKey: 'mock-key-3',
      load: 58,
      maxClients: 1000,
      currentClients: 580,
      ping: 95,
      bandwidth: 1000,
      status: 'online' as const,
      features: ['p2p'] as const,
      performanceScore: 82,
      recommendationScore: 0,
    },
  ],
  favoriteServers: JSON.parse(storage.getString('favoriteServers') || '[]'),
  recentServers: JSON.parse(storage.getString('recentServers') || '[]'),
  recommendedServer: null,

  setServers: (servers) => set({ servers }),

  toggleFavorite: (serverId) => {
    const { favoriteServers } = get();
    const newFavorites = favoriteServers.includes(serverId)
      ? favoriteServers.filter((id) => id !== serverId)
      : [...favoriteServers, serverId];
    
    storage.set('favoriteServers', JSON.stringify(newFavorites));
    set({ favoriteServers: newFavorites });
  },

  addRecentServer: (serverId) => {
    const { recentServers } = get();
    const newRecent = [serverId, ...recentServers.filter((id) => id !== serverId)].slice(0, 5);
    storage.set('recentServers', JSON.stringify(newRecent));
    set({ recentServers: newRecent });
  },

  setRecommendedServer: (server) => set({ recommendedServer: server }),

  getServerById: (id) => {
    const { servers } = get();
    return servers.find((s) => s.id === id);
  },
}));

// ============================================
// SECURITY STORE
// ============================================

interface SecurityState {
  settings: SecuritySettings;
  dashboard: SecurityDashboard;
  threatsBlockedToday: number;
  
  updateSettings: (settings: Partial<SecuritySettings>) => void;
  setDashboard: (dashboard: SecurityDashboard) => void;
  updateDashboard: (updates: Partial<SecurityDashboard>) => void;
  incrementThreatsBlocked: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  settings: {
    killSwitchEnabled: true,
    autoConnectEnabled: false,
    biometricLockEnabled: true,
    dnsLeakProtectionEnabled: true,
    ipv6LeakProtectionEnabled: true,
    splitTunnelingEnabled: false,
    threatProtectionEnabled: true,
    cybersecEnabled: true,
  },
  dashboard: {
    securityScore: 85,
    activeThreats: 0,
    blockedToday: 12,
    protectedData: 1024 * 1024 * 500, // 500 MB
    riskLevel: 'safe',
    lastScan: new Date(),
    recommendations: [],
    killSwitch: true,
    dnsLeakProtection: true,
    ipv6Protection: true,
    autoConnect: false,
    threatsBlocked: 234,
    maliciousSitesBlocked: 45,
    trackersBlocked: 156,
    adsBlocked: 33,
    splitTunnelApps: [],
    lastSecurityScan: new Date(),
  },
  threatsBlockedToday: 0,

  updateSettings: (newSettings) => {
    const { settings } = get();
    const updated = { ...settings, ...newSettings };
    storage.set('securitySettings', JSON.stringify(updated));
    set({ settings: updated });
  },

  setDashboard: (dashboard) => set({ dashboard }),

  updateDashboard: (updates) => {
    const { dashboard } = get();
    const updated = { ...dashboard, ...updates };
    set({ dashboard: updated });
  },

  incrementThreatsBlocked: () => {
    const { threatsBlockedToday } = get();
    set({ threatsBlockedToday: threatsBlockedToday + 1 });
  },
}));

// ============================================
// USER STATS STORE
// ============================================

interface StatsState {
  stats: UserStats;
  devices: UserDevice[];
  
  setStats: (stats: UserStats) => void;
  updateStats: (updates: Partial<UserStats>) => void;
  setDevices: (devices: UserDevice[]) => void;
}

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: {
    totalDataSaved: 1024 * 1024 * 120, // 120 MB
    totalDataUsed: 1024 * 1024 * 1024 * 4.5, // 4.5 GB
    dataUploaded: 1024 * 1024 * 800, // 800 MB
    dataDownloaded: 1024 * 1024 * 1024 * 3.7, // 3.7 GB
    threatsBlocked: 234,
    countriesVisited: ['US', 'UK', 'JP'],
    totalConnections: 45,
    totalConnectionTime: 3600 * 28, // 28 hours
    averageSessionDuration: 3600 * 1.5, // 1.5 hours
    averageSpeed: 85.5,
    peakSpeed: 142.3,
    averageLatency: 35,
    dataSaved: 1024 * 1024 * 120, // 120 MB
    securityScore: 92,
    achievements: [],
  },
  devices: [],

  setStats: (stats) => set({ stats }),
  
  updateStats: (updates) => {
    const { stats } = get();
    const updated = { ...stats, ...updates };
    set({ stats: updated });
  },
  
  setDevices: (devices) => set({ devices }),
}));

// ============================================
// PREFERENCES STORE
// ============================================

interface PreferencesState {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: {
    autoConnect: false,
    autoSelectServer: true,
    preferredProtocol: 'wireguard',
    preferredCountries: [],
    notificationsEnabled: true,
    hapticFeedbackEnabled: true,
    darkModeEnabled: true,
    dataUsageWarnings: true,
  },

  updatePreferences: (newPrefs) => {
    const { preferences } = get();
    const updated = { ...preferences, ...newPrefs };
    storage.set('preferences', JSON.stringify(updated));
    set({ preferences: updated });
  },
}));

// Hydrate auth store on app start
export const hydrateStores = () => {
  useAuthStore.getState().hydrate();
  
  // Hydrate security settings
  const savedSettings = storage.getString('securitySettings');
  if (savedSettings) {
    useSecurityStore.getState().updateSettings(JSON.parse(savedSettings));
  }
  
  // Hydrate preferences
  const savedPrefs = storage.getString('preferences');
  if (savedPrefs) {
    usePreferencesStore.setState({ preferences: JSON.parse(savedPrefs) });
  }
};
