import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a protected dashboard route
  if (pathname.startsWith('/dashboard')) {
    // Check for access token in cookies or localStorage (we'll use a custom header approach)
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
      // Redirect to login if no token found
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
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
