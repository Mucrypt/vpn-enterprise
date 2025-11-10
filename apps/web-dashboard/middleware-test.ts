import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;
  // Diagnostics: log incoming request and cookie state
  if (process.env.NODE_ENV === 'production') {
    console.info('[middleware] Incoming:', { pathname, cookies: request.cookies, headers: request.headers });
  }

  // Check if the path is a protected dashboard route
  if (pathname.startsWith('/dashboard')) {
    if (process.env.NODE_ENV === 'production') {
      const token = request.cookies.get('access_token')?.value;
      const refreshCookie = request.cookies.get('refresh_token')?.value;

      // Only trigger refresh if access token is missing and refresh_token is present
      if (!token && refreshCookie) {
        try {
          const cookieHeader = request.headers.get('cookie') || '';
          const resp = await fetch(`${request.nextUrl.origin}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: cookieHeader,
            },
          });
          if (resp.ok) {
            const data = await resp.json().catch(() => ({}));
            const newAccess = data?.session?.access_token || data?.access_token;
            const role = data?.user?.role || data?.session?.user?.role || request.cookies.get('user_role')?.value;
            const res = NextResponse.next();
            if (newAccess) {
              res.cookies.set('access_token', newAccess, {
                httpOnly: false,
                secure: true,
                sameSite: 'lax',
                path: '/',
              });
            }
            if (role) {
              res.cookies.set('user_role', role, {
                httpOnly: false,
                secure: true,
                sameSite: 'lax',
                path: '/',
              });
            }
            console.info('[middleware] Refresh succeeded:', { newAccess, role });
            return res;
          } else {
            console.warn('[middleware] Refresh failed:', { status: resp.status, body: await resp.text() });
          }
        } catch (e) {
          console.error('[middleware] Refresh error:', e);
        }
        // If refresh fails, redirect to login (avoid loop by only redirecting once)
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      // If both tokens are missing, redirect to login
      if (!token && !refreshCookie) {
        console.warn('[middleware] No access or refresh token, redirecting to login');
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Admin route check
    if (pathname.startsWith('/dashboard/admin')) {
      const userRole = request.cookies.get('user_role')?.value;
      if (userRole !== 'super_admin' && userRole !== 'admin') {
        console.warn('[middleware] Non-admin tried to access admin route:', { userRole });
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }


  // Redirect logged-in users away from auth pages
  if (pathname.startsWith('/auth/')) {
    if (process.env.NODE_ENV === 'production') {
      const token = request.cookies.get('access_token')?.value;
      if (token) {
        console.info('[middleware] Authenticated user on auth page, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
