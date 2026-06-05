'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!supabase) return;

    // OAuth state error — retry sign-in from the beginning
    const errorCode = searchParams.get('error_code');
    if (errorCode === 'bad_oauth_state') {
      sessionStorage.removeItem('pkce_code_verifier');
      router.replace('/members?auth_retry=1');
      return;
    }

    const redirectTo =
      sessionStorage.getItem('authRedirect') ||
      searchParams.get('redirect') ||
      '/members';

    // Supabase auto-detects the hash (#access_token=...) and fires SIGNED_IN.
    // We just wait for it and redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        sessionStorage.removeItem('authRedirect');
        subscription.unsubscribe();
        router.replace(redirectTo);
      }
    });

    // Also check if session already exists (e.g. hash was already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sessionStorage.removeItem('authRedirect');
        subscription.unsubscribe();
        router.replace(redirectTo);
      }
    });

    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      router.replace(redirectTo);
    }, 15000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 bg-[#05020A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg z-10">
            <span className="text-lg font-black tracking-tight text-[#05020A] select-none">P</span>
          </div>
        </div>
      </div>
    </div>
  );
}
