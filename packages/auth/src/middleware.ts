import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '@vpn-enterprise/database';
import { AuthService } from './auth-service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

// Coalesce concurrent refreshSession calls for the same refresh token so the
// server doesn't issue duplicate refresh requests to the auth backend when
// multiple incoming requests arrive at the same time. This map stores the
// in-flight promise keyed by refresh token and is cleared once the promise
// settles.
const refreshInFlight: Map<string, Promise<any>> = new Map();

/**
 * Middleware to verify JWT token from Supabase
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Accept token from Authorization header, cookies (access_token), or query param (for testing)
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.query && (req.query.access_token || (req.query as any).token)) {
      token = String(req.query.access_token || (req.query as any).token);
    }

    if (!token) {
      // Attempt silent refresh using httpOnly refresh_token cookie (if present).
      // This covers the case where the client didn't persist the access_token
      // locally but the server-set refresh cookie exists and can be exchanged
      // for a fresh session.
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        try {
          // Use a single-flight promise for this refresh token so concurrent
          // incoming requests reuse the same refresh operation instead of
          // issuing multiple refreshes in parallel.
          let newSession: any;
          if (refreshInFlight.has(refreshToken)) {
            newSession = await refreshInFlight.get(refreshToken);
          } else {
            const p = (async () => {
              return await AuthService.refreshSession(refreshToken);
            })();
            refreshInFlight.set(refreshToken, p);
            try {
              newSession = await p;
            } finally {
              // clear the promise once settled
              refreshInFlight.delete(refreshToken);
            }
          }

          const newAccess = newSession?.access_token;
          if (newAccess) {
            token = newAccess;
            // also set a readable access_token cookie so future requests (and middleware)
            // that read cookies have a chance to find it. Keep sameSite/lax to match app behavior.
            try {
              res.cookie('access_token', newAccess, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: newSession.expires_in ? Number(newSession.expires_in) * 1000 : undefined,
              } as any);
            } catch (e) {
              // non-fatal
            }
          }
        } catch (e) {
          // silent refresh failed - fall through to original no-token response
        }
      }

      if (!token) {
        console.warn('Auth middleware: no token found on request', { url: req.originalUrl, method: req.method, origin: req.headers.origin });
        res.status(401).json({ error: 'No authorization token provided' });
        return;
      }
    }

    // Verify token with Supabase. supabase.auth.getUser accepts an access token.
    const { data, error } = await supabase.auth.getUser(token as string);

    // In development, add extra debug logging when token verification fails.
    if (process.env.NODE_ENV !== 'production') {
      const preview = typeof token === 'string' ? `${token.substring(0, 30)}...` : null;
      if (error || !data.user) {
        console.warn('Auth middleware: token verification failed', {
          message: error?.message || 'no user returned',
          url: req.originalUrl,
          tokenPreview: preview,
        });
      } else {
        console.debug('Auth middleware: token verified', { url: req.originalUrl, tokenPreview: preview });
      }
    }

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch role from users table (Supabase auth user object may not include application role)
    let role: string | undefined = undefined;
    try {
      // Use the service role client to bypass RLS when reading application
      // user metadata. The anon client may be subject to row-level security
      // that prevents reading the `public.users` row even for the token owner.
      const resp: any = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      const userRow: any = resp.data;
      const userErr: any = resp.error;
      if (!userErr && userRow) role = userRow.role;
    } catch (e) {
      // ignore and continue without role
    }

    // Attach user to request
    req.user = {
      id: data.user.id,
      email: data.user.email!,
      role: role || (data.user as any).role,
    };
    console.debug('Auth middleware: authenticated user', { id: req.user.id, role: req.user.role });

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
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Allow both admin and super_admin roles
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

/**
 * Optional auth middleware (doesn't fail if no token)
 */
export async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Accept token from Authorization header, cookies or query param (non-fatal)
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.query && (req.query.access_token || (req.query as any).token)) {
      token = String(req.query.access_token || (req.query as any).token);
    }

    if (token) {
      const { data } = await supabase.auth.getUser(token as string);

      if (data.user) {
        // Fetch role from users table to ensure application role is present
        let role: string | undefined = undefined;
        try {
          const resp: any = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();
          const userRow: any = resp.data;
          const userErr: any = resp.error;
          if (!userErr && userRow) role = userRow.role;
        } catch (e) {
          // ignore
        }

        req.user = {
          id: data.user.id,
          email: data.user.email!,
          role: role || (data.user as any).role,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
}
