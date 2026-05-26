'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, ChevronDown, ChevronUp, Clock, X, Info } from 'lucide-react';
import { PayparqPageHeader } from '@/components/PayparqPageHeader';
import { AmenitiesChips } from '@/components/AmenitiesChips';

const GMAPS_LIBS: ('places')[] = ['places'];

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputClass = "w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors";
const labelClass = "text-xs font-black text-gray-600 mb-1.5 block leading-none";
const subLabelClass = "text-xs font-semibold text-gray-500 mb-1 block";

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

// ─── Helper: Extract country code from geocoding results ───────────────────
function extractCountryCode(results: google.maps.GeocoderResult[]): string | null {
  if (!results?.[0]) return null;
  const countryComponent = results[0].address_components?.find((c) => c.types.includes('country'));
  return countryComponent?.short_name ?? null;
}

// ─── Address field with mini map ──────────────────────────────────────────────
function AddressMapField({ address, onAddressChange, pin, onPinChange, onRegionDetect, isLoaded }: {
  address: string; onAddressChange: (v: string) => void;
  pin: { lat: number; lng: number } | null; onPinChange: (p: { lat: number; lng: number }) => void;
  onRegionDetect?: (region: string | null) => void;
  isLoaded: boolean;
}) {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const mapCenter = pin || { lat: 45.815, lng: 15.982 };

  useEffect(() => {
    if (!isLoaded || !address || address.length < 3) { setPredictions([]); return; }
    const svc = new google.maps.places.AutocompleteService();
    svc.getPlacePredictions({ input: address }, (results, status) => {
      setPredictions(status === google.maps.places.PlacesServiceStatus.OK && results ? results : []);
    });
  }, [address, isLoaded]);

  const selectPrediction = (pred: google.maps.places.AutocompletePrediction) => {
    setShowPredictions(false); setPredictions([]);
    onAddressChange(pred.description);
    if (!isLoaded) return;
    new google.maps.places.PlacesService(document.createElement('div')).getDetails({ placeId: pred.place_id }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        onPinChange({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        if (place.address_components && onRegionDetect) {
          const countryCode = extractCountryCode([{ address_components: place.address_components } as google.maps.GeocoderResult]);
          onRegionDetect(countryCode);
        }
      }
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude; const lng = pos.coords.longitude;
      onPinChange({ lat, lng });
      if (!isLoaded) return;
      new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          onAddressChange(results[0].formatted_address);
          if (onRegionDetect) {
            const countryCode = extractCountryCode(results);
            onRegionDetect(countryCode);
          }
        }
      });
    });
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat(); const lng = e.latLng.lng();
    onPinChange({ lat, lng });
    if (!isLoaded) return;
    new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        onAddressChange(results[0].formatted_address);
        if (onRegionDetect) {
          const countryCode = extractCountryCode(results);
          onRegionDetect(countryCode);
        }
      }
    });
  }, [isLoaded, onAddressChange, onPinChange, onRegionDetect]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input type="text" placeholder="Ilica 1, Zagreb" value={address}
          onChange={(e) => { onAddressChange(e.target.value); setShowPredictions(true); }}
          onFocus={() => setShowPredictions(true)} onBlur={() => setTimeout(() => setShowPredictions(false), 150)}
          className={inputClass} required />
        {showPredictions && predictions.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            {predictions.slice(0, 4).map((pred) => (
              <button key={pred.place_id} type="button" onMouseDown={() => selectPrediction(pred)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate">{pred.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 180 }}>
        {isLoaded ? (
          <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={mapCenter} zoom={pin ? 15 : 12}
            onClick={onMapClick} options={{ disableDefaultUI: true, zoomControl: true, clickableIcons: false }}>
            {pin && <Marker position={pin} />}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-400">Učitavanje karte...</span>
          </div>
        )}
      </div>
      <button type="button" onClick={useCurrentLocation} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
        <Navigation className="w-3 h-3" />Koristi trenutnu lokaciju
      </button>
    </div>
  );
}

const ADDONS = ['Valet', 'EV punjenje', 'Pretakanje', 'Pranje', 'Natkriveno', 'Rampa/Brana', 'CCTV', 'Pristup invalidima', 'Osoblje', 'Garaža', 'Shuttle'];
const SPOT_TYPES = [
  { key: 'standard_xxl', label: 'Preveliko vozilo (XXL)', mult: '1.25×' },
  { key: 'premium', label: 'Premium (Sjena, Ulaz, Garaža)', mult: '1.5×' },
  { key: 'kamper', label: 'Kamper', mult: '2×' },
  { key: 'bus', label: 'Bus', mult: '5×' },
  { key: 'valet', label: 'Valet', mult: '2×' },
  { key: 'vip_valet', label: 'VIP Valet (Sve uključeno)', mult: '2.5–5×', desc: 'Neograničeno punjenje/pranje, Crveni tepih' },
  { key: 'late_checkout', label: 'Kasni odlazak', mult: '½ dana' },
];

// ─── Main form ────────────────────────────────────────────────────────────────

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GMAPS_LIBS,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // ─── Form data using host form schema ────
  const [lotName, setLotName] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [parkingType, setParkingType] = useState('');
  const [region, setRegion] = useState('HR');

  const [accessType, setAccessType] = useState('');
  const [gatedPhone, setGatedPhone] = useState('');
  const [heightLimit, setHeightLimit] = useState('');
  const [widthLimit, setWidthLimit] = useState('');
  const [exoticVehicles, setExoticVehicles] = useState('');
  const [ownerComment, setOwnerComment] = useState('');
  const [accessInstructions, setAccessInstructions] = useState('');

  const [addons, setAddons] = useState<string[]>([]);
  const toggleAddon = (a: string) => setAddons((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const [is247, setIs247] = useState(true);
  const [hoursFrom, setHoursFrom] = useState('');
  const [hoursTo, setHoursTo] = useState('');
  const [openDays, setOpenDays] = useState<string[]>(['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']);
  const toggleDay = (d: string) => setOpenDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const [baseSpots, setBaseSpots] = useState('');
  const [activeSpotTypes, setActiveSpotTypes] = useState<string[]>([]);
  const toggleSpotType = (k: string) => setActiveSpotTypes((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);

  const [standardHourlyPrice, setStandardHourlyPrice] = useState('');
  const [standardDailyPrice, setStandardDailyPrice] = useState('');
  const [standardMonthlyPrice, setStandardMonthlyPrice] = useState('');

  const [useDynamicPrice, setUseDynamicPrice] = useState(true);
  const [minPriceHourly, setMinPriceHourly] = useState('');
  const [minPriceDaily, setMinPriceDaily] = useState('');
  const [minPriceMonthly, setMinPriceMonthly] = useState('');
  const [useAIDynamicPricing, setUseAIDynamicPricing] = useState(true);

  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  const [checkoutSlots, setCheckoutSlots] = useState<{ type: 'hour' | 'vrsta'; value: number | string }[]>([
    { type: 'hour', value: 1 },
    { type: 'hour', value: 2 },
    { type: 'hour', value: 3 },
  ]);

  // Load listing data
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

      const meta = data.verification_metadata || {};

      // Map database fields to host form schema
      setLotName(data.name || '');
      setAddress(data.address || '');
      if (data.latitude && data.longitude) {
        setPin({ lat: data.latitude, lng: data.longitude });
      }
      setRegion(meta.region || 'HR');
      setParkingType(meta.type || '');

      setAccessType(meta.accessType || '');
      setGatedPhone(meta.gatedPhone || '');
      setHeightLimit(meta.heightLimit || meta.maxHeight || '');
      setWidthLimit(meta.widthLimit || '');
      setExoticVehicles(meta.exoticVehicles || '');
      setOwnerComment(meta.ownerComment || meta.description || '');
      setAccessInstructions(meta.accessInstructions || '');

      setAddons(meta.addons || meta.features || []);
      setIs247(meta.is247 ?? meta.available24_7 ?? true);
      setOpenDays(meta.openDays || meta.daysAvailable || ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']);
      setHoursFrom(meta.hoursFrom || '');
      setHoursTo(meta.hoursTo || '');

      setBaseSpots(meta.baseSpots || '');
      setActiveSpotTypes(meta.activeSpotTypes || []);

      setStandardHourlyPrice(data.base_price_hourly ? String(data.base_price_hourly) : '');
      setStandardDailyPrice(data.base_price_daily ? String(data.base_price_daily) : '');
      setStandardMonthlyPrice(data.base_price_monthly ? String(data.base_price_monthly) : '');

      setMinPriceHourly(meta.minPriceHourly ? String(meta.minPriceHourly) : '');
      setMinPriceDaily(meta.minPriceDaily ? String(meta.minPriceDaily) : '');
      setMinPriceMonthly(meta.minPriceMonthly ? String(meta.minPriceMonthly) : '');
      setUseAIDynamicPricing(meta.useAIDynamicPricing ?? true);

      setExistingPhotos(data.verification_photos || []);
      setCheckoutSlots(meta.checkoutSlots || [
        { type: 'hour', value: 1 },
        { type: 'hour', value: 2 },
        { type: 'hour', value: 3 },
      ]);

      setLoading(false);
    } catch (err) {
      console.error('Error loading listing:', err);
      setLoading(false);
    }
  };

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
      const photoUrls: string[] = [...existingPhotos];

      // Upload new photos
      for (const photo of photos) {
        if (photo instanceof File) {
          const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('locations')
            .upload(fileName, photo);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('locations')
              .getPublicUrl(fileName);
            photoUrls.push(publicUrl);
          }
        }
      }

      // Save with host form schema
      const { error } = await supabase
        .from('locations')
        .update({
          name: lotName,
          address: address,
          latitude: pin ? pin.lat : null,
          longitude: pin ? pin.lng : null,
          base_price_hourly: standardHourlyPrice ? parseFloat(standardHourlyPrice) : null,
          base_price_daily: standardDailyPrice ? parseFloat(standardDailyPrice) : null,
          base_price_monthly: standardMonthlyPrice ? parseFloat(standardMonthlyPrice) : null,
          verification_photos: photoUrls.length > 0 ? photoUrls : null,
          verification_metadata: {
            ...meta,
            region,
            type: parkingType,
            accessType,
            gatedPhone,
            heightLimit,
            maxHeight: heightLimit,
            widthLimit,
            exoticVehicles,
            ownerComment,
            description: ownerComment,
            accessInstructions,
            addons,
            features: addons,
            is247,
            available24_7: is247,
            openDays,
            daysAvailable: openDays,
            hoursFrom,
            hoursTo,
            baseSpots,
            activeSpotTypes,
            standardHourlyPrice,
            standardDailyPrice,
            standardMonthlyPrice,
            useDynamicPrice,
            minPriceHourly,
            minPriceDaily,
            minPriceMonthly,
            useAIDynamicPricing,
            checkoutSlots,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PayparqPageHeader title="Uredi popis" onBack={() => router.back()} lineColor="black" />

      {success && (
        <div className="fixed top-20 left-4 right-4 max-w-sm p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm z-40">
          ✓ Listing updated successfully
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form className="space-y-4">

          {/* ── Section 1: Lot Info ── */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Podaci o lotu</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Naziv</label>
                <input type="text" placeholder="npr. Parking Centar Zagreb" value={lotName} onChange={(e) => setLotName(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Adresa</label>
                <AddressMapField address={address} onAddressChange={setAddress} pin={pin} onPinChange={setPin} onRegionDetect={(r) => r && setRegion(r)} isLoaded={isLoaded} />
              </div>
            </div>
          </div>

          {/* ── Section 2: Lot Specifics ── */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Specifičnosti parkinga</p>

            <CollapsibleSection title="Stvari koje biste trebali znati" defaultOpen={false}>
              <div>
                <label className={labelClass}>Vrsta Pristupa</label>
                <div className="flex gap-2 flex-wrap">
                  {['Rampa/Brana', 'Bez Rampe', 'Recepcija/Čuvar'].map((t) => (
                    <button key={t} type="button" onClick={() => setAccessType(t)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${accessType === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {accessType === 'Rampa/Brana' && (
                  <div className="mt-2">
                    <label className={subLabelClass}>Telefon (hitni slučaj / rezervacija)</label>
                    <input type="tel" placeholder="+385 91 000 0000" value={gatedPhone} onChange={(e) => setGatedPhone(e.target.value)} className={inputClass} />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Vrsta parkinga</label>
                <div className="flex gap-2 flex-wrap">
                  {['Parcela', 'Garaža', 'Valet', 'Parking'].map((t) => (
                    <button key={t} type="button" onClick={() => setParkingType(t)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${parkingType === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Ograničenje visine (m)</label>
                  <input type="text" placeholder="npr. 2.10" value={heightLimit} onChange={(e) => setHeightLimit(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ograničenje širine (m)</label>
                  <input type="text" placeholder="npr. 2.20" value={widthLimit} onChange={(e) => setWidthLimit(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Egzotična vozila</label>
                <div className="flex gap-2">
                  {['Da', 'Ne', 'Na upit'].map((v) => (
                    <button key={v} type="button" onClick={() => setExoticVehicles(v)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${exoticVehicles === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Komentar Vlasnika</label>
                <textarea placeholder="npr. Parking je zaštićen 24/7 video nadzorom..." value={ownerComment} onChange={(e) => setOwnerComment(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors resize-none" />
              </div>

              <div>
                <label className={labelClass}>Upute za pristup</label>
                <textarea placeholder="npr. Uđite s Ulice kralja Tomislava..." value={accessInstructions} onChange={(e) => setAccessInstructions(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors resize-none" />
                <p className="text-xs text-gray-400 mt-1">Prikazuje se vozaču nakon rezervacije i u mobilnom skeneru.</p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Dodaci" defaultOpen={false}>
              <div className="flex flex-wrap gap-2">
                {ADDONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAddon(a)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${addons.includes(a) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                    <span translate="no">{a}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Radno Vrijeme (Pristupno vrijeme)" defaultOpen={false}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-800">24/7</p>
                  <p className="text-xs text-gray-400">Otvoreno cijelo vrijeme</p>
                </div>
                <Toggle checked={is247} onChange={setIs247} />
              </div>

              {!is247 && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className={subLabelClass}>Dani</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].map((d) => (
                        <button key={d} type="button" onClick={() => toggleDay(d)}
                          className={`w-10 h-8 rounded text-xs font-bold border transition-colors ${openDays.includes(d) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'}`}>
                          <span translate="no">{d}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={subLabelClass}>Od</label>
                      <input type="time" value={hoursFrom} onChange={(e) => setHoursFrom(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={subLabelClass}>Do</label>
                      <input type="time" value={hoursTo} onChange={(e) => setHoursTo(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Kapacitet" defaultOpen={false}>
              <div>
                <label className={labelClass}>Broj mjesta</label>
                <input type="number" placeholder="10" min="1" value={baseSpots} onChange={(e) => setBaseSpots(e.target.value)} className={inputClass} required />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Vrsta mjesta" defaultOpen={false}>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">Razlikujte kategoriju mjesta — odaberite koje ćete smjestiti uz množitelj standardne cijene</p>
              <div className="space-y-2">
                {SPOT_TYPES.map((st) => (
                  <div key={st.key} onClick={() => toggleSpotType(st.key)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${activeSpotTypes.includes(st.key) ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{st.label}</p>
                      {st.desc && <p className="text-xs text-gray-400 mt-0.5">{st.desc}</p>}
                    </div>
                    <span className={`text-xs font-bold ml-3 flex-shrink-0 ${activeSpotTypes.includes(st.key) ? 'text-gray-900' : 'text-gray-400'}`}>{st.mult}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Cijena" defaultOpen={false}>
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Standard</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>Satna (€/h)</label>
                    <input type="number" placeholder="2.50" min="0" step="0.50" value={standardHourlyPrice} onChange={(e) => setStandardHourlyPrice(e.target.value)} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Dnevna (€/dan)</label>
                    <input type="number" placeholder="15.00" min="0" step="0.50" value={standardDailyPrice} onChange={(e) => setStandardDailyPrice(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Mjesečna (€/mj)</label>
                    <input type="number" placeholder="300.00" min="0" step="10" value={standardMonthlyPrice} onChange={(e) => setStandardMonthlyPrice(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Minimalne cijene koje ćete prihvatiti</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>Satna (€/h)</label>
                    <input type="number" placeholder="1.00" min="0" step="0.10" value={minPriceHourly} onChange={(e) => setMinPriceHourly(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Dnevna (€/dan)</label>
                    <input type="number" placeholder="5.00" min="0" step="0.10" value={minPriceDaily} onChange={(e) => setMinPriceDaily(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Mjesečna (€/mj)</label>
                    <input type="number" placeholder="100.00" min="0" step="10" value={minPriceMonthly} onChange={(e) => setMinPriceMonthly(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">AI Dinamično određivanje cijena</p>
                    <p className="text-xs text-gray-400">Kalkulacija cijene za maksimalnu zaradu</p>
                  </div>
                  <Toggle checked={useAIDynamicPricing} onChange={setUseAIDynamicPricing} />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Blagajna Dodaci" defaultOpen={false}>
              <p className="text-xs text-gray-600 mb-4">Odaberite što svaki od 3 gumba na checkout stranici nudi kupcu.</p>
              <div className="grid grid-cols-3 gap-3">
                {([0, 1, 2] as const).map((idx) => {
                  const slot = checkoutSlots?.[idx] || { type: 'hour', value: idx + 1 };
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
                      <label className={labelClass}>Widget {idx + 1}</label>
                      <select
                        value={currentVal}
                        onChange={(e) => {
                          const [type, value] = e.target.value.split(':');
                          const updated = [...(checkoutSlots || [{ type: 'hour', value: 1 }, { type: 'hour', value: 2 }, { type: 'hour', value: 3 }])];
                          updated[idx] = { type: type as 'hour' | 'vrsta', value: type === 'hour' ? Number(value) : value };
                          setCheckoutSlots(updated);
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

            <CollapsibleSection title="Fotografije (Neobavezno)" defaultOpen={false}>
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-black mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-violet-600 flex-shrink-0" /> Povećajte konverzije</p>
                <p className="text-xs text-black leading-relaxed">Ogledni parkingi s fotografijama imaju 33-72% veće stope konverzije. Preporučujemo dodavanje 3-5 kvalitetnih fotografija vašeg parking mjesta.</p>
              </div>

              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
                  onClick={() => document.getElementById('photo-input')?.click()}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Kliknite za upload ili prevucite fotografije</p>
                  <p className="text-xs text-gray-500">JPG, PNG, max 5MB po datoteci</p>
                  <input
                    id="photo-input"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files || []);
                      setPhotos([...photos, ...files].slice(0, 10));
                    }}
                    className="hidden"
                  />
                </div>

                {(existingPhotos.length > 0 || photos.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {existingPhotos.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative group">
                        <img src={url} alt={`Fotografija ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => setExistingPhotos(existingPhotos.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {photos.map((photo, idx) => (
                      <div key={`new-${idx}`} className="relative group">
                        <img src={URL.createObjectURL(photo)} alt={`Nova fotografija ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-lg font-bold text-base text-white disabled:opacity-60 transition-opacity shadow-sm bg-gray-900 hover:bg-gray-800">
              {saving ? 'Sprema...' : 'Spremi'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-lg font-bold text-base border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors">
              Otkaži
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
