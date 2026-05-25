'use client';

import { useEffect, useState } from 'react';

interface Verse {
  verse: string;
  reference: string;
  version: string;
}

export default function Dashboard() {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchVerse();
  }, []);

  async function fetchVerse() {
    try {
      const res = await fetch('/api/bible');
      if (res.ok) {
        const data = await res.json();
        setVerse(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-dvh bg-surface text-fg flex flex-col">
      {/* Header */}
      <header className="border-b border-line px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" width="28" height="28" className="shrink-0">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
              <path d="M12 28 L20 10 L28 28" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 22 L25 22" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-lg sm:text-xl font-semibold tracking-tight">Hermes Dashboard</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-4">
            <a
              href="/school"
              className="text-xs text-secondary hover:text-fg transition-colors"
            >
              School
            </a>
            <a
              href="/system"
              className="text-xs text-secondary hover:text-fg transition-colors"
            >
              System
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="sm:hidden flex items-center gap-2 sm:gap-4">
            <a
              href="/school"
              className="text-xs text-secondary hover:text-fg transition-colors"
            >
              School
            </a>
            <a
              href="/system"
              className="text-xs text-secondary hover:text-fg transition-colors"
            >
              System
            </a>
          </div>
        </div>
      </header>

      {/* Verse of the Day — centered */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-2xl mx-auto text-center">
          <div className="bg-card card-shadow border border-line rounded-2xl p-8 sm:p-10 lg:p-12">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-accent mb-6 sm:mb-8">
              ✦ Verse of the Day
            </div>

            {loading ? (
              <div className="text-muted text-base animate-pulse">Loading...</div>
            ) : verse ? (
              <>
                <p className="text-lg sm:text-xl lg:text-2xl text-fg leading-relaxed italic font-light break-words">
                  &ldquo;{verse.verse}&rdquo;
                </p>
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-line break-words">
                  <p className="text-sm sm:text-base text-accent">
                    {verse.reference}
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {verse.version}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Verse unavailable</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
