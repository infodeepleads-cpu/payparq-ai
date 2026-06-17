'use client';

import { useState, useEffect } from 'react';
import { Mail, AlertCircle, CheckCircle, TrendingUp, Lightbulb } from 'lucide-react';

interface EmailStats {
  totalSent: number;
  repliesReceived: number;
  failedSends: number;
  byLanguage: Record<string, number>;
  byEmail: Record<number, number>;
}

interface AnalyticsInsights {
  replyRate: number;
  bestEmail: { number: number; count: number } | null;
  bestLanguage: { code: string; count: number } | null;
  dailyTrend: Array<{ date: string; sends: number; replies: number }>;
  suggestions: string[];
}

export function EmailAnalyticsWidget() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function fetchAnalytics() {
    try {
      const [statsRes, insightsRes] = await Promise.all([
        fetch('/api/admin/email-analytics-today'),
        fetch('/api/admin/email-analytics-insights')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
      }
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

      {/* Key Metrics */}
      {insights && (
        <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
          <div className="bg-purple-50 border border-purple-200 rounded p-2">
            <div className="text-purple-600 font-bold">{insights.replyRate}%</div>
            <div className="text-gray-600 text-xs">Reply Rate</div>
          </div>
          {insights.bestEmail && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <div className="text-yellow-600 font-bold">Email #{insights.bestEmail.number}</div>
              <div className="text-gray-600 text-xs">Best Performer</div>
            </div>
          )}
          {insights.bestLanguage && (
            <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
              <div className="text-indigo-600 font-bold">{insights.bestLanguage.code.toUpperCase()}</div>
              <div className="text-gray-600 text-xs">Top Language</div>
            </div>
          )}
        </div>
      )}

      {/* AI Suggestions */}
      {insights && insights.suggestions.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded p-3">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-amber-900 mb-1">Suggestions:</div>
              <ul className="space-y-1 text-amber-800">
                {insights.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-xs">• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Daily Trend Sparkline */}
      {insights && insights.dailyTrend.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
            <TrendingUp size={14} />
            7-Day Trend
          </h3>
          <div className="flex items-end gap-1 h-12 bg-gray-50 rounded p-2">
            {insights.dailyTrend.slice(-7).map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 text-xs">
                <div
                  className="w-full bg-blue-400 rounded-sm"
                  style={{ height: `${(day.sends / Math.max(...insights.dailyTrend.map(d => d.sends), 1)) * 100}%`, minHeight: '2px' }}
                  title={`${day.date}: ${day.sends} sent, ${day.replies} replies`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Height = sends/day</p>
        </div>
      )}

      {/* By Email Number */}
      {Object.keys(stats.byEmail).length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">By Email #</h3>
          <div className="space-y-1">
            {Object.entries(stats.byEmail).map(([emailNum, count]) => (
              <div key={emailNum} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                <span className="font-medium text-gray-700">Email {emailNum}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
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
          <h3 className="text-xs font-semibold text-gray-900 mb-2">By Language</h3>
          <div className="space-y-1">
            {Object.entries(stats.byLanguage).map(([lang, count]) => (
              <div key={lang} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                <span className="font-medium text-gray-700 uppercase">{lang}</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
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
