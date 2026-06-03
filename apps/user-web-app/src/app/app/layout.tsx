'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/app');
  };

  const openExternal = (url: string) => {
    window.open(url, '_blank');
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* App Top Bar */}
      <header className="fixed inset-x-0 top-0 z-[2000] bg-white border-b border-black/10 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col gap-[5px] p-2"
          aria-label="Open menu"
        >
          <span className="h-[2px] w-5 bg-black rounded" />
          <span className="h-[2px] w-5 bg-black rounded" />
          <span className="h-[2px] w-5 bg-black rounded" />
        </button>

        <span className="text-sm font-bold tracking-tight text-black">PayParq</span>

        <div className="w-9" />
      </header>

      {/* Hamburger Drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-[3000] bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[3001] w-72 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-black/10">
              <span className="font-bold text-black">PayParq</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-black/60 hover:text-black text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* User info or login */}
            <div className="px-5 py-4 border-b border-black/10">
              {user ? (
                <div>
                  <p className="text-xs text-black/50 mb-0.5">Signed in as</p>
                  <p className="text-sm font-semibold text-black truncate">{user.email}</p>
                </div>
              ) : (
                <p className="text-sm text-black/60">Not signed in</p>
              )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              <a
                href="/app"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 transition text-sm font-medium text-black"
              >
                <span>🏠</span> Find Parking
              </a>

              {user ? (
                <a
                  href="/members"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 transition text-sm font-medium text-black"
                >
                  <span>🎫</span> My Bookings
                </a>
              ) : (
                <a
                  href="/members"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black text-white transition text-sm font-medium"
                >
                  <span>🔑</span> Log In
                </a>
              )}

              <a
                href="/locations"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 transition text-sm font-medium text-black"
              >
                <span>📍</span> Locations
              </a>

              <a
                href="/support"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 transition text-sm font-medium text-black"
              >
                <span>💬</span> Support
              </a>

              <button
                onClick={() => openExternal('https://www.payparq.com')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 transition text-sm font-medium text-black"
              >
                <span>🌐</span> Visit Website
              </button>
            </nav>

            {/* Sign out */}
            {user && (
              <div className="px-3 py-4 border-t border-black/10">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition text-sm font-medium text-red-600"
                >
                  <span>👋</span> Sign Out
                </button>
              </div>
            )}

            <div className="px-5 py-3 border-t border-black/10">
              <p className="text-[10px] text-black/30 text-center">PayParq v1.0.0</p>
            </div>
          </div>
        </>
      )}

      {/* Page content — offset by header height */}
      <div className="pt-14">
        {children}
      </div>
    </div>
  );
}
