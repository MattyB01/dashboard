import { NextResponse } from 'next/server';
import { hasValidSession } from '@/lib/auth';

export async function GET() {
  const authenticated = await hasValidSession();
  return NextResponse.json({ authenticated });
}
