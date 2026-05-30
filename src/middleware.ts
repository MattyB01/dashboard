import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasValidSession } from '@/lib/auth-edge';

const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/check',
  '/api/proxy',
  '/api/phone-usage',
  '/api/sermons',
  '/api/sermons/config',
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
