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

    const handleCallback = async () => {
      const code = searchParams.get('code');
      if (code) {
        try {
          await supabase!.auth.exchangeCodeForSession(code);
        } catch (_) {}
      }
      if (typeof window !== 'undefined') sessionStorage.removeItem('authRedirect');
      router.replace(redirectTo);
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
