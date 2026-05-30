/**
 * POST /api/sermons/notes
 *
 * Takes a transcript and returns AI-generated notes using Groq LLM.
 */
import { NextRequest, NextResponse } from 'next/server';

const GROQ_BASE = 'https://api.groq.com/openai/v1';

export async function POST(request: NextRequest) {
  try {
    const { transcript, title } = await request.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 20) {
      return NextResponse.json(
        { error: 'Transcript must be at least 20 characters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured. Add it to Vercel env vars.' },
        { status: 500 }
      );
    }

    const prompt = `You are analyzing a sermon transcript. Extract the following in JSON format:

{
  "theme": "the central theme of the sermon (one sentence)",
  "topic": "the specific topic covered",
  "summary": "a 2-3 sentence summary of the sermon",
  "key_points": ["point 1", "point 2", "point 3", ...],
  "bible_verses": [
    {
      "reference": "e.g. John 3:16",
      "text": "the verse text as quoted or referenced",
      "why_it_matters": "why this verse was significant in this sermon"
    }
  ],
  "actionable_takeaways": ["takeaway 1", "takeaway 2", ...],
  "quotes": ["notable quote from the sermon", ...]
}

Rules:
- bible_verses should list EVERY verse referenced or quoted in the sermon, even partially
- If a verse is quoted but the exact text isn't in the transcript, leave text empty
- key_points: 3-6 concise points
- actionable_takeaways: things the listener should do in response
- Return ONLY valid JSON, no markdown wrapping

Title: ${title || 'Untitled Sermon'}
Transcript:
${transcript}`;

    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a sermon analyst and note-taker. Extract structured notes from sermon transcripts. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Groq notes error:', res.status, errBody);
      return NextResponse.json(
        { error: `Notes generation failed: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No content from AI' }, { status: 502 });
    }

    // Parse JSON from response
    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Notes error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
