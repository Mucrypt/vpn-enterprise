import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import {
  VPNServerManager,
  ServerLoadBalancer,
  ConnectionTracker,
} from '@vpn-enterprise/vpn-core'
import {
  AuthService,
  authMiddleware,
  adminMiddleware,
  AuthRequest,
} from '@vpn-enterprise/auth'
import { Pool } from 'pg'
import {
  ServerRepository,
  SubscriptionRepository,
  DeviceRepository,
  ConnectionRepository,
  ClientConfigRepository,
  SplitTunnelRepository,
  supabase,
  supabaseAdmin,
} from '@vpn-enterprise/database'
import { AuditRepository, SecurityRepository } from '@vpn-enterprise/database'
import { DatabasePlatformClient } from './database-platform-client'
import { hostingRouter } from './routes/hosting'
import { tenantsRouter } from './routes/tenants'
import { registerGeneratedAppsRoutes } from './routes/generated-apps'
import { registerBillingRoutes } from './routes/billing'
import adminUsersRouter from './routes/admin/users'
import adminTenantsRouter from './routes/admin/tenants'
import terminalRouter from './routes/terminal'
import { TerminalWebSocketHandler } from './services/TerminalWebSocketHandler'
import { previewProxyService } from './services/PreviewProxyService'
import { ApolloServer, gql } from 'apollo-server-express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { resolveSecret } from './utils/secrets'
import Redis from 'ioredis'
import promClient from 'prom-client'
// Realtime subscriptions (scaffold) - temporarily disabled for Supabase migration
// import { PostgresSubscriptionEngine } from '@vpn-enterprise/realtime/src/postgres-subscriptions';

// Load environment variables from repo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const app = express()
console.log('[DIAG] Express app constructed')
// Behind Vercel/Proxies: trust X-Forwarded-* / Forwarded headers for req.ip
app.set('trust proxy', 1)
const vpnManager = new VPNServerManager()
const loadBalancer = new ServerLoadBalancer()
const connectionTracker = new ConnectionTracker()
const dbPlatform = new DatabasePlatformClient()

// Security middleware
app.use(helmet())

// Configure CORS: read comma-separated origins from ALLOWED_ORIGINS.
// For backward compatibility, CORS_ORIGINS is also accepted.
// If neither provided, fall back to common local dev origins.
const allowedOriginsRaw =
  process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS || ''

const allowedOrigins = allowedOriginsRaw
  ? allowedOriginsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : [
      'https://vpn-enterprise-dashboard.vercel.app',
      'http://localhost:3000',
      'http://localhost:5000',
    ]

// Helpful startup log to diagnose CORS problems in deployed environments.
console.log('CORS allowed origins:', allowedOrigins)

// Shared CORS options so both normal requests and preflight (OPTIONS) are handled
const corsOptions: cors.CorsOptions = {
  // Be explicit and permissive about the headers we accept from browsers
  // to prevent preflight failures on Vercel/production.
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'apikey',
    'x-client-info',
    'x-csrf-token',
    'x-requested-with',
    'Accept',
    'Origin',
    'User-Agent',
    'Cookie',
  ],
  // Explicitly declare methods so the preflight response includes them
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Authorization'],
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl, or some native apps)
    if (!origin) return callback(null, true)

    // During local development allow any localhost origin (convenience for multiple dev servers/ports)
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true)
    }

    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true)

    // Allow Vercel preview deployments for the dashboard (e.g. *.vercel.app
    // containing the dashboard project name) so preview URLs can call the API.
    try {
      const url = new URL(origin)
      const host = url.hostname
      const isVercelPreview =
        host.endsWith('.vercel.app') &&
        host.includes('vpn-enterprise-dashboard')
      if (isVercelPreview) return callback(null, true)
    } catch (_) {
      // ignore parse failure
    }
    console.warn('Blocked CORS request from origin:', origin)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  optionsSuccessStatus: 204,
}

// Apply CORS for all routes and ensure OPTIONS preflights are answered with proper headers
app.use(cors(corsOptions))
// Express 5 doesn't accept bare "*" path; use a regex to match all paths
app.options(/.*/, cors(corsOptions))

// Rate limiting
// Protect the app from excessive requests but return JSON errors and avoid
// blocking auth/debug endpoints which are used during login/hydration flows.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // Add standard rate-limit response headers
  standardHeaders: true,
  legacyHeaders: false,
  // Use library-provided helper to properly normalize IPv6/IPv4
  keyGenerator: (req: any) => ipKeyGenerator(req),
  // Skip rate limiting for auth endpoints and dev debug endpoint to avoid
  // accidental lockouts during normal login flows in local development.
  skip: (req: any) => {
    try {
      return (
        req.path.startsWith('/api/v1/auth') ||
        req.path.startsWith('/api/v1/debug')
      )
    } catch (e) {
      return false
    }
  },
  // Return a structured JSON error so clients can handle 429 programmatically
  handler: (req, res /*, next */) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    })
  },
})
// Apply rate limiter only in production to avoid accidental lockouts
// during local development where HMR and frequent client reloads can
// easily trigger the limiter. In production this remains enabled.
if (process.env.NODE_ENV === 'production') {
  app.use(limiter)
} else {
  console.debug('Rate limiter is disabled in development')
}

// Body parsing
app.use(express.json({ limit: '10mb' }))
// Cookies (used for refresh token cookie)
app.use(cookieParser())

// Simple audit logger for admin mutations (best-effort, non-blocking)
async function auditLog(
  eventType: string,
  description: string,
  severity: 'info' | 'warning' | 'critical' = 'info',
  metadata?: any,
  userId?: string,
) {
  try {
    const client = await dbPlatform.platformPool.connect()
    try {
      await client.query(
        `
        INSERT INTO security_audit_log (
          user_id, event_type, event_description, severity, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `,
        [
          userId || null,
          eventType,
          description,
          severity,
          JSON.stringify(metadata || null),
        ],
      )
    } finally {
      client.release()
    }
  } catch (e) {
    // Do not throw; audit should never break the main flow
    console.warn(
      '[auditLog] Failed to insert audit log:',
      (e as any)?.message || e,
    )
  }
}

// ==========================
// PUBLIC ENDPOINTS
// ==========================

// Root + favicon handlers to avoid noisy 404s on Vercel
app.get('/', (req, res) => {
  res.status(200).json({ ok: true, service: 'vpn-enterprise-api' })
})
app.get(['/favicon.ico', '/favicon.png'], (req, res) => {
  res.status(204).end()
})

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vpn-enterprise-api',
    version: '1.0.0',
  })
})

// Debug endpoint to check database connections
app.get('/api/v1/debug/connections', async (req, res) => {
  try {
    const dbClient = new DatabasePlatformClient()

    // Clear all cached connections
    console.log('[DEBUG] Clearing connection cache...')
    await dbClient.clearCache()

    // Get fresh tenant info
    const tenantId = '4ea48c83-2286-42b1-b1d8-f0ac529c5d20'
    console.log('[DEBUG] Testing connection for tenant:', tenantId)
    const result = await dbClient.executeQuery(
      tenantId,
      'SELECT current_database(), current_user, inet_server_port(), version()',
    )

    res.json({
      message: 'Connection test complete',
      result: result.results[0]?.rows[0],
      cachedConnections: Array.from(dbClient.tenantConnections.keys()),
    })
  } catch (error) {
    console.error('Debug connection test failed:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
})

// Hosting routes
app.use('/api/v1/hosting', hostingRouter)
// Tenants routes (scaffold)
app.use('/api/v1/tenants', tenantsRouter)
// Billing routes - protected by auth
registerBillingRoutes(app)
// Generated Apps routes (NexusAI integration) - protected by auth
const generatedAppsRouter = express.Router()
registerGeneratedAppsRoutes(generatedAppsRouter)
app.use('/api/v1/generated-apps', authMiddleware, generatedAppsRouter)
// Admin routes
app.use('/api/v1/admin', adminUsersRouter)
app.use('/api/v1/admin/tenants', adminTenantsRouter)
// Terminal routes (NexusAI integration) - protected by auth
app.use('/api/terminal', terminalRouter)

// NOTE: UnifiedDataAPI routes are intentionally not mounted here.
// The production tenant API surface is consolidated under `routes/tenants.ts`
// with strict auth + tenant membership enforcement.

/*
// GraphQL basic schema (placeholder) and server
async function initGraphQL() {
  // Dynamic schema (basic): introspect tenants
  const client = await dbPlatform.platformPool.connect();
  let tables: string[] = [];
  try {
    const result = await client.query('SELECT name FROM tenants WHERE status = $1 LIMIT 50', ['active']);
    tables = result.rows.map((row: any) => row.name);
  } finally {
    client.release();
  }
  const typeDefs = gql`
    scalar JSON
    type Query {
      _health: String
      databases: [String]
    }
  `;
  const resolvers = {
    Query: {
      _health: () => 'ok',
      databases: () => tables
    }
  };
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app: app as any, path: '/api/v1/graphql' });
  console.log('[INIT] GraphQL endpoint mounted at /api/v1/graphql');
}
initGraphQL().catch(err => console.warn('[INIT] GraphQL failed:', err));
*/

// WebSocket + Redis + logical replication scaffold
const httpServer = createServer(app)

// Initialize Terminal WebSocket Handler for NexusAI terminal sessions
const terminalWSHandler = new TerminalWebSocketHandler(httpServer)
console.log('[INIT] Terminal WebSocket Handler initialized')

// Handle WebSocket upgrades for preview proxy (HMR support)
httpServer.on('upgrade', (req, socket, head) => {
  const pathname = req.url?.split('?')[0]

  // Route to appropriate WebSocket handler
  if (pathname?.startsWith('/api/v1/terminal/preview/')) {
    previewProxyService.handleUpgrade(req, socket, head)
  }
  // Other WebSocket paths handled by their respective handlers
})

const wss = new WebSocketServer({
  server: httpServer,
  path: '/api/v1/realtime',
})

class InMemoryRedisFallback {
  private store: Map<string, string> = new Map()
  publish(channel: string, message: string) {
    if (process.env.NODE_ENV !== 'production')
      console.debug('[REDIS-FALLBACK publish]', channel, message)
    return Promise.resolve(1)
  }
  hset(key: string, field: string, value: string) {
    this.store.set(`${key}:${field}`, value)
    return Promise.resolve(1)
  }
  on() {
    /* noop */
  }
}

let redis: any
// Auto-disable Redis in Vercel serverless environment or when explicitly disabled
if (process.env.REALTIME_DISABLE_REDIS === '1' || process.env.VERCEL === '1') {
  redis = new InMemoryRedisFallback()
  console.log(
    '[INIT] Redis disabled (Vercel serverless environment), using in-memory fallback',
  )
} else {
  try {
    const redisUrl = (() => {
      if (process.env.REDIS_URL && process.env.REDIS_URL.trim().length)
        return process.env.REDIS_URL.trim()

      const host = process.env.REDIS_HOST || 'localhost'
      const port = process.env.REDIS_PORT || '6379'
      const password = resolveSecret({
        valueEnv: 'REDIS_PASSWORD',
        fileEnv: 'REDIS_PASSWORD_FILE',
        defaultFilePath: '/run/secrets/redis_password',
      })

      if (password) {
        return `redis://:${encodeURIComponent(password)}@${host}:${port}`
      }

      return `redis://${host}:${port}`
    })()

    redis = new Redis(redisUrl)
    redis.on('error', (err: any) => {
      console.warn('[REDIS] error:', err?.message || err)
    })
  } catch (e) {
    console.warn(
      '[INIT] Redis init failed, falling back to in-memory stub:',
      (e as any)?.message || e,
    )
    redis = new InMemoryRedisFallback()
  }
}
// Subscription engine temporarily disabled for Supabase migration
// const subscriptionEngine = new PostgresSubscriptionEngine();
// Initialize subscription engine later when pg pool available (placeholder)
console.log('[INIT] WebSocket realtime scaffold ready (realtime disabled)')

// Introspection endpoint (dev + admin) lists active subscriptions
app.get('/api/v1/realtime/subscriptions', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  try {
    // Subscriptions temporarily disabled for Supabase migration
    const list: any[] = [] // subscriptionEngine.listSubscriptions();
    res.json({
      subscriptions: list,
      message: 'Realtime subscriptions temporarily disabled',
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) })
  }
})

// Mock event broadcast (dev only) to simulate INSERT/UPDATE/DELETE
app.post('/api/v1/realtime/mock', (req, res) => {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.REALTIME_DEV_ALLOW !== '1'
  ) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  // Simple admin token check
  const adminHeader = req.headers['x-admin-token']
  if (
    !process.env.ADMIN_API_TOKEN ||
    adminHeader !== process.env.ADMIN_API_TOKEN
  ) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { tenantId, table, op, row } = req.body || {}
  if (!tenantId || !table || !op) {
    return res.status(400).json({ error: 'tenantId, table, op required' })
  }
  const validOps = ['INSERT', 'UPDATE', 'DELETE']
  if (!validOps.includes(op))
    return res.status(400).json({ error: 'Invalid op' })
  // subscriptionEngine.broadcastMockEvent(tenantId, table, op, row || {} ) // disabled for Supabase migration
  // Temporary stub response
  res.json({ ok: true, message: 'Realtime broadcasting temporarily disabled' })
})

// Dev mock interval broadcaster (optional) - temporarily disabled for Supabase migration
// if (process.env.REALTIME_DEV_MOCK === '1' && process.env.NODE_ENV !== 'production') {
//   setInterval(() => {
//     const subs = subscriptionEngine.listSubscriptions();
//     for (const s of subs) {
//       const [tenantId, tbl] = s.key.split(':');
//       subscriptionEngine.broadcastMockEvent(tenantId, tbl, 'UPDATE', { id: Math.random(), demo: true, ts: new Date().toISOString() });
//     }
//   }, 30000);
//   console.log('[INIT] Dev mock broadcaster enabled');
// }

wss.on('connection', async (socket, req) => {
  // Basic auth: expect ?tenantId=&token=
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const tenantId = url.searchParams.get('tenantId')
  const token = url.searchParams.get('token')
  if (!tenantId || !token) {
    socket.close(1008, 'Unauthorized')
    return
  }
  // Validate token via database platform
  try {
    const devBypass =
      process.env.REALTIME_DEV_ALLOW === '1' &&
      process.env.NODE_ENV !== 'production'
    // For now, extract user ID from token (implement proper JWT validation later)
    let userId = null
    if (token && !devBypass) {
      // TODO: Implement proper JWT token validation
      // For now, accept any non-empty token in development
      userId = 'temp-user-id'
    }
    if (!userId && !devBypass) {
      socket.close(1008, 'Unauthorized')
      return
    }
    // Verify tenant membership
    try {
      if (typeof userId === 'string') {
        const membership = await dbPlatform.getUserById(userId)
        // If using a tenants mapping table, replace this check accordingly
        if (!membership && !devBypass) {
          socket.close(1008, 'Unauthorized')
          return
        }
      } else if (!devBypass) {
        socket.close(1008, 'Unauthorized')
        return
      }
    } catch {}
    // Immediate welcome echo so frontend can verify connectivity
    socket.send(JSON.stringify({ hello: 'realtime-connected', tenantId }))
    // Handle simple subscription messages from client
    socket.on('message', async (data: any) => {
      try {
        const msg = JSON.parse(String(data))
        if (msg && msg.action === 'subscribe' && msg.table) {
          // Subscriptions temporarily disabled for Supabase migration
          // const key = await subscriptionEngine.createSubscription(tenantId, msg.table, msg.filter || {}, (socket as any));
          const key = 'disabled'
          socket.send(
            JSON.stringify({
              ok: true,
              subscribed: key,
              message: 'Realtime subscriptions temporarily disabled',
            }),
          )
        } else if (msg && msg.action === 'unsubscribe' && msg.table) {
          // const key = await subscriptionEngine.unsubscribe(tenantId, msg.table, (socket as any));
          const key = 'disabled'
          socket.send(
            JSON.stringify({
              ok: true,
              unsubscribed: key,
              message: 'Realtime subscriptions temporarily disabled',
            }),
          )
        } else {
          socket.send(
            JSON.stringify({ ok: false, error: 'Unsupported message' }),
          )
        }
      } catch (e: any) {
        try {
          socket.send(
            JSON.stringify({ ok: false, error: e.message || String(e) }),
          )
        } catch {}
      }
    })
    // Heartbeat interval (every 25s)
    const interval = setInterval(() => {
      try {
        socket.send(
          JSON.stringify({ type: 'heartbeat', ts: new Date().toISOString() }),
        )
      } catch {}
    }, 25000)
    socket.on('close', () => clearInterval(interval))
  } catch {
    socket.close(1008, 'Unauthorized')
  }
})

// Export httpServer for index bootstrap to listen (instead of app directly)
;(app as any)._httpServer = httpServer

// Prometheus metrics
promClient.collectDefaultMetrics()
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType)
    res.end(await promClient.register.metrics())
  } catch (e: any) {
    res.status(500).send(e.message)
  }
})

// Dev debug endpoint: inspect incoming auth headers and cookies
// Only registered in non-production to help debug CORS/auth problems during local development.
if (process.env.NODE_ENV !== 'production') {
  console.log('[DIAG] Registering /api/v1/debug/routes endpoint')
  app.post('/api/v1/debug/request', (req, res) => {
    try {
      const authHeader = req.headers.authorization || null
      const cookies = req.cookies || {}
      // Return presence flags and truncated token for safe debugging
      const tokenPreview =
        typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
          ? `${authHeader.substring(0, 30)}...`
          : null
      res.json({
        ok: true,
        method: req.method,
        origin: req.headers.origin || null,
        hasAuthorizationHeader: !!authHeader,
        authorizationPreview: tokenPreview,
        cookiesPresent: Object.keys(cookies),
      })
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) })
    }
  })
}

// ==========================
// AUTH ENDPOINTS
// ==========================

// In-memory single-flight map for refresh operations initiated via the
// /api/v1/auth/refresh endpoint. This prevents multiple parallel refreshes
// from rotating the refresh token repeatedly when many requests trigger
// client-side refreshes at the same time.
const refreshInFlight: Map<string, Promise<any>> = new Map()

app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const user = await AuthService.signUp(email, password)
    res.status(201).json({ user, message: 'User created successfully' })
  } catch (error: any) {
    const cause: any = error?.cause
    const causeCode = cause?.code || error?.code
    const causeMsg = String(cause?.message || error?.message || '')
    const supabaseStatus =
      typeof error?.status === 'number'
        ? error.status
        : typeof cause?.status === 'number'
          ? cause.status
          : undefined
    const supabaseCode = String(error?.code || cause?.code || '')

    if (process.env.NODE_ENV !== 'production') {
      try {
        console.error('[AUTH] Signup failed', {
          message: String(error?.message || ''),
          supabaseStatus,
          supabaseCode,
          causeCode,
          causeMsg,
        })
      } catch {
        // ignore logging errors
      }
    }

    if (
      causeCode === 'ENOTFOUND' ||
      causeCode === 'EAI_AGAIN' ||
      /getaddrinfo\s+ENOTFOUND/i.test(causeMsg) ||
      /fetch failed/i.test(causeMsg)
    ) {
      return res.status(502).json({
        error: 'Signup failed',
        message:
          'Cannot reach Supabase (DNS/network error). Verify internet/DNS and SUPABASE_URL is correct.',
      })
    }

    // Common Supabase auth errors
    if (supabaseStatus === 429) {
      return res.status(429).json({
        error: 'Signup failed',
        message: 'Too many signup attempts. Please wait and try again.',
      })
    }

    if (
      /user already registered/i.test(causeMsg) ||
      /already\s+registered/i.test(causeMsg) ||
      supabaseCode === 'user_already_exists'
    ) {
      return res.status(409).json({
        error: 'Signup failed',
        message: 'User already exists. Please sign in instead.',
      })
    }

    if (/signups?\s+not\s+allowed/i.test(causeMsg)) {
      return res.status(403).json({
        error: 'Signup failed',
        message:
          'Signups are disabled in Supabase Auth settings. Enable signups or create users in the dashboard.',
      })
    }

    res.status(400).json({ error: 'Signup failed', message: error.message })
  }
})

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    // AuthService may have differing type shapes depending on package builds; cast to any to remain flexible
    const signInResult: any = await (AuthService as any).signIn(email, password)
    const user = signInResult?.user || signInResult
    const session =
      signInResult?.session || (await (AuthService as any).getSession())

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
        }

        // If expires_in is provided use it to set maxAge (ms)
        if (session.expires_in)
          cookieOptions.maxAge = Number(session.expires_in) * 1000

        res.cookie('refresh_token', session.refresh_token, cookieOptions)
        if (process.env.NODE_ENV !== 'production') {
          try {
            console.debug('Login: issued refresh_token cookie (dev):', {
              cookieOpts: cookieOptions,
              hasRefresh: !!session.refresh_token,
              refreshPreview: session.refresh_token
                ? `${String(session.refresh_token).slice(0, 12)}...`
                : null,
            })
          } catch (e) {
            // ignore logging failures
          }
        }
      }
    } catch (cookieErr) {
      console.warn('Failed to set refresh token cookie:', cookieErr)
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
        }
        if (session.expires_in)
          accessCookieOpts.maxAge = Number(session.expires_in) * 1000
        res.cookie('access_token', session.access_token, accessCookieOpts)
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
        })
        if (process.env.NODE_ENV !== 'production') {
          console.debug('Login: set user_role cookie to', user.role || 'user')
        }
      }
    } catch (cookieErr) {
      console.warn(
        'Failed to set non-http cookies (access_token/user_role):',
        cookieErr,
      )
    }

    res.json({ user, session })
  } catch (error: any) {
    const cause: any = error?.cause
    const causeCode = cause?.code || error?.code
    const causeMsg = String(cause?.message || error?.message || '')
    if (
      causeCode === 'ENOTFOUND' ||
      causeCode === 'EAI_AGAIN' ||
      /getaddrinfo\s+ENOTFOUND/i.test(causeMsg) ||
      /fetch failed/i.test(causeMsg)
    ) {
      return res.status(502).json({
        error: 'Login failed',
        message:
          'Cannot reach Supabase (DNS/network error). Verify internet/DNS and SUPABASE_URL is correct.',
      })
    }

    res.status(401).json({ error: 'Login failed', message: error.message })
  }
})

// Refresh session using refresh token stored in httpOnly cookie (or body)
app.post('/api/v1/auth/refresh', async (req, res) => {
  try {
    // In production only accept the httpOnly cookie-supplied refresh token.
    // Accepting a refresh_token in the request body is only allowed for
    // local development convenience (e.g. when using the dev fallback).
    const refreshTokenFromCookie = req.cookies?.refresh_token
    const refreshTokenFromBody = req.body?.refresh_token

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
        })
      } catch (e) {
        // ignore
      }
    }

    const refreshToken =
      refreshTokenFromCookie ||
      (process.env.NODE_ENV !== 'production' ? refreshTokenFromBody : undefined)

    if (!refreshToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[DIAG] /api/v1/auth/refresh: No refresh token provided', {
          cookies: req.cookies,
          headers: req.headers,
        })
      }
      return res.status(401).json({
        error: 'No refresh token provided',
        message:
          'Browser did not send refresh_token cookie. Check cookie settings, CORS, and browser dev tools.',
      })
    }

    // Use a single-flight promise keyed by the refresh token to coalesce
    // concurrent requests and avoid creating multiple refresh operations
    // against the auth provider which would rotate the refresh token.
    let session: any
    if (refreshInFlight.has(refreshToken)) {
      session = await refreshInFlight.get(refreshToken)
    } else {
      const p = (async () => {
        try {
          return await (AuthService as any).refreshSession(refreshToken)
        } catch (err) {
          throw err
        }
      })()
      refreshInFlight.set(refreshToken, p)
      try {
        session = await p
      } finally {
        refreshInFlight.delete(refreshToken)
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
        const incomingRefresh = refreshTokenFromCookie || undefined
        const outgoingRefresh = session.refresh_token

        // Cookie options: SameSite/secure vary by environment
        const cookieOptions: any = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        }
        if (session.expires_in)
          cookieOptions.maxAge = Number(session.expires_in) * 1000

        if (!incomingRefresh || incomingRefresh !== outgoingRefresh) {
          // Only set/rotate cookie when value differs (or doesn't exist)
          res.cookie('refresh_token', outgoingRefresh, cookieOptions)
          if (process.env.NODE_ENV !== 'production') {
            console.debug(
              '/api/v1/auth/refresh: rotated refresh_token cookie (dev)',
              {
                cookieOpts: cookieOptions,
                hasRefresh: !!outgoingRefresh,
                refreshPreview: outgoingRefresh
                  ? `${String(outgoingRefresh).slice(0, 12)}...`
                  : null,
                incomingPreview: incomingRefresh
                  ? `${String(incomingRefresh).slice(0, 12)}...`
                  : null,
              },
            )
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.debug(
              '/api/v1/auth/refresh: refresh_token unchanged — not rotating cookie (dev)',
              {
                incomingPreview: incomingRefresh
                  ? `${String(incomingRefresh).slice(0, 12)}...`
                  : null,
              },
            )
          }
        }
      }
    } catch (cookieErr) {
      console.warn(
        'Failed to set refresh token cookie during refresh:',
        cookieErr,
      )
    }

    // Also rotate the readable access_token and user_role cookies
    try {
      if (session && session.access_token) {
        const accessCookieOpts: any = {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        }
        if (session.expires_in)
          accessCookieOpts.maxAge = Number(session.expires_in) * 1000
        res.cookie('access_token', session.access_token, accessCookieOpts)
      }
      // Try to attach a user_role cookie when possible so server-side
      // middleware can make fast role checks without an extra DB lookup.
      try {
        // If we have an access token, use it to resolve the user id and
        // then fetch the application role using the service client.
        if (session && session.access_token) {
          try {
            // Get user from database platform
            const userObj = await dbPlatform.getUserById(session.user_id)
            if (userObj && userObj.id) {
              const role = userObj.role || 'user'
              res.cookie('user_role', role, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              })
            }
          } catch (e) {
            // non-fatal: role lookup failed, continue without user_role
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (cookieErr) {
      console.warn(
        'Failed to set access_token cookie during refresh:',
        cookieErr,
      )
    }

    res.json({ session })
  } catch (error: any) {
    res.status(401).json({ error: 'Refresh failed', message: error.message })
  }
})

// Logout - clear session and refresh cookie
app.post('/api/v1/auth/logout', async (req, res) => {
  try {
    await AuthService.signOut()
    // Clear cookie
    res.clearCookie('refresh_token', { path: '/' })
    // Clear readable access_token and user_role cookies used by middleware
    res.clearCookie('access_token', { path: '/' })
    res.clearCookie('user_role', { path: '/' })
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: 'Logout failed', message: error.message })
  }
})

// ==========================
// PUBLIC VPN ENDPOINTS
// ==========================

// Public servers
app.get('/api/v1/servers', async (req, res) => {
  try {
    const servers = await ServerRepository.getAllActive()
    res.json({ servers })
  } catch (error: any) {
    res
      .status(500)
      .json({ error: 'Failed to fetch servers', message: error.message })
  }
})

// VPN client configurations (public read, supports query param userId)
app.get('/api/v1/vpn/configs', async (req, res) => {
  try {
    const userId = String(req.query.userId || '')
    if (!userId)
      return res.status(400).json({ error: 'Missing userId query parameter' })
    const configs = await ClientConfigRepository.getUserConfigs(
      userId as string,
    )
    res.json({ configs })
  } catch (error: any) {
    res
      .status(500)
      .json({ error: 'Failed to fetch client configs', message: error.message })
  }
})

// VPN usage (per-user total usage)
app.get('/api/v1/vpn/usage', async (req, res) => {
  try {
    const userId = String(req.query.userId || '')
    if (!userId)
      return res.status(400).json({ error: 'Missing userId query parameter' })
    const usage = await ConnectionRepository.getUserDataUsage(userId as string)
    res.json({ usage })
  } catch (error: any) {
    res
      .status(500)
      .json({ error: 'Failed to fetch vpn usage', message: error.message })
  }
})

// ==========================
// USER ENDPOINTS (AUTH REQUIRED)
// ==========================

// Split-tunnel rules (user scoped). Prefer authenticated user but accept userId query for testing.
app.get(
  '/api/v1/user/split-tunnel',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id || String(req.query.userId || '')
      if (!userId) return res.status(400).json({ error: 'Missing userId' })
      const rules = await SplitTunnelRepository.getUserRules(userId as string)
      res.json({ rules })
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch split tunnel rules',
        message: error.message,
      })
    }
  },
)

// User (protected) routes
app.get(
  '/api/v1/user/subscription',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const subscription = await SubscriptionRepository.getByUserId(
        req.user!.id,
      )
      res.json({ subscription })
    } catch (error: any) {
      res
        .status(500)
        .json({ error: 'Failed to fetch subscription', message: error.message })
    }
  },
)

app.get(
  '/api/v1/user/devices',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const devices = await DeviceRepository.getUserDevices(req.user!.id)
      res.json({ devices })
    } catch (error: any) {
      res
        .status(500)
        .json({ error: 'Failed to fetch devices', message: error.message })
    }
  },
)

app.get('/api/v1/user/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const servers = await ServerRepository.getAllActive()
    res.json({
      totalServers: servers.length,
      activeConnections: 0,
      totalUsers: 1,
      dataTransferred: '0 GB',
    })
  } catch (error: any) {
    res
      .status(500)
      .json({ error: 'Failed to fetch stats', message: error.message })
  }
})

// Auth me endpoint for NexusAI and other sub-apps
// This endpoint handles token refresh automatically if access token is expired
app.get('/api/v1/auth/me', async (req: AuthRequest, res) => {
  try {
    // Try to get access token
    let token = req.headers.authorization?.replace('Bearer ', '')
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token
    }

    // If no access token but has refresh token, try to refresh
    if (!token && req.cookies?.refresh_token) {
      console.log('[API] /api/v1/auth/me - No access token, attempting refresh')
      try {
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: req.cookies.refresh_token,
        })

        if (!error && data.session) {
          // Set new access token cookie
          const accessCookieOpts: any = {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
          }
          if (data.session.expires_in) {
            accessCookieOpts.maxAge = Number(data.session.expires_in) * 1000
          }
          res.cookie(
            'access_token',
            data.session.access_token,
            accessCookieOpts,
          )
          token = data.session.access_token
          console.log('[API] /api/v1/auth/me - Token refreshed successfully')
        }
      } catch (refreshError) {
        console.warn(
          '[API] /api/v1/auth/me - Token refresh failed:',
          refreshError,
        )
      }
    }

    // Now verify the token (either original or refreshed)
    if (!token) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'No valid authentication token found. Please log in.',
      })
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      console.warn('[API] /api/v1/auth/me - Token verification failed')
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Please log in again.',
      })
    }

    const user = data.user

    // Get subscription info from unified billing
    const { getUserSubscription } = await import('./middleware/unified-billing')
    const subscription = await getUserSubscription(user.id)

    // Calculate total credits (monthly + purchased)
    const totalCredits = subscription
      ? (subscription.credits_remaining || 0) +
        (subscription.purchased_credits_balance || 0)
      : 100

    console.log('[API] /auth/me - User:', user.id, 'Credits:', {
      credits_remaining: subscription?.credits_remaining,
      purchased: subscription?.purchased_credits_balance,
      total: totalCredits,
    })

    // Return user with subscription and token info
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'user',
        subscription: {
          plan: subscription?.plan_id || 'free',
          credits: totalCredits,
          database_quota: subscription?.database_quota_gb || 1,
        },
      },
      token: token,
    })
  } catch (error: any) {
    console.error('[API] /api/v1/auth/me error:', error)
    res.status(500).json({
      error: 'Failed to fetch user info',
      message: error.message,
    })
  }
})

app.get(
  '/api/v1/user/profile',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      res.json({ user: req.user })
    } catch (error: any) {
      res
        .status(500)
        .json({ error: 'Failed to fetch profile', message: error.message })
    }
  },
)

// Notifications (user)
app.get(
  '/api/v1/user/notifications',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const limit = Number(req.query.limit) || 10
      const notifications = [] as any[]
      const unread_count = 0
      res.json({ notifications, unread_count })
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch notifications',
        message: error.message,
      })
    }
  },
)

app.put(
  '/api/v1/user/notifications/:id/read',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params
      res.json({ success: true, id })
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to mark notification read',
        message: error.message,
      })
    }
  },
)

app.put(
  '/api/v1/user/notifications/read-all',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to mark notifications read',
        message: error.message,
      })
    }
  },
)

// User security & sessions
app.get(
  '/api/v1/user/security/settings',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id
      const settings = await SecurityRepository.getByUserId(userId)
      res.json(settings || {})
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch security settings',
        message: error.message,
      })
    }
  },
)

// Update user's security settings (upsert)
app.put(
  '/api/v1/user/security/settings',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id
      const payload = { ...req.body, user_id: userId }
      const updated = await SecurityRepository.upsert(payload as any)
      res.json(updated)
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to update security settings',
        message: error.message,
      })
    }
  },
)

// Sessions (basic placeholders)
app.get(
  '/api/v1/user/sessions',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      // If you have session storage, replace this with a real query. Return empty list for now.
      res.json([])
    } catch (error: any) {
      res
        .status(500)
        .json({ error: 'Failed to fetch sessions', message: error.message })
    }
  },
)

app.delete(
  '/api/v1/user/sessions/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params
      // Placeholder: revoke session by id if stored; respond success for now
      res.json({ success: true, id })
    } catch (error: any) {
      res
        .status(500)
        .json({ error: 'Failed to revoke session', message: error.message })
    }
  },
)

// ==========================
// ADMIN ENDPOINTS (AUTH + ADMIN REQUIRED)
// ==========================

// AuthZ probe endpoint for reverse proxies (nginx auth_request).
// Returns 204 when the request is authenticated and the user is an admin.
app.get(
  '/api/v1/admin/authz',
  authMiddleware,
  adminMiddleware,
  async (_req: AuthRequest, res) => {
    return res.status(204).end()
  },
)

// Platform statistics (admin)
app.get(
  '/api/v1/admin/audit/logs',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const logs = await AuditRepository.getRecentCriticalEvents(48)
      res.json({ logs })
    } catch (error: any) {
      res
        .status(500)
        .json({ error: 'Failed to fetch audit logs', message: error.message })
    }
  },
)

// Admin security events (recent critical)
app.get(
  '/api/v1/admin/security/events',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const events = await AuditRepository.getRecentCriticalEvents(24)
      res.json({ events })
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch security events',
        message: error.message,
      })
    }
  },
)

// Admin users endpoints are handled by adminUsersRouter mounted at '/api/v1/admin'
// See packages/api/src/routes/admin/users.ts for full implementation

// ==========================
// ORGANIZATION ENDPOINTS (AUTH + ADMIN REQUIRED)
// ==========================

// Get all organizations
app.get(
  '/api/v1/admin/organizations',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      console.log('Organizations endpoint called by user:', req.user)
      // Get organizations from Supabase
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select(
          `
        *,
        users!users_organization_id_fkey(count)
      `,
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching organizations:', error)
        return res
          .status(500)
          .json({ error: 'Database error', message: error.message })
      }

      // Quick SQL response size for diagnostics
      try {
        console.debug(
          'Organizations SQL rows:',
          Array.isArray(data) ? data.length : 0,
        )
      } catch {}

      // Transform the data to match the expected format
      const transformedOrganizations =
        (data as any[])?.map((org: any) => ({
          id: org.id,
          name: org.name,
          billing_tier: org.billing_tier,
          max_users: org.max_users,
          max_devices_per_user: org.max_devices_per_user,
          max_servers: org.max_servers,
          created_at: org.created_at,
          features:
            typeof org.features === 'string'
              ? JSON.parse(org.features)
              : org.features || {},
          _count: {
            users: parseInt(org.user_count) || 0,
            servers: 0, // TODO: Add server count query
          },
        })) || []

      console.log('Returning organizations:', transformedOrganizations.length)
      res.json({ organizations: transformedOrganizations })
    } catch (error: any) {
      console.error('Organizations endpoint error:', error)
      res.status(500).json({
        error: 'Failed to fetch organizations',
        message: error.message,
      })
    }
  },
)

// Create new organization
app.post(
  '/api/v1/admin/organizations',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const {
        name,
        billing_tier,
        max_users,
        max_devices_per_user,
        max_servers,
      } = req.body
      console.log('Creating organization:', {
        name,
        billing_tier,
        user: req.user,
      })
      if (!name) {
        return res.status(400).json({ error: 'Organization name is required' })
      }

      // Determine features based on billing tier
      const features = {
        advanced_analytics: billing_tier === 'enterprise',
        custom_domains: billing_tier === 'enterprise',
        priority_support: billing_tier === 'enterprise',
        multi_region: ['enterprise', 'business'].includes(billing_tier),
        api_access: ['enterprise', 'business'].includes(billing_tier),
      }

      // Insert into database with platform client
      const client = await dbPlatform.platformPool.connect()
      let data
      try {
        const result = await client.query(
          `
        INSERT INTO organizations (
          name, billing_tier, max_users, max_devices_per_user, max_servers, features, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `,
          [
            name,
            billing_tier || 'enterprise',
            max_users || 100,
            max_devices_per_user || 10,
            max_servers || 50,
            JSON.stringify(features),
          ],
        )
        data = result.rows[0]
      } catch (error: any) {
        console.error('Database error creating organization:', error)
        return res
          .status(500)
          .json({ error: 'Database error', message: error.message })
      } finally {
        client.release()
      }

      // Add _count property for frontend compatibility
      const organizationWithCount = {
        ...data,
        features:
          typeof data.features === 'string'
            ? JSON.parse(data.features)
            : data.features,
        _count: {
          users: 0,
          servers: 0,
        },
      }

      console.log('Organization created:', organizationWithCount.id)
      auditLog(
        'org.create',
        `Organization created: ${organizationWithCount.id}`,
        'info',
        { name: name, billing_tier },
        req.user?.id,
      ).catch(() => {})
      res.json(organizationWithCount)
    } catch (error: any) {
      console.error('Create organization error:', error)
      res.status(500).json({
        error: 'Failed to create organization',
        message: error.message,
      })
    }
  },
)

// Get organization by ID
app.get(
  '/api/v1/admin/organizations/:id',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params
      console.log('Get organization (admin):', { id, user: req.user?.id })

      const client = await dbPlatform.platformPool.connect()
      let data
      try {
        const result = await client.query(
          `
        SELECT o.*,
               COUNT(u.id) as user_count
        FROM organizations o
        LEFT JOIN users u ON o.id = u.organization_id
        WHERE o.id = $1 AND o.deleted_at IS NULL
        GROUP BY o.id
        LIMIT 1
      `,
          [id],
        )
        data = result.rows[0]
      } catch (error: any) {
        console.error('Database error fetching organization:', error)
        return res
          .status(500)
          .json({ error: 'Database error', message: error.message })
      } finally {
        client.release()
      }

      try {
        console.debug('Organization SQL found:', data ? 1 : 0)
      } catch {}

      if (!data) {
        return res
          .status(404)
          .json({ error: 'Not Found', message: 'Organization not found' })
      }

      const org: any = data
      const organization = {
        id: org.id,
        name: org.name,
        billing_tier: org.billing_tier,
        max_users: org.max_users,
        max_devices_per_user: org.max_devices_per_user,
        max_servers: org.max_servers,
        created_at: org.created_at,
        features:
          typeof org.features === 'string'
            ? JSON.parse(org.features)
            : org.features || {},
        _count: {
          users: parseInt(org.user_count) || 0,
          servers: 0, // TODO: Add server count query
        },
      }

      res.json({ organization })
    } catch (error: any) {
      console.error('Get organization error:', error)
      res
        .status(500)
        .json({ error: 'Failed to fetch organization', message: error.message })
    }
  },
)

// Update organization
app.put(
  '/api/v1/admin/organizations/:id',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params
      const body = req.body || {}
      const updates: any = {}
      const whitelist = [
        'name',
        'billing_tier',
        'max_users',
        'max_devices_per_user',
        'max_servers',
        'features',
      ]
      for (const key of whitelist) {
        if (Object.prototype.hasOwnProperty.call(body, key))
          updates[key] = body[key]
      }
      updates.updated_at = new Date().toISOString()

      console.log('Update organization (admin):', {
        id,
        keys: Object.keys(updates),
        user: req.user?.id,
      })

      const client = await dbPlatform.platformPool.connect()
      let data
      try {
        const setClause = Object.keys(updates)
          .map((key, i) => `${key} = $${i + 2}`)
          .join(', ')
        const values = [id, ...Object.values(updates)]
        const result = await client.query(
          `
        UPDATE organizations SET ${setClause}
        WHERE id = $1
        RETURNING *
      `,
          values,
        )
        data = result.rows[0]
      } catch (error: any) {
        console.error('Database error updating organization:', error)
        return res
          .status(500)
          .json({ error: 'Database error', message: error.message })
      } finally {
        client.release()
      }

      auditLog(
        'org.update',
        `Organization updated: ${id}`,
        'info',
        { keys: Object.keys(updates) },
        req.user?.id,
      ).catch(() => {})
      res.json({ organization: data })
    } catch (error: any) {
      console.error('Update organization error:', error)
      res.status(500).json({
        error: 'Failed to update organization',
        message: error.message,
      })
    }
  },
)

// Delete organization
app.delete(
  '/api/v1/admin/organizations/:id',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params
      console.log('Delete organization (soft, admin):', {
        id,
        user: req.user?.id,
      })

      const client = await dbPlatform.platformPool.connect()
      try {
        await client.query(
          `
        UPDATE organizations 
        SET deleted_at = NOW()
        WHERE id = $1
      `,
          [id],
        )
      } catch (error: any) {
        console.error('Database error deleting organization:', error)
        return res
          .status(500)
          .json({ error: 'Database error', message: error.message })
      } finally {
        client.release()
      }

      auditLog(
        'org.delete',
        `Organization soft-deleted: ${id}`,
        'warning',
        {},
        req.user?.id,
      ).catch(() => {})
      res.json({
        success: true,
        id,
        message: 'Organization deleted successfully',
      })
    } catch (error: any) {
      console.error('Delete organization error:', error)
      res.status(500).json({
        error: 'Failed to delete organization',
        message: error.message,
      })
    }
  },
)

// Get organization members
app.get(
  '/api/v1/admin/organizations/:orgId/members',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { orgId } = req.params
      console.log('Get organization members:', { orgId, user: req.user })
      // Get members from database platform
      const client = await dbPlatform.platformPool.connect()
      let data
      try {
        const result = await client.query(
          `
        SELECT id, email, full_name, role, created_at
        FROM users
        WHERE organization_id = $1
        ORDER BY created_at DESC
      `,
          [orgId],
        )
        data = result.rows
      } catch (error: any) {
        console.error('Database error fetching members:', error)
        return res
          .status(500)
          .json({ error: 'Database error', message: error.message })
      } finally {
        client.release()
      }

      // Quick SQL response size for diagnostics
      try {
        console.debug(
          'Organization members SQL rows:',
          Array.isArray(data) ? data.length : 0,
        )
      } catch {}

      // Transform to expected format
      const transformedMembers =
        (data as any[])?.map((member: any) => ({
          id: member.id,
          email: member.email,
          full_name: member.full_name,
          role: member.role || 'user',
          status: 'active', // You might want to add a status field to your users table
          created_at: member.created_at,
        })) || []

      console.log('Returning organization members:', transformedMembers.length)
      res.json({ members: transformedMembers })
    } catch (error: any) {
      console.error('Get organization members error:', error)
      res.status(500).json({
        error: 'Failed to fetch organization members',
        message: error.message,
      })
    }
  },
)

// Invite member to organization
app.post(
  '/api/v1/admin/organizations/:orgId/members',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { orgId } = req.params
      const { email, role, full_name } = req.body
      console.log('Invite member:', {
        orgId,
        email,
        role,
        full_name,
        user: req.user,
      })
      if (!email) {
        return res.status(400).json({ error: 'Email is required' })
      }

      // Check if user already exists
      const client = await dbPlatform.platformPool.connect()
      let existingUser
      try {
        const result = await client.query(
          `
        SELECT id, email, organization_id, full_name
        FROM users WHERE email = $1
      `,
          [email],
        )
        existingUser = result.rows[0]
      } finally {
        client.release()
      }

      if (existingUser) {
        // Update existing user's organization and role
        const client2 = await dbPlatform.platformPool.connect()
        let updatedUser
        try {
          const result = await client2.query(
            `
          UPDATE users 
          SET organization_id = $1, role = $2, full_name = $3, updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `,
            [
              orgId,
              role || 'user',
              full_name || existingUser.full_name,
              existingUser.id,
            ],
          )
          updatedUser = result.rows[0]
        } catch (updateError: any) {
          console.error('Database error updating user:', updateError)
          return res
            .status(500)
            .json({ error: 'Database error', message: updateError.message })
        } finally {
          client2.release()
        }

        const member = {
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          role: updatedUser.role,
          status: 'active',
          created_at: updatedUser.created_at,
        }

        auditLog(
          'member.add_existing',
          `User added to org: ${existingUser.id} -> ${orgId}`,
          'info',
          { role: role || 'user' },
          req.user?.id,
        ).catch(() => {})
        return res.json({ member, message: 'User added to organization' })
      } else {
        // Create new user invitation (you might want to create an invitations table)
        // For now, we'll create a placeholder response
        const member = {
          id: 'invite-' + Date.now(),
          email,
          full_name: full_name || '',
          role: role || 'user',
          status: 'pending',
          created_at: new Date().toISOString(),
        }

        auditLog(
          'member.invite',
          `Invitation created: ${email} -> ${orgId}`,
          'info',
          { role: role || 'user' },
          req.user?.id,
        ).catch(() => {})
        res.json({ member, message: 'Invitation sent successfully' })
      }
    } catch (error: any) {
      console.error('Invite member error:', error)
      res
        .status(500)
        .json({ error: 'Failed to invite member', message: error.message })
    }
  },
)

// Update organization member
app.put(
  '/api/v1/admin/organizations/:orgId/members/:memberId',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { orgId, memberId } = req.params
      const { role } = req.body
      console.log('Update member role:', {
        orgId,
        memberId,
        role,
        user: req.user,
      })

      // Update user role in database
      const client = await dbPlatform.platformPool.connect()
      let updatedMember
      try {
        const result = await client.query(
          `
        UPDATE users 
        SET role = $1, updated_at = NOW()
        WHERE id = $2 AND organization_id = $3
        RETURNING *
      `,
          [role, memberId, orgId],
        )
        updatedMember = result.rows[0]
      } catch (error: any) {
        console.error('Database error updating member:', error)
        return res
          .status(500)
          .json({ error: 'Database error', message: error.message })
      } finally {
        client.release()
      }

      const member = {
        id: updatedMember.id,
        email: updatedMember.email,
        full_name: updatedMember.full_name,
        role: updatedMember.role,
        status: 'active',
        created_at: updatedMember.created_at,
      }

      auditLog(
        'member.role_update',
        `Member role updated: ${memberId} in ${orgId}`,
        'info',
        { role },
        req.user?.id,
      ).catch(() => {})
      res.json({ member })
    } catch (error: any) {
      console.error('Update member error:', error)
      res
        .status(500)
        .json({ error: 'Failed to update member', message: error.message })
    }
  },
)

// Remove member from organization
app.delete(
  '/api/v1/admin/organizations/:orgId/members/:memberId',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { orgId, memberId } = req.params
      console.log('Remove member:', { orgId, memberId, user: req.user })

      // Remove user from organization by setting organization_id to null
      const client = await dbPlatform.platformPool.connect()
      try {
        await client.query(
          `
        UPDATE users 
        SET organization_id = NULL, updated_at = NOW()
        WHERE id = $1 AND organization_id = $2
      `,
          [memberId, orgId],
        )
      } catch (error: any) {
        console.error('Database error removing member:', error)
        return res
          .status(500)
          .json({ error: 'Database error', message: error.message })
      } finally {
        client.release()
      }

      auditLog(
        'member.remove',
        `Member removed: ${memberId} from ${orgId}`,
        'warning',
        {},
        req.user?.id,
      ).catch(() => {})
      res.json({
        success: true,
        memberId,
        message: 'Member removed successfully',
      })
    } catch (error: any) {
      console.error('Remove member error:', error)
      res
        .status(500)
        .json({ error: 'Failed to remove member', message: error.message })
    }
  },
)

// ==========================
// ANALYTICS & SECURITY ENDPOINTS
// ==========================

// Threat protection: stats endpoint
app.get('/api/v1/security/threats/stats', async (req, res) => {
  try {
    // TODO: Replace with real DB query for threat stats in production
    // For now, return mock stats for development/testing
    const { range } = req.query
    const stats = {
      totalThreats: 5,
      blocked: 3,
      severity: {
        critical: 2,
        warning: 2,
        info: 1,
      },
      range: range || 'today',
    }
    res.json(stats)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch threat stats',
      message: (error as any).message,
    })
  }
})

// Threat protection: recent threats endpoint
app.get('/api/v1/security/threats/recent', async (req, res) => {
  try {
    // TODO: Replace with real DB query for recent threats in production
    // For now, return mock data for development/testing
    const { limit } = req.query
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
      },
    ]
    res.json({ threats: threats.slice(0, Number(limit) || 50) })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch recent threats',
      message: (error as any).message,
    })
  }
})

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
      },
    ]
    res.json(connections)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch connections',
      message: (error as any).message,
    })
  }
})

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
      },
    ]
    res.json(users)
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to fetch users', message: (error as any).message })
  }
})

// ==========================
// DEBUG & DEVELOPMENT ENDPOINTS
// ==========================

// Debug route to list all registered routes at the end, after all other routes but before error handling and 404
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/v1/debug/routes', (req, res) => {
    try {
      const appKeys = Object.keys(app)
      console.log('[DIAG] Express app keys:', appKeys)
      let router = (app as any)._router || (app as any).router
      if (!router || !router.stack) {
        return res.status(500).json({
          error: 'Router stack not available',
          message: 'Neither app._router nor app.router is available',
          appKeys,
        })
      }
      const routes: any[] = []
      router.stack.forEach((middleware: any) => {
        if (middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods),
          })
        } else if (
          middleware.name === 'router' &&
          middleware.handle &&
          middleware.handle.stack
        ) {
          middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
              routes.push({
                path: handler.route.path,
                methods: Object.keys(handler.route.methods),
              })
            }
          })
        }
      })
      res.json({ routes })
    } catch (err: any) {
      console.error('Error in /api/v1/debug/routes:', err)
      res
        .status(500)
        .json({ error: 'Failed to list routes', message: err.message })
    }
  })
}

// ==========================
// ERROR HANDLING
// ==========================

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

export default app
