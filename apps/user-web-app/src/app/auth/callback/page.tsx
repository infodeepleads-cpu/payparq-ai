'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!supabase) return;

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
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
        <p className="text-sm text-gray-600">Prijava u tijeku...</p>
      </div>
    </div>
  );
}
