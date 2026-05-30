'use client';

import { useEffect, useState } from 'react';
import SiteHeader from '@/components/SiteHeader';

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
      <SiteHeader currentPage="system" />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-5xl mx-auto w-full animate-fade-up fade-delay-1">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl text-fg mb-2 font-normal leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            System
          </h1>
          <p className="text-sm text-secondary">
            Server status and metrics
          </p>
          {stats && (
            <span className="text-xs text-muted mt-1 inline-block">
              updated {new Date(stats.timestamp).toLocaleTimeString()}
            </span>
          )}
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
