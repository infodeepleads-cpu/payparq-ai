'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ListingData {
  id: string;
  name: string;
  address: string;
  capacity: number;
  description: string;
  base_price_hourly: number;
  base_price_daily: number;
  base_price_monthly: number;
  verification_status: string;
  verification_metadata: any;
  photos: string[];
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: 1,
    description: '',
    base_price_hourly: 0,
    base_price_daily: 0,
    base_price_monthly: 0,
  });

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        setError('Listing not found');
        return;
      }

      setListing(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        capacity: data.capacity || 1,
        description: data.description || '',
        base_price_hourly: data.base_price_hourly || 0,
        base_price_daily: data.base_price_daily || 0,
        base_price_monthly: data.base_price_monthly || 0,
      });
    } catch (err: any) {
      setError(err.message || 'Error loading listing');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('locations')
        .update({
          name: formData.name,
          address: formData.address,
          capacity: formData.capacity,
          description: formData.description,
          base_price_hourly: formData.base_price_hourly,
          base_price_daily: formData.base_price_daily,
          base_price_monthly: formData.base_price_monthly,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setSuccess('Listing updated successfully');
      setTimeout(() => router.push('/members'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error saving listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <p className="text-center text-black/50">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white p-4">
        <p className="text-center text-red-600">Listing not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Nazad
        </button>

        <h1 className="text-2xl font-bold text-black mb-6">Edit Listing: {listing.name}</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">
              Listing Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black placeholder-black/40"
              placeholder="e.g., Downtown Parking Spot"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black placeholder-black/40"
              placeholder="e.g., 123 Main St, City, Country"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">
              Capacity (places)
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
              min="1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black placeholder-black/40 min-h-[100px]"
              placeholder="Describe your parking space..."
            />
          </div>

          {/* Pricing */}
          <div className="border-t border-black/10 pt-4">
            <h3 className="text-sm font-semibold text-black mb-3">Pricing</h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">
                  Hourly (€)
                </label>
                <input
                  type="number"
                  value={formData.base_price_hourly}
                  onChange={(e) => setFormData({ ...formData, base_price_hourly: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">
                  Daily (€)
                </label>
                <input
                  type="number"
                  value={formData.base_price_daily}
                  onChange={(e) => setFormData({ ...formData, base_price_daily: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">
                  Monthly (€)
                </label>
                <input
                  type="number"
                  value={formData.base_price_monthly}
                  onChange={(e) => setFormData({ ...formData, base_price_monthly: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="border-t border-black/10 pt-4 text-sm text-black/60">
            <p>Status: <span className="font-semibold text-black">{listing.verification_status}</span></p>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t border-black/10">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-black/20 rounded-lg text-sm font-semibold text-black hover:bg-black/5 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#5F3DFC] text-white rounded-lg text-sm font-semibold hover:bg-[#4330c4] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
