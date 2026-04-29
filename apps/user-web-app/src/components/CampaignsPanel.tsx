'use client';

import { useState } from 'react';

type Campaign = {
  id: string;
  name: string;
  subject: string;
  recipientCount: number;
  sentAt: string | null;
  status: 'draft' | 'scheduled' | 'sent';
  openRate: number;
  clickRate: number;
};

export function CampaignsPanel() {
  const [tab, setTab] = useState<'list' | 'create' | 'analytics'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    recipientList: 'all',
    scheduleTime: '',
  });

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create campaign');

      setSuccess('Campaign created successfully');
      setFormData({ name: '', subject: '', htmlContent: '', recipientList: 'all', scheduleTime: '' });
      setTab('list');
      fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating campaign');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/campaigns/list');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch campaigns');
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Send this campaign now?')) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send campaign');

      setSuccess('Campaign sent successfully');
      fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex gap-3 border-b border-black/10">
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'list'
              ? 'border-black text-black'
              : 'border-transparent text-black/60 hover:text-black'
          }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setTab('create')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'create'
              ? 'border-black text-black'
              : 'border-transparent text-black/60 hover:text-black'
          }`}
        >
          Create
        </button>
        <button
          onClick={() => setTab('analytics')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'analytics'
              ? 'border-black text-black'
              : 'border-transparent text-black/60 hover:text-black'
          }`}
        >
          Analytics
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          {success}
        </div>
      )}

      {tab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Email Campaigns</h2>
            <button
              onClick={() => { setTab('create'); fetchCampaigns(); }}
              className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900"
            >
              New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-black/20 rounded-lg">
              <p className="text-black/60 text-sm">No campaigns yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border border-black/10 rounded-lg hover:border-black/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-black">{campaign.name}</h3>
                      <p className="text-sm text-black/60">{campaign.subject}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      campaign.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : campaign.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3 py-2 text-sm">
                    <div>
                      <p className="text-black/60">Recipients</p>
                      <p className="font-semibold">{campaign.recipientCount}</p>
                    </div>
                    <div>
                      <p className="text-black/60">Open Rate</p>
                      <p className="font-semibold">{campaign.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-black/60">Click Rate</p>
                      <p className="font-semibold">{campaign.clickRate}%</p>
                    </div>
                    <div>
                      <p className="text-black/60">Sent</p>
                      <p className="font-semibold">
                        {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => handleSendCampaign(campaign.id)}
                      disabled={loading}
                      className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-900 disabled:opacity-60"
                    >
                      Send Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Campaign Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30"
              placeholder="Split Hotels Q2 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Email Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30"
              placeholder="Exclusive Parking Partnership for Hotel Guests"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Recipient List</label>
            <select
              value={formData.recipientList}
              onChange={(e) => setFormData({ ...formData, recipientList: e.target.value })}
              className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30"
            >
              <option value="all">All Property Owners</option>
              <option value="hotels">Hotels Only</option>
              <option value="apartments">Apartments Only</option>
              <option value="split">Split Area</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Email Content (HTML)</label>
            <textarea
              value={formData.htmlContent}
              onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
              required
              rows={12}
              className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 font-mono text-xs"
              placeholder="<div>Your HTML content here...</div>"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Schedule Send (Optional)</label>
            <input
              type="datetime-local"
              value={formData.scheduleTime}
              onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
              className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30"
            />
            <p className="text-xs text-black/60 mt-1">Leave empty to save as draft</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
            <button
              type="button"
              onClick={() => setTab('list')}
              className="flex-1 px-4 py-2 border border-black/10 text-black font-semibold rounded-lg hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {tab === 'analytics' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Campaign Analytics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border border-black/10 rounded-lg">
              <p className="text-black/60 text-sm">Total Campaigns</p>
              <p className="text-3xl font-bold">{campaigns.length}</p>
            </div>
            <div className="p-4 border border-black/10 rounded-lg">
              <p className="text-black/60 text-sm">Total Sent</p>
              <p className="text-3xl font-bold">{campaigns.filter(c => c.status === 'sent').length}</p>
            </div>
            <div className="p-4 border border-black/10 rounded-lg">
              <p className="text-black/60 text-sm">Avg Open Rate</p>
              <p className="text-3xl font-bold">
                {campaigns.length > 0
                  ? (campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length).toFixed(1)
                  : '0'}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
