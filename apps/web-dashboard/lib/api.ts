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
  getSubscription: () => fetchAPI('/user/subscription'),
  
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

  // Analytics
  getAnalytics: () => fetchAPI('/admin/analytics'),

  // Security & Audit
  getAuditLogs: (filters?: any) => fetchAPI('/admin/audit-logs' + (filters ? `?${new URLSearchParams(filters)}` : '')),
  getSecurityEvents: () => fetchAPI('/admin/security/events'),
  
  // Billing
  getInvoices: () => fetchAPI('/billing/invoices'),
  getPlans: () => fetchAPI('/billing/plans'),
};
