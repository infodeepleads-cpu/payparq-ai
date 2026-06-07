'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLocale } from '@/components/LocaleProvider';
import type { User } from '@supabase/supabase-js';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [localUserData, setLocalUserData] = useState<{ plate?: string; phone?: string } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    // Initialize Google Auth on native platforms
    if (typeof window !== 'undefined') {
      GoogleAuth.initialize({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scopes: ['email', 'profile'],
        forceCodeForRefreshToken: true
      }).catch(err => console.log('GoogleAuth init (web fallback):', err));
    }
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
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('payparq_user_data');
    if (saved) {
      try { setLocalUserData(JSON.parse(saved)); } catch {}
    }
    // Open dashboard if redirected back after sign-in
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dashboard') === '1') {
        setShowDashboard(true);
        params.delete('dashboard');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (menuOpen || showDashboard) {
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
  }, [menuOpen, showDashboard]);

  const close = () => setMenuOpen(false);

  const handleDashboard = () => {
    close();
    setShowDashboard(true);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    try {
      const result = await GoogleAuth.signIn();
      if (result?.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: result.idToken
        });
        if (error) {
          console.error('Supabase sign-in error:', error);
        } else {
          setShowDashboard(true);
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
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
          <div className="flex items-center justify-end px-4 h-12 bg-black border-b border-black/10 shrink-0">
            <button
              onClick={() => setShowDashboard(false)}
              className="text-white/60 hover:text-white text-xl leading-none"
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

          {user ? (
            <button
              onClick={handleDashboard}
              className="px-4 py-3 rounded-xl text-sm font-medium text-center w-full hover:bg-black/5 text-black"
            >
              {locale === 'en' ? 'Dashboard' : 'Upravljačka Ploča'}
            </button>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="px-4 py-3 rounded-xl text-sm font-medium text-center w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {locale === 'en' ? 'Sign in with Google' : 'Prijava s Googleom'}
            </button>
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
