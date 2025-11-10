// Determine API base at runtime:
// - In the browser we use a relative path so requests go to the Next.js dev
//   server (same-origin) which proxies /api to the backend. This ensures
//   cookies (httpOnly refresh token) are sent by the browser during dev.
// - On the server (SSR) use NEXT_PUBLIC_API_URL or fallback to localhost:5000.
const DEFAULT_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE_URL = typeof window === 'undefined' ? DEFAULT_API : '';

// Single-flight refresh promise to avoid concurrent refresh requests which can
// trigger server-side rate limits when multiple components call API at once.
let refreshPromise: Promise<{ ok: boolean; body: any; response: Response } | null> | null = null;

// Defer importing the auth store to avoid circulars at module-eval time in some SSR setups
function logoutAndRedirect() {
  try {
    // import lazily so this module can be used in non-auth contexts without pulling store code
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuthStore } = require('./store');
    // If the store exists, call logout to clear tokens and redirect
    if (useAuthStore && typeof useAuthStore.getState === 'function') {
      useAuthStore.getState().logout();
      return;
    }
  } catch (e) {
    // fallback: clear local storage and redirect
    localStorage.removeItem('access_token');
    document.cookie = 'access_token=; path=/; max-age=0';
    try {
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      } else {
        console.debug('logoutAndRedirect: already on /auth/login, skipping redirect');
      }
    } catch (err) {
      try {
        // best-effort
        window.location.href = '/auth/login';
      } catch (err2) {
        // ignore
      }
    }
  }
}

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  if (typeof window !== 'undefined') {
    try {
      console.debug('[fetchAPI] calling', endpoint, 'tokenPreview=', token ? `${String(token).slice(0, 30)}...` : null);
    } catch (e) {
      // ignore
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    // include credentials so httpOnly cookies (refresh_token) are sent for endpoints that rely on them
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // If unauthorized, try silent refresh once
    if (response.status === 401) {
        console.debug('[fetchAPI] received 401 for', endpoint, 'tokenPresent=', !!token);
      try {
        // In development, cross-origin httpOnly cookies are often blocked by
        // browser SameSite rules (POST XHR won't send Lax cookies). To make
        // the dev experience reliable, prefer a localStorage-based refresh
        // fallback when we don't have an access token locally. This avoids
        // a round-trip that can't include the cookie and reduces transient
        // 401 -> refresh -> 401 loops.
        const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
        if (!token && isDev) {
          // Try localStorage fallback first (dev only)
          const storedRefresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
          if (storedRefresh) {
            console.debug('[fetchAPI] dev: attempting localStorage fallback refresh for', endpoint);
            try {
              const fallbackResp = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: storedRefresh }),
              });
              const fallbackBody = await fallbackResp.json().catch(() => ({}));
              console.debug('[fetchAPI] dev fallback refresh ok=', fallbackResp.ok, 'body=', fallbackBody);
              if (fallbackResp.ok) {
                const newAccess = fallbackBody?.session?.access_token || fallbackBody?.access_token || fallbackBody?.session?.token;
                if (newAccess) {
                  localStorage.setItem('access_token', newAccess);
                  // Retry original request with new token
                  const retryHeaders = {
                    'Content-Type': 'application/json',
                    ...(options?.headers || {}),
                    Authorization: `Bearer ${newAccess}`,
                  } as any;

                  const retryResp = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
                    credentials: 'include',
                    ...options,
                    headers: retryHeaders,
                  });

                  if (retryResp.ok) return retryResp.json();
                }
              }
            } catch (e) {
              console.debug('[fetchAPI] dev fallback refresh error for', endpoint, e);
            }
          }
        }

        // Attempt to refresh using httpOnly cookie. Use a single-flight
        // promise so concurrent callers await the same refresh instead of
        // issuing multiple refresh requests which can trigger 429s.
        if (!refreshPromise) {
            console.debug('[fetchAPI] starting refreshPromise for', endpoint);
          refreshPromise = (async () => {
            try {
              const r = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
              });
              const body = await (async () => {
                try {
                  return await r.json();
                } catch (e) {
                  return {};
                }
              })();
                console.debug('[fetchAPI] refresh response for', endpoint, 'ok=', r.ok, 'bodyPreview=', body);
              return { ok: r.ok, body, response: r };
            } catch (err) {
                console.debug('[fetchAPI] refresh request error for', endpoint, err);
              return { ok: false, body: null, response: null as any };
            }
          })();
        }

        const refreshResult = await refreshPromise;
        // clear promise so future 401s can trigger a new attempt
        refreshPromise = null;

        if (refreshResult && refreshResult.ok) {
          const refreshBody = refreshResult.body || {};
          const newAccess = refreshBody?.session?.access_token || refreshBody?.access_token || refreshBody?.session?.token;
            console.debug('[fetchAPI] refreshResult ok, got newAccess=', !!newAccess);
          if (newAccess) {
            localStorage.setItem('access_token', newAccess);
            // Also set a readable access_token cookie so server-side middleware
            // that reads cookies can validate the retried request if the
            // Authorization header is stripped by any proxy during replay.
            try {
              if (typeof document !== 'undefined') {
                document.cookie = `access_token=${newAccess}; path=/`;
                console.debug('[fetchAPI] set access_token cookie for retry (dev)');
              }
            } catch (e) {
              // ignore cookie set failures
            }

            // Retry original request once with new token
            const retryHeaders = {
              'Content-Type': 'application/json',
              ...(options?.headers || {}),
              Authorization: `Bearer ${newAccess}`,
            } as any;

            const retryResp = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
              // include credentials so httpOnly cookies (if any) are sent
              credentials: 'include',
              ...options,
              headers: retryHeaders,
            });

            if (retryResp.ok) return retryResp.json();
            // otherwise fall through and handle error normally
          }
        }
        // If cookie-based refresh failed (likely browser blocked cookie in dev),
        // attempt a fallback refresh using a refresh_token stored in localStorage
        // (only used for local development convenience).
        try {
          const storedRefresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
          if (storedRefresh) {
            const fallbackResp = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: storedRefresh }),
            });

              console.debug('[fetchAPI] local fallback refresh_token present=', !!storedRefresh);
            if (fallbackResp.ok) {
              const fallbackBody = await fallbackResp.json().catch(() => ({}));
              const newAccess = fallbackBody?.session?.access_token || fallbackBody?.access_token || fallbackBody?.session?.token;
                console.debug('[fetchAPI] fallback got newAccess=', !!newAccess);
              if (newAccess) {
                localStorage.setItem('access_token', newAccess);

                const retryHeaders = {
                  'Content-Type': 'application/json',
                  ...(options?.headers || {}),
                  Authorization: `Bearer ${newAccess}`,
                } as any;

                const retryResp = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
                  credentials: 'include',
                  ...options,
                  headers: retryHeaders,
                });

                if (retryResp.ok) return retryResp.json();
              }
            }
          }
        } catch (e) {
          // ignore fallback errors and continue to logout flow
        }
      } catch (e) {
        // ignore and continue to final logout handling below
      }

      // If refresh failed, show a small notification (if available) then logout
      try {
        // lazy require toast to avoid SSR errors
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const toast = require('react-hot-toast').default;
        if (toast && typeof toast.error === 'function') {
          toast.error('Session expired. Please sign in again.');
        }
      } catch (e) {
        // ignore toast errors
      }

      // perform logout and redirect, but avoid doing this if we're already
      // on the login page (prevents redirect/clear-state loops during HMR
      // or when the login page itself triggers an API call that 401s).
      try {
        // Avoid forcing logout immediately after a successful login/hydration.
        // If the store indicates a recent successful auth, skip the logout and
        // let the client-side hydrator retry/settle. This is defensive for
        // dev-only races (HMR/cookie races). If window is not available or
        // reading the store fails, fall back to the original behavior.
        let skipLogout = false;
        try {
          if (typeof window !== 'undefined') {
            if (window.location.pathname === '/auth/login') {
              console.debug('[fetchAPI] refresh/login failed but already on /auth/login — skipping logout/redirect');
              skipLogout = true;
            }
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { useAuthStore: _useAuthStore } = require('./store');
            if (_useAuthStore && typeof _useAuthStore.getState === 'function') {
              const st = _useAuthStore.getState() as any;
              const last = st?.lastSuccessfulAuth || 0;
              if (Date.now() - last < 5000) {
                console.debug('[fetchAPI] recent successful auth detected — skipping logout (age ms)=', Date.now() - last);
                skipLogout = true;
              }
            }
          }
        } catch (e) {
          // ignore store read errors and fall back to logout
        }

        if (!skipLogout) {
          logoutAndRedirect();
        }
      } catch (e) {
        // best-effort: if anything goes wrong, still attempt the logout redirect
        try {
          logoutAndRedirect();
        } catch (err) {
          console.debug('[fetchAPI] logoutAndRedirect failed', err);
        }
      }
    }

    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = errorBody?.message || errorBody?.error || JSON.stringify(errorBody) || response.statusText || 'API request failed';
    const err = new Error(`${response.status} ${response.statusText} - ${errorMessage}`);
    // attach the original response body for richer handling in callers
    (err as any).body = errorBody;
    (err as any).status = response.status;

    // If unauthorized, immediately clear auth and redirect to login so the UX isn't stuck.
    // older code handled 401 by logging out immediately; now handled above during refresh attempt

    throw err;
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
