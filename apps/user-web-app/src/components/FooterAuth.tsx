'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function FooterAuth() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <a href="/members" className="text-[11px] text-white/70 hover:text-white transition-colors">
        Log in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-white/50 truncate max-w-[140px]">{user.email}</span>
      <button
        onClick={async () => {
          if (!supabase) return;
          await supabase.auth.signOut();
          router.push('/');
        }}
        className="text-[11px] text-white/70 hover:text-white transition-colors"
      >
        Log out
      </button>
    </div>
  );
}
