'use client';

import { useState, useEffect } from 'react';
import { CRMTable } from '@/components/CRMTable';
import { CampaignAnalyticsWidget } from '@/components/CampaignAnalyticsWidget';
import { SequencesEditor } from '@/components/SequencesEditor';
import { X } from 'lucide-react';

export default function AdminCRMPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'crm' | 'sequences'>('crm');

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

          {/* Tabs */}
          <div className="px-6 flex gap-4 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'crm'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              CRM & Campaigns
            </button>
            <button
              onClick={() => setActiveTab('sequences')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'sequences'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Email Sequences
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'crm' && (
            <div className="space-y-6">
              {/* Analytics Widget */}
              <CampaignAnalyticsWidget />

              {/* CRM Table */}
              <CRMTable />
            </div>
          )}

          {activeTab === 'sequences' && (
            <SequencesEditor />
          )}
        </div>
      </div>
    </div>
  );
}
