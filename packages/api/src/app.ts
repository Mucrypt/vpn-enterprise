import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { VPNServerManager, ServerLoadBalancer, ConnectionTracker } from '@vpn-enterprise/vpn-core';
import { AuthService, authMiddleware, adminMiddleware, AuthRequest } from '@vpn-enterprise/auth';
import { supabase, supabaseAdmin } from '@vpn-enterprise/database';
import {
  ServerRepository,
  SubscriptionRepository,
  DeviceRepository,
  ConnectionRepository,
  ClientConfigRepository,
  SplitTunnelRepository
} from '@vpn-enterprise/database';
import { AuditRepository, SecurityRepository } from '@vpn-enterprise/database';

// Load environment variables from repo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
console.log('[DIAG] Express app constructed');
const vpnManager = new VPNServerManager();
const loadBalancer = new ServerLoadBalancer();
const connectionTracker = new ConnectionTracker();

// Security middleware
app.use(helmet());

// Configure CORS: read comma-separated origins from ALLOWED_ORIGINS env var.
// If not provided, fall back to common local dev origins.
const allowedOrigins =
  process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
    : [
        'https://vpn-enterprise-dashboard.vercel.app',
        'http://localhost:3000',
        'http://localhost:5000'
      ];

// Helpful startup log to diagnose CORS problems in deployed environments.
console.log('CORS allowed origins:', allowedOrigins);

// Shared CORS options so both normal requests and preflight (OPTIONS) are handled
const corsOptions: cors.CorsOptions = {
  // Allow Authorization header and Content-Type for preflight requests so
  // client-side Authorization: Bearer <token> is accepted by the server.
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl, or some native apps)
    if (!origin) return callback(null, true);

    // During local development allow any localhost origin (convenience for multiple dev servers/ports)
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);

    // Allow Vercel preview deployments for the dashboard (e.g. *.vercel.app
    // containing the dashboard project name) so preview URLs can call the API.
    try {
      const url = new URL(origin);
      const host = url.hostname;
      const isVercelPreview = host.endsWith('.vercel.app') && host.includes('vpn-enterprise-dashboard');
      if (isVercelPreview) return callback(null, true);
    } catch (_) {
      // ignore parse failure
    }
    console.warn('Blocked CORS request from origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

// Apply CORS for all routes
app.use(cors(corsOptions));
// Handle preflight generically without path patterns to avoid router errors
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // cors() already set headers above; just return 204
    return res.sendStatus(204);
  }
  next();
});

// Rate limiting
// Protect the app from excessive requests but return JSON errors and avoid
// blocking auth/debug endpoints which are used during login/hydration flows.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // Add standard rate-limit response headers
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for auth endpoints and dev debug endpoint to avoid
  // accidental lockouts during normal login flows in local development.
  skip: (req: any) => {
    try {
      return req.path.startsWith('/api/v1/auth') || req.path.startsWith('/api/v1/debug');
    } catch (e) {
      return false;
    }
  },
  // Return a structured JSON error so clients can handle 429 programmatically
  handler: (req, res /*, next */) => {
    res.status(429).json({ error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' });
  }
});
// Apply rate limiter only in production to avoid accidental lockouts
// during local development where HMR and frequent client reloads can
// easily trigger the limiter. In production this remains enabled.
if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
} else {
  console.debug('Rate limiter is disabled in development');
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
// Cookies (used for refresh token cookie)
app.use(cookieParser());

// ==========================
// PUBLIC ENDPOINTS
// ==========================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vpn-enterprise-api',
    version: '1.0.0'
  });
});

// Dev debug endpoint: inspect incoming auth headers and cookies
// Only registered in non-production to help debug CORS/auth problems during local development.
if (process.env.NODE_ENV !== 'production') {
  console.log('[DIAG] Registering /api/v1/debug/routes endpoint');
  app.post('/api/v1/debug/request', (req, res) => {
    try {
      const authHeader = req.headers.authorization || null;
      const cookies = req.cookies || {};
      // Return presence flags and truncated token for safe debugging
      const tokenPreview = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? `${authHeader.substring(0, 30)}...` : null;
      res.json({
        ok: true,
        method: req.method,
        origin: req.headers.origin || null,
        hasAuthorizationHeader: !!authHeader,
        authorizationPreview: tokenPreview,
        cookiesPresent: Object.keys(cookies),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });
}

// ==========================
// AUTH ENDPOINTS
// ==========================

// In-memory single-flight map for refresh operations initiated via the
// /api/v1/auth/refresh endpoint. This prevents multiple parallel refreshes
// from rotating the refresh token repeatedly when many requests trigger
// client-side refreshes at the same time.
const refreshInFlight: Map<string, Promise<any>> = new Map();

app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await AuthService.signUp(email, password);
    res.status(201).json({ user, message: 'User created successfully' });
  } catch (error: any) {
    res.status(400).json({ error: 'Signup failed', message: error.message });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    // AuthService may have differing type shapes depending on package builds; cast to any to remain flexible
    const signInResult: any = await (AuthService as any).signIn(email, password);
    const user = signInResult?.user || signInResult;
    const session = signInResult?.session || (await (AuthService as any).getSession());

    // If a refresh token is present in the session, set it as a httpOnly cookie
    try {
      if (session && session.refresh_token) {
        // Cookie options: browsers require Secure when SameSite=None. Use
        // SameSite='none' + secure=true in production (HTTPS). For local
        // development (no HTTPS) fall back to SameSite='lax' so the cookie is
        // accepted by the browser. Keep path=/ so API endpoints can read it.
        const cookieOptions: any = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        };

        // If expires_in is provided use it to set maxAge (ms)
        if (session.expires_in) cookieOptions.maxAge = Number(session.expires_in) * 1000;

        res.cookie('refresh_token', session.refresh_token, cookieOptions);
        if (process.env.NODE_ENV !== 'production') {
          try {
            console.debug('Login: issued refresh_token cookie (dev):', {
              cookieOpts: cookieOptions,
              hasRefresh: !!session.refresh_token,
              refreshPreview: session.refresh_token ? `${String(session.refresh_token).slice(0, 12)}...` : null,
            });
          } catch (e) {
            // ignore logging failures
          }
        }
      }
    } catch (cookieErr) {
      console.warn('Failed to set refresh token cookie:', cookieErr);
    }

    // Also set a readable access_token cookie and user_role cookie so Next.js
    // middleware (server-side) can detect authenticated users. access_token is
    // intentionally NOT httpOnly so middleware can read it in the Edge runtime.
    try {
      if (session && session.access_token) {
        // readable access_token cookie: in production use SameSite=None and
        // Secure; in development use SameSite=Lax so the cookie will be stored
        // without HTTPS.
        const accessCookieOpts: any = {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        };
        if (session.expires_in) accessCookieOpts.maxAge = Number(session.expires_in) * 1000;
        res.cookie('access_token', session.access_token, accessCookieOpts);
      }

      // Expose a non-http-only user role cookie used by middleware for admin checks
      if (user && (user.role || 'user')) {
        // user_role is non-sensitive and kept readable. Use Lax in dev and
        // Lax in prod as it's only used by middleware/server-side checks.
        res.cookie('user_role', user.role || 'user', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });
        if (process.env.NODE_ENV !== 'production') {
          console.debug('Login: set user_role cookie to', user.role || 'user');
        }
      }
    } catch (cookieErr) {
      console.warn('Failed to set non-http cookies (access_token/user_role):', cookieErr);
    }

    res.json({ user, session });
  } catch (error: any) {
    res.status(401).json({ error: 'Login failed', message: error.message });
  }
});

// Refresh session using refresh token stored in httpOnly cookie (or body)
app.post('/api/v1/auth/refresh', async (req, res) => {
  try {
    // In production only accept the httpOnly cookie-supplied refresh token.
    // Accepting a refresh_token in the request body is only allowed for
    // local development convenience (e.g. when using the dev fallback).
    const refreshTokenFromCookie = req.cookies?.refresh_token;
    const refreshTokenFromBody = req.body?.refresh_token;

    // Diagnostics: log request details for debugging
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.debug('[DIAG] /api/v1/auth/refresh called', {
          method: req.method,
          url: req.originalUrl,
          origin: req.headers.origin,
          cookiePresent: !!refreshTokenFromCookie,
          bodyPresent: !!refreshTokenFromBody,
          cookies: req.cookies,
          headers: req.headers,
        });
      } catch (e) {
        // ignore
      }
    }

    const refreshToken = refreshTokenFromCookie || (process.env.NODE_ENV !== 'production' ? refreshTokenFromBody : undefined);

    if (!refreshToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[DIAG] /api/v1/auth/refresh: No refresh token provided', {
          cookies: req.cookies,
          headers: req.headers,
        });
      }
      return res.status(401).json({ error: 'No refresh token provided', message: 'Browser did not send refresh_token cookie. Check cookie settings, CORS, and browser dev tools.' });
    }

    // Use a single-flight promise keyed by the refresh token to coalesce
    // concurrent requests and avoid creating multiple refresh operations
    // against the auth provider which would rotate the refresh token.
    let session: any;
    if (refreshInFlight.has(refreshToken)) {
      session = await refreshInFlight.get(refreshToken);
    } else {
      const p = (async () => {
        try {
          return await (AuthService as any).refreshSession(refreshToken);
        } catch (err) {
          throw err;
        }
      })();
      refreshInFlight.set(refreshToken, p);
      try {
        session = await p;
      } finally {
        refreshInFlight.delete(refreshToken);
      }
    }
    // Session refreshed (no noisy debug logging here). If needed add
    // targeted logging in a follow-up change.

    // Rotate refresh token cookie if provided — but only when the token
    // returned by the auth provider differs from the one the client sent.
    // This avoids unnecessary cookie churn when multiple refresh requests
    // are processed in quick succession and the token hasn't actually
    // changed (or when the auth provider returns the same value).
    try {
      if (session && session.refresh_token) {
        const incomingRefresh = refreshTokenFromCookie || undefined;
        const outgoingRefresh = session.refresh_token;

        // Cookie options: SameSite/secure vary by environment
        const cookieOptions: any = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        };
        if (session.expires_in) cookieOptions.maxAge = Number(session.expires_in) * 1000;

        if (!incomingRefresh || incomingRefresh !== outgoingRefresh) {
          // Only set/rotate cookie when value differs (or doesn't exist)
          res.cookie('refresh_token', outgoingRefresh, cookieOptions);
          if (process.env.NODE_ENV !== 'production') {
            console.debug('/api/v1/auth/refresh: rotated refresh_token cookie (dev)', {
              cookieOpts: cookieOptions,
              hasRefresh: !!outgoingRefresh,
              refreshPreview: outgoingRefresh ? `${String(outgoingRefresh).slice(0, 12)}...` : null,
              incomingPreview: incomingRefresh ? `${String(incomingRefresh).slice(0, 12)}...` : null,
            });
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('/api/v1/auth/refresh: refresh_token unchanged — not rotating cookie (dev)', {
              incomingPreview: incomingRefresh ? `${String(incomingRefresh).slice(0, 12)}...` : null,
            });
          }
        }
      }
    } catch (cookieErr) {
      console.warn('Failed to set refresh token cookie during refresh:', cookieErr);
    }

    // Also rotate the readable access_token and user_role cookies
    try {
      if (session && session.access_token) {
        const accessCookieOpts: any = {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        };
        if (session.expires_in) accessCookieOpts.maxAge = Number(session.expires_in) * 1000;
        res.cookie('access_token', session.access_token, accessCookieOpts);
      }
      // Try to attach a user_role cookie when possible so server-side
      // middleware can make fast role checks without an extra DB lookup.
      try {
        // If we have an access token, use it to resolve the user id and
        // then fetch the application role using the service client.
        if (session && session.access_token) {
          try {
            const userResp: any = await supabase.auth.getUser(session.access_token);
            const userObj = userResp?.data?.user;
            if (userObj && userObj.id) {
              const roleResp: any = await supabaseAdmin.from('users').select('role').eq('id', userObj.id).single();
              const role = roleResp?.data?.role || (userObj as any).role || 'user';
              res.cookie('user_role', role, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              });
            }
          } catch (e) {
            // non-fatal: role lookup failed, continue without user_role
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (cookieErr) {
      console.warn('Failed to set access_token cookie during refresh:', cookieErr);
    }

    res.json({ session });
  } catch (error: any) {
    res.status(401).json({ error: 'Refresh failed', message: error.message });
  }
});

// Logout - revoke session on Supabase and clear refresh cookie
app.post('/api/v1/auth/logout', async (req, res) => {
  try {
    await AuthService.signOut();
    // Clear cookie
    res.clearCookie('refresh_token', { path: '/' });
    // Clear readable access_token and user_role cookies used by middleware
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('user_role', { path: '/' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Logout failed', message: error.message });
  }
});

// ==========================
// PUBLIC VPN ENDPOINTS
// ==========================

// Public servers
app.get('/api/v1/servers', async (req, res) => {
  try {
    const servers = await ServerRepository.getAllActive();
    res.json({ servers });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch servers', message: error.message });
  }
});

// VPN client configurations (public read, supports query param userId)
app.get('/api/v1/vpn/configs', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'Missing userId query parameter' });
    const configs = await ClientConfigRepository.getUserConfigs(userId as string);
    res.json({ configs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch client configs', message: error.message });
  }
});

// VPN usage (per-user total usage)
app.get('/api/v1/vpn/usage', async (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'Missing userId query parameter' });
    const usage = await ConnectionRepository.getUserDataUsage(userId as string);
    res.json({ usage });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch vpn usage', message: error.message });
  }
});

// ==========================
// USER ENDPOINTS (AUTH REQUIRED)
// ==========================

// Split-tunnel rules (user scoped). Prefer authenticated user but accept userId query for testing.
app.get('/api/v1/user/split-tunnel', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const rules = await SplitTunnelRepository.getUserRules(userId as string);
    res.json({ rules });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch split tunnel rules', message: error.message });
  }
});

// User (protected) routes
app.get('/api/v1/user/subscription', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const subscription = await SubscriptionRepository.getByUserId(req.user!.id);
    res.json({ subscription });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch subscription', message: error.message });
  }
});

app.get('/api/v1/user/devices', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const devices = await DeviceRepository.getUserDevices(req.user!.id);
    res.json({ devices });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch devices', message: error.message });
  }
});

app.get('/api/v1/user/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const servers = await ServerRepository.getAllActive();
    res.json({
      totalServers: servers.length,
      activeConnections: 0,
      totalUsers: 1,
      dataTransferred: '0 GB'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

app.get('/api/v1/user/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    res.json({ user: req.user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

// Notifications (user)
app.get('/api/v1/user/notifications', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const notifications = [] as any[];
    const unread_count = 0;
    res.json({ notifications, unread_count });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
});

app.put('/api/v1/user/notifications/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notification read', message: error.message });
  }
});

app.put('/api/v1/user/notifications/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notifications read', message: error.message });
  }
});

// User security & sessions
app.get('/api/v1/user/security/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const settings = await SecurityRepository.getByUserId(userId);
    res.json(settings || {});
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch security settings', message: error.message });
  }
});

// Update user's security settings (upsert)
app.put('/api/v1/user/security/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const payload = { ...req.body, user_id: userId };
    const updated = await SecurityRepository.upsert(payload as any);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update security settings', message: error.message });
  }
});

// Sessions (basic placeholders)
app.get('/api/v1/user/sessions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // If you have session storage, replace this with a real query. Return empty list for now.
    res.json([]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch sessions', message: error.message });
  }
});

app.delete('/api/v1/user/sessions/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    // Placeholder: revoke session by id if stored; respond success for now
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to revoke session', message: error.message });
  }
});

// ==========================
// ADMIN ENDPOINTS (AUTH + ADMIN REQUIRED)
// ==========================

// Platform statistics (admin)
app.get('/api/v1/admin/audit/logs', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const logs = await AuditRepository.getRecentCriticalEvents(48);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
});

// Admin security events (recent critical)
app.get('/api/v1/admin/security/events', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const events = await AuditRepository.getRecentCriticalEvents(24);
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch security events', message: error.message });
  }
});

// Admin: list users (simple implementation for dev)
app.get('/api/v1/admin/users', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    // In the absence of a dedicated users repository, return the current
    // authenticated user as a single-item list (useful for local dev).
    const userReq = req as AuthRequest;
    const user = userReq.user;
    if (!user) return res.json({ users: [] });
    res.json({ users: [{
      id: user.id,
      email: user.email,
      username: user.email?.split('@')[0] || '',
      subscription_tier: 'premium', // mock value
      is_active: true, // mock value
      max_devices: 3, // mock value
      updated_at: new Date().toISOString(),
      role: user.role || 'user'
    }] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// Admin: set user encryption placeholder (no-op in dev)
app.put('/api/v1/admin/users/:id/encryption', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { protocol_id } = req.body || {};
    // Placeholder: echo back the request for dev usage
    res.json({ success: true, id, protocol_id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to set encryption', message: error.message });
  }
});

// ==========================
// ORGANIZATION ENDPOINTS (AUTH + ADMIN REQUIRED)
// ==========================

// Get all organizations
app.get('/api/v1/admin/organizations', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('Organizations endpoint called by user:', req.user);
    // Use Supabase to get all organizations with counts
      const { data, error } = await (supabase as any)
        .from('organizations')
        .select(`
          *,
          users:users(count)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching organizations:', error);
      return res.status(500).json({ error: 'Database error', message: error.message });
    }

    // Transform the data to match the expected format
    const transformedOrganizations = (data as any[])?.map((org: any) => ({
      id: org.id,
      name: org.name,
      billing_tier: org.billing_tier,
      max_users: org.max_users,
      max_devices_per_user: org.max_devices_per_user,
      max_servers: org.max_servers,
      created_at: org.created_at,
      features: org.features || {},
      _count: {
        users: org.users?.[0]?.count || 0,
        servers: org.servers?.[0]?.count || 0
      }
    })) || [];

    console.log('Returning organizations:', transformedOrganizations.length);
    res.json({ organizations: transformedOrganizations });
  } catch (error: any) {
    console.error('Organizations endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch organizations', message: error.message });
  }
});

// Create new organization
app.post('/api/v1/admin/organizations', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, billing_tier, max_users, max_devices_per_user, max_servers } = req.body;
    console.log('Creating organization:', { name, billing_tier, user: req.user });
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Determine features based on billing tier
    const features = {
      advanced_analytics: billing_tier === 'enterprise',
      custom_domains: billing_tier === 'enterprise',
      priority_support: billing_tier === 'enterprise',
      multi_region: ['enterprise', 'business'].includes(billing_tier),
      api_access: ['enterprise', 'business'].includes(billing_tier)
    };

    // Insert into database
    const { data, error } = await (supabase as any)
      .from('organizations')
      .insert({
        name,
        billing_tier: billing_tier || 'enterprise',
        max_users: max_users || 100,
        max_devices_per_user: max_devices_per_user || 10,
        max_servers: max_servers || 50,
        features
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating organization:', error);
      return res.status(500).json({ error: 'Database error', message: error.message });
    }

    // Add _count property for frontend compatibility
    const organizationWithCount = {
      ...(data as any),
      _count: {
        users: 0,
        servers: 0
      }
    };

    console.log('Organization created:', organizationWithCount.id);
    res.json(organizationWithCount);
  } catch (error: any) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization', message: error.message });
  }
});

// Get organization by ID
app.get('/api/v1/admin/organizations/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    console.log('Get organization:', { id, user: req.user });
    // Mock organization - replace with real database query
    const organization = {
      id,
      name: 'Sample Organization',
      billing_tier: 'enterprise',
      max_users: 100,
      max_devices_per_user: 10,
      max_servers: 50,
      created_at: new Date().toISOString(),
      features: { 
        advanced_analytics: true, 
        custom_domains: true,
        priority_support: true
      }
    };
    res.json({ organization });
  } catch (error: any) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to fetch organization', message: error.message });
  }
});

// Update organization
app.put('/api/v1/admin/organizations/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('Update organization:', { id, updates, user: req.user });
    // Mock update - replace with real database update
    const organization = {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };
    res.json({ organization });
  } catch (error: any) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Failed to update organization', message: error.message });
  }
});

// Delete organization
app.delete('/api/v1/admin/organizations/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    console.log('Delete organization:', { id, user: req.user });
    // Mock delete - replace with real database delete
    res.json({ success: true, id, message: 'Organization deleted successfully' });
  } catch (error: any) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: 'Failed to delete organization', message: error.message });
  }
});

// Get organization members
app.get('/api/v1/admin/organizations/:orgId/members', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { orgId } = req.params;
    console.log('Get organization members:', { orgId, user: req.user });
    // Get members from database
    const { data, error } = await (supabase as any)
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching members:', error);
      return res.status(500).json({ error: 'Database error', message: error.message });
    }

    // Transform to expected format
    const transformedMembers = (data as any[])?.map((member: any) => ({
      id: member.id,
      email: member.email,
      full_name: member.full_name,
      role: member.role || 'user',
      status: 'active', // You might want to add a status field to your users table
      created_at: member.created_at
    })) || [];

    res.json({ members: transformedMembers });
  } catch (error: any) {
    console.error('Get organization members error:', error);
    res.status(500).json({ error: 'Failed to fetch organization members', message: error.message });
  }
});

// Invite member to organization
app.post('/api/v1/admin/organizations/:orgId/members', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { orgId } = req.params;
    const { email, role, full_name } = req.body;
    console.log('Invite member:', { orgId, email, role, full_name, user: req.user });
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const { data: existingUser } = await (supabase as any)
      .from('users')
      .select('id, email, organization_id, full_name')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Update existing user's organization and role
      const { data: updatedUser, error: updateError } = await (supabase as any)
        .from('users')
        .update({
          organization_id: orgId,
          role: role || 'user',
          full_name: full_name || existingUser.full_name
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Database error updating user:', updateError);
        return res.status(500).json({ error: 'Database error', message: updateError.message });
      }

      const member = {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        status: 'active',
        created_at: updatedUser.created_at
      };

      return res.json({ member, message: 'User added to organization' });
    } else {
      // Create new user invitation (you might want to create an invitations table)
      // For now, we'll create a placeholder response
      const member = {
        id: 'invite-' + Date.now(),
        email,
        full_name: full_name || '',
        role: role || 'user',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      res.json({ member, message: 'Invitation sent successfully' });
    }
  } catch (error: any) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Failed to invite member', message: error.message });
  }
});

// Update organization member
app.put('/api/v1/admin/organizations/:orgId/members/:memberId', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { orgId, memberId } = req.params;
    const { role } = req.body;
    console.log('Update member role:', { orgId, memberId, role, user: req.user });

    // Update user role in database
    const { data: updatedMember, error } = await (supabase as any)
      .from('users')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating member:', error);
      return res.status(500).json({ error: 'Database error', message: error.message });
    }

    const member = {
      id: updatedMember.id,
      email: updatedMember.email,
      full_name: updatedMember.full_name,
      role: updatedMember.role,
      status: 'active',
      created_at: updatedMember.created_at
    };

    res.json({ member });
  } catch (error: any) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member', message: error.message });
  }
});

// Remove member from organization
app.delete('/api/v1/admin/organizations/:orgId/members/:memberId', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { orgId, memberId } = req.params;
    console.log('Remove member:', { orgId, memberId, user: req.user });

    // Remove user from organization by setting organization_id to null
    const { error } = await (supabase as any)
      .from('users')
      .update({ organization_id: null })
      .eq('id', memberId)
      .eq('organization_id', orgId);

    if (error) {
      console.error('Database error removing member:', error);
      return res.status(500).json({ error: 'Database error', message: error.message });
    }

    res.json({ success: true, memberId, message: 'Member removed successfully' });
  } catch (error: any) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member', message: error.message });
  }
});

// ==========================
// ANALYTICS & SECURITY ENDPOINTS
// ==========================

// Threat protection: stats endpoint
app.get('/api/v1/security/threats/stats', async (req, res) => {
  try {
    // TODO: Replace with real DB query for threat stats in production
    // For now, return mock stats for development/testing
    const { range } = req.query;
    const stats = {
      totalThreats: 5,
      blocked: 3,
      severity: {
        critical: 2,
        warning: 2,
        info: 1,
      },
      range: range || 'today',
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threat stats', message: (error as any).message });
  }
});

// Threat protection: recent threats endpoint
app.get('/api/v1/security/threats/recent', async (req, res) => {
  try {
    // TODO: Replace with real DB query for recent threats in production
    // For now, return mock data for development/testing
    const { limit } = req.query;
    const threats = [
      {
        id: 't1',
        type: 'malware',
        severity: 'critical',
        detected_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        status: 'blocked',
        description: 'Malware detected and blocked',
      },
      {
        id: 't2',
        type: 'phishing',
        severity: 'warning',
        detected_at: new Date(Date.now() - 7200 * 1000).toISOString(),
        status: 'blocked',
        description: 'Phishing attempt blocked',
      }
    ];
    res.json({ threats: threats.slice(0, Number(limit) || 50) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent threats', message: (error as any).message });
  }
});

// Analytics: return connection data for dashboard analytics page
app.get('/api/v1/connections', async (req, res) => {
  try {
    // TODO: Replace with real DB query for all connections in production
    // For now, return a mock list for development/testing
    const connections = [
      {
        id: 'c1',
        user_id: '1',
        server_id: 's1',
        status: 'connected',
        connected_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        disconnected_at: null,
        data_uploaded_mb: 120,
        data_downloaded_mb: 340,
        ip_address: '192.168.1.10',
      },
      {
        id: 'c2',
        user_id: '2',
        server_id: 's2',
        status: 'disconnected',
        connected_at: new Date(Date.now() - 7200 * 1000).toISOString(),
        disconnected_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        data_uploaded_mb: 80,
        data_downloaded_mb: 150,
        ip_address: '192.168.1.11',
      }
    ];
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connections', message: (error as any).message });
  }
});

// Clients: return all users for dashboard client page
app.get('/api/v1/users', async (req, res) => {
  try {
    // TODO: Replace with real DB query for all users in production
    // For now, return a mock list for development/testing
    const users = [
      {
        id: '1',
        email: 'alice@example.com',
        username: 'alice',
        subscription_tier: 'premium',
        is_active: true,
        max_devices: 3,
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        email: 'bob@example.com',
        username: 'bob',
        subscription_tier: 'free',
        is_active: false,
        max_devices: 1,
        updated_at: new Date().toISOString(),
      }
    ];
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', message: (error as any).message });
  }
});

// ==========================
// DEBUG & DEVELOPMENT ENDPOINTS
// ==========================

// Debug route to list all registered routes at the end, after all other routes but before error handling and 404
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/v1/debug/routes', (req, res) => {
    try {
      const appKeys = Object.keys(app);
      console.log('[DIAG] Express app keys:', appKeys);
      let router = (app as any)._router || (app as any).router;
      if (!router || !router.stack) {
        return res.status(500).json({
          error: 'Router stack not available',
          message: 'Neither app._router nor app.router is available',
          appKeys
        });
      }
      const routes: any[] = [];
      router.stack.forEach((middleware: any) => {
        if (middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods)
          });
        } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
          middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
              routes.push({
                path: handler.route.path,
                methods: Object.keys(handler.route.methods)
              });
            }
          });
        }
      });
      res.json({ routes });
    } catch (err: any) {
      console.error('Error in /api/v1/debug/routes:', err);
      res.status(500).json({ error: 'Failed to list routes', message: err.message });
    }
  });
}

// ==========================
// ERROR HANDLING
// ==========================

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export default app;