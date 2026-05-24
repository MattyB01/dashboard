import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, createSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    if (!process.env.DASHBOARD_PASSWORD) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    if (!checkPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const sessionCookie = await createSessionCookie();
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
