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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchVerse();
  }, []);

  const nav = (href: string) => {
    setMenuOpen(false);
    window.location.href = href;
  };

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
              <rect x="8" y="6" width="24" height="28" rx="4" fill="none" stroke="#c4563d" strokeWidth="2.5" />
              <path d="M14 14 L26 14" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 19 L26 19" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 24 L22 24" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-lg sm:text-xl font-semibold tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Hermes
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            <a href="/faith" className="px-3 py-1.5 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-all">
              Faith
            </a>
            <a href="/school" className="px-3 py-1.5 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-all">
              School
            </a>
            <a href="/system" className="px-3 py-1.5 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-all">
              System
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-secondary hover:text-fg transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-b border-line bg-card px-4 py-3 flex gap-3 flex-wrap">
          <button onClick={() => nav('/faith')} className="text-sm text-secondary hover:text-fg transition-colors font-medium">
            Faith
          </button>
          <button onClick={() => nav('/school')} className="text-sm text-secondary hover:text-fg transition-colors font-medium">
            School
          </button>
          <button onClick={() => nav('/system')} className="text-sm text-secondary hover:text-fg transition-colors font-medium">
            System
          </button>
        </div>
      )}

      {/* Verse of the Day — centered */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="w-full max-w-xl mx-auto text-center animate-fade-up fade-delay-1">
          {loading ? (
            <div className="text-muted text-base animate-pulse">Loading...</div>
          ) : verse ? (
            <>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-accent mb-6 sm:mb-8 font-medium">
                Verse of the Day
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl text-fg leading-[1.3] italic font-light" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                &ldquo;{verse.verse}&rdquo;
              </p>
              <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-line">
                <p className="text-sm sm:text-base text-accent font-medium">
                  {verse.reference}
                </p>
                <p className="text-xs text-muted mt-1.5">
                  {verse.version}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Verse unavailable</p>
          )}
        </div>
      </main>
    </div>
  );
}
