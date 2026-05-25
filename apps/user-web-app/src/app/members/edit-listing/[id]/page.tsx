'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJsApiLoader } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase';
import { MapPin, Camera, Clock, AlertCircle, Menu, X, Square, Calendar, FileText, Map, Euro, ChevronDown, ChevronUp } from 'lucide-react';
import { PayparqPageHeader } from '@/components/PayparqPageHeader';
import { AmenitiesChips } from '@/components/AmenitiesChips';

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputClass = "w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors";
const labelClass = "text-xs font-black text-gray-600 mb-1.5 block leading-none";

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-gray-900' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-4">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-3">
        <p className="text-xs font-black text-gray-700 uppercase tracking-widest">{title}</p>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  );
}

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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
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
    base_price_hourly: '',
    base_price_daily: '',
    base_price_monthly: '',
    photos: [] as { id: number; name: string; url: string }[],
    checkoutSlots: [
      { type: 'hour', value: 1 },
      { type: 'hour', value: 2 },
      { type: 'hour', value: 3 },
    ] as { type: 'hour' | 'vrsta'; value: number | string }[],
  });

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('locations')
        .select('verification_photos, verification_metadata')
        .eq('id', id)
        .single();

      const meta = existing?.verification_metadata || {};
      const photoUrls: string[] = [];

      for (const photo of formData.photos) {
        if (photo.url.startsWith('blob:')) {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

          const { error: uploadError } = await supabase.storage
            .from('locations')
            .upload(fileName, blob);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('locations')
            .getPublicUrl(fileName);

          photoUrls.push(publicUrl);
        } else {
          photoUrls.push(photo.url);
        }
      }

      const { error } = await supabase
        .from('locations')
        .update({
          name: formData.name,
          address: formData.address,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          base_price_hourly: formData.base_price_hourly ? parseFloat(formData.base_price_hourly) : null,
          base_price_daily: formData.base_price_daily ? parseFloat(formData.base_price_daily) : null,
          base_price_monthly: formData.base_price_monthly ? parseFloat(formData.base_price_monthly) : null,
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
            additionalDescription: formData.description,
            checkoutSlots: formData.checkoutSlots,
          },
        })
        .eq('id', id);

      if (error) throw error;

      const newPhotos = photoUrls.map((url, i) => ({
        id: i + 1,
        name: `photo-${i + 1}.jpg`,
        url,
      }));
      setFormData({ ...formData, photos: newPhotos });

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
        checkoutSlots: data.verification_metadata?.checkoutSlots || [
          { type: 'hour', value: 1 },
          { type: 'hour', value: 2 },
          { type: 'hour', value: 3 },
        ],
        base_price_hourly: data.base_price_hourly != null ? String(data.base_price_hourly) : '',
        base_price_daily: data.base_price_daily != null ? String(data.base_price_daily) : '',
        base_price_monthly: data.base_price_monthly != null ? String(data.base_price_monthly) : '',
        photos: (() => {
          const savedPhotos = data.verification_metadata?.photos || data.verification_photos || [];
          if (Array.isArray(savedPhotos) && savedPhotos.length > 0) {
            if (typeof savedPhotos[0] === 'object') {
              return savedPhotos.filter((p: any) => p.url && !p.url.startsWith('blob:'));
            }
            const photoUrls = savedPhotos.filter((url: string) => url && !url.startsWith('blob:'));
            return photoUrls.map((url: string, i: number) => ({
              id: i + 1,
              name: `photo-${i + 1}.jpg`,
              url,
            }));
          }
          return [];
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
          <p className="text-gray-600 text-sm">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PayparqPageHeader
        title="Uredi popis"
        onBack={() => router.back()}
        lineColor="black"
      />

      {/* Success Message */}
      {success && (
        <div className="fixed top-20 left-4 right-4 max-w-sm p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm z-40">
          ✓ Listing updated successfully
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* LEFT INFO PANEL */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-4 md:space-y-6 sticky top-24 md:top-32">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Uredjivanje vašeg oglasa</p>
              <p className="text-xs text-gray-500">Ažurirajte detalje vašeg parkirnog mjesta kako bi privukli više vozača.</p>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Sekcije za uređivanje</p>
              <div className="space-y-2 text-xs">
                {SECTIONS.map((section) => (
                  <div key={section.id} className="flex items-start gap-2 text-gray-700">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span>{section.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Sprema...' : 'Spremi sve'}
              </button>
              <button
                onClick={() => router.back()}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-0">
            {/* SECTION 1: LOCATION */}
            <CollapsibleSection title="Lokacijski detalji" defaultOpen={true}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Listing Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    disabled
                    className={inputClass + " bg-gray-50 text-gray-500 cursor-not-allowed"}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Town/City</label>
                  <input
                    type="text"
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className={inputClass + " font-mono"}
                  />
                </div>

                <div>
                  <label className={labelClass}>Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className={inputClass + " font-mono"}
                  />
                </div>

                <div className="col-span-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                    📍 Koordinate: {formData.latitude || '—'}, {formData.longitude || '—'}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* SECTION 2: SPACE DETAILS */}
            <CollapsibleSection title="Detalji prostora" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tip parkinga</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Tip prostora</label>
                  <select
                    value={formData.spaceType}
                    onChange={(e) => setFormData({ ...formData, spaceType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Odaberite tip</option>
                    <option value="private_driveway">Privatni prilaz</option>
                    <option value="commercial_carpark">Komercijalni parking</option>
                    <option value="residential_carpark">Stambeni parking</option>
                    <option value="lockup_garage">Garaža</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Veličina vozila</label>
                  <input
                    type="text"
                    value={formData.vehicleSize}
                    onChange={(e) => setFormData({ ...formData, vehicleSize: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Toggle checked={formData.hasHeightRestrictions} onChange={(v) => setFormData({ ...formData, hasHeightRestrictions: v })} />
                    <span className="block text-xs font-semibold text-gray-600 uppercase">Ograničenja visine</span>
                  </label>
                  {formData.hasHeightRestrictions && (
                    <div className="mt-3">
                      <label className={labelClass}>Maksimalna visina</label>
                      <input
                        type="text"
                        placeholder="npr. 2.5m"
                        value={formData.maxHeight}
                        onChange={(e) => setFormData({ ...formData, maxHeight: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Toggle checked={formData.hasAccessControl} onChange={(v) => setFormData({ ...formData, hasAccessControl: v })} />
                    <span className="block text-xs font-semibold text-gray-600 uppercase">Kontrola pristupa</span>
                  </label>
                  {formData.hasAccessControl && (
                    <div className="mt-3">
                      <label className={labelClass}>Tip kontrole pristupa</label>
                      <select
                        value={formData.accessControlType}
                        onChange={(e) => setFormData({ ...formData, accessControlType: e.target.value })}
                        className={inputClass}
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
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Toggle checked={formData.requiresPermit} onChange={(v) => setFormData({ ...formData, requiresPermit: v })} />
                    <span className="block text-xs font-semibold text-gray-600 uppercase">Dozvola obavezna</span>
                  </label>
                </div>

                <div>
                  <label className={labelClass}>Dodijeljeni prostor</label>
                  <input
                    type="text"
                    value={formData.spaceAllocated}
                    onChange={(e) => setFormData({ ...formData, spaceAllocated: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase">Karakteristike</label>
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
            </CollapsibleSection>

            {/* SECTION 3: AVAILABILITY & HOURS */}
            <CollapsibleSection title="Dostupnost i radno vrijeme" defaultOpen={false}>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <Toggle checked={formData.available24_7} onChange={(v) => setFormData({ ...formData, available24_7: v })} />
                  <span className="text-xs font-semibold text-gray-600 uppercase">Dostupan 24/7</span>
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
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs font-semibold text-black">{day}</span>
                      </div>
                      {d.enabled && !formData.available24_7 ? (
                        <>
                          <input
                            type="time"
                            value={d.openTime}
                            onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, [day]: { ...d, openTime: e.target.value } } })}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs text-black w-24"
                          />
                          <span className="text-xs text-gray-400">–</span>
                          <input
                            type="time"
                            value={d.closeTime}
                            onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, [day]: { ...d, closeTime: e.target.value } } })}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs text-black w-24"
                          />
                        </>
                      ) : d.enabled ? (
                        <span className="text-xs text-gray-400">00:00 – 24:00</span>
                      ) : (
                        <span className="text-xs text-black/30 italic">Zatvoreno</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* SECTION 4: PRICING */}
            <CollapsibleSection title="Cijene" defaultOpen={false}>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Satna cijena (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price_hourly}
                    onChange={(e) => setFormData({ ...formData, base_price_hourly: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className={labelClass}>Dnevna cijena (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price_daily}
                    onChange={(e) => setFormData({ ...formData, base_price_daily: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className={labelClass}>Mjesečna cijena (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price_monthly}
                    onChange={(e) => setFormData({ ...formData, base_price_monthly: e.target.value })}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700"><strong>Savjet:</strong> Koristite "Upravljaj kalendarom i cijenama" za postavljanje cijena za određene datume.</p>
              </div>
            </CollapsibleSection>

            {/* SECTION 5: DESCRIPTION */}
            <CollapsibleSection title="Opis" defaultOpen={false}>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClass + " min-h-[120px]"}
                placeholder="Opišite vaš parking..."
              />
            </CollapsibleSection>

            {/* SECTION 6: ADDITIONAL INFO */}
            <CollapsibleSection title="Dodatne informacije" defaultOpen={false}>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <Toggle checked={formData.addPostBookingInfo} onChange={(v) => setFormData({ ...formData, addPostBookingInfo: v })} />
                    <span className="text-xs font-semibold text-gray-600 uppercase">Dodaj upute nakon rezervacije</span>
                  </label>
                  {formData.addPostBookingInfo && (
                    <textarea
                      value={formData.postBookingInstructions}
                      onChange={(e) => setFormData({ ...formData, postBookingInstructions: e.target.value })}
                      className={inputClass + " min-h-[100px]"}
                      placeholder="E.g., Gate code, parking spot location, contact info..."
                    />
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* SECTION 7: PHOTOS */}
            <CollapsibleSection title="Fotografije" defaultOpen={true}>
              <div className="grid grid-cols-3 gap-3">
                {formData.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
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
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center text-center cursor-pointer hover:border-black/40 hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const maxId = formData.photos.length > 0 ? Math.max(...formData.photos.map(p => p.id)) : 0;
                        const newPhotos = Array.from(e.target.files).map((file, idx) => ({
                          id: maxId + idx + 1,
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
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-600">Click to add photos</p>
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">Note: Photos are saved with the listing. They will appear on the search page once saved.</p>
            </CollapsibleSection>

            {/* SECTION 8: STREET VIEW */}
            <CollapsibleSection title="Pogled s ceste" defaultOpen={false}>
              {formData.latitude && formData.longitude ? (
                <div ref={streetViewRef} className="rounded-lg overflow-hidden border border-gray-300 w-full h-80" />
              ) : (
                <div className="rounded-lg border border-gray-300 w-full h-80 flex items-center justify-center bg-gray-50">
                  <p className="text-xs text-gray-400">Nema koordinata za prikaz Street Viewa</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">📍 Koordinate: {formData.latitude || '—'}, {formData.longitude || '—'}</p>
            </CollapsibleSection>

            {/* SECTION 9: CHECKOUT SLOTS */}
            <CollapsibleSection title="Checkout Dodaci" defaultOpen={false}>
              <p className="text-xs text-gray-600 mb-4">Odaberite što svaki od 3 gumba na checkout stranici nudi kupcu.</p>
              <div className="grid grid-cols-3 gap-3">
                {([0, 1, 2] as const).map((idx) => {
                  const slot = formData.checkoutSlots?.[idx] || { type: 'hour', value: idx + 1 };
                  const hoursOpts = [
                    { value: 'hour:1', label: '+1h' },
                    { value: 'hour:2', label: '+2h' },
                    { value: 'hour:3', label: '+3h' },
                  ];
                  const vrstaOpts = [
                    { value: 'vrsta:oversized', label: 'Oversized 1.25×' },
                    { value: 'vrsta:premium', label: 'Premium 1.5×' },
                    { value: 'vrsta:kamper', label: 'Kamper 2×' },
                    { value: 'vrsta:bus', label: 'Bus 5×' },
                    { value: 'vrsta:valet', label: 'Valet 2×' },
                    { value: 'vrsta:vip_valet', label: 'VIP Valet 3×' },
                    { value: 'vrsta:late_checkout', label: 'Late Checkout ½d' },
                  ];
                  const allOpts = [...hoursOpts, ...vrstaOpts];
                  const currentVal = `${slot.type}:${slot.value}`;
                  return (
                    <div key={idx}>
                      <label className={labelClass}>Slot {idx + 1}</label>
                      <select
                        value={currentVal}
                        onChange={(e) => {
                          const [type, value] = e.target.value.split(':');
                          const updated = [...(formData.checkoutSlots || [{ type: 'hour', value: 1 }, { type: 'hour', value: 2 }, { type: 'hour', value: 3 }])];
                          updated[idx] = { type: type as 'hour' | 'vrsta', value: type === 'hour' ? Number(value) : value };
                          setFormData({ ...formData, checkoutSlots: updated });
                        }}
                        className={inputClass}
                      >
                        {allOpts.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}
