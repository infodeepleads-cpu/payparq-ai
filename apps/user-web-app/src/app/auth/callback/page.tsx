'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectTo =
      (typeof window !== 'undefined' ? sessionStorage.getItem('authRedirect') : null) ||
      searchParams.get('redirect') ||
      '/members';

    const finish = () => {
      if (typeof window !== 'undefined') sessionStorage.removeItem('authRedirect');
      router.replace(redirectTo);
    };

    const handleCallback = async () => {
      const code = searchParams.get('code');

      if (!code) {
        finish();
        return;
      }

      // Try exchange with retries
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { error } = await supabase!.auth.exchangeCodeForSession(code);
          if (!error) break; // Success
        } catch (_) {
          // ignore
        }
        if (attempt < 2) await new Promise(r => setTimeout(r, 500));
      }

      // Wait for session to propagate in cookies
      await new Promise(r => setTimeout(r, 1000));

      finish();
    };

    handleCallback();
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
