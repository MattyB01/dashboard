'use client';

import { useEffect, useState, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BibleVerse {
  reference: string;
  text: string;
  why_it_matters: string;
}

interface SermonNotes {
  theme: string;
  topic: string;
  summary: string;
  key_points: string[];
  bible_verses: BibleVerse[];
  actionable_takeaways: string[];
  quotes: string[];
}

interface SermonEntry {
  id: string;
  date: string;
  ministry: string;
  title: string;
  theme: string;
  topic: string;
  transcript: string;
  notes?: SermonNotes;
  createdAt: string;
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

function loadSermons(): SermonEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('sermons') || '[]');
  } catch {
    return [];
  }
}

function saveSermons(sermons: SermonEntry[]) {
  localStorage.setItem('sermons', JSON.stringify(sermons));
}

// ─── Bible verse card colors ──────────────────────────────────────────────────

const VERSE_COLORS = [
  'from-violet-500/10 to-purple-500/5 border-violet-200',
  'from-amber-500/10 to-orange-500/5 border-amber-200',
  'from-emerald-500/10 to-teal-500/5 border-emerald-200',
  'from-blue-500/10 to-indigo-500/5 border-blue-200',
  'from-rose-500/10 to-pink-500/5 border-rose-200',
  'from-cyan-500/10 to-sky-500/5 border-cyan-200',
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function SermonsPage() {
  const [view, setView] = useState<'library' | 'upload' | 'detail'>('library');
  const [sermons, setSermons] = useState<SermonEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Upload form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ministry, setMinistry] = useState('');
  const [theme, setTheme] = useState('');
  const [topic, setTopic] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progressMsg, setProgressMsg] = useState('');

  // Filter / sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'ministry'>('newest');

  useEffect(() => {
    setMounted(true);
    setSermons(loadSermons());
  }, []);

  if (!mounted) return null;

  // ── Upload & process ──────────────────────────────────────────────────────

  async function handleUpload() {
    if (!audioFile) { setError('Please select an audio file'); return; }
    if (!ministry.trim()) { setError('Please enter a ministry name'); return; }

    setIsProcessing(true);
    setError('');
    setProgressMsg('Uploading audio...');

    try {
      // Step 1: Transcribe
      const formData = new FormData();
      formData.append('audio', audioFile);

      const transRes = await fetch('/api/sermons/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transRes.ok) {
        const err = await transRes.json();
        throw new Error(err.error || 'Transcription failed');
      }

      const transData = await transRes.json();
      const transcript: string = transData.transcript;

      if (!transcript || transcript.trim().length < 10) {
        throw new Error('Transcription too short or empty');
      }

      setProgressMsg('Generating notes from transcript...');

      // Step 2: Generate notes
      const notesRes = await fetch('/api/sermons/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, title: title || undefined }),
      });

      let notes: SermonNotes | undefined;
      if (notesRes.ok) {
        notes = await notesRes.json();
      }

      // Step 3: Create entry
      const entry: SermonEntry = {
        id: crypto.randomUUID?.() || Date.now().toString(36),
        date,
        ministry: ministry.trim(),
        title: title.trim() || 'Untitled Sermon',
        theme: notes?.theme || theme || '',
        topic: notes?.topic || topic || '',
        transcript,
        notes,
        createdAt: new Date().toISOString(),
      };

      const updated = [entry, ...sermons];
      setSermons(updated);
      saveSermons(updated);
      setSelectedId(entry.id);
      setView('detail');
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  }

  function resetForm() {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setMinistry('');
    setTheme('');
    setTopic('');
    setAudioFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDelete(id: string) {
    const updated = sermons.filter(s => s.id !== id);
    setSermons(updated);
    saveSermons(updated);
    if (selectedId === id) setView('library');
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const selectedSermon = sermons.find(s => s.id === selectedId) || null;

  const filtered = sermons.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.ministry.toLowerCase().includes(q) ||
      s.theme.toLowerCase().includes(q) ||
      s.topic.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'oldest') return a.date.localeCompare(b.date);
    if (sortBy === 'ministry') return a.ministry.localeCompare(b.ministry);
    return b.date.localeCompare(a.date); // newest
  });

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderVerseCard(verse: BibleVerse, i: number) {
    const color = VERSE_COLORS[i % VERSE_COLORS.length];
    return (
      <div
        key={i}
        className={`bg-gradient-to-br ${color} border rounded-xl p-4 sm:p-5 relative overflow-hidden`}
      >
        {/* decorative quote marks */}
        <div className="absolute top-2 right-3 text-4xl leading-none opacity-20 select-none text-fg">
          &ldquo;
        </div>
        <div className="relative z-10">
          <div className="flex items-start gap-2 mb-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z"/>
            </svg>
            <span className="text-sm font-semibold text-accent">{verse.reference}</span>
          </div>
          {verse.text && (
            <p className="text-sm text-fg/90 leading-relaxed italic mb-3">
              &ldquo;{verse.text}&rdquo;
            </p>
          )}
          {verse.why_it_matters && (
            <div className="border-t border-current border-opacity-10 pt-2 mt-1">
              <p className="text-xs text-secondary leading-relaxed">
                <span className="font-medium">Why it matters: </span>
                {verse.why_it_matters}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  function renderLibrary() {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Sermon Notes</h1>
            <p className="text-sm text-muted mt-1">
              {sermons.length} sermon{sermons.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setView('upload'); }}
            className="inline-flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Sermon
          </button>
        </div>

        {/* Search & sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search sermons..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-input border border-line rounded-xl text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 bg-input border border-line rounded-xl text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="ministry">By ministry</option>
          </select>
        </div>

        {/* Grid */}
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-light rounded-2xl mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-fg mb-1">
              {searchQuery ? 'No matches found' : 'No sermons yet'}
            </h3>
            <p className="text-sm text-muted mb-4">
              {searchQuery ? 'Try a different search term' : 'Upload your first sermon to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => { resetForm(); setView('upload'); }}
                className="inline-flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
              >
                Upload a Sermon
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(sermon => (
              <button
                key={sermon.id}
                onClick={() => { setSelectedId(sermon.id); setView('detail'); }}
                className="text-left bg-card border border-line rounded-2xl p-4 sm:p-5 card-shadow hover:shadow-md hover:border-accent/30 transition-all group"
              >
                {/* Date badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-medium">
                    {formatDate(sermon.date)}
                  </span>
                  <span className="text-muted/40">·</span>
                  <span className="text-[11px] uppercase tracking-wider text-accent font-medium">
                    {sermon.ministry}
                  </span>
                </div>

                <h3 className="font-semibold text-fg group-hover:text-accent transition-colors mb-1.5">
                  {sermon.title}
                </h3>

                {sermon.theme && (
                  <p className="text-xs text-secondary leading-relaxed line-clamp-2 mb-3">
                    {sermon.theme}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {sermon.topic && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-light text-accent font-medium">
                      {sermon.topic}
                    </span>
                  )}
                  {sermon.notes?.bible_verses && sermon.notes.bible_verses.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                      {sermon.notes.bible_verses.length} verse{sermon.notes.bible_verses.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderUpload() {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back */}
        <button
          onClick={() => setView('library')}
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-fg transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Library
        </button>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">New Sermon</h1>
        <p className="text-sm text-muted mb-8">Upload an audio recording and let AI generate structured notes</p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {isProcessing ? (
          <div className="bg-card border border-line rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-light rounded-2xl mb-4">
              <svg className="w-7 h-7 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-fg mb-1">Processing...</h3>
            <p className="text-sm text-muted">{progressMsg}</p>
            <div className="mt-4 max-w-xs mx-auto bg-line rounded-full h-1.5 overflow-hidden">
              <div className="bg-accent h-full rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : (
          <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 space-y-5">
            {/* Audio file */}
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">Audio Recording *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  audioFile
                    ? 'border-accent/40 bg-accent-light'
                    : 'border-line hover:border-accent/30 hover:bg-accent-light/50'
                }`}
              >
                {audioFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-accent">{audioFile.name}</p>
                      <p className="text-xs text-secondary">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setAudioFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="ml-auto text-muted hover:text-rose-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-8 h-8 text-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm text-muted">Tap to select an audio file</p>
                    <p className="text-xs text-muted mt-1">MP3, M4A, WAV, WebM — max 25 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={e => setAudioFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Metadata fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="e.g. The Good Samaritan"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-input border border-line rounded-xl text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-input border border-line rounded-xl text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Ministry *</label>
                <input
                  type="text"
                  placeholder="e.g. Youth Group, Sunday Service"
                  value={ministry}
                  onChange={e => setMinistry(e.target.value)}
                  className="w-full px-3 py-2.5 bg-input border border-line rounded-xl text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Faith, Grace, Prayer"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-3 py-2.5 bg-input border border-line rounded-xl text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleUpload}
              disabled={!audioFile || !ministry.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white text-sm font-medium px-4 py-3 rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Upload &amp; Generate Notes
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderDetail() {
    if (!selectedSermon) return null;
    const s = selectedSermon;
    const n = s.notes;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back */}
        <button
          onClick={() => setView('library')}
          className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-fg transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Library
        </button>

        {/* Title block */}
        <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted font-medium uppercase tracking-wider mb-2">
                <span>{formatDate(s.date)}</span>
                <span className="text-muted/30">·</span>
                <span className="text-accent">{s.ministry}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">{s.title}</h1>
            </div>
            <button
              onClick={() => handleDelete(s.id)}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs text-muted hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>

          {/* Theme & topic tags */}
          {(s.theme || s.topic) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {s.theme && <span className="text-xs px-2.5 py-1 rounded-full bg-accent-light text-accent font-medium">{s.theme}</span>}
              {s.topic && <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">{s.topic}</span>}
            </div>
          )}
        </div>

        {!n ? (
          <div className="bg-card border border-line rounded-2xl p-8 text-center">
            <p className="text-sm text-muted">No AI notes available for this sermon yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Summary</h2>
              <p className="text-sm sm:text-base text-fg leading-relaxed">{n.summary}</p>
            </div>

            {/* Key Points */}
            <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Key Points</h2>
              <ul className="space-y-2">
                {n.key_points.map((pt, i) => (
                  <li key={i} className="flex gap-3 text-sm text-fg leading-relaxed">
                    <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-accent-light text-accent text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bible Verses */}
            {n.bible_verses.length > 0 && (
              <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z"/>
                  </svg>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
                    Scripture References ({n.bible_verses.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {n.bible_verses.map((v, i) => renderVerseCard(v, i))}
                </div>
              </div>
            )}

            {/* Actionable Takeaways */}
            {n.actionable_takeaways.length > 0 && (
              <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Actionable Takeaways</h2>
                </div>
                <ul className="space-y-2">
                  {n.actionable_takeaways.map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm text-fg leading-relaxed">
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="pt-0.5">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quotes */}
            {n.quotes.length > 0 && (
              <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">Notable Quotes</h2>
                <div className="space-y-3">
                  {n.quotes.map((q, i) => (
                    <blockquote key={i} className="border-l-2 border-accent pl-4 py-1">
                      <p className="text-sm text-fg italic leading-relaxed">&ldquo;{q}&rdquo;</p>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* Full Transcript (collapsible) */}
            <details className="bg-card border border-line rounded-2xl card-shadow group">
              <summary className="px-5 sm:px-6 py-4 cursor-pointer text-sm font-medium text-secondary hover:text-fg transition-colors flex items-center justify-between">
                <span>Full Transcript</span>
                <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 sm:px-6 pb-5">
                <div className="bg-input border border-line rounded-xl p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-secondary leading-relaxed whitespace-pre-wrap font-sans">{s.transcript}</pre>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    );
  }

  // ── Root render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-surface text-fg flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-line px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" width="24" height="24" className="shrink-0">
              <rect x="10" y="6" width="20" height="28" rx="3" fill="none" stroke="#7c3aed" strokeWidth="2.5" />
              <circle cx="20" cy="20" r="4" fill="none" stroke="#7c3aed" strokeWidth="2" />
              <path d="M16 12 L24 12" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16 28 L24 28" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-base font-semibold tracking-tight">Sermon Notes</span>
          </div>
          {view !== 'library' && (
            <button
              onClick={() => setView('library')}
              className="text-xs text-secondary hover:text-fg transition-colors"
            >
              Library
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      {view === 'library' && renderLibrary()}
      {view === 'upload' && renderUpload()}
      {view === 'detail' && renderDetail()}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
