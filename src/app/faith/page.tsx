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
    <main className="min-h-screen bg-surface text-fg flex flex-col">
      {/* Header */}
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <a href="/" className="text-xs text-secondary hover:text-fg transition-colors">
            Home
          </a>
          <span className="text-xs text-accent border-b border-accent">
            Faith
          </span>
          <a href="/school" className="text-xs text-secondary hover:text-fg transition-colors">
            School
          </a>
          <a href="/system" className="text-xs text-secondary hover:text-fg transition-colors">
            System
          </a>
        </div>

        {/* Mobile hamburger */}
        <details className="sm:hidden relative">
          <summary className="list-none cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
            <div className="w-5 h-0.5 bg-muted mb-1"></div>
            <div className="w-5 h-0.5 bg-muted mb-1"></div>
            <div className="w-5 h-0.5 bg-muted"></div>
          </summary>
          <div className="absolute right-0 top-full mt-2 bg-card border border-line rounded-xl p-4 w-48 shadow-2xl flex flex-col gap-3">
            <a href="/" className="text-sm text-secondary hover:text-fg transition-colors">
              Home
            </a>
            <span className="text-sm text-accent">Faith</span>
            <a href="/school" className="text-sm text-secondary hover:text-fg transition-colors">
              School
            </a>
            <a href="/sermons" className="text-sm text-secondary hover:text-fg transition-colors">
              Sermons
            </a>
            <a href="/system" className="text-sm text-secondary hover:text-fg transition-colors">
              System
            </a>
          </div>
        </details>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl text-fg mb-2 font-bold tracking-tight">
            <span className="text-accent">✝</span> Faith
          </h1>
          <p className="text-sm text-secondary">
            Spiritual growth &amp; resources
          </p>
        </div>

        {/* Verse of the Day card */}
        {verse && (
          <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 mb-6 card-shadow">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-accent mb-4">
              ✦ Verse of the Day
            </div>
            <p className="text-base sm:text-lg text-fg leading-relaxed italic font-light">
              &ldquo;{verse.verse}&rdquo;
            </p>
            <div className="mt-4 pt-4 border-t border-line">
              <p className="text-sm text-accent">{verse.reference}</p>
              <p className="text-[11px] text-muted mt-1">{verse.version}</p>
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <a
            href="/sermons"
            className="group bg-card border border-line rounded-2xl p-6 hover:border-accent/50 transition-all hover:shadow-md card-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
              <span className="text-xl text-accent">📖</span>
            </div>
            <h2 className="text-lg text-fg mb-2 group-hover:text-accent transition-colors font-semibold tracking-tight">
              Sermon Notes
            </h2>
            <p className="text-sm text-secondary leading-relaxed break-words">
              Upload sermon audio, get AI-powered transcriptions, structured notes, Bible verses, and key takeaways.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
