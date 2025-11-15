import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd;

  // Dashboard session logic
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('access_token')?.value;
    const refreshCookie = request.cookies.get('refresh_token')?.value;

    // Attempt refresh in both dev and prod using the Next rewrite to /api
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
              secure,
              sameSite: 'lax',
              path: '/',
            });
          }
          if (role) {
            res.cookies.set('user_role', role, {
              httpOnly: false,
              secure,
              sameSite: 'lax',
              path: '/',
            });
          }
          return res;
        }
      } catch (e) {
        // ignore and fall through to redirect
      }
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!token && !refreshCookie) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith('/dashboard/admin')) {
      const userRole = request.cookies.get('user_role')?.value;
      if (userRole !== 'super_admin' && userRole !== 'admin') {
        console.warn('[proxy] Non-admin tried to access admin route:', { userRole });
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith('/auth/')) {
    const token = request.cookies.get('access_token')?.value;
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};

// Ensure Next can consume default export form if required by future versions
export default proxy;
