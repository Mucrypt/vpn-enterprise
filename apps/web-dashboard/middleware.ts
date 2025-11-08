import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a protected dashboard route
  if (pathname.startsWith('/dashboard')) {
    // Check for access token in cookies
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
      // Redirect to login if no token found
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is trying to access admin routes
    if (pathname.startsWith('/dashboard/admin')) {
      const userRole = request.cookies.get('user_role')?.value;
      
      // Only super_admin and admin can access admin panel
      if (userRole !== 'super_admin' && userRole !== 'admin') {
        // Redirect regular users to main dashboard
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
