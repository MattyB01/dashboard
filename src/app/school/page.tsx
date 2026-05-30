"use client";
import { useState, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";

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
      <SiteHeader currentPage="school" />

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
