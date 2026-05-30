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
    const text = await request.text();
    const body = JSON.parse(text);
    const { key, value, secret } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value required' }, { status: 400 });
    }

    // Simple auth — match the dashboard password
    if (secret !== process.env.DASHBOARD_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS sermon_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Upsert
    await sql`
      INSERT INTO sermon_config (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Config POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
