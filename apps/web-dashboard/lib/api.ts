const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const api = {
  // Servers
  getServers: () => fetchAPI('/servers'),
  getServer: (id: string) => fetchAPI(`/admin/servers/${id}`),
  createServer: (data: any) => fetchAPI('/admin/servers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateServer: (id: string, data: any) => fetchAPI(`/admin/servers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteServer: (id: string) => fetchAPI(`/admin/servers/${id}`, {
    method: 'DELETE',
  }),

  // Users
  getUsers: () => fetchAPI('/admin/users'),
  getUserStats: () => fetchAPI('/admin/statistics'),
  
  // Profile
  getProfile: () => fetchAPI('/user/profile'),
  updateProfile: (data: any) => fetchAPI('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  changePassword: (data: any) => fetchAPI('/user/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getSubscription: () => fetchAPI('/user/subscription'),
  
  // Security Settings
  getSecuritySettings: () => fetchAPI('/user/security/settings'),
  updateSecuritySettings: (data: any) => fetchAPI('/user/security/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  enable2FA: () => fetchAPI('/user/security/2fa/enable', { method: 'POST' }),
  disable2FA: (code: string) => fetchAPI('/user/security/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),
  
  // Sessions
  getSessions: () => fetchAPI('/user/sessions'),
  revokeSession: (sessionId: string) => fetchAPI(`/user/sessions/${sessionId}`, {
    method: 'DELETE',
  }),
  
  // API Keys (for advanced users/admins)
  getAPIKeys: () => fetchAPI('/user/api-keys'),
  createAPIKey: (data: any) => fetchAPI('/user/api-keys', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  revokeAPIKey: (keyId: string) => fetchAPI(`/user/api-keys/${keyId}`, {
    method: 'DELETE',
  }),
  
  // Devices
  getDevices: () => fetchAPI('/user/devices'),
  addDevice: (data: any) => fetchAPI('/user/devices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteDevice: (id: string) => fetchAPI(`/user/devices/${id}`, {
    method: 'DELETE',
  }),

  // Connections
  getConnectionHistory: () => fetchAPI('/user/connections/history'),
  getConnections: () => fetchAPI('/admin/connections'),
  getDataUsage: () => fetchAPI('/user/connections/data-usage'),
  
  // VPN
  connect: (serverId: string) => fetchAPI('/vpn/connect', {
    method: 'POST',
    body: JSON.stringify({ serverId }),
  }),
  disconnect: (connectionId: string) => fetchAPI('/vpn/disconnect', {
    method: 'POST',
    body: JSON.stringify({ connectionId }),
  }),
  // Admin: create a vpn client (supports testMode and options)
  createAdminVPNClient: (data: any) => fetchAPI('/admin/vpn/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  // Dev helper: create vpn client without auth when running in development server
  createDevVPNClient: (data: any) => fetchAPI('/vpn/dev/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Analytics
  getAnalytics: () => fetchAPI('/admin/analytics'),

  // Security & Audit
  getAuditLogs: (filters?: any) => fetchAPI('/admin/audit-logs' + (filters ? `?${new URLSearchParams(filters)}` : '')),
  getSecurityEvents: () => fetchAPI('/admin/security/events'),
  
  // Billing
  getInvoices: () => fetchAPI('/billing/invoices'),
  getPlans: () => fetchAPI('/billing/plans'),
  
  // Organizations & Teams
  getOrganizations: () => fetchAPI('/admin/organizations'),
  getOrganization: (id: string) => fetchAPI(`/admin/organizations/${id}`),
  createOrganization: (data: any) => fetchAPI('/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateOrganization: (id: string, data: any) => fetchAPI(`/admin/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteOrganization: (id: string) => fetchAPI(`/admin/organizations/${id}`, {
    method: 'DELETE',
  }),
  getOrganizationMembers: (orgId: string) => fetchAPI(`/admin/organizations/${orgId}/members`),
  inviteOrganizationMember: (orgId: string, data: any) => fetchAPI(`/admin/organizations/${orgId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateOrganizationMember: (orgId: string, memberId: string, data: any) => fetchAPI(`/admin/organizations/${orgId}/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  removeOrganizationMember: (orgId: string, memberId: string) => fetchAPI(`/admin/organizations/${orgId}/members/${memberId}`, {
    method: 'DELETE',
  }),
  
  // Split Tunnel Rules
  getSplitTunnelRules: () => fetchAPI('/user/split-tunnel'),
  createSplitTunnelRule: (data: any) => fetchAPI('/user/split-tunnel', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSplitTunnelRule: (id: string, data: any) => fetchAPI(`/user/split-tunnel/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteSplitTunnelRule: (id: string) => fetchAPI(`/user/split-tunnel/${id}`, {
    method: 'DELETE',
  }),
  
  // Threat Protection
  getThreatStats: (timeRange: string) => fetchAPI(`/security/threats/stats?range=${timeRange}`),
  getRecentThreats: (params: any) => fetchAPI(`/security/threats/recent?${new URLSearchParams(params)}`),
  
  // Kill Switch Events
  getKillSwitchEvents: (params?: any) => fetchAPI('/security/kill-switch/events' + (params ? `?${new URLSearchParams(params)}` : '')),
  
  // Server Monitoring
  getServerHealth: (serverId?: string) => fetchAPI(serverId ? `/admin/servers/${serverId}/health` : '/admin/servers/health'),
  getServerMetrics: (serverId: string, timeRange: string) => fetchAPI(`/admin/servers/${serverId}/metrics?range=${timeRange}`),
  
  // Webhooks
  getWebhooks: () => fetchAPI('/admin/webhooks'),
  createWebhook: (data: any) => fetchAPI('/admin/webhooks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateWebhook: (id: string, data: any) => fetchAPI(`/admin/webhooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteWebhook: (id: string) => fetchAPI(`/admin/webhooks/${id}`, {
    method: 'DELETE',
  }),
  testWebhook: (id: string) => fetchAPI(`/admin/webhooks/${id}/test`, {
    method: 'POST',
  }),
  
  // Advanced Reporting
  generateReport: (type: string, params: any) => fetchAPI(`/admin/reports/${type}`, {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  exportReport: (type: string, format: string, params: any) => fetchAPI(`/admin/reports/${type}/export?format=${format}`, {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  
  // Encryption Protocols
  getEncryptionProtocols: () => fetchAPI('/admin/encryption/protocols'),
  updateEncryptionProtocol: (id: string, data: any) => fetchAPI(`/admin/encryption/protocols/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  setUserEncryption: (userId: string, protocolId: string) => fetchAPI(`/admin/users/${userId}/encryption`, {
    method: 'PUT',
    body: JSON.stringify({ protocol_id: protocolId }),
  }),
  
  // Notifications
  getNotifications: (params?: any) => fetchAPI('/user/notifications' + (params ? `?${new URLSearchParams(params)}` : '')),
  markNotificationRead: (id: string) => fetchAPI(`/user/notifications/${id}/read`, {
    method: 'PUT',
  }),
  markAllNotificationsRead: () => fetchAPI('/user/notifications/read-all', {
    method: 'PUT',
  }),
  deleteNotification: (id: string) => fetchAPI(`/user/notifications/${id}`, {
    method: 'DELETE',
  }),
  getNotificationSettings: () => fetchAPI('/user/notifications/settings'),
  updateNotificationSettings: (data: any) => fetchAPI('/user/notifications/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
