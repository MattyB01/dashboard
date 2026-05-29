/**
 * POST /api/sermons/transcribe
 *
 * Accepts an audio file and transcribes it using OpenAI Whisper.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured. Add it to .env.local' },
        { status: 500 }
      );
    }

    const audioBuffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([audioBuffer], { type: file.type });

    const openaiForm = new FormData();
    openaiForm.append('file', blob, file.name || 'audio.webm');
    openaiForm.append('model', 'whisper-1');
    openaiForm.append('response_format', 'verbose_json');
    openaiForm.append('language', 'en');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiForm,
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('OpenAI Whisper error:', res.status, errBody);
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
