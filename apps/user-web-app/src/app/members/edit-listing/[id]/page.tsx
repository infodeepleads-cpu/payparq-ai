'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJsApiLoader } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase';
import { MapPin, Camera, Clock, AlertCircle, Menu, X, Square, Calendar, FileText, Map } from 'lucide-react';
import { PayparqPageHeader } from '@/components/PayparqPageHeader';
import { AmenitiesChips } from '@/components/AmenitiesChips';

const SECTIONS = [
  { id: 'location', label: 'Lokacijski detalji', icon: MapPin },
  { id: 'space', label: 'Detalji prostora', icon: Square },
  { id: 'availability', label: 'Dostupnost i radnog vremena', icon: Clock },
  { id: 'description', label: 'Opis', icon: FileText },
  { id: 'additional', label: 'Dodatne informacije', icon: AlertCircle },
  { id: 'photos', label: 'Fotografije', icon: Camera },
  { id: 'streetview', label: 'Pogled s ceste', icon: Map },
];

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('location');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const streetViewInstanceRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    region: 'HR',
    address: '',
    addressLine2: '',
    town: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    type: '',
    description: '',
    spaceType: '',
    vehicleSize: '',
    hasAccessControl: false,
    accessControlType: '',
    hasHeightRestrictions: false,
    maxHeight: '',
    requiresPermit: false,
    spaceAllocated: '',
    features: [] as string[],
    available24_7: false,
    schedule: {
      Ponedjeljak: { enabled: true, openTime: '00:00', closeTime: '23:59' },
      Utorak:      { enabled: true, openTime: '00:00', closeTime: '23:59' },
      Srijeda:     { enabled: true, openTime: '00:00', closeTime: '23:59' },
      Četvrtak:    { enabled: true, openTime: '00:00', closeTime: '23:59' },
      Petak:       { enabled: true, openTime: '00:00', closeTime: '23:59' },
      Subota:      { enabled: true, openTime: '00:00', closeTime: '23:59' },
      Nedjelja:    { enabled: true, openTime: '00:00', closeTime: '23:59' },
    } as Record<string, { enabled: boolean; openTime: string; closeTime: string }>,
    smartPricing: false,
    permits: '',
    postBookingInstructions: '',
    addPostBookingInfo: false,
    photos: [] as { id: number; name: string; url: string }[],
  });

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('locations')
        .select('verification_metadata')
        .eq('id', id)
        .single();

      const meta = existing?.verification_metadata || {};

      const photoUrls = formData.photos.map(p => p.url);

      const { error } = await supabase
        .from('locations')
        .update({
          name: formData.name,
          address: formData.address,
          description: formData.description,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          verification_photos: photoUrls.length > 0 ? photoUrls : null,
          verification_metadata: {
            ...meta,
            region: formData.region,
            addressLine2: formData.addressLine2,
            town: formData.town,
            postalCode: formData.postalCode,
            type: formData.type,
            spaceType: formData.spaceType,
            vehicleSize: formData.vehicleSize,
            hasAccessControl: formData.hasAccessControl,
            accessControlType: formData.accessControlType,
            hasHeightRestrictions: formData.hasHeightRestrictions,
            maxHeight: formData.maxHeight,
            requiresPermit: formData.requiresPermit,
            spaceAllocated: formData.spaceAllocated,
            features: formData.features,
            available24_7: formData.available24_7,
            schedule: formData.schedule,
            smartPricing: formData.smartPricing,
            permits: formData.permits,
            postBookingInstructions: formData.postBookingInstructions,
            photos: formData.photos,
          },
        })
        .eq('id', id);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
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
    if (!isLoaded || !formData.latitude || !formData.longitude || !streetViewRef.current) return;
    if (!window.google?.maps) return;
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    const location = new window.google.maps.LatLng(lat, lng);
    if (!streetViewInstanceRef.current) {
      streetViewInstanceRef.current = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
        position: location,
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
        addressControl: false,
        fullscreenControl: false,
      });
    } else {
      streetViewInstanceRef.current.setPosition(location);
    }
  }, [isLoaded, formData.latitude, formData.longitude]);

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
        latitude: data.latitude != null && data.latitude !== 0 ? String(data.latitude) : '',
        longitude: data.longitude != null && data.longitude !== 0 ? String(data.longitude) : '',
        type: data.verification_metadata?.type || '',
        description: data.verification_metadata?.additionalDescription || data.description || '',
        spaceType: data.verification_metadata?.spaceType || '',
        vehicleSize: data.verification_metadata?.vehicleSize || '',
        hasHeightRestrictions: data.verification_metadata?.hasHeightRestrictions ?? true,
        maxHeight: data.verification_metadata?.maxHeight || '2.5m',
        hasAccessControl: data.verification_metadata?.hasAccessControl ?? true,
        accessControlType: data.verification_metadata?.accessControlType || 'Electronic keypad',
        requiresPermit: data.verification_metadata?.requiresPermit ?? false,
        spaceAllocated: data.verification_metadata?.spaceAllocated || '',
        features: data.verification_metadata?.features || [],
        available24_7: data.verification_metadata?.available24_7 || false,
        schedule: (() => {
          const days = ['Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota','Nedjelja'];
          const saved = data.verification_metadata?.schedule;
          const oldOpen = data.verification_metadata?.openTime || '00:00';
          const oldClose = data.verification_metadata?.closeTime || '23:59';
          const oldDays: string[] = data.verification_metadata?.daysAvailable || days;
          return Object.fromEntries(days.map(d => [d, saved?.[d] ?? {
            enabled: oldDays.includes(d),
            openTime: oldOpen,
            closeTime: oldClose,
          }]));
        })(),
        smartPricing: data.verification_metadata?.smartPricing || false,
        permits: data.verification_metadata?.permits || '',
        postBookingInstructions: data.verification_metadata?.postBookingInstructions || '',
        addPostBookingInfo: !!data.verification_metadata?.postBookingInstructions,
        photos: (() => {
          const photoUrls = data.verification_photos || data.verification_metadata?.photo_urls || [];
          return photoUrls.map((url: string, i: number) => ({
            id: i + 1,
            name: `photo-${i + 1}.jpg`,
            url,
          }));
        })(),
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
                      ? 'bg-black text-white'
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
              className="w-full px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
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
                <h2 className="hidden md:block text-2xl font-bold text-black">Location Details</h2>
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
                  <select
                    value={formData.spaceType}
                    onChange={(e) => setFormData({ ...formData, spaceType: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black bg-white"
                  >
                    <option value="">Odaberite tip</option>
                    <option value="private_driveway">Privatni prilaz</option>
                    <option value="commercial_carpark">Komercijalni parking</option>
                    <option value="residential_carpark">Stambeni parking</option>
                    <option value="lockup_garage">Garaža</option>
                  </select>
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
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.hasHeightRestrictions}
                        onChange={() => setFormData({ ...formData, hasHeightRestrictions: true })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-black">Da</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!formData.hasHeightRestrictions}
                        onChange={() => setFormData({ ...formData, hasHeightRestrictions: false })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-black">Ne</span>
                    </label>
                  </div>
                  {formData.hasHeightRestrictions && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Maksimalna visina</label>
                      <input
                        type="text"
                        placeholder="npr. 2.5m"
                        value={formData.maxHeight}
                        onChange={(e) => setFormData({ ...formData, maxHeight: e.target.value })}
                        className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Kontrola pristupa</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.hasAccessControl}
                        onChange={() => setFormData({ ...formData, hasAccessControl: true })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-black">Da</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!formData.hasAccessControl}
                        onChange={() => setFormData({ ...formData, hasAccessControl: false })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-black">Ne</span>
                    </label>
                  </div>
                  {formData.hasAccessControl && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Tip kontrole pristupa</label>
                      <select
                        value={formData.accessControlType}
                        onChange={(e) => setFormData({ ...formData, accessControlType: e.target.value })}
                        className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black"
                      >
                        <option value="Electronic keypad">Electronic keypad</option>
                        <option value="Gate with code">Gate with code</option>
                        <option value="RFID card">RFID card</option>
                        <option value="Mobile app">Mobile app</option>
                        <option value="Manual entry">Manual entry</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-2 uppercase">Dozvola obavezna</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.requiresPermit}
                        onChange={() => setFormData({ ...formData, requiresPermit: true })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-black">Da</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!formData.requiresPermit}
                        onChange={() => setFormData({ ...formData, requiresPermit: false })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-black">Ne</span>
                    </label>
                  </div>
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
                  <AmenitiesChips
                    selected={formData.features}
                    onToggle={(amenityId) => {
                      setFormData({
                        ...formData,
                        features: formData.features.includes(amenityId)
                          ? formData.features.filter(f => f !== amenityId)
                          : [...formData.features, amenityId]
                      });
                    }}
                    editable={true}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: AVAILABILITY & HOURS */}
            <div id="availability" className="scroll-mt-24 pt-6 border-t border-black/10">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-black" />
                <h2 className="hidden md:block text-2xl font-bold text-black">Dostupnost i radno vrijeme</h2>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.available24_7}
                    onChange={(e) => setFormData({ ...formData, available24_7: e.target.checked })}
                    className="rounded border-black/20"
                  />
                  <span className="text-sm font-semibold text-black">Dostupan 24/7</span>
                </label>

                {['Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota','Nedjelja'].map(day => {
                  const d = formData.schedule[day] ?? { enabled: true, openTime: '00:00', closeTime: '23:59' };
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <div className="w-28 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={d.enabled}
                          onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, [day]: { ...d, enabled: e.target.checked } } })}
                          className="rounded border-black/20"
                        />
                        <span className="text-xs font-semibold text-black">{day}</span>
                      </div>
                      {d.enabled && !formData.available24_7 ? (
                        <>
                          <input
                            type="time"
                            value={d.openTime}
                            onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, [day]: { ...d, openTime: e.target.value } } })}
                            className="px-2 py-1 border border-black/20 rounded-lg text-xs text-black w-24"
                          />
                          <span className="text-xs text-black/40">–</span>
                          <input
                            type="time"
                            value={d.closeTime}
                            onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, [day]: { ...d, closeTime: e.target.value } } })}
                            className="px-2 py-1 border border-black/20 rounded-lg text-xs text-black w-24"
                          />
                        </>
                      ) : d.enabled ? (
                        <span className="text-xs text-black/40">00:00 – 24:00</span>
                      ) : (
                        <span className="text-xs text-black/30 italic">Zatvoreno</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: DESCRIPTION */}
            <div id="description" className="scroll-mt-24 pt-6 border-t border-black/10">
              <h2 className="text-2xl font-bold text-black mb-4">Description</h2>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm text-black min-h-[120px]"
                placeholder="Describe your parking space..."
              />
            </div>

            {/* SECTION 5: ADDITIONAL INFO */}
            <div id="additional" className="scroll-mt-24 pt-6 border-t border-black/10">
              <h2 className="text-2xl font-bold text-black mb-4">Additional Information</h2>

              <div className="space-y-4">
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

            {/* SECTION 6: PHOTOS */}
            <div id="photos" className="scroll-mt-24 pt-6 border-t border-black/10">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-black" />
                <h2 className="hidden md:block text-2xl font-bold text-black">Photos</h2>
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
                <label className="border-2 border-dashed border-black/20 rounded-lg p-6 flex items-center justify-center text-center cursor-pointer hover:border-black/40 hover:bg-black/2 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newPhotos = Array.from(e.target.files).map((file, idx) => ({
                          id: Math.max(...formData.photos.map(p => p.id), 0) + idx + 1,
                          name: file.name.replace(/\.[^/.]+$/, ''),
                          url: URL.createObjectURL(file),
                        }));
                        setFormData({
                          ...formData,
                          photos: [...formData.photos, ...newPhotos],
                        });
                      }
                    }}
                  />
                  <div>
                    <Camera className="w-8 h-8 text-black/40 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-black/60">Click to add photos</p>
                  </div>
                </label>
              </div>
              <p className="text-xs text-black/50 mt-3">Note: Photos are saved with the listing. They will appear on the search page once saved.</p>
            </div>

            {/* SECTION 7: STREET VIEW */}
            <div id="streetview" className="scroll-mt-24 pt-6 border-t border-black/10 pb-8">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-black" />
                <h2 className="hidden md:block text-2xl font-bold text-black">Street View</h2>
              </div>

              {formData.latitude && formData.longitude ? (
                <div ref={streetViewRef} className="rounded-lg overflow-hidden border border-black/10 w-full h-80" />
              ) : (
                <div className="rounded-lg border border-black/10 w-full h-80 flex items-center justify-center bg-black/5">
                  <p className="text-xs text-black/40">Nema koordinata za prikaz Street Viewa</p>
                </div>
              )}
              <p className="text-xs text-black/50 mt-2">📍 Koordinate: {formData.latitude}, {formData.longitude}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
