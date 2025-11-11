// Determine API base at runtime
const DEFAULT_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// Always use backend API URL for both SSR and browser in local dev
const API_BASE_URL = DEFAULT_API;

// Single-flight refresh promise
let refreshPromise: Promise<string | null> | null = null;

class APIClient {
  // ==================== SECURITY EVENTS ENDPOINT ====================
  getSecurityEvents() {
    // Backend returns { events: [...] }
    return this.fetchAPI('/admin/security/events').then((res) => res?.events || []);
  }
  // ==================== SECURITY ENDPOINT ====================
  getAuditLogs(filters?: { severity?: string }) {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
    // Backend returns { logs: [...] }
    return this.fetchAPI(`/admin/audit/logs${queryParams}`).then((res) => res?.logs || []);
  }
  // ==================== ANALYTICS ENDPOINT ====================
  getConnections() {
    return this.fetchAPI('/connections');
  }
  // ==================== CLIENTS ENDPOINT ====================
  getUsers() {
    return this.fetchAPI('/users');
  }
 private async refreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<string | null> => {
    try {
      console.debug('[APIClient] Attempting token refresh');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('[APIClient] Token refresh failed:', response.status);
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.session?.access_token;

      if (newAccessToken) {
        // Update token in store and localStorage
        this.updateTokenStorage(newAccessToken);
        console.debug('[APIClient] Token refresh successful');
        return newAccessToken;
      }

      return null;
    } catch (error) {
      console.error('[APIClient] Token refresh error:', error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      // Try to get from store first
      const { useAuthStore } = require('./store');
      return useAuthStore.getState().accessToken;
    } catch (e) {
      // Fallback to localStorage
      return localStorage.getItem('access_token');
    }
  }

  private updateTokenStorage(token: string): void {
    if (typeof window === 'undefined') return;

    try {
      // Update store
      const { useAuthStore } = require('./store');
      useAuthStore.getState().setAccessToken(token);
    } catch (e) {
      // Fallback to localStorage
      localStorage.setItem('access_token', token);
    }

    // Always set as cookie for server-side usage
    try {
      document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    } catch (e) {
      // Ignore cookie errors
    }
  }

  private async handleLogout(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const { useAuthStore } = require('./store');
      useAuthStore.getState().logout();
    } catch (e) {
      // Fallback cleanup
      localStorage.removeItem('access_token');
      document.cookie = 'access_token=; path=/; max-age=0';
      document.cookie = 'refresh_token=; path=/; max-age=0';
      document.cookie = 'user_role=; path=/; max-age=0';
      
      if (!window.location.pathname.startsWith('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getToken();

    // Always set cookie before request to ensure backend sees it
    if (typeof window !== 'undefined' && token) {
      try {
        document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
      } catch (e) {
        // Ignore cookie errors
      }
    }

    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    let response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);

    // Handle 401 - token expired
    if (response.status === 401 && token) {
      console.debug('[APIClient] Token expired, attempting refresh');

      const newToken = await this.refreshToken();
      if (newToken) {
        // Retry with new token
        if (typeof window !== 'undefined') {
          try {
            document.cookie = `access_token=${newToken}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
          } catch (e) {}
        }
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config);
      } else {
        // Refresh failed, logout user
        await this.handleLogout();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  }

  async fetchAPI<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.request(endpoint, options);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody?.message || errorBody?.error || response.statusText || 'API request failed';
      
      const error = new Error(`${response.status} ${response.statusText} - ${errorMessage}`);
      (error as any).status = response.status;
      (error as any).body = errorBody;
      
      throw error;
    }

    return response.json();
  }

  // ==================== AUTH ENDPOINTS ====================
  async signUp(email: string, password: string) {
    return this.fetchAPI('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.fetchAPI('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshSession() {
    return this.fetchAPI('/auth/refresh', {
      method: 'POST',
    });
  }

  // ==================== PUBLIC ENDPOINTS ====================
  getServers() {
    return this.fetchAPI('/servers');
  }

  getVPNConfigs(userId: string) {
    return this.fetchAPI(`/vpn/configs?userId=${encodeURIComponent(userId)}`);
  }

  getVPNUsage(userId: string) {
    return this.fetchAPI(`/vpn/usage?userId=${encodeURIComponent(userId)}`);
  }

  // ==================== USER ENDPOINTS ====================
  getProfile() {
    return this.fetchAPI('/user/profile');
  }

  updateProfile(data: any) {
    return this.fetchAPI('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  getSubscription() {
    return this.fetchAPI('/user/subscription');
  }

  getDevices() {
    return this.fetchAPI('/user/devices');
  }

  addDevice(data: any) {
    return this.fetchAPI('/user/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteDevice(id: string) {
    return this.fetchAPI(`/user/devices/${id}`, {
      method: 'DELETE',
    });
  }

  getUserStats() {
    return this.fetchAPI('/user/stats');
  }

  // ==================== SECURITY ENDPOINTS ====================
  getSecuritySettings() {
    return this.fetchAPI('/user/security/settings');
  }

  updateSecuritySettings(data: any) {
    return this.fetchAPI('/user/security/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  getSessions() {
    return this.fetchAPI('/user/sessions');
  }

  revokeSession(sessionId: string) {
    return this.fetchAPI(`/user/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  enable2FA() {
    return this.fetchAPI('/user/security/2fa/enable', {
      method: 'POST',
    });
  }

  disable2FA(code: string) {
    return this.fetchAPI('/user/security/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  changePassword(data: any) {
    return this.fetchAPI('/user/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== VPN ENDPOINTS ====================
  connect(serverId: string) {
    return this.fetchAPI('/vpn/connect', {
      method: 'POST',
      body: JSON.stringify({ serverId }),
    });
  }

  disconnect(connectionId: string) {
    return this.fetchAPI('/vpn/disconnect', {
      method: 'POST',
      body: JSON.stringify({ connectionId }),
    });
  }

  getConnectionHistory() {
    return this.fetchAPI('/user/connections/history');
  }

  getDataUsage() {
    return this.fetchAPI('/user/connections/data-usage');
  }

  // ==================== SPLIT TUNNEL ENDPOINTS ====================
  getSplitTunnelRules() {
    return this.fetchAPI('/user/split-tunnel');
  }

  createSplitTunnelRule(data: any) {
    return this.fetchAPI('/user/split-tunnel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateSplitTunnelRule(id: string, data: any) {
    return this.fetchAPI(`/user/split-tunnel/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteSplitTunnelRule(id: string) {
    return this.fetchAPI(`/user/split-tunnel/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== NOTIFICATION ENDPOINTS ====================
  getNotifications(params?: { limit?: number }) {
    const queryParams = params ? `?${new URLSearchParams(params as any)}` : '';
    return this.fetchAPI(`/user/notifications${queryParams}`);
  }

  markNotificationRead(id: string) {
    return this.fetchAPI(`/user/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  markAllNotificationsRead() {
    return this.fetchAPI('/user/notifications/read-all', {
      method: 'PUT',
    });
  }

  deleteNotification(id: string) {
    return this.fetchAPI(`/user/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  getNotificationSettings() {
    return this.fetchAPI('/user/notifications/settings');
  }

  updateNotificationSettings(data: any) {
    return this.fetchAPI('/user/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== ADMIN ENDPOINTS ====================
  getAdminStatistics() {
    return this.fetchAPI('/admin/statistics');
  }

  getAdminUsers() {
    return this.fetchAPI('/admin/users');
  }

  getAdminAuditLogs(filters?: { severity?: string }) {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.fetchAPI(`/admin/audit-logs${queryParams}`);
  }

  getAdminSecurityEvents() {
    return this.fetchAPI('/admin/security/events');
  }

  setUserEncryption(userId: string, protocolId: string) {
    return this.fetchAPI(`/admin/users/${userId}/encryption`, {
      method: 'PUT',
      body: JSON.stringify({ protocol_id: protocolId }),
    });
  }

  // ==================== ADMIN SERVER ENDPOINTS ====================
  getAdminServer(id: string) {
    return this.fetchAPI(`/admin/servers/${id}`);
  }

  createAdminServer(data: any) {
    return this.fetchAPI('/admin/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateAdminServer(id: string, data: any) {
    return this.fetchAPI(`/admin/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteAdminServer(id: string) {
    return this.fetchAPI(`/admin/servers/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== ADMIN VPN CLIENT ENDPOINTS ====================
  createAdminVPNClient(data: any) {
    return this.fetchAPI('/admin/vpn/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getAdminConnections() {
    return this.fetchAPI('/admin/connections');
  }

  // ==================== ADMIN ANALYTICS ENDPOINTS ====================
  getAdminAnalytics() {
    return this.fetchAPI('/admin/analytics');
  }

  // ==================== BILLING ENDPOINTS ====================
  getInvoices() {
    return this.fetchAPI('/billing/invoices');
  }

  getPlans() {
    return this.fetchAPI('/billing/plans');
  }

  // ==================== ORGANIZATION ENDPOINTS ====================
  getOrganizations() {
    return this.fetchAPI('/admin/organizations');
  }

  getOrganization(id: string) {
    return this.fetchAPI(`/admin/organizations/${id}`);
  }

  createOrganization(data: any) {
    return this.fetchAPI('/admin/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateOrganization(id: string, data: any) {
    return this.fetchAPI(`/admin/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteOrganization(id: string) {
    return this.fetchAPI(`/admin/organizations/${id}`, {
      method: 'DELETE',
    });
  }

  getOrganizationMembers(orgId: string) {
    return this.fetchAPI(`/admin/organizations/${orgId}/members`);
  }

  inviteOrganizationMember(orgId: string, data: any) {
    return this.fetchAPI(`/admin/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateOrganizationMember(orgId: string, memberId: string, data: any) {
    return this.fetchAPI(`/admin/organizations/${orgId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  removeOrganizationMember(orgId: string, memberId: string) {
    return this.fetchAPI(`/admin/organizations/${orgId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // ==================== API KEY ENDPOINTS ====================
  getAPIKeys() {
    return this.fetchAPI('/user/api-keys');
  }

  createAPIKey(data: any) {
    return this.fetchAPI('/user/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  revokeAPIKey(keyId: string) {
    return this.fetchAPI(`/user/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  // ==================== SECURITY & THREAT PROTECTION ENDPOINTS ====================
  getThreatStats(timeRange: string) {
    return this.fetchAPI(`/security/threats/stats?range=${timeRange}`);
  }

  getRecentThreats(params: any) {
    const queryParams = new URLSearchParams(params).toString();
    return this.fetchAPI(`/security/threats/recent?${queryParams}`);
  }

  getKillSwitchEvents(params?: any) {
    const queryParams = params ? `?${new URLSearchParams(params)}` : '';
    return this.fetchAPI(`/security/kill-switch/events${queryParams}`);
  }

  // ==================== SERVER MONITORING ENDPOINTS ====================
  getServerHealth(serverId?: string) {
    return serverId 
      ? this.fetchAPI(`/admin/servers/${serverId}/health`)
      : this.fetchAPI('/admin/servers/health');
  }

  getServerMetrics(serverId: string, timeRange: string) {
    return this.fetchAPI(`/admin/servers/${serverId}/metrics?range=${timeRange}`);
  }

  // ==================== WEBHOOK ENDPOINTS ====================
  getWebhooks() {
    return this.fetchAPI('/admin/webhooks');
  }

  createWebhook(data: any) {
    return this.fetchAPI('/admin/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateWebhook(id: string, data: any) {
    return this.fetchAPI(`/admin/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteWebhook(id: string) {
    return this.fetchAPI(`/admin/webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  testWebhook(id: string) {
    return this.fetchAPI(`/admin/webhooks/${id}/test`, {
      method: 'POST',
    });
  }

  // ==================== REPORTING ENDPOINTS ====================
  generateReport(type: string, params: any) {
    return this.fetchAPI(`/admin/reports/${type}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  exportReport(type: string, format: string, params: any) {
    return this.fetchAPI(`/admin/reports/${type}/export?format=${format}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ==================== ENCRYPTION PROTOCOL ENDPOINTS ====================
  getEncryptionProtocols() {
    return this.fetchAPI('/admin/encryption/protocols');
  }

  updateEncryptionProtocol(id: string, data: any) {
    return this.fetchAPI(`/admin/encryption/protocols/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== DEVELOPMENT ENDPOINTS ====================
  createDevVPNClient(data: any) {
    return this.fetchAPI('/vpn/dev/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== DEBUG ENDPOINTS ====================
  debugRequest() {
    return this.fetchAPI('/debug/request', {
      method: 'POST',
    });
  }
}

// Create singleton instance
export const api = new APIClient();

// Legacy fetchAPI function for backward compatibility
export async function fetchAPI<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  return api.fetchAPI(endpoint, options);
}