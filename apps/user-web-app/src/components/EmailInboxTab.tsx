'use client';
import { useState, useEffect } from 'react';

interface EmailMessage {
  id: string;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'opened' | 'clicked' | 'bounced' | 'replied' | 'draft';
  sent_at: string;
  opened_at?: string;
  replied_at?: string;
}

type EmailTab = 'inbox' | 'sent' | 'drafts';

export function EmailInboxTab() {
  const [activeTab, setActiveTab] = useState<EmailTab>('inbox');
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchEmails();
  }, [activeTab]);

  async function fetchEmails() {
    setLoading(true);
    try {
      const endpoint =
        activeTab === 'inbox'
          ? '/api/emails/inbox'
          : activeTab === 'sent'
            ? '/api/emails/sent'
            : '/api/emails/drafts';

      const res = await fetch(endpoint);
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEmail(id: string) {
    try {
      await fetch(`/api/emails/${id}`, { method: 'DELETE' });
      setEmails((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  }

  async function retrySend(id: string) {
    try {
      const res = await fetch(`/api/emails/${id}/retry`, { method: 'POST' });
      if (res.ok) {
        fetchEmails();
      }
    } catch (error) {
      console.error('Error retrying email:', error);
    }
  }

  const filteredEmails = filterStatus
    ? emails.filter((e) => e.status === filterStatus)
    : emails;

  const statusColors: Record<string, string> = {
    sent: 'text-blue-600',
    opened: 'text-blue-600',
    clicked: 'text-blue-600',
    bounced: 'text-black',
    replied: 'text-blue-600',
    draft: 'text-black',
  };

  return (
    <div className="space-y-4">
      {/* Email Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['inbox', 'sent', 'drafts'] as EmailTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => fetchEmails()}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Refresh
        </button>

        {activeTab !== 'drafts' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-gray-900"
            >
              <option value="">All</option>
              <option value="sent">Sent</option>
              <option value="opened">Opened</option>
              <option value="clicked">Clicked</option>
              <option value="bounced">Bounced</option>
              <option value="replied">Replied</option>
            </select>
          </div>
        )}

        <span className="text-xs text-gray-600 ml-auto">
          {filteredEmails.length} emails
        </span>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-gray-600">Loading emails...</span>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No emails in {activeTab}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{email.recipient_email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                      {email.subject || '(no subject)'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium capitalize ${statusColors[email.status] || 'text-gray-700'}`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(email.sent_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-3">
                      {email.status === 'draft' && (
                        <button
                          onClick={() => retrySend(email.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                          title="Send draft"
                        >
                          Send
                        </button>
                      )}
                      {email.status === 'bounced' && (
                        <button
                          onClick={() => retrySend(email.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                          title="Retry send"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => deleteEmail(email.id)}
                        className="text-black hover:text-gray-700 font-medium"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
