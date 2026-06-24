'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, ChevronDown, ChevronUp, Clock, X, Info } from 'lucide-react';
import { PayparqPageHeader } from '@/components/PayparqPageHeader';
import { AmenitiesChips } from '@/components/AmenitiesChips';
import { useLocale } from '@/components/LocaleProvider';

const EDIT_T: Record<string, { en: string; hr: string }> = {
  'Loading map...': { en: 'Loading map...', hr: 'Učitavanje karte...' },
  'Use current location': { en: 'Use current location', hr: 'Koristi trenutnu lokaciju' },
  'Loading...': { en: 'Loading...', hr: 'Učitavanje...' },
  'Edit listing': { en: 'Edit listing', hr: 'Uredi popis' },
  'Lot info': { en: 'Lot info', hr: 'Podaci o lotu' },
  'Name': { en: 'Name', hr: 'Naziv' },
  'Address': { en: 'Address', hr: 'Adresa' },
  'Parking specifics': { en: 'Parking specifics', hr: 'Specifičnosti parkinga' },
  'Things to know': { en: 'Things to know', hr: 'Stvari koje biste trebali znati' },
  'Access type': { en: 'Access type', hr: 'Vrsta Pristupa' },
  'Gate/Barrier': { en: 'Gate/Barrier', hr: 'Rampa/Brana' },
  'No barrier': { en: 'No barrier', hr: 'Bez Rampe' },
  'Reception/Guard': { en: 'Reception/Guard', hr: 'Recepcija/Čuvar' },
  'Phone (emergency / booking)': { en: 'Phone (emergency / booking)', hr: 'Telefon (hitni slučaj / rezervacija)' },
  'Parking type': { en: 'Parking type', hr: 'Vrsta parkinga' },
  'Lot': { en: 'Lot', hr: 'Parcela' },
  'Garage': { en: 'Garage', hr: 'Garaža' },
  'Valet': { en: 'Valet', hr: 'Valet' },
  'Parking': { en: 'Parking', hr: 'Parking' },
  'Height limit (m)': { en: 'Height limit (m)', hr: 'Ograničenje visine (m)' },
  'Width limit (m)': { en: 'Width limit (m)', hr: 'Ograničenje širine (m)' },
  'Exotic vehicles': { en: 'Exotic vehicles', hr: 'Egzotična vozila' },
  'Yes': { en: 'Yes', hr: 'Da' },
  'No': { en: 'No', hr: 'Ne' },
  'On request': { en: 'On request', hr: 'Na upit' },
  'Owner comment': { en: 'Owner comment', hr: 'Komentar Vlasnika' },
  'Access instructions': { en: 'Access instructions', hr: 'Upute za pristup' },
  'Shown to driver after booking and in mobile scanner.': { en: 'Shown to driver after booking and in mobile scanner.', hr: 'Prikazuje se vozaču nakon rezervacije i u mobilnom skeneru.' },
  'Amenities': { en: 'Amenities', hr: 'Dodaci' },
  'Working hours (Access hours)': { en: 'Working hours (Access hours)', hr: 'Radno Vrijeme (Pristupno vrijeme)' },
  'Open all day': { en: 'Open all day', hr: 'Otvoreno cijelo vrijeme' },
  'Days': { en: 'Days', hr: 'Dani' },
  'From': { en: 'From', hr: 'Od' },
  'To': { en: 'To', hr: 'Kraj' },
  'Capacity': { en: 'Capacity', hr: 'Kapacitet' },
  'Number of spots': { en: 'Number of spots', hr: 'Broj mjesta' },
  'Spot types': { en: 'Spot types', hr: 'Vrsta mjesta' },
  'Differentiate spot categories': { en: 'Differentiate spot categories with a standard price multiplier', hr: 'Razlikujte kategoriju mjesta — odaberite koje ćete smjestiti uz množitelj standardne cijene' },
  'Pricing': { en: 'Pricing', hr: 'Cijena' },
  'Standard': { en: 'Standard', hr: 'Standard' },
  'Hourly (€/h)': { en: 'Hourly (€/h)', hr: 'Satna (€/h)' },
  'Daily (€/day)': { en: 'Daily (€/day)', hr: 'Dnevna (€/dan)' },
  'Monthly (€/mo)': { en: 'Monthly (€/mo)', hr: 'Mjesečna (€/mj)' },
  'Minimum prices you will accept': { en: 'Minimum prices you will accept', hr: 'Minimalne cijene koje ćete prihvatiti' },
  'AI Dynamic pricing': { en: 'AI Dynamic pricing', hr: 'AI Dinamično određivanje cijena' },
  'Price calculation for maximum earnings': { en: 'Price calculation for maximum earnings', hr: 'Kalkulacija cijene za maksimalnu zaradu' },
  'Checkout add-ons': { en: 'Checkout add-ons', hr: 'Blagajna Dodaci' },
  'Select what each of 3 buttons on checkout offers the customer.': { en: 'Select what each of 3 buttons on checkout offers the customer.', hr: 'Odaberite što svaki od 3 gumba na checkout stranici nudi kupcu.' },
  'Photos (Optional)': { en: 'Photos (Optional)', hr: 'Fotografije (Neobavezno)' },
  'Boost conversions': { en: 'Boost conversions', hr: 'Povećajte konverzije' },
  'Listings with photos have 33-72% higher conversion rates.': { en: 'Listings with photos have 33-72% higher conversion rates. We recommend adding 3-5 quality photos.', hr: 'Ogledni parkingi s fotografijama imaju 33-72% veće stope konverzije. Preporučujemo dodavanje 3-5 kvalitetnih fotografija vašeg parking mjesta.' },
  'Click to upload or drag photos': { en: 'Click to upload or drag photos', hr: 'Kliknite za upload ili prevucite fotografije' },
  'JPG, PNG, max 5MB per file': { en: 'JPG, PNG, max 5MB per file', hr: 'JPG, PNG, max 5MB po datoteci' },
  'Photo': { en: 'Photo', hr: 'Fotografija' },
  'New photo': { en: 'New photo', hr: 'Nova fotografija' },
  'Save': { en: 'Save', hr: 'Spremi' },
  'Saving...': { en: 'Saving...', hr: 'Sprema...' },
  'Cancel': { en: 'Cancel', hr: 'Otkaži' },
  'Oversized vehicle (XXL)': { en: 'Oversized vehicle (XXL)', hr: 'Preveliko vozilo (XXL)' },
  'Premium (Shade, Entrance, Garage)': { en: 'Premium (Shade, Entrance, Garage)', hr: 'Premium (Sjena, Ulaz, Garaža)' },
  'Camper': { en: 'Camper', hr: 'Kamper' },
  'Bus': { en: 'Bus', hr: 'Bus' },
  'VIP Valet (All included)': { en: 'VIP Valet (All included)', hr: 'VIP Valet (Sve uključeno)' },
  'Unlimited charging/washing, Red carpet': { en: 'Unlimited charging/washing, Red carpet', hr: 'Neograničeno punjenje/pranje, Crveni tepih' },
  'Late checkout': { en: 'Late checkout', hr: 'Kasni odlazak' },
  'EV charging': { en: 'EV charging', hr: 'EV punjenje' },
  'Fueling': { en: 'Fueling', hr: 'Pretakanje' },
  'Wash': { en: 'Wash', hr: 'Pranje' },
  'Covered': { en: 'Covered', hr: 'Natkriveno' },
  'Barrier': { en: 'Barrier', hr: 'Rampa/Brana' },
  'CCTV': { en: 'CCTV', hr: 'CCTV' },
  'Disabled access': { en: 'Disabled access', hr: 'Pristup invalidima' },
  'Staff': { en: 'Staff', hr: 'Osoblje' },
  'Shuttle service': { en: 'Shuttle service', hr: 'Shuttle servis' },
  'Monday': { en: 'Mon', hr: 'Po' },
  'Tuesday': { en: 'Tue', hr: 'U' },
  'Wednesday': { en: 'Wed', hr: 'Sr' },
  'Thursday': { en: 'Thu', hr: 'Č' },
  'Friday': { en: 'Fri', hr: 'Pe' },
  'Saturday': { en: 'Sat', hr: 'Su' },
  'Sunday': { en: 'Sun', hr: 'Ne' },
};
const et = (key: string, locale: 'en' | 'hr') => EDIT_T[key]?.[locale] ?? key;

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
            <span className="text-xs text-gray-400">Loading map...</span>
          </div>
        )}
      </div>
      <button type="button" onClick={useCurrentLocation} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
        <Navigation className="w-3 h-3" />Use current location
      </button>
    </div>
  );
}

const ADDON_KEYS = ['Valet', 'EV charging', 'Fueling', 'Wash', 'Covered', 'Barrier', 'CCTV', 'Disabled access', 'Staff', 'Garage', 'Shuttle service'];
const SPOT_TYPE_KEYS = [
  { key: 'standard_xxl', labelKey: 'Oversized vehicle (XXL)', mult: '1.25×' },
  { key: 'premium', labelKey: 'Premium (Shade, Entrance, Garage)', mult: '1.5×' },
  { key: 'kamper', labelKey: 'Camper', mult: '2×' },
  { key: 'bus', labelKey: 'Bus', mult: '5×' },
  { key: 'valet', labelKey: 'Valet', mult: '2×' },
  { key: 'vip_valet', labelKey: 'VIP Valet (All included)', mult: '2.5–5×', descKey: 'Unlimited charging/washing, Red carpet' },
  { key: 'late_checkout', labelKey: 'Late checkout', mult: '½ day' },
];

// ─── Main form ────────────────────────────────────────────────────────────────

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
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
  const [openDays, setOpenDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
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

  const [tieredDailyEnabled, setTieredDailyEnabled] = useState(false);
  const [tieredDailyRates, setTieredDailyRates] = useState<string[]>(['', '']);
  const [tieredDailyIncrement, setTieredDailyIncrement] = useState('');

  // Feature 1: Personal Branding
  const [personalBrandingEnabled, setPersonalBrandingEnabled] = useState(false);

  // Feature 2: Shuttle/Valet Info
  const [shuttleValetInfo, setShuttleValetInfo] = useState('');

  // Feature 3: Free Cancellation
  const [freeCancellationEnabled, setFreeCancellationEnabled] = useState(false);
  const [freeCancellationDays, setFreeCancellationDays] = useState('');

  // Feature 4: Payment Method Mode
  const [paymentMethodMode, setPaymentMethodMode] = useState<'online' | 'ticketing_only'>('online');

  // Feature 5: Airport Lot
  const [airportLotEnabled, setAirportLotEnabled] = useState(false);

  // Feature 6: Key Management
  const [keyManagementMode, setKeyManagementMode] = useState<'operator_keeps' | 'customer_keeps'>('operator_keeps');

  // Feature 7: Show How It Works
  const [showHowItWorksEnabled, setShowHowItWorksEnabled] = useState(true);

  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string>('');

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
      // Use API route (supabaseAdmin) so RLS cannot block reading verification_metadata
      const res = await fetch(`/api/listings/${id}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const { location: data } = await res.json();

      if (!data) {
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
      const savedDays = meta.openDays || meta.daysAvailable || [];
      const dayMapping: Record<string, string> = { 'Pon': 'Monday', 'Uto': 'Tuesday', 'Sri': 'Wednesday', 'Čet': 'Thursday', 'Pet': 'Friday', 'Sub': 'Saturday', 'Ned': 'Sunday', 'Ponedjeljak': 'Monday', 'Utorak': 'Tuesday', 'Srijeda': 'Wednesday', 'Četvrtak': 'Thursday', 'Petak': 'Friday', 'Subota': 'Saturday', 'Nedjelja': 'Sunday' };
      const convertedDays = savedDays.map((d: string) => dayMapping[d] || d);
      setOpenDays(convertedDays.length > 0 ? convertedDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
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

      setTieredDailyEnabled(meta.tiered_daily_enabled ?? false);
      const savedRates = Array.isArray(meta.tiered_daily_rates) ? (meta.tiered_daily_rates as number[]).map(String) : ['', ''];
      setTieredDailyRates(savedRates.length >= 2 ? savedRates : ['', '']);
      setTieredDailyIncrement(meta.tiered_daily_increment ? String(meta.tiered_daily_increment) : '');

      // Feature 1: Personal Branding
      setPersonalBrandingEnabled(meta.personal_branding_enabled ?? false);

      // Feature 2: Shuttle/Valet Info
      setShuttleValetInfo(meta.shuttle_valet_info ?? '');

      // Feature 3: Free Cancellation
      setFreeCancellationEnabled(meta.free_cancellation_enabled ?? false);
      setFreeCancellationDays(meta.free_cancellation_days ? String(meta.free_cancellation_days) : '');

      // Feature 4: Payment Method Mode — accept all legacy values
      const TICKETING_ONLY_VALUES = ['ticketing_only', 'pay_on_arrival', 'samo izdavanje karata'];
      const isTicketingOnly = TICKETING_ONLY_VALUES.includes(meta.payment_method_mode);
      setPaymentMethodMode(isTicketingOnly ? 'ticketing_only' : 'online');

      // Feature 5: Airport Lot
      setAirportLotEnabled(meta.airport_lot_enabled ?? false);

      // Feature 6: Key Management
      setKeyManagementMode(meta.key_management_mode ?? 'operator_keeps');

      // Feature 7: Show How It Works
      setShowHowItWorksEnabled(meta.show_how_it_works_enabled ?? true);

      setExistingPhotos(data.verification_photos || []);
      setExistingLogoUrl(data.logo_url || '');
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
    setSaving(true);
    try {
      const photoUrls: string[] = [...existingPhotos];
      let logoUrl = existingLogoUrl;

      if (supabase) {
        // Upload new photos
        for (const photo of photos) {
          if (photo instanceof File) {
            const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('locations')
              .upload(fileName, photo);
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage.from('locations').getPublicUrl(fileName);
              photoUrls.push(publicUrl);
            }
          }
        }
        // Upload logo
        if (logoFile) {
          const logoFileName = `${id}/logo-${Date.now()}.jpg`;
          const { error: logoError } = await supabase.storage.from('locations').upload(logoFileName, logoFile);
          if (!logoError) {
            const { data: { publicUrl } } = supabase.storage.from('locations').getPublicUrl(logoFileName);
            logoUrl = publicUrl;
          }
        }
      }

      // Save via PATCH API (uses supabaseAdmin server-side so RLS cannot block the read
      // of existing verification_metadata — this ensures dateConfigs and other calendar
      // overrides stored there are preserved in the merge)
      const reverseMapping: Record<string, string> = { 'Monday': 'Pon', 'Tuesday': 'Uto', 'Wednesday': 'Sri', 'Thursday': 'Čet', 'Friday': 'Pet', 'Saturday': 'Sub', 'Sunday': 'Ned' };
      const abbreviatedDays = openDays.map(d => reverseMapping[d] || d);

      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lotName,
          address,
          latitude: pin ? pin.lat : null,
          longitude: pin ? pin.lng : null,
          base_price_hourly: standardHourlyPrice ? parseFloat(standardHourlyPrice) : null,
          base_price_daily: standardDailyPrice ? parseFloat(standardDailyPrice) : null,
          base_price_monthly: standardMonthlyPrice ? parseFloat(standardMonthlyPrice) : null,
          rate_per_hour: standardHourlyPrice ? parseFloat(standardHourlyPrice) : null,
          verification_photos: photoUrls.length > 0 ? photoUrls : null,
          logo_url: logoUrl || null,
          verification_metadata: {
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
            things_to_know: ownerComment,
            accessInstructions,
            addons,
            features: addons,
            shuttle_enabled: addons.includes('Shuttle service') || addons.includes('Shuttle'),
            is247,
            available24_7: is247,
            openDays: abbreviatedDays,
            daysAvailable: abbreviatedDays,
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
            tiered_daily_enabled: tieredDailyEnabled,
            tiered_daily_rates: tieredDailyEnabled ? tieredDailyRates.map((r) => parseFloat(r)).filter((v) => v > 0) : null,
            tiered_daily_increment: tieredDailyEnabled ? (tieredDailyIncrement ? parseFloat(tieredDailyIncrement) : null) : null,
            // Feature 1: Personal Branding
            personal_branding_enabled: personalBrandingEnabled,
            // Feature 2: Shuttle/Valet Info
            shuttle_valet_info: shuttleValetInfo || null,
            // Feature 3: Free Cancellation
            free_cancellation_enabled: freeCancellationEnabled,
            free_cancellation_days: freeCancellationEnabled ? (freeCancellationDays ? parseFloat(freeCancellationDays) : null) : null,
            // Feature 4: Payment Method Mode
            payment_method_mode: paymentMethodMode,
            // Feature 5: Airport Lot
            airport_lot_enabled: airportLotEnabled,
            // Feature 6: Key Management
            key_management_mode: keyManagementMode,
            // Feature 7: Show How It Works
            show_how_it_works_enabled: showHowItWorksEnabled,
          },
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(error);
      }

      await res.json();

      // Reload data from database to reflect saved changes
      await loadListing();

      // Reset new photos since they've been uploaded
      setPhotos([]);

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
          <p className="text-gray-600 text-sm">{et('Loading...', locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PayparqPageHeader title={et('Edit listing', locale)} onBack={() => router.back()} lineColor="black" />

      {success && (
        <div className="fixed top-20 left-4 right-4 max-w-sm p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm z-40">
          ✓ Listing updated successfully
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form className="space-y-4">

          {/* ── Section 1: Lot Info ── */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{et('Lot info', locale)}</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>{et('Name', locale)}</label>
                <input type="text" placeholder="e.g. Parking Center Zagreb" value={lotName} onChange={(e) => setLotName(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>{et('Address', locale)}</label>
                <AddressMapField address={address} onAddressChange={setAddress} pin={pin} onPinChange={setPin} onRegionDetect={(r) => r && setRegion(r)} isLoaded={isLoaded} />
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass}>{locale === 'en' ? 'Personal branding' : 'Osobno branding'}</label>
                  <Toggle checked={personalBrandingEnabled} onChange={setPersonalBrandingEnabled} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Lot Specifics ── */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{et('Parking specifics', locale)}</p>

            <CollapsibleSection title={et('Things to know', locale)} defaultOpen={false}>
              <div>
                <label className={labelClass}>{et('Access type', locale)}</label>
                <div className="flex gap-2 flex-wrap">
                  {(['Gate/Barrier', 'No barrier', 'Reception/Guard'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setAccessType(k)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${accessType === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                      {et(k, locale)}
                    </button>
                  ))}
                </div>
                {accessType === 'Gate/Barrier' && (
                  <div className="mt-2">
                    <label className={subLabelClass}>{et('Phone (emergency / booking)', locale)}</label>
                    <input type="tel" placeholder="+385 91 000 0000" value={gatedPhone} onChange={(e) => setGatedPhone(e.target.value)} className={inputClass} />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>{et('Parking type', locale)}</label>
                <div className="flex gap-2 flex-wrap">
                  {(['Lot', 'Garage', 'Valet', 'Parking'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setParkingType(k)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${parkingType === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                      {et(k, locale)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>{et('Height limit (m)', locale)}</label>
                  <input type="text" placeholder="e.g. 2.10" value={heightLimit} onChange={(e) => setHeightLimit(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{et('Width limit (m)', locale)}</label>
                  <input type="text" placeholder="e.g. 2.20" value={widthLimit} onChange={(e) => setWidthLimit(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>{et('Exotic vehicles', locale)}</label>
                <div className="flex gap-2">
                  {(['Yes', 'No', 'On request'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setExoticVehicles(k)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${exoticVehicles === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                      {et(k, locale)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{et('Owner comment', locale)}</label>
                <textarea placeholder={locale === 'en' ? 'e.g. Parking is protected 24/7 by CCTV...' : 'npr. Parking je zaštićen 24/7 video nadzorom...'} value={ownerComment} onChange={(e) => setOwnerComment(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors resize-none" />
              </div>

              <div>
                <label className={labelClass}>{et('Access instructions', locale)}</label>
                <textarea placeholder={locale === 'en' ? 'e.g. Enter from King Tomislav Street...' : 'npr. Uđite s Ulice kralja Tomislava...'} value={accessInstructions} onChange={(e) => setAccessInstructions(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors resize-none" />
                <p className="text-xs text-gray-400 mt-1">{et('Shown to driver after booking and in mobile scanner.', locale)}</p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={et('Amenities', locale)} defaultOpen={false}>
              <div className="flex flex-wrap gap-2">
                {ADDON_KEYS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAddon(a)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${addons.includes(a) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                    {et(a, locale)}
                  </button>
                ))}
              </div>
              {(addons.includes('Shuttle') || addons.includes('Valet')) && (
                <div className="pt-3 border-t border-gray-200 mt-3">
                  <label className={labelClass}>{locale === 'en' ? 'Shuttle/Valet service information' : 'Informacije o Shuttle/Valet uslugama'}</label>
                  <textarea
                    placeholder={locale === 'en' ? 'Enter instructions or details for your shuttle/valet service' : 'Unesite upute ili detalje o vašoj shuttle/valet usluzi'}
                    value={shuttleValetInfo}
                    onChange={(e) => setShuttleValetInfo(e.target.value)}
                    className={`${inputClass} resize-none`}
                    rows={3}
                  />
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection title={et('Working hours (Access hours)', locale)} defaultOpen={false}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-800">24/7</p>
                  <p className="text-xs text-gray-400">{et('Open all day', locale)}</p>
                </div>
                <Toggle checked={is247} onChange={setIs247} />
              </div>

              {!is247 && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className={subLabelClass}>{et('Days', locale)}</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map((day) => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`w-10 h-8 rounded text-xs font-bold border transition-colors ${openDays.includes(day) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'}`}>
                          {et(day, locale)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={subLabelClass}>{et('From', locale)}</label>
                      <input type="time" value={hoursFrom} onChange={(e) => setHoursFrom(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={subLabelClass}>{et('To', locale)}</label>
                      <input type="time" value={hoursTo} onChange={(e) => setHoursTo(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection title={et('Capacity', locale)} defaultOpen={false}>
              <div>
                <label className={labelClass}>{et('Number of spots', locale)}</label>
                <input type="number" placeholder="10" min="1" value={baseSpots} onChange={(e) => setBaseSpots(e.target.value)} className={inputClass} required />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={et('Spot types', locale)} defaultOpen={false}>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">{et('Differentiate spot categories', locale)}</p>
              <div className="space-y-2">
                {SPOT_TYPE_KEYS.map((st) => (
                  <div key={st.key} onClick={() => toggleSpotType(st.key)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${activeSpotTypes.includes(st.key) ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{et(st.labelKey, locale)}</p>
                      {st.descKey && <p className="text-xs text-gray-400 mt-0.5">{et(st.descKey, locale)}</p>}
                    </div>
                    <span className={`text-xs font-bold ml-3 flex-shrink-0 ${activeSpotTypes.includes(st.key) ? 'text-gray-900' : 'text-gray-400'}`}>{st.mult}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={et('Pricing', locale)} defaultOpen={false}>
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">{et('Standard', locale)}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>{et('Hourly (€/h)', locale)}</label>
                    <input type="number" placeholder="2.50" min="0" step="0.50" value={standardHourlyPrice} onChange={(e) => setStandardHourlyPrice(e.target.value)} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>{et('Daily (€/day)', locale)}</label>
                    <input type="number" placeholder="15.00" min="0" step="0.50" value={standardDailyPrice} onChange={(e) => setStandardDailyPrice(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{et('Monthly (€/mo)', locale)}</label>
                    <input type="number" placeholder="300.00" min="0" step="10" value={standardMonthlyPrice} onChange={(e) => setStandardMonthlyPrice(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Tiered Daily Pricing */}
              <div className="space-y-4 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">{locale === 'en' ? 'Tiered Daily Pricing' : 'Višerazinska dnevna cijena'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{locale === 'en' ? 'Set a price for each day, then a fixed increment after' : 'Postavite cijenu za svaki dan, zatim fiksni prirast'}</p>
                  </div>
                  <Toggle checked={tieredDailyEnabled} onChange={setTieredDailyEnabled} />
                </div>
                {tieredDailyEnabled && (
                  <div className="space-y-2">
                    {tieredDailyRates.map((rate, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-14 flex-shrink-0">{locale === 'en' ? `Day ${i + 1}` : `${i + 1}. dan`}</span>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.50"
                          value={rate}
                          onChange={(e) => {
                            const updated = [...tieredDailyRates];
                            updated[i] = e.target.value;
                            setTieredDailyRates(updated);
                          }}
                          className={inputClass}
                        />
                        {tieredDailyRates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTieredDailyRates(tieredDailyRates.filter((_, idx) => idx !== i))}
                            className="text-gray-400 hover:text-red-500 text-lg leading-none flex-shrink-0"
                          >×</button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTieredDailyRates([...tieredDailyRates, ''])}
                      className="text-xs text-black font-medium hover:underline mt-1"
                    >+ {locale === 'en' ? 'Add day' : 'Dodaj dan'}</button>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                      <span className="text-xs text-gray-500 w-14 flex-shrink-0">{locale === 'en' ? 'Each day after' : 'Svaki sljedeći'}</span>
                      <input
                        type="number"
                        placeholder="5"
                        min="0"
                        step="0.50"
                        value={tieredDailyIncrement}
                        onChange={(e) => setTieredDailyIncrement(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Feature 3: Free Cancellation */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{locale === 'en' ? 'Free cancellation policy' : 'Politika besplatnog otkazivanja'}</p>
                    <p className="text-xs text-gray-400">{locale === 'en' ? 'Allow free cancellation up to X days before arrival' : 'Dozvoli besplatnu otkaznu do X dana prije dolaska'}</p>
                  </div>
                  <Toggle checked={freeCancellationEnabled} onChange={setFreeCancellationEnabled} />
                </div>
                {freeCancellationEnabled && (
                  <div>
                    <label className={labelClass}>{locale === 'en' ? 'Days before arrival' : 'Dana prije dolaska'}</label>
                    <input
                      type="number"
                      placeholder="7"
                      min="0"
                      value={freeCancellationDays}
                      onChange={(e) => setFreeCancellationDays(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* Feature 4: Payment Method Mode */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-800 block mb-2">{locale === 'en' ? 'Payment Method' : 'Metoda Plaćanja'}</label>
                  <select
                    value={paymentMethodMode}
                    onChange={(e) => setPaymentMethodMode(e.target.value as 'online' | 'ticketing_only')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="online">{locale === 'en' ? 'Online payment only' : 'Samo online plaćanje'}</option>
                    <option value="ticketing_only">{locale === 'en' ? 'Pay on Arrival' : 'Plaćanje pri dolasku'}</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-2">
                    {paymentMethodMode === 'online' && (locale === 'en' ? 'Customers pay full price at checkout' : 'Kupci plaćaju punu cijenu pri kupnji')}
                    {paymentMethodMode === 'ticketing_only' && (locale === 'en' ? 'Customers pay authorization hold at checkout, full price when they arrive' : 'Kupci plaćaju autorizacijsku rezervu pri kupnji, punu cijenu pri dolasku')}
                  </p>
                </div>
              </div>

              {/* Feature 5: Airport Lot */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{locale === 'en' ? 'Airport Lot' : 'Parking pri Zračnoj Luci'}</p>
                    <p className="text-xs text-gray-400">{locale === 'en' ? 'Add dynamic airport surcharge (0.99€ + 3% of total)' : 'Dodaj dinamičku naknadu za parking (0.99€ + 3% ukupno)'}</p>
                  </div>
                  <Toggle checked={airportLotEnabled} onChange={setAirportLotEnabled} />
                </div>
              </div>

              {/* Feature 6: Key Management */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-800 block mb-2">{locale === 'en' ? 'Key Management' : 'Upravljanje ključevima'}</label>
                  <select
                    value={keyManagementMode}
                    onChange={(e) => setKeyManagementMode(e.target.value as 'operator_keeps' | 'customer_keeps')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="operator_keeps">{locale === 'en' ? 'Keep Keys' : 'Zadrži ključeve'}</option>
                    <option value="customer_keeps">{locale === 'en' ? 'Give Keys' : 'Daješ ključeve'}</option>
                  </select>
                </div>
              </div>

              {/* Feature 7: Show How It Works */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{locale === 'en' ? 'Show Instructions' : 'Prikaži Kako radi'}</p>
                    <p className="text-xs text-gray-400">{locale === 'en' ? 'Display parking instructions in search' : 'Prikaži upute u rezultatima pretrage'}</p>
                  </div>
                  <Toggle checked={showHowItWorksEnabled} onChange={setShowHowItWorksEnabled} />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">{et('Minimum prices you will accept', locale)}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>{et('Hourly (€/h)', locale)}</label>
                    <input type="number" placeholder="1.00" min="0" step="0.10" value={minPriceHourly} onChange={(e) => setMinPriceHourly(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{et('Daily (€/day)', locale)}</label>
                    <input type="number" placeholder="5.00" min="0" step="0.10" value={minPriceDaily} onChange={(e) => setMinPriceDaily(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{et('Monthly (€/mo)', locale)}</label>
                    <input type="number" placeholder="100.00" min="0" step="10" value={minPriceMonthly} onChange={(e) => setMinPriceMonthly(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{et('AI Dynamic pricing', locale)}</p>
                    <p className="text-xs text-gray-400">{et('Price calculation for maximum earnings', locale)}</p>
                  </div>
                  <Toggle checked={useAIDynamicPricing} onChange={setUseAIDynamicPricing} />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={et('Checkout add-ons', locale)} defaultOpen={false}>
              <p className="text-xs text-gray-600 mb-4">{et('Select what each of 3 buttons on checkout offers the customer.', locale)}</p>
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

            <CollapsibleSection title={et('Photos (Optional)', locale)} defaultOpen={false}>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-black mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-blue-600 flex-shrink-0" /> {et('Boost conversions', locale)}</p>
                <p className="text-xs text-black leading-relaxed">{et('Listings with photos have 33-72% higher conversion rates.', locale)}</p>
              </div>

              {/* Logo upload */}
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 mb-2">Logo / Brand Image</p>
                <p className="text-xs text-gray-500 mb-3">Shown in search results as your lot's brand identity. Square image recommended.</p>
                <div className="flex items-center gap-4">
                  {(logoFile || existingLogoUrl) && (
                    <div className="relative">
                      <img
                        src={logoFile ? URL.createObjectURL(logoFile) : existingLogoUrl}
                        alt="Logo"
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                      />
                      <button type="button" onClick={() => { setLogoFile(null); setExistingLogoUrl(''); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                    </div>
                  )}
                  <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-600 hover:border-violet-400 transition-colors">
                    {logoFile || existingLogoUrl ? 'Change logo' : 'Upload logo'}
                    <input type="file" accept="image/jpeg,image/png" className="hidden"
                      onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) setLogoFile(f); }} />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
                  onClick={() => document.getElementById('photo-input')?.click()}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">{et('Click to upload or drag photos', locale)}</p>
                  <p className="text-xs text-gray-500">{et('JPG, PNG, max 5MB per file', locale)}</p>
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
                        <img src={url} alt={`${et('Photo', locale)} ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
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
                        <img src={URL.createObjectURL(photo)} alt={`${et('New photo', locale)} ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
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
              {saving ? et('Saving...', locale) : et('Save', locale)}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 rounded-lg font-bold text-base border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors">
              {et('Cancel', locale)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
