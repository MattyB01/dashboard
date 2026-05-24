'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(d => { if (d.authenticated) router.replace('/'); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.replace('/');
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#555570] text-sm font-mono animate-pulse">Checking...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <svg viewBox="0 0 40 40" width="40" height="40" className="mx-auto mb-4">
            <circle cx="20" cy="20" r="18" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
            <path d="M12 28 L20 10 L28 28" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 22 L25 22" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h1 className="text-xl font-semibold text-[#e8e8f0]">Hermes Dashboard</h1>
          <p className="text-sm text-[#555570] mt-1 font-mono">Enter password to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              autoFocus
              className="w-full px-4 py-3 bg-[#16161f] border border-[#1e1e30] rounded-lg text-[#e8e8f0] placeholder:text-[#555570] font-mono text-sm focus:outline-none focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa]/30 transition-all disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="text-sm text-[#f87171] font-mono text-center bg-[#f87171]/10 border border-[#f87171]/20 rounded-lg px-4 py-2.5">
              ✦ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-[#a78bfa] text-[#0a0a0f] font-semibold rounded-lg hover:bg-[#b99cfb] transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-[10px] text-center text-[#33334a] mt-8 font-mono">
          Authorized access only
        </p>
      </div>
    </div>
  );
}
