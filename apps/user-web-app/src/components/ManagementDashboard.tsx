'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Download, Search, DollarSign, Users, BarChart2 } from 'lucide-react';

interface CRMRow {
  status: string;
}

interface Props {
  rows: CRMRow[];
  onClose: () => void;
}

interface RevenueData {
  total_eur: string;
  booking_count: number;
  date: string;
}

interface GSCData {
  connected: boolean;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  position?: number;
}

interface AppDownloadsData {
  app_store: { connected: boolean; downloads: number };
  play_store: { connected: boolean; downloads: number };
}

function StatCard({
  label,
  value,
  sub,
  connected = true,
}: {
  label: string;
  value: string | number;
  sub?: string;
  connected?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      {connected ? (
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      ) : (
        <span className="text-lg font-semibold text-gray-400">—</span>
      )}
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
      {!connected && (
        <span className="text-xs text-amber-600 font-medium">Not connected</span>
      )}
    </div>
  );
}

const STATUS_STEPS = [
  { key: 'Newly Contacted', label: 'Newly Contacted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'DEMO Sent', label: 'DEMO Sent', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'Closed', label: 'Closed', color: 'bg-green-100 text-green-700 border-green-200' },
];

export function ManagementDashboard({ rows, onClose }: Props) {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [gsc, setGsc] = useState<GSCData | null>(null);
  const [appDownloads, setAppDownloads] = useState<AppDownloadsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [revRes, gscRes, appRes] = await Promise.allSettled([
        fetch('/api/dashboard/revenue').then((r) => r.json()),
        fetch('/api/dashboard/gsc').then((r) => r.json()),
        fetch('/api/dashboard/app-downloads').then((r) => r.json()),
      ]);
      if (revRes.status === 'fulfilled') setRevenue(revRes.value);
      if (gscRes.status === 'fulfilled') setGsc(gscRes.value);
      if (appRes.status === 'fulfilled') setAppDownloads(appRes.value);
      setLoading(false);
    }
    fetchAll();
  }, []);

  const statusCounts = STATUS_STEPS.map((s) => ({
    ...s,
    count: rows.filter((r) => r.status === s.key).length,
  }));
  const totalLeads = rows.length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Management Dashboard</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Supply Acquisition */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-gray-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Supply Acquisition</h3>
              <span className="ml-auto text-xs text-gray-500">{totalLeads} total leads</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {statusCounts.map((s, i) => (
                <div
                  key={s.key}
                  className={`border rounded-xl p-4 flex flex-col items-center gap-2 ${s.color}`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                    {i + 1}. {s.label}
                  </span>
                  <span className="text-4xl font-black">{s.count}</span>
                </div>
              ))}
            </div>
            {totalLeads > 0 && statusCounts[2].count > 0 && (
              <p className="text-xs text-gray-500 mt-2 text-right">
                Conversion: {((statusCounts[2].count / totalLeads) * 100).toFixed(1)}% closed
              </p>
            )}
          </section>

          {/* Google Search Console */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search size={16} className="text-gray-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Google Search Console</h3>
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${gsc?.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {loading ? 'Loading...' : gsc?.connected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Impressions"
                value={gsc?.impressions?.toLocaleString() ?? 0}
                sub="today"
                connected={!!gsc?.connected}
              />
              <StatCard
                label="CTR"
                value={gsc?.connected ? `${gsc.ctr}%` : '—'}
                sub="click-through rate"
                connected={!!gsc?.connected}
              />
              <StatCard
                label="Avg Position"
                value={gsc?.position ?? '—'}
                sub="search ranking"
                connected={!!gsc?.connected}
              />
            </div>
            {!gsc?.connected && !loading && (
              <p className="text-xs text-gray-400 mt-2">
                Add <code className="bg-gray-100 px-1 rounded">GSC_SERVICE_ACCOUNT_JSON</code> and{' '}
                <code className="bg-gray-100 px-1 rounded">GSC_SITE_URL</code> to Vercel env vars to connect.
              </p>
            )}
          </section>

          {/* Daily Revenue */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-gray-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Total Daily Revenue</h3>
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${revenue ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {loading ? 'Loading...' : revenue ? 'Live' : 'Error'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="PayParq Revenue"
                value={revenue ? `€${revenue.total_eur}` : '—'}
                sub={revenue?.date ?? 'today'}
                connected={!!revenue}
              />
              <StatCard
                label="Bookings"
                value={revenue?.booking_count ?? '—'}
                sub="transactions today"
                connected={!!revenue}
              />
            </div>
          </section>

          {/* App Downloads */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Download size={16} className="text-gray-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">App Downloads</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">App Store</span>
                {appDownloads?.app_store.connected ? (
                  <span className="text-2xl font-bold text-gray-900">{appDownloads.app_store.downloads}</span>
                ) : (
                  <span className="text-lg font-semibold text-gray-400">—</span>
                )}
                <span className="text-xs text-gray-500">today</span>
                {!appDownloads?.app_store.connected && !loading && (
                  <span className="text-xs text-amber-600 font-medium">Not connected</span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Play Store</span>
                {appDownloads?.play_store.connected ? (
                  <span className="text-2xl font-bold text-gray-900">{appDownloads.play_store.downloads}</span>
                ) : (
                  <span className="text-lg font-semibold text-gray-400">—</span>
                )}
                <span className="text-xs text-gray-500">today</span>
                {!appDownloads?.play_store.connected && !loading && (
                  <span className="text-xs text-amber-600 font-medium">Not connected</span>
                )}
              </div>
            </div>
            {(!appDownloads?.app_store.connected || !appDownloads?.play_store.connected) && !loading && (
              <p className="text-xs text-gray-400 mt-2">
                Add App Store (<code className="bg-gray-100 px-1 rounded">APP_STORE_KEY_ID</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">APP_STORE_ISSUER_ID</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">APP_STORE_PRIVATE_KEY</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">APP_STORE_APP_ID</code>) and Play Store (
                <code className="bg-gray-100 px-1 rounded">PLAY_STORE_SERVICE_ACCOUNT_JSON</code>,{' '}
                <code className="bg-gray-100 px-1 rounded">PLAY_STORE_PACKAGE_NAME</code>) env vars to connect.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
