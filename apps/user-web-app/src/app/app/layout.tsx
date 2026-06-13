'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLocale } from '@/components/LocaleProvider';
import { MapPin, LayoutDashboard, Home, HelpCircle, MessageSquare, Mail, FileText, Lock, type LucideIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [localUserData, setLocalUserData] = useState<{ plate?: string; phone?: string } | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dashboard') === '1') {
        setShowDashboard(true);
        params.delete('dashboard');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
      const ua = navigator.userAgent;
      setIsIOS(/iPad|iPhone|iPod/.test(ua));
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
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/app?dashboard=1`,
          skipBrowserRedirect: false
        }
      });
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  return (
    <div className="min-h-screen">
      <meta name="theme-color" content="#ffffff" />
      {children}

      {/* Floating hamburger button */}
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
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => { document.cookie = 'NEXT_LOCALE=' + (locale === 'en' ? 'hr' : 'en') + ';path=/'; window.location.reload(); }} className="text-xs font-bold text-black/70 hover:text-black px-2 py-1 rounded border border-black/10">
              {locale === 'en' ? 'CRO' : 'ENG'}
            </button>
            <button onClick={close} className="text-black/40 hover:text-black text-xl leading-none">✕</button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col px-3 py-4 gap-6">
          {/* Main Selector */}
          <div>
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide px-4 mb-2">{locale === 'en' ? 'Main Selector' : 'Glavni Izbor'}</p>
            <div className="space-y-1">
              <a href="/app" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black">
                <MapPin className="w-4 h-4 text-black shrink-0" />
                {locale === 'en' ? 'Find Parking' : 'Pronađi parking'}
              </a>
              {user ? (
                <button onClick={handleDashboard} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black text-left">
                  <LayoutDashboard className="w-4 h-4 text-black shrink-0" />
                  {locale === 'en' ? 'Admin Dashboard' : 'Upravljačka Ploča'}
                </button>
              ) : (
                <button onClick={handleGoogleSignIn} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black text-left">
                  <LayoutDashboard className="w-4 h-4 text-black shrink-0" />
                  {locale === 'en' ? 'Admin Dashboard' : 'Upravljačka Ploča'}
                </button>
              )}
              <a href="/host" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black">
                <Home className="w-4 h-4 text-black shrink-0" />
                {locale === 'en' ? 'Instant Listing' : 'Objavi Svoj Prostor'}
              </a>
            </div>
          </div>

          {/* Support */}
          <div>
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide px-4 mb-2">{locale === 'en' ? 'Support' : 'Podrška'}</p>
            <div className="space-y-1">
              <a href="https://help.payparq.com" target="_blank" rel="noopener noreferrer" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black">
                <HelpCircle className="w-4 h-4 text-black shrink-0" />
                {locale === 'en' ? 'Help Centre' : 'Centar Pomoći'}
              </a>
              <a href={isIOS ? "https://apps.apple.com/app/payparq/id1234567890" : "https://play.google.com/store/apps/details?id=com.payparq.app"} target="_blank" rel="noopener noreferrer" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black">
                <MessageSquare className="w-4 h-4 text-black shrink-0" />
                {locale === 'en' ? 'App Feedback' : 'Povratna Informacija'}
              </a>
              <button onClick={() => setShowContact(!showContact)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black text-left">
                <Mail className="w-4 h-4 text-black shrink-0" />
                {locale === 'en' ? 'Priority Support' : 'Prioritetna Podrška'}
              </button>
              {showContact && (
                <div className="space-y-2 px-4 py-3 rounded-xl bg-black/5 ml-2">
                  <a href="mailto:payparq@outlook.com" className="block text-sm text-black hover:text-black/70 font-medium">
                    payparq@outlook.com
                  </a>
                  <a href="tel:+385915963139" className="block text-sm text-black hover:text-black/70 font-medium">
                    +385 91 596 3139
                  </a>
                </div>
              )}
              <a href="/terms" target="_blank" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black">
                <FileText className="w-4 h-4 text-black shrink-0" />
                {locale === 'en' ? 'Terms of Use' : 'Uvjeti Korištenja'}
              </a>
              <a href="/privacy" target="_blank" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black">
                <Lock className="w-4 h-4 text-black shrink-0" />
                {locale === 'en' ? 'Privacy Policy' : 'Politika Privatnosti'}
              </a>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sign out */}
          {user && (
            <button onClick={async () => { if (supabase) { await supabase.auth.signOut(); close(); } }} className="px-4 py-3 rounded-xl text-sm font-medium text-black/50 text-center hover:bg-black/5 w-full">
              {locale === 'en' ? 'Sign out' : 'Odjava'}
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
