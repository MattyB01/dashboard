'use client';

import { useState, useEffect } from 'react';

type PageName = 'home' | 'faith' | 'school' | 'system';

const NAV_ITEMS: { page: PageName; label: string; href: string }[] = [
  { page: 'faith', label: 'Faith', href: '/faith' },
  { page: 'school', label: 'School', href: '/school' },
  { page: 'system', label: 'System', href: '/system' },
];

export default function SiteHeader({ currentPage }: { currentPage: PageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  if (!mounted) return null;

  return (
    <header className="border-b border-line px-4 sm:px-6 lg:px-8 py-4 sm:py-5 relative z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand — no breadcrumbs */}
        <a href="/" className="flex items-center gap-3 shrink-0">
          <svg viewBox="0 0 40 40" width="24" height="24" className="shrink-0">
            <rect x="8" y="6" width="24" height="28" rx="4" fill="none" stroke="#c4563d" strokeWidth="2.5" />
            <path d="M14 14 L26 14" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 19 L26 19" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 24 L22 24" stroke="#c4563d" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span
            className="text-lg sm:text-xl font-semibold tracking-tight text-fg"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Hermes
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) =>
            currentPage === item.page ? (
              <span
                key={item.page}
                className="px-3 py-1.5 text-sm text-accent font-medium"
              >
                {item.label}
              </span>
            ) : (
              <a
                key={item.page}
                href={item.href}
                className="px-3 py-1.5 text-sm text-secondary hover:text-fg hover:bg-card rounded-lg transition-all"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 text-secondary hover:text-fg transition-colors rounded-lg hover:bg-card"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu — full-screen overlay, appears ABOVE all content */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed inset-x-4 top-4 bg-card border border-line rounded-2xl p-3 shadow-xl animate-fade-up">
            <div className="flex justify-end mb-1">
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-secondary hover:text-fg transition-colors rounded-lg hover:bg-surface"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              <a
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  currentPage === 'home'
                    ? 'text-accent font-medium bg-accent-light'
                    : 'text-secondary hover:text-fg hover:bg-surface'
                }`}
              >
                Home
              </a>
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.page}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    currentPage === item.page
                      ? 'text-accent font-medium bg-accent-light'
                      : 'text-secondary hover:text-fg hover:bg-surface'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
