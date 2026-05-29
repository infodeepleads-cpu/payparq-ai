'use client';

import { useState, useEffect } from 'react';

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

type Template = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  category?: string;
  description?: string;
};

export function CampaignsPanel() {
  const [tab, setTab] = useState<'list' | 'create' | 'templates' | 'analytics' | 'sequences'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saveTemplateData, setSaveTemplateData] = useState({
    name: '',
    category: '',
    description: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    recipientList: 'all',
    scheduleTime: '',
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Sequence state
  const [seqSending, setSeqSending] = useState(false);
  const [seqResult, setSeqResult] = useState<{ sent?: number; checked?: number } | null>(null);
  const [enrollEmails, setEnrollEmails] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState('');
  const [seqStats, setSeqStats] = useState<{
    total: number;
    active: number;
    completed: number;
    unsubscribed: number;
    onEmail1: number;
    onEmail2: number;
    onEmail3: number;
    sentToday: number;
    enrollments: {
      id: string;
      email: string;
      name: string | null;
      status: string;
      nextEmailNumber: number;
      lastSentAt: string | null;
      nextSendAt: string | null;
      createdAt: string;
    }[];
  } | null>(null);
  const [seqStatsLoading, setSeqStatsLoading] = useState(false);
  const [seqSearch, setSeqSearch] = useState('');

  const fetchSeqStats = async () => {
    setSeqStatsLoading(true);
    try {
      const res = await fetch('/api/sequences/stats');
      const data = await res.json();
      setSeqStats(data);
    } catch { /* ignore */ } finally {
      setSeqStatsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'list') fetchCampaigns();
    if (tab === 'templates') fetchTemplates();
    if (tab === 'sequences') fetchSeqStats();
  }, [tab]);

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
      setShowSaveTemplateModal(true);
      setFormData({ name: '', subject: '', htmlContent: '', recipientList: 'all', scheduleTime: '' });
      setSelectedTemplateId('');
      fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTemplateData.name) {
      setError('Template name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveTemplateData.name,
          subject: formData.subject,
          htmlContent: formData.htmlContent,
          category: saveTemplateData.category || null,
          description: saveTemplateData.description || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save template');

      setSuccess('Template saved successfully!');
      setShowSaveTemplateModal(false);
      setSaveTemplateData({ name: '', category: '', description: '' });
      fetchTemplates();
      setTimeout(() => setTab('list'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving template');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          htmlContent: editingTemplate.htmlContent,
          category: editingTemplate.category || null,
          description: editingTemplate.description || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update template');

      setSuccess('Template updated successfully!');
      setShowEditTemplateModal(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template permanently?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/templates/${templateId}/delete`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete template');
      }

      setSuccess('Template deleted');
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting template');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = (template: Template) => {
    setFormData({
      ...formData,
      subject: template.subject,
      htmlContent: template.htmlContent,
    });
    setSelectedTemplateId(template.id);
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns/list');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch campaigns');
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching campaigns');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates/list');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch templates');
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching templates');
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
          onClick={() => setTab('templates')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'templates'
              ? 'border-black text-black'
              : 'border-transparent text-black/60 hover:text-black'
          }`}
        >
          Templates
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
        <button
          onClick={() => setTab('sequences')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'sequences'
              ? 'border-black text-black'
              : 'border-transparent text-black/60 hover:text-black'
          }`}
        >
          Sequences
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
            <label className="block text-sm font-semibold mb-2">Start from Template (Optional)</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                if (e.target.value) {
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) handleLoadTemplate(template);
                }
              }}
              className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30"
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-black/60 mt-1">Template will pre-fill subject and content below</p>
          </div>

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

      {tab === 'templates' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Email Templates</h2>

          {templates.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-black/20 rounded-lg">
              <p className="text-black/60 text-sm">No templates yet. Save a campaign as template to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="p-4 border border-black/10 rounded-lg hover:border-black/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">{template.name}</h3>
                      <p className="text-sm text-black/60">{template.subject}</p>
                      {template.description && (
                        <p className="text-xs text-black/40 mt-1">{template.description}</p>
                      )}
                    </div>
                    {template.category && (
                      <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                        {template.category}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowEditTemplateModal(true);
                      }}
                      className="px-3 py-1 text-xs font-semibold text-black border border-black/20 rounded hover:bg-black/5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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

      {tab === 'sequences' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Airbnb Host Sequence</h2>

          {/* Sequence overview */}
          <div className="space-y-2">
            {[
              { n: 1, subject: 'Objavite parking mjesto i ostvarite do 100€ bespovratno', day: 'Day 0' },
              { n: 2, subject: 'Pretvori svoje parkirno mjesto u zaradu', day: 'Day 3' },
              { n: 3, subject: 'Zaradi više sa svojim parkingom...', day: 'Day 6' },
            ].map(e => (
              <div key={e.n} className="flex items-center gap-3 p-3 border border-black/10 rounded-lg">
                <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{e.n}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{e.subject}</p>
                </div>
                <span className="text-xs text-black/40 flex-shrink-0">{e.day}</span>
              </div>
            ))}
          </div>

          {/* Enroll recipients */}
          <div className="border border-black/10 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold">Add Recipients</p>
            <p className="text-xs text-black/50">Paste emails one per line or comma-separated</p>
            <textarea
              value={enrollEmails}
              onChange={e => setEnrollEmails(e.target.value)}
              placeholder={'host@hotel.hr\ninfo@apartmani.hr\nvilla@dubrovnik.hr'}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              onClick={async () => {
                setEnrolling(true);
                setEnrollResult('');
                try {
                  const emails = enrollEmails
                    .split(/[\n,]+/)
                    .map(e => e.trim())
                    .filter(e => e.includes('@'))
                    .map(email => ({ email }));
                  const res = await fetch('/api/sequences/enroll', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sequenceName: 'airbnb-host', recipients: emails }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  setEnrollResult(`✅ ${data.enrolled} recipients enrolled`);
                  setEnrollEmails('');
                } catch (err) {
                  setEnrollResult(`❌ ${err instanceof Error ? err.message : 'Error'}`);
                } finally {
                  setEnrolling(false);
                }
              }}
              disabled={enrolling || !enrollEmails.trim()}
              className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 disabled:opacity-50"
            >
              {enrolling ? 'Enrolling...' : 'Enroll Recipients'}
            </button>
            {enrollResult && (
              <p className="text-sm">{enrollResult}</p>
            )}
          </div>

          {/* Send batch + refresh */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setSeqSending(true);
                setSeqResult(null);
                try {
                  const res = await fetch('/api/cron/sequence-sender');
                  const data = await res.json();
                  setSeqResult(data);
                  await fetchSeqStats();
                } catch {
                  setSeqResult({ sent: 0 });
                } finally {
                  setSeqSending(false);
                }
              }}
              disabled={seqSending}
              className="flex-1 px-4 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-900 disabled:opacity-50"
            >
              {seqSending ? 'Sending...' : 'Send 10 Today'}
            </button>
            <button
              onClick={fetchSeqStats}
              disabled={seqStatsLoading}
              className="px-4 py-2.5 border border-black/20 text-sm font-semibold rounded-full hover:border-black/40 disabled:opacity-50"
            >
              {seqStatsLoading ? '...' : 'Refresh'}
            </button>
          </div>
          {seqResult && (
            <p className="text-sm text-green-700 font-medium">
              Sent {seqResult.sent} of {seqResult.checked} queued emails
            </p>
          )}

          {/* Stats overview */}
          {seqStats && (
            <>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Total', value: seqStats.total, color: 'bg-gray-50' },
                  { label: 'Active', value: seqStats.active, color: 'bg-blue-50' },
                  { label: 'Completed', value: seqStats.completed, color: 'bg-green-50' },
                  { label: 'Sent Today', value: seqStats.sentToday, color: 'bg-yellow-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.color} rounded-lg p-3 text-center`}>
                    <p className="text-2xl font-bold text-black">{s.value}</p>
                    <p className="text-xs text-black/50 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Pipeline bar */}
              <div className="border border-black/10 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-black/60 uppercase tracking-wide">Pipeline</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Awaiting Email 1', count: seqStats.onEmail1, color: 'bg-gray-400' },
                    { label: 'Awaiting Email 2', count: seqStats.onEmail2, color: 'bg-blue-400' },
                    { label: 'Awaiting Email 3', count: seqStats.onEmail3, color: 'bg-purple-400' },
                    { label: 'Unsubscribed', count: seqStats.unsubscribed, color: 'bg-red-300' },
                  ].map(p => (
                    <div key={p.label} className="flex items-center gap-2">
                      <span className="text-xs text-black/60 w-36 flex-shrink-0">{p.label}</span>
                      <div className="flex-1 bg-black/5 rounded-full h-2">
                        <div
                          className={`${p.color} h-2 rounded-full`}
                          style={{ width: seqStats.total > 0 ? `${Math.round((p.count / seqStats.total) * 100)}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-6 text-right">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              {seqStats.total > 0 && (
                <div className="border border-amber-100 bg-amber-50 rounded-lg p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-900">Suggestions</p>
                  {seqStats.completed > 0 && (
                    <p className="text-xs text-amber-800">• {seqStats.completed} recipients finished all 3 emails — consider a follow-up call or offer.</p>
                  )}
                  {seqStats.onEmail1 > 5 && (
                    <p className="text-xs text-amber-800">• {seqStats.onEmail1} people haven&apos;t received Email 1 yet — click Send 10 Today.</p>
                  )}
                  {seqStats.unsubscribed > 0 && (
                    <p className="text-xs text-amber-800">• {seqStats.unsubscribed} bounced/unsubscribed — remove from future campaigns.</p>
                  )}
                  {seqStats.active === 0 && seqStats.total > 0 && (
                    <p className="text-xs text-amber-800">• No active recipients — enroll new leads to keep the pipeline moving.</p>
                  )}
                  {seqStats.total < 10 && (
                    <p className="text-xs text-amber-800">• You have fewer than 10 leads — add more to fill your daily send quota.</p>
                  )}
                </div>
              )}

              {/* Recipients table */}
              <div className="border border-black/10 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-black/5">
                  <p className="text-xs font-semibold">All Recipients</p>
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={seqSearch}
                    onChange={e => setSeqSearch(e.target.value)}
                    className="text-xs border border-black/10 rounded-full px-3 py-1 outline-none focus:border-black/30 w-40"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-black/10 bg-black/5">
                        <th className="text-left px-4 py-2 font-semibold text-black/60">Email</th>
                        <th className="text-left px-4 py-2 font-semibold text-black/60">Status</th>
                        <th className="text-left px-4 py-2 font-semibold text-black/60">Next Email</th>
                        <th className="text-left px-4 py-2 font-semibold text-black/60">Last Sent</th>
                        <th className="text-left px-4 py-2 font-semibold text-black/60">Next Send</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seqStats.enrollments
                        .filter(e => !seqSearch || e.email.includes(seqSearch))
                        .map(e => (
                          <tr key={e.id} className="border-b border-black/5 hover:bg-black/5">
                            <td className="px-4 py-2 font-mono">{e.email}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                e.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                e.status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {e.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-black/60">
                              {e.status === 'completed' ? '—' : `Email ${e.nextEmailNumber}`}
                            </td>
                            <td className="px-4 py-2 text-black/60">
                              {e.lastSentAt ? new Date(e.lastSentAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-2 text-black/60">
                              {e.status === 'active' && e.nextSendAt
                                ? new Date(e.nextSendAt) <= new Date()
                                  ? <span className="text-orange-600 font-semibold">Due now</span>
                                  : new Date(e.nextSendAt).toLocaleDateString()
                                : '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {seqStats.enrollments.length === 0 && (
                    <p className="text-center text-xs text-black/40 py-6">No recipients yet</p>
                  )}
                </div>
              </div>

              {/* Resend webhook setup */}
              <div className="border border-blue-100 bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-900">Track Opens & Clicks (optional)</p>
                <p className="text-xs text-blue-700">Set up Resend webhook to track bounces and auto-unsubscribe.</p>
                <p className="text-xs text-blue-800 font-mono bg-blue-100 px-2 py-1 rounded">
                  https://payparq.com/api/webhooks/resend
                </p>
                <p className="text-xs text-blue-600">Resend dashboard → Webhooks → Add endpoint above → Events: email.bounced, email.complained</p>
              </div>
            </>
          )}

          {!seqStats && !seqStatsLoading && (
            <p className="text-sm text-black/40 text-center py-4">Click Refresh to load stats</p>
          )}
          {seqStatsLoading && (
            <p className="text-sm text-black/40 text-center py-4">Loading...</p>
          )}
        </div>
      )}

      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold">Save Campaign as Template</h2>
            <form onSubmit={handleSaveAsTemplate} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Template Name</label>
                <input
                  type="text"
                  value={saveTemplateData.name}
                  onChange={(e) => setSaveTemplateData({ ...saveTemplateData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 text-sm"
                  placeholder="Email 3 - Product Launch"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Category (Optional)</label>
                <input
                  type="text"
                  value={saveTemplateData.category}
                  onChange={(e) => setSaveTemplateData({ ...saveTemplateData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 text-sm"
                  placeholder="hotel, general, promotional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={saveTemplateData.description}
                  onChange={(e) => setSaveTemplateData({ ...saveTemplateData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 text-sm"
                  placeholder="Brief description of this template"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Save Template'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveTemplateModal(false);
                    setSaveTemplateData({ name: '', category: '', description: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-black/10 text-black text-sm font-semibold rounded-lg hover:bg-black/5"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditTemplateModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-lg font-semibold">Edit Template</h2>
            <form onSubmit={handleUpdateTemplate} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Template Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <input
                  type="text"
                  value={editingTemplate.category || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">HTML Content</label>
                <textarea
                  value={editingTemplate.htmlContent}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, htmlContent: e.target.value })}
                  required
                  rows={10}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg outline-none focus:border-black/30 font-mono text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTemplateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 border border-black/10 text-black text-sm font-semibold rounded-lg hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
