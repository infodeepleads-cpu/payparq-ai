'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLocale } from '@/components/LocaleProvider';
import type { User } from '@supabase/supabase-js';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [localUserData, setLocalUserData] = useState<{ plate?: string; phone?: string } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    // Try refreshing session first to avoid false "not logged in" on first load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        // Attempt token refresh before giving up
        const { data } = await supabase!.auth.refreshSession();
        setUser(data.session?.user ?? null);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowLoginPrompt(false);
        setShowDashboard(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('payparq_user_data');
    if (saved) {
      try { setLocalUserData(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [menuOpen]);

  const close = () => { setMenuOpen(false); setShowLoginPrompt(false); };

  const handleDashboard = () => {
    if (user) {
      close();
      setShowDashboard(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setSigningIn(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/members` },
      });
    } catch {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* White status bar for Android */}
      <meta name="theme-color" content="#ffffff" />
      {children}

      {/* Floating hamburger button — top right, fixed */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed top-4 right-4 z-[1100] flex flex-col gap-[5px] p-2 md:top-[22px] md:py-[13px] bg-white rounded-lg shadow-md border border-black/10"
        aria-label="Open menu"
      >
        <span className="h-[2px] w-5 bg-black rounded" />
        <span className="h-[2px] w-5 bg-black rounded" />
        <span className="h-[2px] w-5 bg-black rounded" />
      </button>

      {/* Dashboard iframe sheet */}
      {showDashboard && (
        <div className="fixed inset-0 z-[9500] flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 h-12 border-b border-black/10 shrink-0">
            <span className="text-sm font-bold">Dashboard</span>
            <button
              onClick={() => setShowDashboard(false)}
              className="text-black/40 hover:text-black text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <iframe
            src="/members"
            className="flex-1 w-full border-none"
            title="Dashboard"
          />
        </div>
      )}

      {/* Backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-[8999] bg-black/40" onClick={close} />
      )}

      {/* Right-side sliding panel */}
      <div
        className="fixed inset-y-0 right-0 z-[9000] w-72 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out"
        style={{ transform: menuOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-black/10 shrink-0 gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold block">PayParq</span>
            {user && <p className="text-[10px] text-black/50 truncate">{user.email}</p>}
            {user && localUserData?.plate && (
              <p className="text-[10px] text-black/50 font-semibold">{localUserData.plate}</p>
            )}
            {user && localUserData?.phone && (
              <p className="text-[10px] text-black/50">{localUserData.phone}</p>
            )}
          </div>
          <button onClick={close} className="text-black/40 hover:text-black text-xl leading-none shrink-0">✕</button>
        </div>

        <nav className="flex-1 flex flex-col px-3 py-4 gap-1">
          <a href="/app" onClick={close} className="px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black text-center">
            {locale === 'en' ? 'Find Parking' : 'Pronađi parking'}
          </a>

          {/* Dashboard — gated behind auth */}
          {!showLoginPrompt ? (
            <button
              onClick={handleDashboard}
              className="px-4 py-3 rounded-xl text-sm font-medium text-center w-full hover:bg-black/5 text-black"
            >
              {locale === 'en' ? 'Dashboard' : 'Upravljačka Ploča'}
            </button>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-black/5 flex flex-col gap-2">
              <p className="text-xs text-black/60 text-center">
                {locale === 'en' ? 'Sign in to access Dashboard' : 'Prijavite se za pristup'}
              </p>
              <button
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="w-full py-2 rounded-lg bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-black/80 transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {signingIn ? '...' : (locale === 'en' ? 'Sign in with Google' : 'Prijava s Googleom')}
              </button>
              <button onClick={() => setShowLoginPrompt(false)} className="text-xs text-black/40 text-center hover:text-black/60">
                {locale === 'en' ? 'Cancel' : 'Odustani'}
              </button>
            </div>
          )}

          {user && (
            <button
              onClick={async () => { if (supabase) { await supabase.auth.signOut(); close(); } }}
              className="px-4 py-3 rounded-xl text-sm font-medium text-black/50 text-center hover:bg-black/5 w-full"
            >
              {locale === 'en' ? 'Sign out' : 'Odjava'}
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
