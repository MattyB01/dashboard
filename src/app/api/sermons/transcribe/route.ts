/**
 * POST /api/sermons/transcribe
 *
 * Accepts an audio file and transcribes it using Groq's Whisper-compatible API.
 * Vercel timeout: max 60s (Hobby) / 300s (Pro)
 */
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  maxDuration: 60,
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured. Add it to Vercel env vars.' },
        { status: 500 }
      );
    }

    const audioBuffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([audioBuffer], { type: file.type });

    const groqForm = new FormData();
    groqForm.append('file', blob, file.name || 'audio.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('response_format', 'verbose_json');
    groqForm.append('language', 'en');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqForm,
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Groq Whisper error:', res.status, errBody);
      return NextResponse.json(
        { error: `Transcription failed: ${res.status}. ${errBody}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ transcript: data.text, segments: data.segments ?? [] });
  } catch (err: any) {
    console.error('Transcribe error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
