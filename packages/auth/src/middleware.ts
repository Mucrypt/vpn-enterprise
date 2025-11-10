import { Request, Response, NextFunction } from 'express';
import { AppUser } from '@vpn-enterprise/database';
import type { AppUserRow } from '@vpn-enterprise/database';
import { supabase } from '@vpn-enterprise/database';
import { AuthService } from './auth-service';

export interface AuthRequest extends Request {
  user?: AppUser;
}

// Simple in-memory cache for token verification to reduce DB calls
const tokenCache = new Map<string, { user: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clean expired cache entries
 */
function cleanTokenCache() {
  const now = Date.now();
  for (const [key, value] of tokenCache.entries()) {
    if (value.expires < now) {
      tokenCache.delete(key);
    }
  }
}

/**
 * Middleware to verify JWT token from Supabase
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log('[authMiddleware] Checking request for:', req.originalUrl);
    cleanTokenCache();

    // Log incoming cookies and headers for debugging
    console.info('[authMiddleware] Incoming request', {
      url: req.originalUrl,
      method: req.method,
      headers: req.headers,
      cookies: req.cookies,
    });

    // Accept token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      console.warn('[authMiddleware] No token found for:', req.originalUrl);
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && cached.expires > Date.now()) {
      req.user = cached.user;
      console.log('[authMiddleware] Token verified (cache) for:', req.originalUrl);
      return next();
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.warn('[authMiddleware] Token verification failed for:', req.originalUrl, error?.message);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Get user role from database
    let role: AppUser["role"] = 'user';
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      const userRow = userData as AppUserRow | null;
      if (userRow && typeof userRow.role === 'string') {
        role = userRow.role as AppUser["role"];
      }
    } catch (e) {
      console.warn('[authMiddleware] Failed to fetch user role for:', req.originalUrl, e);
    }

    const user = {
      id: data.user.id,
      email: data.user.email!,
      role,
    };

    // Cache the verified token
    tokenCache.set(token, {
      user,
      expires: Date.now() + CACHE_TTL
    });

  req.user = user;
  console.log('[authMiddleware] Token verified for:', req.originalUrl);
  console.log('[authMiddleware] Decoded user:', user);
  next();
  } catch (error) {
    console.error('[authMiddleware] Error for:', req.originalUrl, error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to check if user is admin
 */
export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  console.log('[adminMiddleware] Incoming user object:', req.user);
  console.log('[adminMiddleware] Incoming Authorization header:', req.headers?.authorization);
  if (!req.user) {
    console.warn('[adminMiddleware] No user found on request', {
      url: req.originalUrl,
      method: req.method,
      headers: req.headers,
      cookies: req.cookies,
    });
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Normalize role to handle variants
  const role = (req.user.role || '').toLowerCase().replace(/\s|-/g, '_');
  const allowedRoles = ['admin', 'super_admin', 'superadmin', 'administrator'];
  if (!allowedRoles.includes(role)) {
    console.warn('[adminMiddleware] User does not have admin privileges for:', req.originalUrl, {
      userId: req.user.id,
      role: req.user.role,
      normalizedRole: role
    });
    res.status(403).json({ error: 'Admin or Super Admin access required' });
    return;
  }

  console.log('[adminMiddleware] Admin access granted for:', req.originalUrl);
  next();
}