'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface LocationData {
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
  [key: string]: any;
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<LocationData | null>(null);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      if (!supabase) throw new Error('Supabase nije konfiguriran');
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

      setLocation(data);
      setFormData(data);
    } catch (err: any) {
      setError(err.message || 'Error loading listing');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!supabase) throw new Error('Supabase nije konfiguriran');

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
          verification_metadata: formData.verification_metadata,
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

  if (!location || !formData) {
    return (
      <div className="min-h-screen bg-white p-4">
        <p className="text-center text-red-600">Listing not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Nazad
        </button>

        <h1 className="text-3xl font-bold text-black mb-2">Edit Listing</h1>
        <p className="text-black/60 mb-6">{location.name}</p>

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

        <div className="grid grid-cols-2 gap-6">
          {/* SECTION 1: Location */}
          <div className="col-span-2 border-b border-black/10 pb-6">
            <h2 className="text-xl font-bold text-black mb-4">Location Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Capacity (places)</label>
                <input
                  type="number"
                  value={formData.capacity || 1}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  min="1"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                />
              </div>

              {formData.verification_metadata?.region && (
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Region</label>
                  <input
                    type="text"
                    value={formData.verification_metadata.region || ''}
                    disabled
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black/50 bg-black/5"
                  />
                </div>
              )}

              {formData.verification_metadata?.town && (
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Town</label>
                  <input
                    type="text"
                    value={formData.verification_metadata.town || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      verification_metadata: { ...formData.verification_metadata, town: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>
              )}

              {formData.verification_metadata?.postalCode && (
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Postal Code</label>
                  <input
                    type="text"
                    value={formData.verification_metadata.postalCode || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      verification_metadata: { ...formData.verification_metadata, postalCode: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Space Details */}
          <div className="col-span-2 border-b border-black/10 pb-6">
            <h2 className="text-xl font-bold text-black mb-4">Space Details</h2>

            <div className="grid grid-cols-2 gap-4">
              {formData.verification_metadata?.spaceType && (
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Space Type</label>
                  <input
                    type="text"
                    value={formData.verification_metadata.spaceType || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      verification_metadata: { ...formData.verification_metadata, spaceType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>
              )}

              {formData.verification_metadata?.vehicleSize && (
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Vehicle Size</label>
                  <input
                    type="text"
                    value={formData.verification_metadata.vehicleSize || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      verification_metadata: { ...formData.verification_metadata, vehicleSize: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>
              )}

              {formData.verification_metadata?.accessControl && (
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Access Control</label>
                  <input
                    type="text"
                    value={formData.verification_metadata.accessControl || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      verification_metadata: { ...formData.verification_metadata, accessControl: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>
              )}

              {formData.verification_metadata?.features && Array.isArray(formData.verification_metadata.features) && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Features</label>
                  <p className="text-sm text-black">{formData.verification_metadata.features.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Availability & Pricing */}
          <div className="col-span-2 border-b border-black/10 pb-6">
            <h2 className="text-xl font-bold text-black mb-4">Availability & Pricing</h2>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Hourly (€)</label>
                <input
                  type="number"
                  value={formData.base_price_hourly || 0}
                  onChange={(e) => setFormData({ ...formData, base_price_hourly: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Daily (€)</label>
                <input
                  type="number"
                  value={formData.base_price_daily || 0}
                  onChange={(e) => setFormData({ ...formData, base_price_daily: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Monthly (€)</label>
                <input
                  type="number"
                  value={formData.base_price_monthly || 0}
                  onChange={(e) => setFormData({ ...formData, base_price_monthly: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  step="0.01"
                />
              </div>
            </div>

            {formData.verification_metadata?.available24_7 !== undefined && (
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.verification_metadata.available24_7 || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      verification_metadata: { ...formData.verification_metadata, available24_7: e.target.checked }
                    })}
                    className="rounded border-black/20"
                  />
                  <span className="text-sm text-black">Available 24/7</span>
                </label>
              </div>
            )}

            {formData.verification_metadata?.openTime && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Open Time</label>
                  <input
                    type="time"
                    value={formData.verification_metadata.openTime || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      verification_metadata: { ...formData.verification_metadata, openTime: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Close Time</label>
                  <input
                    type="time"
                    value={formData.verification_metadata.closeTime || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      verification_metadata: { ...formData.verification_metadata, closeTime: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Description */}
          <div className="col-span-2">
            <h2 className="text-xl font-bold text-black mb-4">Description</h2>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black min-h-[120px]"
              placeholder="Describe your parking space..."
            />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex gap-3 pt-4 border-t border-black/10">
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
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
