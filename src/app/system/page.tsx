'use client';

import { useEffect, useState } from 'react';

interface SystemStats {
  hostname: string;
  platform: string;
  release: string;
  arch: string;
  nodeVersion: string;
  uptime: string;
  cpu: { model: string; cores: number; usagePercent: number; loadAverage: number[]; };
  memory: { totalGb: number; usedGb: number; freeGb: number; usagePercent: number; };
  timestamp: string;
}

export default function SystemPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/system');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
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
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="/" className="text-sm text-secondary hover:text-fg transition-colors">
              Home
            </a>
            <span className="text-muted text-xs">/</span>
            <span className="text-sm text-accent font-medium border-b-2 border-accent/40 pb-0.5" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              System
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
            <span className="px-3 py-1.5 text-sm text-accent font-medium">System</span>
            {stats && (
              <span className="text-xs text-muted ml-2">
                updated {new Date(stats.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 text-secondary hover:text-fg transition-colors rounded-lg hover:bg-card"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-line space-y-1">
            <a href="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-colors">Home</a>
            <a href="/faith" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-colors">Faith</a>
            <a href="/school" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-colors">School</a>
            <div className="px-3 py-2 text-sm text-accent font-medium">System</div>
            {stats && (
              <div className="px-3 text-xs text-muted">updated {new Date(stats.timestamp).toLocaleTimeString()}</div>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-5xl mx-auto w-full animate-fade-up fade-delay-1">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl text-fg mb-2 font-normal leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            System
          </h1>
          <p className="text-sm text-secondary">
            Server status and metrics
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-muted animate-pulse">Loading system data...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-fade-up fade-delay-2">
            {/* Host */}
            <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted mb-3 font-medium">Host</div>
              <div className="text-sm text-fg font-medium">{stats.hostname}</div>
              <div className="text-xs text-secondary mt-1">{stats.platform} {stats.release}</div>
              <div className="text-xs text-secondary">{stats.arch}</div>
            </div>

            {/* CPU */}
            <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted mb-3 font-medium">CPU</div>
              <div className="text-sm text-fg font-medium">{stats.cpu.model}</div>
              <div className="text-xs text-secondary mt-1">{stats.cpu.cores} cores</div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary">Usage</span>
                  <span className={stats.cpu.usagePercent > 80 ? 'text-accent font-medium' : 'text-fg'}>{stats.cpu.usagePercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(stats.cpu.usagePercent, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Memory */}
            <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted mb-3 font-medium">Memory</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg text-fg font-medium" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{stats.memory.usedGb.toFixed(1)}</span>
                <span className="text-xs text-secondary">/ {stats.memory.totalGb.toFixed(1)} GB</span>
              </div>
              <div className="text-xs text-secondary mt-0.5">{stats.memory.freeGb.toFixed(1)} GB free</div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary">Usage</span>
                  <span className={stats.memory.usagePercent > 85 ? 'text-accent font-medium' : 'text-fg'}>{stats.memory.usagePercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(stats.memory.usagePercent, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Node */}
            <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted mb-3 font-medium">Runtime</div>
              <div className="text-sm text-fg font-medium">Node.js {stats.nodeVersion}</div>
              <div className="text-xs text-secondary mt-1">Uptime: {stats.uptime}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No data</p>
        )}
      </div>
    </div>
  );
}
