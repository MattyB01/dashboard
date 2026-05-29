'use client';

import { useEffect, useState } from 'react';

interface Verse {
  verse: string;
  reference: string;
  version: string;
}

export default function FaithPage() {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/bible')
      .then((r) => r.json())
      .then(setVerse)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-dvh bg-surface text-fg flex flex-col">
      {/* Header */}
      <header className="border-b border-line px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="/" className="text-sm text-secondary hover:text-fg transition-colors">
              Home
            </a>
            <span className="text-muted text-xs">/</span>
            <span className="text-sm text-accent font-medium border-b-2 border-accent/40 pb-0.5" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Faith
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            <span className="px-3 py-1.5 text-sm text-accent font-medium">Faith</span>
            <a href="/school" className="px-3 py-1.5 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-all">
              School
            </a>
            <a href="/system" className="px-3 py-1.5 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-all">
              System
            </a>
          </div>

          {/* Mobile hamburger */}
          <details className="sm:hidden relative">
            <summary className="list-none cursor-pointer p-2 text-secondary hover:text-fg transition-colors rounded-lg hover:bg-card">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute right-0 top-full mt-2 bg-card border border-line rounded-xl p-3 w-44 shadow-lg flex flex-col gap-1">
              <a href="/" className="block px-3 py-2 text-sm text-secondary hover:text-fg hover:bg-surface rounded-lg transition-colors">Home</a>
              <span className="block px-3 py-2 text-sm text-accent font-medium rounded-lg">Faith</span>
              <a href="/school" className="block px-3 py-2 text-sm text-secondary hover:text-fg hover:bg-surface rounded-lg transition-colors">School</a>
              <a href="/system" className="block px-3 py-2 text-sm text-secondary hover:text-fg hover:bg-surface rounded-lg transition-colors">System</a>
            </div>
          </details>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-5xl mx-auto w-full">
        <div className="mb-8 sm:mb-10 animate-fade-up fade-delay-1">
          <h1 className="text-3xl sm:text-4xl text-fg mb-2 font-normal leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Faith
          </h1>
          <p className="text-sm text-secondary">
            Spiritual growth &amp; resources
          </p>
        </div>

        {/* Verse of the Day card */}
        {verse && !loading && (
          <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 mb-6 card-shadow animate-fade-up fade-delay-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-accent mb-4 font-medium">
              Verse of the Day
            </div>
            <p className="text-lg sm:text-xl text-fg leading-relaxed italic font-light" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              &ldquo;{verse.verse}&rdquo;
            </p>
            <div className="mt-5 pt-4 border-t border-line">
              <p className="text-sm text-accent font-medium">{verse.reference}</p>
              <p className="text-xs text-muted mt-1">{verse.version}</p>
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-fade-up fade-delay-3">
          <a
            href="/sermons"
            className="group bg-card border border-line rounded-2xl p-6 sm:p-7 hover:border-accent/30 transition-all card-shadow hover:card-shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
              <span className="text-lg text-accent font-serif italic">S</span>
            </div>
            <h2 className="text-lg text-fg mb-2 group-hover:text-accent transition-colors font-medium leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Sermon Notes
            </h2>
            <p className="text-sm text-secondary leading-relaxed">
              Upload sermon audio, get transcriptions, notes, and Bible verses.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
