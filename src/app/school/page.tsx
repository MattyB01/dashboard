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
    <main className="min-h-screen bg-surface text-fg flex flex-col">
      {/* Header */}
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <a href="/" className="text-xs text-secondary hover:text-fg transition-colors">
            Home
          </a>
          <a href="/faith" className="text-xs text-secondary hover:text-fg transition-colors">
            Faith
          </a>
          <span className="text-xs text-accent border-b border-accent">
            School
          </span>
          <a href="/system" className="text-xs text-secondary hover:text-fg transition-colors">
            System
          </a>
          {stats && (
            <span className="text-[11px] text-muted whitespace-nowrap hidden sm:inline">
              Updated {new Date(stats.timestamp).toLocaleTimeString()}
            </span>
          )}
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
            <a href="/faith" className="text-sm text-secondary hover:text-fg transition-colors">
              Faith
            </a>
            <span className="text-sm text-accent">School</span>
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
            <span className="text-accent">✦</span> School
          </h1>
          <p className="text-sm text-secondary">
            Tools and resources for your studies
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <a
            href="/school/maths-test-generator"
            className="group bg-card border border-line rounded-2xl p-6 hover:border-accent/50 transition-all hover:shadow-md card-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
              <span className="text-xl text-accent">∫</span>
            </div>
            <h2 className="text-lg text-fg mb-2 group-hover:text-accent transition-colors font-semibold tracking-tight">
              Maths Test Generator
            </h2>
            <p className="text-sm text-secondary leading-relaxed break-words">
              Generate SACE Stage 2 Maths Methods practice tests with worked solutions. Pick your topics.
            </p>
          </a>
          <a
            href="/school/referencing-tool"
            className="group bg-card border border-line rounded-2xl p-6 hover:border-accent/50 transition-all hover:shadow-md card-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
              <span className="text-xl text-accent">📚</span>
            </div>
            <h2 className="text-lg text-fg mb-2 group-hover:text-accent transition-colors font-semibold tracking-tight">
              Referencing Tool
            </h2>
            <p className="text-sm text-secondary leading-relaxed break-words">
              Build APA 7th edition reference lists. Auto-fill from URLs, bulk import, save lists for later.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
