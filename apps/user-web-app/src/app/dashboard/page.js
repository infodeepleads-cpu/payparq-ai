'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToDashboard = async () => {
      try {
        if (!supabase || !isSupabaseConfigured) {
          router.push('/members');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/members');
          return;
        }

        // Get user's role from sync-role endpoint
        const res = await fetch(`/api/auth/sync-role?user_id=${user.id}`);
        const { role } = await res.json();

        // Route based on role
        if (role === 'superadmin') {
          router.push('/members');
        } else if (role === 'officer' || role === 'admin') {
          router.push('/officer/dashboard');
        } else {
          // member, manager, or any other role defaults to members
          router.push('/members');
        }
      } catch (error) {
        console.error('Dashboard redirect error:', error);
        router.push('/members');
      } finally {
        setLoading(false);
      }
    };

    redirectToDashboard();
  }, [router]);

  // Show loading state while redirecting
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return null;
}
