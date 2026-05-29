"use client";
import { useState, useEffect } from "react";

export default function SchoolPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/system")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

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
              School
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            <a href="/faith" className="px-3 py-1.5 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-all">
              Faith
            </a>
            <span className="px-3 py-1.5 text-sm text-accent font-medium">School</span>
            <a href="/system" className="px-3 py-1.5 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-all">
              System
            </a>
            {stats && (
              <span className="text-xs text-muted ml-2 hidden lg:inline">
                {new Date(stats.timestamp).toLocaleTimeString()}
              </span>
            )}
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
              <a href="/faith" className="block px-3 py-2 text-sm text-secondary hover:text-fg hover:bg-surface rounded-lg transition-colors">Faith</a>
              <span className="block px-3 py-2 text-sm text-accent font-medium rounded-lg">School</span>
              <a href="/system" className="block px-3 py-2 text-sm text-secondary hover:text-fg hover:bg-surface rounded-lg transition-colors">System</a>
            </div>
          </details>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-5xl mx-auto w-full">
        <div className="mb-8 sm:mb-10 animate-fade-up fade-delay-1">
          <h1 className="text-3xl sm:text-4xl text-fg mb-2 font-normal leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            School
          </h1>
          <p className="text-sm text-secondary">
            Tools and resources for your studies
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-fade-up fade-delay-2">
          <a
            href="/school/maths-test-generator"
            className="group bg-card border border-line rounded-2xl p-6 sm:p-7 hover:border-accent/30 transition-all card-shadow hover:card-shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
              <span className="text-lg text-accent font-medium">∫</span>
            </div>
            <h2 className="text-lg text-fg mb-2 group-hover:text-accent transition-colors font-medium leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Maths Test Generator
            </h2>
            <p className="text-sm text-secondary leading-relaxed">
              Generate SACE Stage 2 Maths Methods practice tests with worked solutions. Pick your topics.
            </p>
          </a>
          <a
            href="/school/referencing-tool"
            className="group bg-card border border-line rounded-2xl p-6 sm:p-7 hover:border-accent/30 transition-all card-shadow hover:card-shadow-lg"
          >
            <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
              <span className="text-lg text-accent">📚</span>
            </div>
            <h2 className="text-lg text-fg mb-2 group-hover:text-accent transition-colors font-medium leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Referencing Tool
            </h2>
            <p className="text-sm text-secondary leading-relaxed">
              Build APA 7th edition reference lists. Auto-fill from URLs, bulk import, save lists.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
