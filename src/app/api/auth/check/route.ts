import { NextResponse } from 'next/server';
import { hasValidSession } from '@/lib/auth-edge';

export async function GET() {
  const authenticated = await hasValidSession();
  return NextResponse.json({ authenticated });
}
