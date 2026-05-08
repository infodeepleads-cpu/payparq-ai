'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DevLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Set mock session directly in cookies for dev
    const mockSession = {
      user: {
        id: 'mock-user-123',
        email: 'test@payparq.com',
        user_metadata: { name: 'Test User' },
      },
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    // Store in cookie (same format Supabase uses)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `sb-mock-auth-token=${encodeURIComponent(JSON.stringify(mockSession))};expires=${expires.toUTCString()};path=/;SameSite=Lax`;

    // Redirect to members
    router.replace('/members');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
        <p className="text-sm text-gray-600">Dev login...</p>
      </div>
    </div>
  );
}
