'use client';

import { useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';

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
      <SiteHeader currentPage="home" />

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
