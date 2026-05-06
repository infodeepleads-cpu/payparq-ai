'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MapPin, Camera, Clock, Euro, AlertCircle, Menu, X, Square, Calendar, FileText, Map } from 'lucide-react';
import { PayparqPageHeader } from '@/components/PayparqPageHeader';

const SECTIONS = [
  { id: 'location', label: 'Lokacijski detalji', icon: MapPin },
  { id: 'space', label: 'Detalji prostora', icon: Square },
  { id: 'availability', label: 'Dostupnost i radnog vremena', icon: Clock },
  { id: 'pricing', label: 'Cijene', icon: Euro },
  { id: 'description', label: 'Opis', icon: FileText },
  { id: 'additional', label: 'Dodatne informacije', icon: AlertCircle },
  { id: 'photos', label: 'Fotografije', icon: Camera },
  { id: 'streetview', label: 'Pogled s ceste', icon: Map },
];

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('location');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Info
    name: 'Downtown Premium Parking',
    region: 'HR',
    address: '123 Main Street',
    addressLine2: 'Building B, Ground Floor',
    town: 'Zagreb',
    postalCode: '10000',
    latitude: '45.8150',
    longitude: '15.9819',
    capacity: '5',
    type: 'Outdoor Lot',
    description: 'Secure parking in the heart of downtown. Well-lit, 24/7 access with CCTV monitoring and security guard on premises.',

    // Space Details
    spaceType: 'Outdoor Lot',
    vehicleSize: 'All vehicles',
    heightRestrictions: 'Yes',
    maxHeight: '2.5m',
    accessControl: 'Gate with code',
    accessControlType: 'Electronic keypad',
    permitRequired: 'No',
    spaceAllocated: 'Marked spaces',
    features: ['24/7 Lighting', 'CCTV', 'Security Guard', 'EV Charging'],

    // Availability & Pricing
    available24_7: true,
    openTime: '00:00',
    closeTime: '23:59',
    daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    smartPricing: false,
    permits: 'None required',


    // Pricing
    base_price_hourly: '5.50',
    base_price_daily: '18.00',
    base_price_monthly: '350.00',

    // Additional Info
    addAdditionalInfo: true,
    additionalDescription: 'Free Wi-Fi available in waiting area. Reserved spaces for handicapped. Covered parking available for additional fee.',
    postBookingInstructions: 'Upon arrival, use gate code: 1234. Reserved spot marked with your license plate. Contact security at +385 1 234 5678 for assistance.',
    addPostBookingInfo: true,

    // Photos (simulated)
    photos: [
      { id: 1, name: 'parking-entrance.jpg', url: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500&h=500&fit=crop' },
      { id: 2, name: 'parking-spaces.jpg', url: 'https://images.unsplash.com/photo-1597045866519-bf8eb5537877?w=500&h=500&fit=crop' },
      { id: 3, name: 'parking-night.jpg', url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=500&h=500&fit=crop' },
    ],

    // Street View
    streetView: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop',
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleRemovePhoto = (id: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter(p => p.id !== id)
    });
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setFormData({
        name: data.name || '',
        region: data.verification_metadata?.region || 'HR',
        address: data.address || '',
        addressLine2: data.verification_metadata?.addressLine2 || '',
        town: data.verification_metadata?.town || '',
        postalCode: data.verification_metadata?.postalCode || '',
        latitude: data.verification_metadata?.latitude || '',
        longitude: data.verification_metadata?.longitude || '',
        capacity: String(data.capacity || 1),
        type: data.verification_metadata?.type || '',
        description: data.description || '',
        spaceType: data.verification_metadata?.spaceType || '',
        vehicleSize: data.verification_metadata?.vehicleSize || '',
        heightRestrictions: data.verification_metadata?.heightRestrictions || '',
        maxHeight: data.verification_metadata?.maxHeight || '',
        accessControl: data.verification_metadata?.accessControl || '',
        accessControlType: data.verification_metadata?.accessControlType || '',
        permitRequired: data.verification_metadata?.permitRequired || '',
        spaceAllocated: data.verification_metadata?.spaceAllocated || '',
        features: data.verification_metadata?.features || [],
        available24_7: data.verification_metadata?.available24_7 || false,
        openTime: data.verification_metadata?.openTime || '00:00',
        closeTime: data.verification_metadata?.closeTime || '23:59',
        daysAvailable: data.verification_metadata?.daysAvailable || [],
        smartPricing: data.verification_metadata?.smartPricing || false,
        permits: data.verification_metadata?.permits || '',
        base_price_hourly: String(data.base_price_hourly || 0),
        base_price_daily: String(data.base_price_daily || 0),
        base_price_monthly: String(data.base_price_monthly || 0),
        addAdditionalInfo: !!data.verification_metadata?.additionalDescription,
        additionalDescription: data.verification_metadata?.additionalDescription || '',
        postBookingInstructions: data.verification_metadata?.postBookingInstructions || '',
        addPostBookingInfo: !!data.verification_metadata?.postBookingInstructions,
        photos: data.verification_metadata?.photos || [],
        streetView: data.verification_metadata?.streetView || '',
      });
    } catch (err) {
      console.error('Error loading listing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-4">
            {/* Rotating white ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
            {/* Pulsating logo */}
            <div className="animate-pulse w-12 h-12 rounded-full bg-[#020617] flex items-center justify-center shadow-lg z-10">
              <span className="text-lg font-black tracking-tight text-white select-none">P</span>
            </div>
          </div>
          <p className="text-black/60 text-sm">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PayparqPageHeader
        title="Uredi popis"
        onBack={() => router.back()}
      />

      {/* Success Message */}
      {success && (
        <div className="fixed top-20 left-4 right-4 max-w-sm p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm z-40">
          ✓ Listing updated successfully
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* SIDEBAR */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 lg:min-h-[calc(100vh-5rem)] bg-black/2 border-r border-black/10 p-4 sticky top-20 lg:top-20 max-h-[calc(100vh-5rem)] overflow-y-auto`}>
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                    isActive
                      ? 'bg-[#5F3DFC] text-white'
                      : 'text-black/60 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <span className="text-left">{section.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Save Button in Sidebar */}
          <div className="mt-8 pt-4 border-t border-black/10 space-y-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 bg-[#5F3DFC] text-white rounded-lg text-sm font-semibold hover:bg-[#4330c4] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All'}
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 border border-black/20 rounded-lg text-sm font-semibold text-black hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="max-w-3xl space-y-8">
            {/* SECTION 1: LOCATION */}
            <div id="location" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-bold text-black">Location Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Listing Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    disabled
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black/50 bg-black/5"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Town/City</label>
                  <input
                    type="text"
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <div className="bg-black/5 border border-black/10 rounded-lg p-3 text-sm text-black/70">
                    📍 Map coordinates: {formData.latitude}, {formData.longitude}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: SPACE DETAILS */}
            <div id="space" className="scroll-mt-24 pt-6 border-t border-black/10">
              <h2 className="text-2xl font-bold text-black mb-4">Detalji prostora</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Kapacitet (mjesta)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value === "" ? "" : parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Tip parkinga</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Tip prostora</label>
                  <input
                    type="text"
                    value={formData.spaceType}
                    onChange={(e) => setFormData({ ...formData, spaceType: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Veličina vozila</label>
                  <input
                    type="text"
                    value={formData.vehicleSize}
                    onChange={(e) => setFormData({ ...formData, vehicleSize: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Ograničenja visine</label>
                  <input
                    type="text"
                    value={formData.heightRestrictions}
                    onChange={(e) => setFormData({ ...formData, heightRestrictions: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Maksimalna visina</label>
                  <input
                    type="text"
                    value={formData.maxHeight}
                    onChange={(e) => setFormData({ ...formData, maxHeight: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Kontrola pristupa</label>
                  <input
                    type="text"
                    value={formData.accessControl}
                    onChange={(e) => setFormData({ ...formData, accessControl: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Tip kontrole pristupa</label>
                  <input
                    type="text"
                    value={formData.accessControlType}
                    onChange={(e) => setFormData({ ...formData, accessControlType: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Dozvola obavezna</label>
                  <input
                    type="text"
                    value={formData.permitRequired}
                    onChange={(e) => setFormData({ ...formData, permitRequired: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Dodijeljeni prostor</label>
                  <input
                    type="text"
                    value={formData.spaceAllocated}
                    onChange={(e) => setFormData({ ...formData, spaceAllocated: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-black/60 mb-3 uppercase">Karakteristike</label>
                  <div className="space-y-2">
                    {['24/7 Lighting', 'CCTV', 'Security Guard', 'EV Charging'].map((feature) => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.features.includes(feature)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, features: [...formData.features, feature] });
                            } else {
                              setFormData({ ...formData, features: formData.features.filter(f => f !== feature) });
                            }
                          }}
                          className="w-4 h-4 rounded border-black/20 accent-[#7C3AED]"
                        />
                        <span className="text-sm text-black">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: AVAILABILITY & HOURS */}
            <div id="availability" className="scroll-mt-24 pt-6 border-t border-black/10">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-bold text-black">Availability & Hours</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.available24_7}
                      onChange={(e) => setFormData({ ...formData, available24_7: e.target.checked })}
                      className="rounded border-black/20"
                    />
                    <span className="text-sm font-semibold text-black">Available 24/7</span>
                  </label>
                </div>

                {!formData.available24_7 && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Opens At</label>
                      <input
                        type="time"
                        value={formData.openTime}
                        onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                        className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Closes At</label>
                      <input
                        type="time"
                        value={formData.closeTime}
                        onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                        className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Days Available</label>
                  <p className="text-sm text-black">{formData.daysAvailable.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* SECTION 4: PRICING */}
            <div id="pricing" className="scroll-mt-24 pt-6 border-t border-black/10">
              <div className="flex items-center gap-2 mb-4">
                <Euro className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-bold text-black">Pricing</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Hourly Rate (€)</label>
                  <input
                    type="number"
                    value={formData.base_price_hourly}
                    onChange={(e) => setFormData({ ...formData, base_price_hourly: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Daily Rate (€)</label>
                  <input
                    type="number"
                    value={formData.base_price_daily}
                    onChange={(e) => setFormData({ ...formData, base_price_daily: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Monthly Rate (€)</label>
                  <input
                    type="number"
                    value={formData.base_price_monthly}
                    onChange={(e) => setFormData({ ...formData, base_price_monthly: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: DESCRIPTION */}
            <div id="description" className="scroll-mt-24 pt-6 border-t border-black/10">
              <h2 className="text-2xl font-bold text-black mb-4">Description</h2>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black min-h-[120px]"
                placeholder="Describe your parking space..."
              />
            </div>

            {/* SECTION 6: ADDITIONAL INFO */}
            <div id="additional" className="scroll-mt-24 pt-6 border-t border-black/10">
              <h2 className="text-2xl font-bold text-black mb-4">Additional Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={formData.addAdditionalInfo}
                      onChange={(e) => setFormData({ ...formData, addAdditionalInfo: e.target.checked })}
                      className="rounded border-black/20"
                    />
                    <span className="text-sm font-semibold text-black">Add Additional Information</span>
                  </label>
                  {formData.addAdditionalInfo && (
                    <textarea
                      value={formData.additionalDescription}
                      onChange={(e) => setFormData({ ...formData, additionalDescription: e.target.value })}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black min-h-[100px]"
                      placeholder="E.g., Free Wi-Fi, handicapped accessible, covered parking..."
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={formData.addPostBookingInfo}
                      onChange={(e) => setFormData({ ...formData, addPostBookingInfo: e.target.checked })}
                      className="rounded border-black/20"
                    />
                    <span className="text-sm font-semibold text-black">Add Post-Booking Instructions</span>
                  </label>
                  {formData.addPostBookingInfo && (
                    <textarea
                      value={formData.postBookingInstructions}
                      onChange={(e) => setFormData({ ...formData, postBookingInstructions: e.target.value })}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black min-h-[100px]"
                      placeholder="E.g., Gate code, parking spot location, contact info..."
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 7: PHOTOS */}
            <div id="photos" className="scroll-mt-24 pt-6 border-t border-black/10">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-bold text-black">Photos</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {formData.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-40 object-cover rounded-lg border border-black/10"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <p className="text-white text-xs font-semibold text-center px-2">{photo.name}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="border-2 border-dashed border-black/20 rounded-lg p-6 flex items-center justify-center text-center cursor-pointer hover:border-black/40 transition-colors">
                  <div>
                    <Camera className="w-8 h-8 text-black/40 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-black/60">Add more photos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 8: STREET VIEW */}
            <div id="streetview" className="scroll-mt-24 pt-6 border-t border-black/10 pb-8">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-bold text-black">Street View</h2>
              </div>

              <div className="rounded-lg overflow-hidden border border-black/10">
                <img
                  src={formData.streetView}
                  alt="Street view"
                  className="w-full h-80 object-cover"
                />
              </div>
              <p className="text-xs text-black/50 mt-2">📍 Street view from coordinates: {formData.latitude}, {formData.longitude}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
