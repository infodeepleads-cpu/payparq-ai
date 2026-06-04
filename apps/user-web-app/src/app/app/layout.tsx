'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLocale } from '@/components/LocaleProvider';
import type { User } from '@supabase/supabase-js';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { locale } = useLocale();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    document.body.style.overflowY = menuOpen ? 'scroll' : '';
    return () => { document.body.style.overflow = ''; document.body.style.overflowY = ''; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);
  const openExternal = (url: string) => { window.open(url, '_blank'); close(); };

  return (
    <div className="min-h-screen">
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

      {/* Backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-[8999] bg-black/40" onClick={close} />
      )}

      {/* Right-side sliding panel */}
      <div
        className="fixed inset-y-0 right-0 z-[9000] w-72 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out"
        style={{ transform: menuOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-black/10 shrink-0 gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold block">PayParq</span>
            {user && <p className="text-[10px] text-black/50 truncate">{user.email}</p>}
          </div>
          <button onClick={close} className="text-black/40 hover:text-black text-xl leading-none shrink-0">✕</button>
        </div>

        <nav className="flex-1 flex flex-col px-3 py-4 gap-1">
          <a href="/app" onClick={close} className="px-4 py-3 rounded-xl hover:bg-black/5 text-sm font-medium text-black text-center">
            Find Parking
          </a>
          <a
            href="/members"
            onClick={() => { close(); setTimeout(() => window.location.href = '/members', 50); }}
            className={`px-4 py-3 rounded-xl text-sm font-medium text-center ${user ? 'hover:bg-black/5 text-black' : 'bg-black text-white'}`}
          >
            {locale === 'en' ? 'Dashboard' : 'Upravljačka Ploča'}
          </a>
          <a
            href="/members?tab=help"
            onClick={() => { close(); setTimeout(() => window.location.href = '/members?tab=help', 50); }}
            className="px-4 py-3 rounded-xl text-sm font-medium text-black text-center hover:bg-black/5"
          >
            {locale === 'en' ? 'Contact Us' : 'Kontaktirajte nas'}
          </a>
          <button
            onClick={() => openExternal('https://www.payparq.com/main')}
            className="px-4 py-3 rounded-xl text-sm font-medium text-black text-center hover:bg-black/5 w-full"
          >
            {locale === 'en' ? 'Visit Website' : 'Posjetite web stranicu'}
          </button>
        </nav>

        <div className="px-4 pb-8 pt-2 shrink-0">
          <a
            href="/app-release.apk"
            download="payparq.apk"
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition block text-center"
          >
            Download App
          </a>
        </div>
      </div>
    </div>
  );
}
