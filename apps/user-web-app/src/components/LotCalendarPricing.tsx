'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Calendar, DollarSign } from 'lucide-react';

interface LotCalendarPricingProps {
  lotId: string;
  lotName: string;
  onBack: () => void;
}

export function LotCalendarPricing({ lotId, lotName, onBack }: LotCalendarPricingProps) {
  const [tab, setTab] = useState<'calendar' | 'pricing'>('calendar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calendar state
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [available24_7, setAvailable24_7] = useState(true);

  // Pricing state
  const [hourlyPrice, setHourlyPrice] = useState('0');
  const [dailyPrice, setDailyPrice] = useState('0');
  const [monthlyPrice, setMonthlyPrice] = useState('0');

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!supabase) return;
        const { data: lot, error: err } = await supabase
          .from('locations')
          .select('base_price_hourly, base_price_daily, base_price_monthly, availability_calendar, verification_metadata')
          .eq('id', lotId)
          .single();

        if (err) throw err;
        if (lot) {
          setHourlyPrice(String(lot.base_price_hourly || 0));
          setDailyPrice(String(lot.base_price_daily || 0));
          setMonthlyPrice(String(lot.base_price_monthly || 0));
          setAvailableDates(lot.availability_calendar?.dates || []);
          setAvailable24_7(lot.verification_metadata?.available24_7 || true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load lot data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lotId]);

  const handleSaveCalendar = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (!supabase) throw new Error('Supabase nije konfiguriran');
      const { error: err } = await supabase
        .from('locations')
        .update({
          availability_calendar: {
            dates: availableDates,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', lotId);

      if (err) throw err;
      setSuccess('Kalendar je spreman!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save calendar');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePricing = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (!supabase) throw new Error('Supabase nije konfiguriran');
      const { error: err } = await supabase
        .from('locations')
        .update({
          base_price_hourly: parseInt(hourlyPrice) || 0,
          base_price_daily: parseInt(dailyPrice) || 0,
          base_price_monthly: parseInt(monthlyPrice) || 0,
        })
        .eq('id', lotId);

      if (err) throw err;
      setSuccess('Cijene su spremljene!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  const toggleDate = (date: string) => {
    setAvailableDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5F3DFC] mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manage: {lotName}</h2>
            <p className="text-sm text-gray-500">Calendar & Pricing</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6 flex gap-8">
        <button
          onClick={() => setTab('calendar')}
          className={`py-4 font-medium text-sm border-b-2 transition-colors ${
            tab === 'calendar'
              ? 'border-[#5F3DFC] text-[#5F3DFC]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4 inline-block mr-2" />
          Calendar
        </button>
        <button
          onClick={() => setTab('pricing')}
          className={`py-4 font-medium text-sm border-b-2 transition-colors ${
            tab === 'pricing'
              ? 'border-[#5F3DFC] text-[#5F3DFC]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4 inline-block mr-2" />
          Pricing
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Error & Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Calendar Tab */}
        {tab === 'calendar' && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Availability</h3>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={available24_7}
                  onChange={(e) => setAvailable24_7(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#5F3DFC]"
                />
                <span className="font-medium text-gray-900">Available 24/7</span>
              </label>
              <p className="text-sm text-gray-600">
                {available24_7
                  ? 'Your parking space is available all day, every day.'
                  : 'Set specific availability dates below.'}
              </p>
            </div>

            {!available24_7 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Select dates when your space is available:
                </p>
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {Array.from({ length: 30 }, (_, i) => {
                    const date = new Date(2026, 4, i + 1);
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = availableDates.includes(dateStr);
                    return (
                      <button
                        key={dateStr}
                        onClick={() => toggleDate(dateStr)}
                        className={`p-2 text-xs font-medium rounded transition-colors ${
                          isSelected
                            ? 'bg-[#5F3DFC] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-600">
                  Selected: {availableDates.length} dates
                </p>
              </div>
            )}

            <button
              onClick={handleSaveCalendar}
              disabled={saving}
              className="mt-6 w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg font-medium hover:bg-[#4330c4] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Spremanje...' : 'Spremi Kalendar'}
            </button>
          </div>
        )}

        {/* Pricing Tab */}
        {tab === 'pricing' && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Your Prices</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Hourly Rate (€)
                </label>
                <input
                  type="number"
                  value={hourlyPrice}
                  onChange={(e) => setHourlyPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  placeholder="e.g., 5"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Price per hour</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Daily Rate (€)
                </label>
                <input
                  type="number"
                  value={dailyPrice}
                  onChange={(e) => setDailyPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  placeholder="e.g., 20"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Price per day (24 hours)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Monthly Rate (€)
                </label>
                <input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  placeholder="e.g., 500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Price per month (30 days)</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  💡 Tip: Set competitive prices to attract more bookings. You can adjust these anytime.
                </p>
              </div>
            </div>

            <button
              onClick={handleSavePricing}
              disabled={saving}
              className="mt-6 w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg font-medium hover:bg-[#4330c4] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Spremanje...' : 'Spremi Cijene'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
