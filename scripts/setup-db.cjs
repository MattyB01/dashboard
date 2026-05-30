const { sql } = require('@vercel/postgres');

async function run() {
  await sql`CREATE TABLE IF NOT EXISTS sermons (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    ministry TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Sermon',
    theme TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL DEFAULT '',
    transcript TEXT NOT NULL DEFAULT '',
    notes JSONB,
    status TEXT NOT NULL DEFAULT 'processing',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`;
  console.log('✓ sermons table created');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
