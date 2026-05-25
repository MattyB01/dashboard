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
    <main className="min-h-screen bg-[#0e0e16] text-[#e8e8f0] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e1e30] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono">
            Home
          </a>
          <span className="text-xs text-[#a78bfa] font-mono border-b border-[#a78bfa]">
            School
          </span>
          <a href="/system" className="text-xs text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono">
            System
          </a>
          {stats && (
            <span className="text-[11px] text-[#555570] font-mono whitespace-nowrap hidden sm:inline">
              Updated {new Date(stats.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Mobile hamburger */}
        <details className="sm:hidden relative">
          <summary className="list-none cursor-pointer p-2 hover:bg-[#1e1e30] rounded-lg">
            <div className="w-5 h-0.5 bg-[#8888a0] mb-1"></div>
            <div className="w-5 h-0.5 bg-[#8888a0] mb-1"></div>
            <div className="w-5 h-0.5 bg-[#8888a0]"></div>
          </summary>
          <div className="absolute right-0 top-full mt-2 bg-[#16161f] border border-[#1e1e30] rounded-xl p-4 w-48 shadow-2xl flex flex-col gap-3">
            <a href="/" className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono">
              Home
            </a>
            <span className="text-sm text-[#a78bfa] font-mono">School</span>
            <a href="/system" className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono">
              System
            </a>
          </div>
        </details>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-mono text-[#e8e8f0] mb-2">
            <span className="text-[#a78bfa]">✦</span> School
          </h1>
          <p className="text-sm text-[#8888a0] font-mono">
            Tools and resources for your studies
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/school/maths-test-generator"
            className="group bg-[#16161f] border border-[#1e1e30] rounded-2xl p-6 hover:border-[#a78bfa]/50 transition-all hover:bg-[#1a1a28]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1e1e30] flex items-center justify-center mb-4 group-hover:bg-[#a78bfa]/10 transition-colors">
              <span className="text-xl text-[#a78bfa]">∫</span>
            </div>
            <h2 className="text-lg font-mono text-[#e8e8f0] mb-2 group-hover:text-[#a78bfa] transition-colors">
              Maths Test Generator
            </h2>
            <p className="text-sm text-[#8888a0] font-mono leading-relaxed">
              Generate SACE Stage 2 Maths Methods practice tests with worked solutions. Pick your topics.
            </p>
          </a>
          <a
            href="/school/referencing-tool"
            className="group bg-[#16161f] border border-[#1e1e30] rounded-2xl p-6 hover:border-[#a78bfa]/50 transition-all hover:bg-[#1a1a28]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1e1e30] flex items-center justify-center mb-4 group-hover:bg-[#a78bfa]/10 transition-colors">
              <span className="text-xl text-[#a78bfa]">📚</span>
            </div>
            <h2 className="text-lg font-mono text-[#e8e8f0] mb-2 group-hover:text-[#a78bfa] transition-colors">
              Referencing Tool
            </h2>
            <p className="text-sm text-[#8888a0] font-mono leading-relaxed">
              Build APA 7th edition reference lists. Auto-fill from URLs, bulk import, save lists for later.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
