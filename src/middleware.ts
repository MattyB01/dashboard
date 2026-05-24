import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasValidSession } from '@/lib/auth';

const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/check',
  '/_next/static',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Block all other paths if not authenticated
  const authenticated = await hasValidSession();

  if (!authenticated) {
    // API routes get 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Pages redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - But we handle those in the middleware itself anyway
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
