// Determine API base at runtime with robust fallbacks for Vercel vs local.
// For self-hosted (Hetzner) we prefer same-origin so cookies/auth work cleanly.
const ENV_API = process.env.NEXT_PUBLIC_API_URL
const INTERNAL_API = process.env.INTERNAL_API_URL

function isLocalHostName(hostname: string): boolean {
  const host = (hostname || '').toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return isLocalHostName(u.hostname)
  } catch {
    return false
  }
}

function resolveApiBase(): string {
  // 1) Explicit env var wins, except when it accidentally points to localhost
  // (e.g. .env.local got baked into a production build). In that case prefer
  // same-origin in the browser so /api/* routes through nginx.
  if (ENV_API && ENV_API.trim()) {
    const envApi = ENV_API.trim()
    if (typeof window !== 'undefined') {
      try {
        const pageHost = window.location.hostname
        if (!isLocalHostName(pageHost) && isLocalhostUrl(envApi)) {
          return window.location.origin
        }
      } catch {}
    }

    return envApi
  }

  // 2) Browser heuristics: on Vercel dashboard domain, default to API subdomain
  if (typeof window !== 'undefined') {
    try {
      const host = window.location.hostname
      if (host.endsWith('vercel.app')) {
        return 'https://vpn-enterprise-api.vercel.app'
      }
    } catch {}

    // Self-hosted default: same-origin (nginx routes /api/* to the API container)
    try {
      return window.location.origin
    } catch {}

    // Fallback
    return 'http://localhost:5000'
  }

  // 3) SSR fallback: prefer internal Docker API URL when provided
  if (INTERNAL_API && INTERNAL_API.trim()) return INTERNAL_API.trim()

  // 4) SSR fallback: if running on Vercel, prefer the production API URL
  if (process.env.VERCEL === '1') {
    return 'https://vpn-enterprise-api.vercel.app'
  }

  // 5) Production container default (compose service DNS)
  if (process.env.NODE_ENV === 'production') {
    return 'http://api:5000'
  }

  // 6) Default local dev
  return 'http://localhost:5000'
}

const API_BASE_URL = resolveApiBase()

// Single-flight refresh promise
let refreshPromise: Promise<string | null> | null = null

class APIClient {
  // ==================== SECURITY EVENTS ENDPOINT ====================
  getSecurityEvents() {
    // Backend returns { events: [...] }
    return this.fetchAPI('/admin/security/events').then(
      (res) => res?.events || [],
    )
  }
  // ==================== SECURITY ENDPOINT ====================
  getAuditLogs(filters?: { severity?: string }) {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : ''
    // Backend returns { logs: [...] }
    return this.fetchAPI(`/admin/audit/logs${queryParams}`).then(
      (res) => res?.logs || [],
    )
  }
  // ==================== ANALYTICS ENDPOINT ====================
  getConnections() {
    return this.fetchAPI('/connections')
  }
  // ==================== CLIENTS ENDPOINT ====================
  getUsers() {
    return this.fetchAPI('/users')
  }
  private async refreshToken(): Promise<string | null> {
    if (refreshPromise) {
      return refreshPromise
    }

    refreshPromise = (async (): Promise<string | null> => {
      try {
        console.debug('[APIClient] Attempting token refresh')

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.warn('[APIClient] Token refresh failed:', response.status)
          return null
        }

        const data = await response.json()
        const newAccessToken = data.session?.access_token

        if (newAccessToken) {
          // Update token in store and localStorage
          this.updateTokenStorage(newAccessToken)
          console.debug('[APIClient] Token refresh successful')
          return newAccessToken
        }

        return null
      } catch (error) {
        console.error('[APIClient] Token refresh error:', error)
        return null
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      // Try to get from store first
      const { useAuthStore } = require('./store')
      return useAuthStore.getState().accessToken
    } catch (e) {
      // Fallback to localStorage
      return localStorage.getItem('access_token')
    }
  }

  private updateTokenStorage(token: string): void {
    if (typeof window === 'undefined') return

    try {
      // Update store
      const { useAuthStore } = require('./store')
      useAuthStore.getState().setAccessToken(token)
    } catch (e) {
      // Fallback to localStorage
      localStorage.setItem('access_token', token)
    }

    // Always set as cookie for server-side usage
    try {
      document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
    } catch (e) {
      // Ignore cookie errors
    }
  }

  private async handleLogout(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const { useAuthStore } = require('./store')
      useAuthStore.getState().logout()
    } catch (e) {
      // Fallback cleanup
      localStorage.removeItem('access_token')
      document.cookie = 'access_token=; path=/; max-age=0'
      document.cookie = 'refresh_token=; path=/; max-age=0'
      document.cookie = 'user_role=; path=/; max-age=0'

      // Redirect to home page instead of login
      if (!window.location.pathname.startsWith('/')) {
        window.location.href = '/'
      }
    }
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    let token = this.getToken()

    // Always set cookie before request to ensure backend sees it
    if (typeof window !== 'undefined' && token) {
      try {
        document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
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
    }

    let response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config)

    // Handle 401 - token expired
    if (response.status === 401 && token) {
      console.debug('[APIClient] Token expired, attempting refresh')

      const newToken = await this.refreshToken()
      if (newToken) {
        // Retry with new token
        if (typeof window !== 'undefined') {
          try {
            document.cookie = `access_token=${newToken}; path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
          } catch (e) {}
        }
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        }
        response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, config)
      } else {
        // Refresh failed, logout user silently and redirect
        await this.handleLogout()
        // Return a response that will be handled gracefully
        return new Response(JSON.stringify({ error: 'Session expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return response
  }

  async fetchAPI<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.request(endpoint, options)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))

      // Handle 401 silently if session expired
      if (response.status === 401 && errorBody?.error === 'Session expired') {
        // Already handled in request(), just return empty data
        return {} as T
      }

      const errorMessage =
        errorBody?.message ||
        errorBody?.error ||
        response.statusText ||
        'API request failed'

      const error = new Error(
        `${response.status} ${response.statusText} - ${errorMessage}`,
      )
      ;(error as any).status = response.status
      ;(error as any).body = errorBody

      throw error
    }

    return response.json()
  }

  // ==================== AUTH ENDPOINTS ====================
  async signUp(email: string, password: string) {
    return this.fetchAPI('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async login(email: string, password: string) {
    return this.fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async logout() {
    return this.fetchAPI('/auth/logout', {
      method: 'POST',
    })
  }

  async refreshSession() {
    return this.fetchAPI('/auth/refresh', {
      method: 'POST',
    })
  }

  // ==================== PUBLIC ENDPOINTS ====================
  getServers() {
    return this.fetchAPI('/servers')
  }

  getVPNConfigs(userId: string) {
    return this.fetchAPI(`/vpn/configs?userId=${encodeURIComponent(userId)}`)
  }

  getVPNUsage(userId: string) {
    return this.fetchAPI(`/vpn/usage?userId=${encodeURIComponent(userId)}`)
  }

  // ==================== USER ENDPOINTS ====================
  getProfile() {
    return this.fetchAPI('/user/profile')
  }

  updateProfile(data: any) {
    return this.fetchAPI('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  getSubscription() {
    return this.fetchAPI('/user/subscription')
  }

  getDevices() {
    return this.fetchAPI('/user/devices')
  }

  addDevice(data: any) {
    return this.fetchAPI('/user/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  deleteDevice(id: string) {
    return this.fetchAPI(`/user/devices/${id}`, {
      method: 'DELETE',
    })
  }

  getUserStats() {
    return this.fetchAPI('/user/stats')
  }

  // ==================== SECURITY ENDPOINTS ====================
  getSecuritySettings() {
    return this.fetchAPI('/user/security/settings')
  }

  updateSecuritySettings(data: any) {
    return this.fetchAPI('/user/security/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  getSessions() {
    return this.fetchAPI('/user/sessions')
  }

  revokeSession(sessionId: string) {
    return this.fetchAPI(`/user/sessions/${sessionId}`, {
      method: 'DELETE',
    })
  }

  enable2FA() {
    return this.fetchAPI('/user/security/2fa/enable', {
      method: 'POST',
    })
  }

  disable2FA(code: string) {
    return this.fetchAPI('/user/security/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  }

  changePassword(data: any) {
    return this.fetchAPI('/user/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // ==================== VPN ENDPOINTS ====================
  connect(serverId: string) {
    return this.fetchAPI('/vpn/connect', {
      method: 'POST',
      body: JSON.stringify({ serverId }),
    })
  }

  disconnect(connectionId: string) {
    return this.fetchAPI('/vpn/disconnect', {
      method: 'POST',
      body: JSON.stringify({ connectionId }),
    })
  }

  getConnectionHistory() {
    return this.fetchAPI('/user/connections/history')
  }

  getDataUsage() {
    return this.fetchAPI('/user/connections/data-usage')
  }

  // ==================== SPLIT TUNNEL ENDPOINTS ====================
  getSplitTunnelRules() {
    return this.fetchAPI('/user/split-tunnel')
  }

  createSplitTunnelRule(data: any) {
    return this.fetchAPI('/user/split-tunnel', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateSplitTunnelRule(id: string, data: any) {
    return this.fetchAPI(`/user/split-tunnel/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  deleteSplitTunnelRule(id: string) {
    return this.fetchAPI(`/user/split-tunnel/${id}`, {
      method: 'DELETE',
    })
  }

  // ==================== NOTIFICATION ENDPOINTS ====================
  getNotifications(params?: { limit?: number }) {
    const queryParams = params ? `?${new URLSearchParams(params as any)}` : ''
    return this.fetchAPI(`/user/notifications${queryParams}`)
  }

  markNotificationRead(id: string) {
    return this.fetchAPI(`/user/notifications/${id}/read`, {
      method: 'PUT',
    })
  }

  markAllNotificationsRead() {
    return this.fetchAPI('/user/notifications/read-all', {
      method: 'PUT',
    })
  }

  deleteNotification(id: string) {
    return this.fetchAPI(`/user/notifications/${id}`, {
      method: 'DELETE',
    })
  }

  getNotificationSettings() {
    return this.fetchAPI('/user/notifications/settings')
  }

  updateNotificationSettings(data: any) {
    return this.fetchAPI('/user/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // ==================== ADMIN ENDPOINTS ====================
  getAdminStatistics() {
    return this.fetchAPI('/admin/statistics')
  }

  getAdminUsers() {
    return this.fetchAPI('/admin/users')
  }

  getAdminAuditLogs(filters?: { severity?: string }) {
    const queryParams = filters ? `?${new URLSearchParams(filters)}` : ''
    return this.fetchAPI(`/admin/audit-logs${queryParams}`)
  }

  getAdminSecurityEvents() {
    return this.fetchAPI('/admin/security/events')
  }

  setUserEncryption(userId: string, protocolId: string) {
    return this.fetchAPI(`/admin/users/${userId}/encryption`, {
      method: 'PUT',
      body: JSON.stringify({ protocol_id: protocolId }),
    })
  }

  // ==================== ADMIN SERVER ENDPOINTS ====================
  getAdminServer(id: string) {
    return this.fetchAPI(`/admin/servers/${id}`)
  }

  createAdminServer(data: any) {
    return this.fetchAPI('/admin/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateAdminServer(id: string, data: any) {
    return this.fetchAPI(`/admin/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  deleteAdminServer(id: string) {
    return this.fetchAPI(`/admin/servers/${id}`, {
      method: 'DELETE',
    })
  }

  // ==================== ADMIN VPN CLIENT ENDPOINTS ====================
  createAdminVPNClient(data: any) {
    return this.fetchAPI('/admin/vpn/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  getAdminConnections() {
    return this.fetchAPI('/admin/connections')
  }

  // ==================== ADMIN ANALYTICS ENDPOINTS ====================
  getAdminAnalytics() {
    return this.fetchAPI('/admin/analytics')
  }

  // ==================== BILLING ENDPOINTS ====================
  getInvoices() {
    return this.fetchAPI('/billing/invoices')
  }

  getPlans() {
    return this.fetchAPI('/billing/plans')
  }

  // ==================== ORGANIZATION ENDPOINTS ====================
  getOrganizations() {
    return this.fetchAPI('/admin/organizations')
  }

  getOrganization(id: string) {
    return this.fetchAPI(`/admin/organizations/${id}`)
  }

  createOrganization(data: any) {
    return this.fetchAPI('/admin/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateOrganization(id: string, data: any) {
    return this.fetchAPI(`/admin/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  deleteOrganization(id: string) {
    return this.fetchAPI(`/admin/organizations/${id}`, {
      method: 'DELETE',
    })
  }

  getOrganizationMembers(orgId: string) {
    return this.fetchAPI(`/admin/organizations/${orgId}/members`)
  }

  inviteOrganizationMember(orgId: string, data: any) {
    return this.fetchAPI(`/admin/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateOrganizationMember(orgId: string, memberId: string, data: any) {
    return this.fetchAPI(`/admin/organizations/${orgId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  removeOrganizationMember(orgId: string, memberId: string) {
    return this.fetchAPI(`/admin/organizations/${orgId}/members/${memberId}`, {
      method: 'DELETE',
    })
  }

  // ==================== API KEY ENDPOINTS ====================
  getAPIKeys() {
    return this.fetchAPI('/user/api-keys')
  }

  createAPIKey(data: any) {
    return this.fetchAPI('/user/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  revokeAPIKey(keyId: string) {
    return this.fetchAPI(`/user/api-keys/${keyId}`, {
      method: 'DELETE',
    })
  }

  // ==================== SECURITY & THREAT PROTECTION ENDPOINTS ====================
  getThreatStats(timeRange: string) {
    return this.fetchAPI(`/security/threats/stats?range=${timeRange}`)
  }

  getRecentThreats(params: any) {
    const queryParams = new URLSearchParams(params).toString()
    return this.fetchAPI(`/security/threats/recent?${queryParams}`)
  }

  getKillSwitchEvents(params?: any) {
    const queryParams = params ? `?${new URLSearchParams(params)}` : ''
    return this.fetchAPI(`/security/kill-switch/events${queryParams}`)
  }

  // ==================== SERVER MONITORING ENDPOINTS ====================
  getServerHealth(serverId?: string) {
    return serverId
      ? this.fetchAPI(`/admin/servers/${serverId}/health`)
      : this.fetchAPI('/admin/servers/health')
  }

  getServerMetrics(serverId: string, timeRange: string) {
    return this.fetchAPI(
      `/admin/servers/${serverId}/metrics?range=${timeRange}`,
    )
  }

  // ==================== WEBHOOK ENDPOINTS ====================
  getWebhooks() {
    return this.fetchAPI('/admin/webhooks')
  }

  createWebhook(data: any) {
    return this.fetchAPI('/admin/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  updateWebhook(id: string, data: any) {
    return this.fetchAPI(`/admin/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  deleteWebhook(id: string) {
    return this.fetchAPI(`/admin/webhooks/${id}`, {
      method: 'DELETE',
    })
  }

  testWebhook(id: string) {
    return this.fetchAPI(`/admin/webhooks/${id}/test`, {
      method: 'POST',
    })
  }

  // ==================== REPORTING ENDPOINTS ====================
  generateReport(type: string, params: any) {
    return this.fetchAPI(`/admin/reports/${type}`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  exportReport(type: string, format: string, params: any) {
    return this.fetchAPI(`/admin/reports/${type}/export?format=${format}`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ==================== ENCRYPTION PROTOCOL ENDPOINTS ====================
  getEncryptionProtocols() {
    return this.fetchAPI('/admin/encryption/protocols')
  }

  updateEncryptionProtocol(id: string, data: any) {
    return this.fetchAPI(`/admin/encryption/protocols/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // ==================== DEVELOPMENT ENDPOINTS ====================
  createDevVPNClient(data: any) {
    return this.fetchAPI('/vpn/dev/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ==================== HOSTING ENDPOINTS ====================
  // Public: list hosting plans (optional filter by type)
  getHostingPlans(params?: { type?: string }) {
    const query = params?.type ? `?type=${encodeURIComponent(params.type)}` : ''
    return this.fetchAPI(`/hosting/plans${query}`).then(
      (res) => res?.plans || [],
    )
  }

  // Auth: list services for current user
  getHostingServices() {
    return this.fetchAPI('/hosting/services').then((res) => res?.services || [])
  }

  // Auth: create a new hosted service
  createHostedService(payload: {
    plan_id: string
    name: string
    domain?: string
    config?: Record<string, any>
  }) {
    return this.fetchAPI('/hosting/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // Auth: get service details
  getHostedService(id: string) {
    return this.fetchAPI(`/hosting/services/${encodeURIComponent(id)}`)
  }

  // Auth: delete service
  deleteHostedService(id: string) {
    return this.fetchAPI(`/hosting/services/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  // Auth: control actions
  startHostingService(id: string) {
    return this.fetchAPI(`/hosting/services/${encodeURIComponent(id)}/start`, {
      method: 'POST',
    })
  }

  stopHostingService(id: string) {
    return this.fetchAPI(`/hosting/services/${encodeURIComponent(id)}/stop`, {
      method: 'POST',
    })
  }

  restartHostingService(id: string) {
    return this.fetchAPI(
      `/hosting/services/${encodeURIComponent(id)}/restart`,
      {
        method: 'POST',
      },
    )
  }

  createBackup(id: string) {
    return this.fetchAPI(`/hosting/services/${encodeURIComponent(id)}/backup`, {
      method: 'POST',
    })
  }

  // ==================== DECENTRALIZED HOSTING (MVP) ====================
  getHostingNodes() {
    return this.fetchAPI('/hosting/network/nodes').then(
      (res) => res?.nodes || [],
    )
  }

  // Admin-only: upsert a hosting node
  upsertHostingNode(payload: {
    id: string
    name: string
    region: string
    capabilities?: string[]
    public_key?: string
    status?: string
  }) {
    return this.fetchAPI('/hosting/network/nodes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // Admin-only: delete a hosting node
  deleteHostingNode(id: string) {
    return this.fetchAPI(`/hosting/network/nodes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  attestService(id: string) {
    return this.fetchAPI(`/hosting/services/${encodeURIComponent(id)}/attest`, {
      method: 'POST',
    })
  }

  distributeServiceEdge(id: string, regions?: string[]) {
    return this.fetchAPI(
      `/hosting/services/${encodeURIComponent(id)}/distribute`,
      {
        method: 'POST',
        body: JSON.stringify({ regions }),
      },
    )
  }

  getServiceAttestations(id: string) {
    return this.fetchAPI(
      `/hosting/services/${encodeURIComponent(id)}/attestations`,
    ).then((res) => res?.attestations || [])
  }

  // Auth: simple hosting stats (placeholder, returned by backend if implemented)
  getHostingStats() {
    // If backend returns a flat object, pass through; otherwise synthesize from services
    return this.fetchAPI('/hosting/stats').catch(async () => {
      try {
        const services = await this.getHostingServices()
        const activeServices = services.filter(
          (s: any) => s.status === 'active',
        ).length
        const totals = services.reduce(
          (acc: any, s: any) => {
            acc.totalStorage += Number(s?.resource_usage?.storage || 0)
            acc.bandwidthUsed += Number(s?.resource_usage?.bandwidth || 0)
            return acc
          },
          { totalStorage: 0, bandwidthUsed: 0 },
        )
        return {
          totalServices: services.length,
          activeServices,
          totalStorage: totals.totalStorage,
          bandwidthUsed: totals.bandwidthUsed,
        }
      } catch {
        return {
          totalServices: 0,
          activeServices: 0,
          totalStorage: 0,
          bandwidthUsed: 0,
        }
      }
    })
  }

  // ==================== DEBUG ENDPOINTS ====================
  debugRequest() {
    return this.fetchAPI('/debug/request', {
      method: 'POST',
    })
  }
}

// Create singleton instance
export const api = new APIClient()

// Legacy fetchAPI function for backward compatibility
export async function fetchAPI<T = any>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  return api.fetchAPI(endpoint, options)
}
