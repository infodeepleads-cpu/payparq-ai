'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface CampaignMetrics {
  campaignId: string;
  variantA: {
    sent: number;
    opened: number;
    bounced: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
  variantB: {
    sent: number;
    opened: number;
    bounced: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
  winner?: 'A' | 'B' | 'tie';
  createdAt: string;
}

export function CampaignAnalyticsWidget() {
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/email-analytics');
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-600">Loading campaign analytics...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} />
            Campaign Analytics
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No A/B test campaigns yet. Send an email with A/B test enabled to see results here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={20} />
          Campaign Analytics
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-6">
        {campaigns.map((campaign) => (
          <div key={campaign.campaignId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Campaign: {campaign.campaignId.substring(3, 13)}
              </h3>
              <span className="text-xs text-gray-500">
                {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>

            {campaign.winner && (
              <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900">
                  🏆 Variant {campaign.winner} is winning!
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Variant A */}
              <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-xs font-bold">
                    A
                  </span>
                  Variant A
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Sent:</span>
                    <span className="font-semibold text-gray-900">{campaign.variantA.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Opened:</span>
                    <span className="font-semibold text-gray-900">
                      {campaign.variantA.opened} ({campaign.variantA.openRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Clicked:</span>
                    <span className="font-semibold text-gray-900">
                      {campaign.variantA.clicked} ({campaign.variantA.clickRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Bounced:</span>
                    <span className="font-semibold text-gray-900">{campaign.variantA.bounced}</span>
                  </div>
                </div>
              </div>

              {/* Variant B */}
              <div className="border-2 border-green-200 rounded-lg p-3 bg-green-50">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-green-600 text-white rounded-full text-xs font-bold">
                    B
                  </span>
                  Variant B
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Sent:</span>
                    <span className="font-semibold text-gray-900">{campaign.variantB.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Opened:</span>
                    <span className="font-semibold text-gray-900">
                      {campaign.variantB.opened} ({campaign.variantB.openRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Clicked:</span>
                    <span className="font-semibold text-gray-900">
                      {campaign.variantB.clicked} ({campaign.variantB.clickRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Bounced:</span>
                    <span className="font-semibold text-gray-900">{campaign.variantB.bounced}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
