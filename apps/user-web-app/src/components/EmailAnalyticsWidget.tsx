'use client';

import { useState, useEffect } from 'react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface EmailStats {
  totalSent: number;
  repliesReceived: number;
  failedSends: number;
  byLanguage: Record<string, number>;
  byEmail: Record<number, number>;
}

export function EmailAnalyticsWidget() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayStats();
    const interval = setInterval(fetchTodayStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function fetchTodayStats() {
    try {
      const response = await fetch('/api/admin/email-analytics-today');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch email analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Mail size={24} className="text-blue-600" />
          Today's Email Activity
        </h2>
        <p className="text-sm text-gray-600 mt-1">Real-time email send tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{stats.totalSent}</div>
          <div className="text-sm font-medium text-gray-700">Emails Sent</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600">{stats.repliesReceived}</div>
          <div className="text-sm font-medium text-gray-700">Replies</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-600">{stats.failedSends}</div>
          <div className="text-sm font-medium text-gray-700">Failed</div>
        </div>
      </div>

      {/* By Email Number */}
      {Object.keys(stats.byEmail).length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">By Email #</h3>
          <div className="space-y-2">
            {Object.entries(stats.byEmail).map(([emailNum, count]) => (
              <div key={emailNum} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Email {emailNum}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Language */}
      {Object.keys(stats.byLanguage).length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">By Language</h3>
          <div className="space-y-2">
            {Object.entries(stats.byLanguage).map(([lang, count]) => (
              <div key={lang} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700 uppercase">{lang}</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
