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
      console.warn('Auth middleware: no token found', { 
        url: req.originalUrl, 
        method: req.method,
        headers: req.headers,
        cookies: req.cookies,
      });
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && cached.expires > Date.now()) {
      req.user = cached.user;
      return next();
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.warn('Auth middleware: token verification failed', {
        error: error?.message,
        url: req.originalUrl,
      });
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
      console.warn('Failed to fetch user role:', e);
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
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
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
    console.warn('[adminMiddleware] User does not have admin privileges', {
      userId: req.user.id,
      role: req.user.role,
      normalizedRole: role,
      url: req.originalUrl,
      method: req.method,
      headers: req.headers,
      cookies: req.cookies,
    });
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  console.info('[adminMiddleware] User authenticated as admin', {
    userId: req.user.id,
    role: req.user.role,
    normalizedRole: role,
    url: req.originalUrl,
    method: req.method,
  });
  next();
}

/**
 * Optional auth middleware
 */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      const { data } = await supabase.auth.getUser(token);
      if (data.user) {
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
          // ignore
        }
        req.user = {
          id: data.user.id,
          email: data.user.email!,
          role,
        };
      }
    }
    next();
  } catch (error) {
    next();
  }
}