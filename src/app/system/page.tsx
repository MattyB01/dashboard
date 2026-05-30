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

function ProgressBar({ percent }: { percent: number }) {
  const pct = Math.min(percent, 100);
  return (
    <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
      <div
        className="h-full bg-accent rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatCard({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading: boolean }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-4 sm:p-5 card-shadow">
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1.5 font-medium">{label}</div>
      {loading ? (
        <div className="h-5 w-16 bg-line rounded animate-pulse" />
      ) : (
        <>
          <div className="text-lg sm:text-xl text-fg font-medium" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{value}</div>
          {sub && <div className="text-xs text-secondary mt-0.5">{sub}</div>}
        </>
      )}
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 card-shadow">
      <h3 className="text-sm font-medium text-fg mb-4 pb-3 border-b border-line" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-secondary shrink-0">{label}</span>
      <span className="text-sm text-fg text-right font-medium">{value}</span>
    </div>
  );
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

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-5xl mx-auto w-full">
        <div className="mb-6 sm:mb-8 animate-fade-up fade-delay-1">
          <h1 className="text-3xl sm:text-4xl text-fg mb-2 font-normal leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            System
          </h1>
          <p className="text-sm text-secondary">
            Server status and metrics
          </p>
        </div>

        {loading && !stats ? (
          <div className="text-sm text-muted animate-pulse">Loading system data...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : stats ? (
          <>
            {/* Stat cards row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8 sm:mb-10 animate-fade-up fade-delay-2">
              <StatCard label="CPU Usage" value={`${stats.cpu.usagePercent}%`} sub={`${stats.cpu.cores} cores`} loading={loading} />
              <StatCard label="Memory" value={`${stats.memory.usagePercent}%`} sub={`${stats.memory.freeGb.toFixed(1)} GB free`} loading={loading} />
              <StatCard label="Uptime" value={stats.uptime} sub={stats.hostname} loading={loading} />
              <StatCard label="Platform" value={`${stats.platform} ${stats.arch}`} sub={stats.release} loading={loading} />
            </div>

            {/* Detail sections */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 animate-fade-up fade-delay-3">
              <DetailCard title="Processor">
                <Row label="Model" value={stats.cpu.model} />
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary">Usage</span>
                    <span className={stats.cpu.usagePercent > 80 ? 'text-accent font-medium' : 'text-fg'}>{stats.cpu.usagePercent}%</span>
                  </div>
                  <ProgressBar percent={stats.cpu.usagePercent} />
                </div>
                <Row label="Cores" value={stats.cpu.cores.toString()} />
                <Row label="Load (1m)" value={stats.cpu.loadAverage[0].toFixed(2)} />
                <Row label="Load (5m)" value={stats.cpu.loadAverage[1].toFixed(2)} />
                <Row label="Load (15m)" value={stats.cpu.loadAverage[2].toFixed(2)} />
              </DetailCard>

              <DetailCard title="Memory">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-secondary">Usage</span>
                    <span className={stats.memory.usagePercent > 85 ? 'text-accent font-medium' : 'text-fg'}>{stats.memory.usagePercent}%</span>
                  </div>
                  <ProgressBar percent={stats.memory.usagePercent} />
                </div>
                <Row label="Total" value={`${stats.memory.totalGb.toFixed(1)} GB`} />
                <Row label="Used" value={`${stats.memory.usedGb.toFixed(1)} GB`} />
                <Row label="Free" value={`${stats.memory.freeGb.toFixed(1)} GB`} />
              </DetailCard>

              <DetailCard title="System">
                <Row label="Hostname" value={stats.hostname} />
                <Row label="OS" value={`${stats.platform} ${stats.arch}`} />
                <Row label="Kernel" value={stats.release} />
                <Row label="Node.js" value={stats.nodeVersion} />
                <Row label="Uptime" value={stats.uptime} />
              </DetailCard>

              <DetailCard title="About">
                <div className="text-sm text-secondary leading-relaxed space-y-3">
                  <p>
                    This dashboard displays real-time system statistics for the Hermes
                    server environment. Stats refresh automatically every 30 seconds.
                  </p>
                  <p className="text-xs text-muted">
                    Built with Next.js · Deployed via Vercel
                  </p>
                </div>
              </DetailCard>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">No data</p>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-xl text-sm shadow-2xl max-w-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
