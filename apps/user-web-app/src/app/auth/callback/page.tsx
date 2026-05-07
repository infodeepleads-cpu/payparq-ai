'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const redirectTo = (typeof window !== 'undefined' ? sessionStorage.getItem('authRedirect') : null) || searchParams.get('redirect') || '/members';

        if (!code) {
          // No code — check if already signed in before showing error
          const { data: { session } } = await supabase!.auth.getSession();
          if (session) {
            if (typeof window !== 'undefined') sessionStorage.removeItem('authRedirect');
            router.push(redirectTo);
            return;
          }
          setError('No authorization code received');
          return;
        }

        const { error: exchangeError } = await supabase!.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          // Exchange failed — still check if session exists (code may have been used already)
          const { data: { session } } = await supabase!.auth.getSession();
          if (session) {
            if (typeof window !== 'undefined') sessionStorage.removeItem('authRedirect');
            router.push(redirectTo);
            return;
          }
          setError(exchangeError.message);
          return;
        }

        if (typeof window !== 'undefined') sessionStorage.removeItem('authRedirect');
        router.push(redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    handleCallback();
  }, [searchParams, router, supabase]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <h1 className="text-lg font-semibold text-red-600">Greška pri prijavi</h1>
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/members')}
            className="mt-2 inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors"
          >
            Nastavi na Members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
