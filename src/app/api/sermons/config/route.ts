import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Simple config store using Postgres
// Stores key-value pairs for dynamic configuration

// GET /api/sermons/config?key=vps_url — read a config value
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'key query param required' }, { status: 400 });
    }
    const { rows } = await sql`SELECT value FROM sermon_config WHERE key = ${key}`;
    if (rows.length === 0) {
      return NextResponse.json({ value: null }, { status: 200 });
    }
    return NextResponse.json({ value: rows[0].value });
  } catch (err: any) {
    // Table might not exist yet
    if (err.message?.includes('does not exist')) {
      return NextResponse.json({ value: null }, { status: 200 });
    }
    console.error('Config GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/sermons/config — set a config value (requires API secret)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, secret } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value required' }, { status: 400 });
    }

    // Simple auth — match the Vercel deploy token
    if (secret !== process.env.VERCEL_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert
    await sql`
      INSERT INTO sermon_config (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Auto-create table if it doesn't exist
    if (err.message?.includes('does not exist')) {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS sermon_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;
        // Retry
        const body = await request.json();
        const { key, value, secret } = body;
        if (secret !== process.env.VERCEL_TOKEN) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await sql`
          INSERT INTO sermon_config (key, value, updated_at)
          VALUES (${key}, ${value}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
        `;
        return NextResponse.json({ success: true });
      } catch (e2: any) {
        console.error('Config create table error:', e2);
        return NextResponse.json({ error: e2.message }, { status: 500 });
      }
    }
    console.error('Config POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
