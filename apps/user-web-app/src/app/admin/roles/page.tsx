'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'member' | 'officer' | 'city_manager' | 'superadmin'>('member');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      // Check if user is superadmin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'superadmin') {
        setLoading(false);
        return;
      }

      setIsAuthorized(true);
      await loadUsers();
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });

      if (data) {
        setUsers(data as User[]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update user role');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>Only superadmin can manage user roles.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">User Role Management</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Email</th>
              <th className="px-6 py-3 text-left font-semibold">Current Role</th>
              <th className="px-6 py-3 text-left font-semibold">Change Role</th>
              <th className="px-6 py-3 text-left font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {user.email}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        user.role === 'superadmin'
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'city_manager'
                          ? 'bg-blue-100 text-blue-800'
                          : user.role === 'officer'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role || 'member'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role || 'member'}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="officer">Officer</option>
                      <option value="city_manager">City Manager</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users', count: users.length },
          { label: 'Superadmin', count: users.filter(u => u.role === 'superadmin').length },
          { label: 'City Managers', count: users.filter(u => u.role === 'city_manager').length },
          { label: 'Officers', count: users.filter(u => u.role === 'officer').length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
