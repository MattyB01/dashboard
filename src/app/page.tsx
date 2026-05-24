'use client';

import { useEffect, useState } from 'react';

interface SystemStats {
  hostname: string;
  platform: string;
  release: string;
  arch: string;
  nodeVersion: string;
  uptime: string;
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
    loadAverage: number[];
  };
  memory: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    usagePercent: number;
  };
  timestamp: string;
}

export default function Dashboard() {
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
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Header */}
      <header className="border-b border-[#1e1e30] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" width="28" height="28">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
              <path d="M12 28 L20 10 L28 28" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 22 L25 22" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-lg font-semibold tracking-tight">Hermes Dashboard</span>
          </div>
          {stats && (
            <span className="text-xs text-[#555570] font-mono">
              Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="CPU Usage" value={stats ? `${stats.cpu.usagePercent}%` : '—'} sub={stats ? `${stats.cpu.cores} cores` : undefined} loading={loading} />
          <StatCard label="Memory" value={stats ? `${stats.memory.usagePercent}%` : '—'} sub={stats ? `${stats.memory.freeGb} GB free` : undefined} loading={loading} />
          <StatCard label="Uptime" value={stats ? stats.uptime : '—'} sub={stats?.hostname} loading={loading} />
          <StatCard label="Platform" value={stats ? `${stats.platform} ${stats.arch}` : '—'} sub={stats?.release} loading={loading} />
        </div>

        {/* Detail Sections */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* CPU Card */}
          <SectionCard title="◆ Processor">
            <Row label="Model" value={stats?.cpu.model ?? '—'} />
            <Row label="Usage" value={stats ? `${stats.cpu.usagePercent}%` : '—'} />
            {stats && <ProgressBar percent={stats.cpu.usagePercent} />}
            <Row label="Cores" value={stats?.cpu.cores?.toString() ?? '—'} />
            <Row label="Load (1m)" value={stats ? stats.cpu.loadAverage[0].toFixed(2) : '—'} />
            <Row label="Load (5m)" value={stats ? stats.cpu.loadAverage[1].toFixed(2) : '—'} />
            <Row label="Load (15m)" value={stats ? stats.cpu.loadAverage[2].toFixed(2) : '—'} />
          </SectionCard>

          {/* Memory Card */}
          <SectionCard title="◈ Memory">
            <Row label="Usage" value={stats ? `${stats.memory.usagePercent}%` : '—'} />
            {stats && <ProgressBar percent={stats.memory.usagePercent} />}
            <Row label="Total" value={stats ? `${stats.memory.totalGb} GB` : '—'} />
            <Row label="Used" value={stats ? `${stats.memory.usedGb} GB` : '—'} />
            <Row label="Free" value={stats ? `${stats.memory.freeGb} GB` : '—'} />
          </SectionCard>

          {/* System Card */}
          <SectionCard title="⊘ System">
            <Row label="Hostname" value={stats?.hostname ?? '—'} />
            <Row label="OS" value={stats ? `${stats.platform} ${stats.arch}` : '—'} />
            <Row label="Kernel" value={stats?.release ?? '—'} />
            <Row label="Node.js" value={stats?.nodeVersion ?? '—'} />
            <Row label="Uptime" value={stats?.uptime ?? '—'} />
          </SectionCard>

          {/* Network / Info Card */}
          <SectionCard title="◉ About">
            <div className="text-sm text-[#8888a0] leading-relaxed">
              <p className="mb-3">
                This dashboard displays real-time system statistics for the Hermes
                server environment. Stats refresh automatically every 30 seconds.
              </p>
              <p className="text-xs text-[#555570] font-mono">
                Built with Next.js · Deployed via Vercel
              </p>
            </div>
          </SectionCard>
        </div>
      </main>

      {error && (
        <div className="fixed bottom-4 right-4 bg-[#f87171] text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, loading }: {
  label: string;
  value: string;
  sub?: string;
  loading: boolean;
}) {
  return (
    <div className="relative bg-[#16161f] border border-[#1e1e30] rounded-xl p-5 overflow-hidden hover:border-[#2a2a40] transition-colors">
      <div className="absolute top-0 left-0 w-[3px] h-full bg-[#a78bfa] opacity-50" />
      <div className="text-[10px] uppercase tracking-widest text-[#555570] font-mono mb-2">
        {label}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${loading ? 'animate-pulse text-[#555570]' : ''}`}>
        {loading ? '...' : value}
      </div>
      {sub && <div className="text-xs text-[#8888a0] mt-1 font-mono">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#16161f] border border-[#1e1e30] rounded-xl p-5">
      <h3 className="text-[10px] uppercase tracking-widest text-[#a78bfa] font-mono mb-4">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#1e1e30] last:border-0">
      <span className="text-sm text-[#8888a0]">{label}</span>
      <span className="text-sm font-mono text-[#e8e8f0]">{value}</span>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent > 80 ? '#f87171' : percent > 60 ? '#fbbf24' : '#a78bfa';
  return (
    <div className="w-full h-1.5 bg-[#1a1a26] rounded-full overflow-hidden my-2">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}
