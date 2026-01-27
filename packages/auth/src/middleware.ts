import { Request, Response, NextFunction } from 'express'
import { AppUser } from '@vpn-enterprise/database'
import type { AppUserRow } from '@vpn-enterprise/database'
import { supabase, supabaseAdmin } from '@vpn-enterprise/database'
import { AuthService } from './auth-service'

export interface AuthRequest extends Request {
  user?: AppUser
}

// Simple in-memory cache for token verification to reduce DB calls
const tokenCache = new Map<string, { user: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
// Admin endpoints can be extremely chatty (e.g. nginx auth_request for n8n assets).
// Cache admin verifications briefly to avoid hammering Supabase for every request.
const ADMIN_CACHE_TTL = 60 * 1000 // 60 seconds

// Single-flight token verification to avoid parallel Supabase calls for the same token.
const verifyInFlight = new Map<string, Promise<AppUser>>()

// Admin role variants for flexible role checking
const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin', 'administrator']

/**
 * Clean expired cache entries
 */
function cleanTokenCache() {
  const now = Date.now()
  for (const [key, value] of tokenCache.entries()) {
    if (value.expires < now) {
      tokenCache.delete(key)
    }
  }
}

/**
 * Normalize role string for consistent comparison
 */
function normalizeRole(role: string | undefined | null): string {
  if (!role) return 'user'
  return role.toLowerCase().replace(/[\s\-_]/g, '')
}

/**
 * Check if user has admin privileges
 */
function isAdminUser(role: string | undefined | null): boolean {
  const normalizedRole = normalizeRole(role)
  return ADMIN_ROLES.some(
    (adminRole) => normalizeRole(adminRole) === normalizedRole,
  )
}

/**
 * Extract token from request (Authorization header or cookies)
 */
function extractToken(req: Request): string | undefined {
  // Check Authorization header first
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Fall back to access_token cookie
  if (req.cookies?.access_token) {
    return req.cookies.access_token
  }

  return undefined
}

/**
 * Get user role from database with proper error handling
 */
async function getUserRoleFromDatabase(
  userId: string,
): Promise<AppUser['role']> {
  try {
    // Use the admin/service client to bypass RLS when fetching roles for server-side auth
    const { data: userData, error } = await (supabaseAdmin as any)
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn('[authMiddleware] Database error fetching user role:', error)
      return 'user' // Default role on error
    }

    if (!userData) {
      console.warn('[authMiddleware] User not found in database:', userId)
      return 'user' // Default role if user not found
    }

    const userRow = userData as AppUserRow
    if (userRow && typeof userRow.role === 'string') {
      return userRow.role as AppUser['role']
    }

    console.warn('[authMiddleware] Invalid role format for user:', userId)
    return 'user' // Default role if invalid format
  } catch (error) {
    console.error(
      '[authMiddleware] Unexpected error fetching user role:',
      error,
    )
    return 'user' // Default role on unexpected error
  }
}

/**
 * Middleware to verify JWT token from Supabase
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const requestUrl = req.originalUrl
    const isAdminRoute =
      typeof requestUrl === 'string' && requestUrl.startsWith('/api/v1/admin')
    console.log('[authMiddleware] Checking request for:', requestUrl)

    cleanTokenCache()

    // Log minimal request info for debugging (reduce noise in production)
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[authMiddleware] Request details', {
        url: requestUrl,
        method: req.method,
        hasAuthHeader: !!req.headers.authorization,
        hasAccessTokenCookie: !!req.cookies?.access_token,
      })
    }

    // Extract token from request
    const token = extractToken(req)

    if (!token) {
      console.warn('[authMiddleware] No token found for:', requestUrl)
      res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource',
      })
      return
    }

    // Check cache first for performance
    const cached = tokenCache.get(token)
    if (cached && cached.expires > Date.now()) {
      req.user = cached.user
      console.log('[authMiddleware] Token verified (cache) for:', requestUrl)
      return next()
    }

    // Verify token with Supabase (single-flight per token)
    let verifyPromise = verifyInFlight.get(token)
    if (!verifyPromise) {
      verifyPromise = (async (): Promise<AppUser> => {
        const { data, error } = await supabase.auth.getUser(token)

        if (error) {
          // Re-throw with a stable shape for downstream mapping
          throw {
            type: 'supabase',
            message: error.message,
            status: error.status,
          }
        }

        if (!data.user) {
          throw {
            type: 'supabase',
            message: 'No user data in token',
            status: 401,
          }
        }

        // Get user role from database
        const role = await getUserRoleFromDatabase(data.user.id)

        return {
          id: data.user.id,
          email: data.user.email!,
          role,
        } as AppUser
      })()
      verifyInFlight.set(token, verifyPromise)
      verifyPromise.finally(() => verifyInFlight.delete(token))
    }

    let user: AppUser
    try {
      user = await verifyPromise
    } catch (e: any) {
      const msg = String(e?.message || 'Token verification failed')
      const status = Number(e?.status || 401)
      console.warn(
        '[authMiddleware] Token verification failed for:',
        requestUrl,
        {
          error: msg,
          status,
        },
      )

      // Provide specific error messages based on the error type
      if (msg.includes('jwt expired')) {
        res.status(401).json({
          error: 'Token expired',
          message: 'Your session has expired. Please log in again.',
        })
      } else if (msg.includes('invalid token') || msg.includes('Invalid JWT')) {
        res.status(401).json({
          error: 'Invalid token',
          message: 'Your authentication token is invalid. Please log in again.',
        })
      } else {
        // Keep 401 semantics for auth_request, but preserve status if Supabase returned one.
        res.status(status === 401 ? 401 : status).json({
          error: 'Authentication failed',
          message: 'Unable to verify your identity. Please log in again.',
        })
      }
      return
    }

    // Cache the verified token
    tokenCache.set(token, {
      user,
      expires: Date.now() + (isAdminRoute ? ADMIN_CACHE_TTL : CACHE_TTL),
    })

    req.user = user
    console.log('[authMiddleware] Token verified for:', requestUrl, {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    })
    next()
  } catch (error) {
    console.error(
      '[authMiddleware] Unexpected error for:',
      req.originalUrl,
      error,
    )
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An unexpected error occurred during authentication',
    })
  }
}

/**
 * Middleware to check if user is admin
 */
export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const requestUrl = req.originalUrl

  if (process.env.NODE_ENV !== 'production') {
    console.log('[adminMiddleware] Checking admin access for:', requestUrl, {
      user: req.user
        ? {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
          }
        : 'No user',
    })
  }

  if (!req.user) {
    console.warn('[adminMiddleware] No user found on request:', requestUrl)
    res.status(401).json({
      error: 'Not authenticated',
      message: 'Please log in to access admin resources',
    })
    return
  }

  // Check if user has admin privileges
  if (!isAdminUser(req.user.role)) {
    console.warn('[adminMiddleware] User does not have admin privileges:', {
      url: requestUrl,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
    })

    res.status(403).json({
      error: 'Admin access required',
      message:
        'You do not have permission to access this resource. Admin or Super Admin role required.',
    })
    return
  }

  console.log('[adminMiddleware] Admin access granted for:', requestUrl, {
    userId: req.user.id,
    userRole: req.user.role,
  })
  next()
}

/**
 * Optional middleware for role-based access control
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: 'Not authenticated',
        message: 'Authentication required',
      })
      return
    }

    const userRole = normalizeRole(req.user.role)
    const hasRequiredRole = allowedRoles.some(
      (role) => normalizeRole(role) === userRole,
    )

    if (!hasRequiredRole) {
      console.warn('[requireRole] User does not have required role:', {
        url: req.originalUrl,
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      })

      res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required roles: ${allowedRoles.join(', ')}`,
      })
      return
    }

    next()
  }
}

/**
 * Development-only middleware for debugging authentication
 */
export function debugAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (process.env.NODE_ENV === 'production') {
    return next()
  }

  console.debug('[debugAuthMiddleware] Request details:', {
    url: req.originalUrl,
    method: req.method,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      origin: req.headers.origin,
    },
    cookies: {
      access_token: req.cookies?.access_token ? 'Present' : 'Missing',
      refresh_token: req.cookies?.refresh_token ? 'Present' : 'Missing',
      user_role: req.cookies?.user_role || 'Missing',
    },
    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        }
      : 'Not authenticated',
  })

  next()
}
