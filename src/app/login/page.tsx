'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

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
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <div className="text-muted text-sm animate-pulse">Checking...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-10 sm:mb-12">
          <svg viewBox="0 0 40 40" width="48" height="48" className="mx-auto mb-5">
            <circle cx="20" cy="20" r="18" fill="none" stroke="#a78bfa" strokeWidth="2.5" />
            <path d="M12 28 L20 10 L28 28" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 22 L25 22" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h1 className="text-2xl sm:text-3xl font-semibold text-fg tracking-tight">Hermes Dashboard</h1>
          <p className="text-sm sm:text-base text-muted mt-2">Enter password to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              autoFocus
              className="w-full px-5 py-4 bg-card card-shadow border border-line rounded-xl text-fg placeholder:text-muted text-base sm:text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 border border-red-200 rounded-xl px-5 py-3">
              ✦ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-[#6d28d9] transition-colors text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-[11px] text-center text-gray-400 mt-10 tracking-wider uppercase">
          Authorized access only
        </p>
      </div>
    </div>
  );
}
