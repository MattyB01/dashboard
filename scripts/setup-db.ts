import { sql } from '@vercel/postgres';

async function setup() {
  console.log('Creating sermons table...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS sermons (
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
    );
  `;

  console.log('✓ sermons table ready');
}

setup()
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
