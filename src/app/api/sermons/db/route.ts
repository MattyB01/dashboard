import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Helper: row to SermonEntry
function rowToEntry(row: any) {
  return {
    id: row.id,
    date: row.date,
    ministry: row.ministry,
    title: row.title,
    theme: row.theme,
    topic: row.topic,
    transcript: row.transcript,
    notes: row.notes,
    createdAt: row.created_at,
    status: row.status,
    errorMessage: row.error_message,
  };
}

// GET /api/sermons/db — list all sermons
export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM sermons ORDER BY created_at DESC`;
    return NextResponse.json(rows.map(rowToEntry));
  } catch (err: any) {
    console.error('DB list error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/sermons/db — create a sermon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, date, ministry, title, theme, topic, transcript, notes, status, errorMessage } = body;

    const { rows } = await sql`
      INSERT INTO sermons (id, date, ministry, title, theme, topic, transcript, notes, status, error_message)
      VALUES (${id}, ${date}, ${ministry}, ${title || 'Untitled Sermon'}, ${theme || ''}, ${topic || ''}, ${transcript || ''}, ${notes ? JSON.stringify(notes) : null}, ${status || 'processing'}, ${errorMessage || null})
      RETURNING *
    `;

    return NextResponse.json(rowToEntry(rows[0]), { status: 201 });
  } catch (err: any) {
    console.error('DB create error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/sermons/db — update a sermon
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fields.date !== undefined) { updates.push(`date = $${idx++}`); values.push(fields.date); }
    if (fields.ministry !== undefined) { updates.push(`ministry = $${idx++}`); values.push(fields.ministry); }
    if (fields.title !== undefined) { updates.push(`title = $${idx++}`); values.push(fields.title); }
    if (fields.theme !== undefined) { updates.push(`theme = $${idx++}`); values.push(fields.theme); }
    if (fields.topic !== undefined) { updates.push(`topic = $${idx++}`); values.push(fields.topic); }
    if (fields.transcript !== undefined) { updates.push(`transcript = $${idx++}`); values.push(fields.transcript); }
    if (fields.notes !== undefined) { updates.push(`notes = $${idx++}`); values.push(JSON.stringify(fields.notes)); }
    if (fields.status !== undefined) { updates.push(`status = $${idx++}`); values.push(fields.status); }
    if (fields.errorMessage !== undefined) { updates.push(`error_message = $${idx++}`); values.push(fields.errorMessage); }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE sermons SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;

    const { rows } = await sql.query(query, values);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sermon not found' }, { status: 404 });
    }

    return NextResponse.json(rowToEntry(rows[0]));
  } catch (err: any) {
    console.error('DB update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/sermons/db — delete a sermon
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    await sql`DELETE FROM sermons WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DB delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
