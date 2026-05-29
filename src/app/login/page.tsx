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
      <div className="w-full max-w-sm animate-fade-up fade-delay-1">
        <div className="text-center mb-10 sm:mb-12">
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-card border border-line flex items-center justify-center card-shadow">
            <svg viewBox="0 0 40 40" width="28" height="28" className="shrink-0">
              <rect x="8" y="6" width="24" height="28" rx="4" fill="none" stroke="#c4563d" strokeWidth="2.5" />
              <path d="M14 14 L26 14" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 19 L26 19" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 24 L22 24" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal text-fg tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Hermes
          </h1>
          <p className="text-sm text-secondary mt-2">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              autoFocus
              className="w-full px-5 py-4 bg-card border border-line rounded-xl text-fg placeholder:text-muted text-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50 card-shadow"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 border border-red-200 rounded-xl px-5 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-4 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark transition-colors text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-center text-muted mt-10 tracking-wider uppercase">
          Authorized access only
        </p>
      </div>
    </div>
  );
}
