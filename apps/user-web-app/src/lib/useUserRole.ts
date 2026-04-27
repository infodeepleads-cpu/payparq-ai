import { useState, useEffect } from 'react';
import { supabase } from './supabase';

type UserRole = 'member' | 'officer' | 'city_manager' | 'superadmin';

export function useUserRole() {
  const [role, setRole] = useState<UserRole>('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      if (!supabase) {
        setRole('member');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRole('member');
        setLoading(false);
        return;
      }

      // Fetch role from mobile scanner (defaults to 'member' if not found)
      const response = await fetch(`/api/auth/sync-role?user_id=${user.id}`);
      const data = await response.json();

      setRole((data.role as UserRole) || 'member');
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      setRole('member');
    } finally {
      setLoading(false);
    }
  };

  return { role, loading };
}

export function getRoleColor(role: UserRole) {
  switch (role) {
    case 'superadmin':
      return 'bg-red-100 text-red-800';
    case 'city_manager':
      return 'bg-blue-100 text-blue-800';
    case 'officer':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case 'superadmin':
      return 'Superadmin';
    case 'city_manager':
      return 'City Manager';
    case 'officer':
      return 'Officer';
    default:
      return 'Member';
  }
}
