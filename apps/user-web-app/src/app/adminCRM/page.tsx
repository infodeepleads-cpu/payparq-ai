'use client';

import { useState, useEffect } from 'react';
import { CRMTable } from '@/components/CRMTable';
import { CampaignAnalyticsWidget } from '@/components/CampaignAnalyticsWidget';
import { EmailAnalyticsWidget } from '@/components/EmailAnalyticsWidget';
import { X, BarChart3 } from 'lucide-react';

export default function AdminCRMPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Bandana12#4') {
      setIsAuthenticated(true);
      setError('');
      setPassword('');
      // Store in sessionStorage (cleared when browser closes)
      sessionStorage.setItem('crm_auth', 'true');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  // Check if already authenticated in this session
  useEffect(() => {
    if (sessionStorage.getItem('crm_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-black text-gray-900 mb-2">PayParq Admin</h1>
          <p className="text-gray-600 mb-6">CRM Management</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                autoFocus
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <span className="text-red-600 text-sm font-medium">{error}</span>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Access CRM
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-6 py-4 flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">PayParq Admin</h1>
              <p className="text-sm text-gray-600">CRM & Email Management</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('crm_auth');
                setIsAuthenticated(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
            >
              <X size={16} />
              Logout
            </button>
          </div>

        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Analytics Button */}
          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md transition-all hover:shadow-lg"
          >
            <BarChart3 size={20} />
            📊 View Analytics
          </button>

          {/* CRM Table */}
          <CRMTable />
        </div>

        {/* Analytics Modal */}
        {showAnalyticsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={24} />
                  Campaign & Email Analytics
                </h2>
                <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CampaignAnalyticsWidget />
                  <EmailAnalyticsWidget />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
