import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  // CPU info
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'N/A';
  const cpuCores = cpus.length;

  // Calculate CPU usage (average over cores)
  const cpuTimes = cpus.map(cpu => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return { total, idle, usage: ((total - idle) / total) * 100 };
  });
  const cpuUsage = cpuTimes.reduce((sum, c) => sum + c.usage, 0) / cpuTimes.length;

  // Memory info
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100);

  // Uptime
  const uptimeSeconds = os.uptime();

  // Network interfaces (basic)
  const netInterfaces = os.networkInterfaces();

  // Host info
  const hostname = os.hostname();
  const platform = os.platform();
  const release = os.release();
  const arch = os.arch();
  const nodeVersion = process.version;

  return NextResponse.json({
    hostname,
    platform,
    release,
    arch,
    nodeVersion,
    uptime: formatUptime(uptimeSeconds),
    uptimeSeconds,
    cpu: {
      model: cpuModel,
      cores: cpuCores,
      usagePercent: Math.round(cpuUsage * 10) / 10,
      loadAverage: os.loadavg(),
    },
    memory: {
      totalGb: roundGb(totalMem),
      usedGb: roundGb(usedMem),
      freeGb: roundGb(freeMem),
      usagePercent: Math.round(memUsagePercent * 10) / 10,
    },
    timestamp: new Date().toISOString(),
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

function roundGb(bytes: number): number {
  return Math.round((bytes / (1024 ** 3)) * 100) / 100;
}
