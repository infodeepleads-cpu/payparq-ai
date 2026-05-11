'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Lock, CheckCircle, MapPin, Navigation, ChevronDown, ChevronUp, Clock, X, Info } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

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

// ─── Left info panel ──────────────────────────────────────────────────────────

function InfoPanel() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 sticky top-8 p-6 space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">Oglasi svoje parkirno mjesto</p>
        <p className="text-xs text-gray-500">Zarađujte iznajmljivanjem svog neiskorištenog parkirnog mjesta vozačima u vašoj okolini.</p>
      </div>
      <div className="border-t border-gray-100 pt-6 space-y-4">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Kako funkcionira</p>
        <div className="space-y-3">
          {[
            { n: '1', title: 'Unesite podatke', desc: 'Ispunite kontakt podatke i informacije o lotu.' },
            { n: '2', title: 'Pregledavamo oglas', desc: 'Naš tim verificira vaš prostor unutar 24 sata.' },
            { n: '3', title: 'Počnite zarađivati', desc: 'Vaš lot postaje aktivan i vozači mogu rezervirati.' },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">{step.n}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-100 pt-6">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">Procjena zarade</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-gray-700"><span>Prosj. raspon satne cijene</span><span className="font-medium">€0.5 – €4.00</span></div>
          <div className="flex justify-between text-gray-700"><span>Prosj. raspon dnevne cijene</span><span className="font-medium">€5 – €30</span></div>
          <div className="flex justify-between text-gray-900 font-bold pt-2 border-t border-gray-100"><span>Prosj. raspon mjesečne cijene</span><span>€29 – €440</span></div>
        </div>
      </div>
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

// ─── Special term row ─────────────────────────────────────────────────────────


// ─── Calendar scheduler (from LotCalendarPricing) ──────────────────────────────

interface DateConfig {
  date: string;
  capacity: number | null;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  priceMode: 'auto' | 'manual';
  priceHourly: number | null;
  priceDaily: number | null;
  priceMonthly: number | null;
}

function CalendarScheduler({ baseSpots, onConfigsChange }: { baseSpots: string; onConfigsChange?: (configs: Record<string, DateConfig>) => void }) {
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 4, 1));
  const [dateConfigs, setDateConfigs] = useState<Record<string, DateConfig>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const croatianMonths = ['siječnja','veljače','ožujka','travnja','svibnja','lipnja','srpnja','kolovoza','rujna','listopada','studenog','prosinca'];
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const emptyBefore = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const getDateString = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDateConfig = (dateStr: string): DateConfig => {
    return dateConfigs[dateStr] || {
      date: dateStr,
      capacity: baseSpots ? parseInt(baseSpots) : 1,
      isOpen: true,
      openTime: '00:00',
      closeTime: '23:59',
      priceMode: 'auto',
      priceHourly: null,
      priceDaily: null,
      priceMonthly: null,
    };
  };

  const handleDateClick = (day: number) => setSelectedDate(getDateString(day));
  const handleSaveDate = (config: DateConfig) => {
    setDateConfigs((prev) => {
      const next = { ...prev, [config.date]: config };
      onConfigsChange?.(next);
      return next;
    });
    setSelectedDate(null);
  };
  const handleCloseDate = (dateStr: string) => {
    setDateConfigs((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      onConfigsChange?.(next);
      return next;
    });
    setSelectedDate(null);
  };

  const selectedDateConfig = selectedDate ? getDateConfig(selectedDate) : null;
  const selectedDay = selectedDate ? parseInt(selectedDate.split('-')[2]) : null;

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900" translate="no"
        >← Prethodna</button>
        <h3 className="text-sm font-semibold text-gray-900" translate="no">{croatianMonths[month]} {year}</h3>
        <button
          type="button"
          onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900" translate="no"
        >Dalje →</button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="grid grid-cols-7 gap-1.5">
          {['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'].map((day) => (
            <div key={day} className="text-center font-semibold text-xs text-gray-700 py-2" translate="no">{day}</div>
          ))}
          {[...Array(emptyBefore)].map((_, i) => (
            <div key={`empty-${i}`}></div>
          ))}
          {[...Array(daysInMonth)].map((_, i) => {
            const date = i + 1;
            const dateStr = getDateString(date);
            const config = dateConfigs[dateStr];
            const isSelected = selectedDate === dateStr;
            const isClosed = config && !config.isOpen;
            const displayCapacity = config?.capacity || baseSpots;
            const dayOfWeek = new Date(year, month, date).toLocaleDateString('hr-HR', { weekday: 'short' });

            return (
              <button
                key={date}
                type="button"
                onClick={() => handleDateClick(date)}
                className={`min-h-[75px] border-2 rounded-lg p-2 flex flex-col items-start justify-start text-left transition-all cursor-pointer text-[10px] font-medium pt-1 ${
                  isClosed
                    ? 'border-black bg-gradient-to-br from-black to-black/80 hover:from-black/90 hover:to-black/70 text-white shadow-lg'
                    : isSelected
                    ? 'border-gray-900 bg-gray-100 hover:bg-gray-200 text-gray-900'
                    : config
                    ? 'border-gray-900 bg-gray-50 hover:bg-gray-100 text-gray-900'
                    : 'border-gray-300 bg-white hover:border-gray-500 text-gray-700'
                }`}
              >
                <p className={`font-bold text-sm ${isClosed ? 'text-white' : 'text-gray-900'} w-full text-center`}>{date}</p>
                {!isClosed && (
                  <>
                    <p className={`text-[7px] mt-0.5 font-medium w-full text-center ${isClosed ? 'text-white/80' : 'text-gray-700'}`}>
                      {displayCapacity} {parseInt(String(displayCapacity)) === 1 ? 'mjesto' : 'mjesta'}
                    </p>
                    <div className={`flex items-center gap-0.5 mt-0.5 text-[6px] w-full justify-center ${isClosed ? 'text-white/60' : 'text-gray-600'}`}>
                      <Clock className="w-2 h-2" />
                      <span>{config && config.isOpen ? `${config.openTime}-${config.closeTime}` : '00:00-23:59'}</span>
                    </div>
                    {config && config.priceMode === 'manual' && (
                      <p className="text-[7px] text-green-700 font-semibold mt-0.5 w-full text-center" translate="no">
                        ✓ {config.priceHourly ?? ''}€/h
                      </p>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info note */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-3.5 space-y-1">
        <p className="text-xs text-black font-medium flex items-center gap-2" translate="no"><Info className="w-4 h-4 text-violet-600 flex-shrink-0" /> Napomena</p>
        <p className="text-xs text-black" translate="no">Kliknite na bilo koji datum da biste zatvorili datum ili promijenili kapacitet, vrijeme i cijene. Kasnije ćete moći pristupiti kalendaru i promijeniti podatke.</p>
      </div>

      {/* Modal */}
      {selectedDateConfig && selectedDay && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{selectedDay}. {croatianMonths[month]}</h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <DateConfigWidget
              config={selectedDateConfig}
              lotCapacity={baseSpots ? parseInt(baseSpots) : 1}
              onSave={(config) => handleSaveDate(config)}
              onDelete={() => handleCloseDate(selectedDate!)}
              onCancel={() => setSelectedDate(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Date config widget ───────────────────────────────────────────────────────

function DateConfigWidget({ config, lotCapacity, onSave, onDelete, onCancel }: {
  config: DateConfig;
  lotCapacity: number;
  onSave: (config: DateConfig) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [capacity, setCapacity] = useState(config.capacity ? String(config.capacity) : '');
  const [isOpen, setIsOpen] = useState(config.isOpen);
  const [openTime, setOpenTime] = useState(config.openTime);
  const [closeTime, setCloseTime] = useState(config.closeTime);
  const [priceMode, setPriceMode] = useState<'auto' | 'manual'>(config.priceMode || 'auto');
  const [priceHourly, setPriceHourly] = useState(config.priceHourly != null ? String(config.priceHourly) : '');

  return (
    <div className="space-y-4">
      {/* Open/Close */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900" translate="no">Dostupnost</label>
        <div className="flex gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setIsOpen(v)}
              className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                (isOpen && v) || (!isOpen && !v)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
              }`}
              translate="no"
            >
              {v ? 'Otvoreno' : 'Zatvoreno'}
            </button>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900" translate="no">Kapacitet (mjesta)</label>
        <input
          type="number"
          min="1"
          max={lotCapacity}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value.replace(/^0+/, '') || '0')}
          className={inputClass}
        />
      </div>

      {/* Time Range */}
      {isOpen && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900" translate="no">Od</label>
            <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900" translate="no">Do</label>
            <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      {/* Price */}
      {isOpen && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900" translate="no">Cijena</label>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${priceMode === 'auto' ? 'text-gray-900' : 'text-gray-400'}`} translate="no">Auto</span>
              <button
                type="button"
                onClick={() => setPriceMode(priceMode === 'auto' ? 'manual' : 'auto')}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ backgroundColor: priceMode === 'manual' ? '#1f2937' : '#d1d5db' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                  style={{ transform: priceMode === 'manual' ? 'translateX(22px)' : 'translateX(2px)' }}
                />
              </button>
              <span className={`text-xs font-medium ${priceMode === 'manual' ? 'text-gray-900' : 'text-gray-400'}`} translate="no">Ručno</span>
            </div>
          </div>
          {priceMode === 'manual' && (
            <input
              type="number"
              min="0"
              step="0.10"
              value={priceHourly}
              onChange={(e) => setPriceHourly(e.target.value)}
              placeholder="2.50"
              className={inputClass}
            />
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => onSave({ ...config, capacity: parseInt(capacity) || 1, isOpen, openTime, closeTime, priceMode, priceHourly: priceMode === 'manual' ? parseFloat(priceHourly) : null })}
          className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          translate="no"
        >
          Spremi
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
          translate="no"
        >
          Zatvori
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          translate="no"
        >
          Odustani
        </button>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function HostPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GMAPS_LIBS,
  });

  // Section 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Section 2
  const [lotName, setLotName] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [parkingType, setParkingType] = useState('');
  const [region, setRegion] = useState('HR');

  // Section 3 — Stvari koje biste trebali znati
  const [accessType, setAccessType] = useState('');
  const [gatedPhone, setGatedPhone] = useState('');
  const [heightLimit, setHeightLimit] = useState('');
  const [widthLimit, setWidthLimit] = useState('');
  const [exoticVehicles, setExoticVehicles] = useState('');

  const [ownerComment, setOwnerComment] = useState('');
  const [accessInstructions, setAccessInstructions] = useState('');

  // Section 3 — Dodaci
  const ADDONS = ['Valet', 'EV punjenje', 'Pretakanje', 'Pranje', 'Natkriveno', 'Rampa/Brana', 'CCTV', 'Pristup invalidima', 'Osoblje', 'Garaža', 'Shuttle'];
  const [addons, setAddons] = useState<string[]>([]);
  const toggleAddon = (a: string) => setAddons((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  // Section 3 — Radno vrijeme
  const [is247, setIs247] = useState(true);
  const [hoursFrom, setHoursFrom] = useState('');
  const [hoursTo, setHoursTo] = useState('');
  const [openDays, setOpenDays] = useState<string[]>(['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']);
  const toggleDay = (d: string) => setOpenDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  // Section 3 — Kapacitet
  const [baseSpots, setBaseSpots] = useState('');
  const [calendarConfigs, setCalendarConfigs] = useState<Record<string, unknown>>({});

  // Section 3 — Vrsta mjesta
  const [useSpotTypes, setUseSpotTypes] = useState(true);
  const SPOT_TYPES = [
    { key: 'standard_xxl', label: 'Oversized Vehicle (XXL)', mult: '1.25×' },
    { key: 'premium', label: 'Premium (Sjena, Ulaz, Garaža)', mult: '1.5×' },
    { key: 'kamper', label: 'Kamper', mult: '2×' },
    { key: 'bus', label: 'Bus', mult: '5×' },
    { key: 'valet', label: 'Valet', mult: '2×' },
    { key: 'vip_valet', label: 'VIP Valet (All-inclusive)', mult: '2.5–5×', desc: 'Unlimited punjenje/pranje, Red Carpet' },
    { key: 'late_checkout', label: 'Late Checkout', mult: '½ dana' },
  ];
  const [activeSpotTypes, setActiveSpotTypes] = useState<string[]>([]);
  const toggleSpotType = (k: string) => setActiveSpotTypes((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);

  // Section 3 — Cijena / H-D-M
  // Pricing — Standard
  const [standardHourlyPrice, setStandardHourlyPrice] = useState('');
  const [standardDailyPrice, setStandardDailyPrice] = useState('');
  const [standardMonthlyPrice, setStandardMonthlyPrice] = useState('');

  // Dynamic Pricing
  const [useDynamicPrice, setUseDynamicPrice] = useState(true);
  const [minPriceHourly, setMinPriceHourly] = useState('');
  const [minPriceDaily, setMinPriceDaily] = useState('');
  const [minPriceMonthly, setMinPriceMonthly] = useState('');

  // Photos
  const [photos, setPhotos] = useState<File[]>([]);

  // Toggles
  const [wantQR, setWantQR] = useState(false);
  const [wantLPR, setWantLPR] = useState(false);
  const [wantHotel, setWantHotel] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    const fd = new FormData();
    // Contact
    fd.append('ownerName', name);
    fd.append('ownerEmail', email);
    fd.append('ownerPhone', phone);
    // Lot Info
    fd.append('lotName', lotName);
    fd.append('address', address);
    fd.append('latitude', pin ? String(pin.lat) : '');
    fd.append('longitude', pin ? String(pin.lng) : '');
    // Lot Specifics
    fd.append('accessType', accessType);
    fd.append('gatedPhone', gatedPhone);
    fd.append('heightLimit', heightLimit);
    fd.append('widthLimit', widthLimit);
    fd.append('exoticVehicles', exoticVehicles);
    fd.append('ownerComment', ownerComment);
    fd.append('accessInstructions', accessInstructions);
    fd.append('addons', JSON.stringify(addons));
    fd.append('is247', String(is247));
    fd.append('openDays', JSON.stringify(openDays));
    fd.append('hoursFrom', hoursFrom);
    fd.append('hoursTo', hoursTo);
    fd.append('baseSpots', baseSpots);
    fd.append('dateConfigs', JSON.stringify({}));
    fd.append('activeSpotTypes', JSON.stringify(activeSpotTypes));
    // Pricing
    fd.append('standardHourlyPrice', standardHourlyPrice);
    fd.append('standardDailyPrice', standardDailyPrice);
    fd.append('standardMonthlyPrice', standardMonthlyPrice);
    fd.append('useDynamicPrice', String(useDynamicPrice));
    fd.append('minPriceHourly', minPriceHourly);
    fd.append('minPriceDaily', minPriceDaily);
    fd.append('minPriceMonthly', minPriceMonthly);
    // Photos
    photos.forEach((photo) => fd.append('photos', photo));

    try {
      const res = await fetch('/api/host/submit', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSubmitError(json.error || 'Greška pri slanju zahtjeva.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Mrežna greška. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#020617] flex items-center justify-center border border-white/40">
                  <span className="text-sm font-black text-white">P</span>
                </div>
              </div>
              <span className="text-base font-black tracking-tight text-black">payparq</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-black text-gray-900">Lot je kreiran!</h2>
            <p className="text-sm text-gray-600">Vaš parking je vidljiv u pretrazi. Poslali smo vam link na <span className="font-semibold text-gray-900">{email}</span> za pristup vašem računu i upravljanje lotom.</p>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/members?tab=moji-prostori" className="inline-block px-6 py-3 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">
                Moji prostori
              </Link>
              <Link href="/search" className="inline-block px-6 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                Pogledaj u pretrazi
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" translate="no" data-no-translate="true">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#020617] flex items-center justify-center border border-white/40">
                <span className="text-sm font-black tracking-tight leading-none text-white">P</span>
              </div>
            </div>
            <span className="text-base font-black tracking-tight text-black">payparq</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Lock className="w-3 h-3" /><span className="font-medium">Oglasi lot</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">
          <InfoPanel />

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Section 1: Contact Info ── */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">1 — Kontakt podaci</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Ime i prezime</label>
                  <input type="text" placeholder="Ivan Horvat" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Email adresa</label>
                  <input type="email" placeholder="vi@primjer.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Telefon</label>
                  <input type="tel" placeholder="+385 91 234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* ── Section 2: Lot Info ── */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">2 — Podaci o lotu</p>
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

            {/* ── Section 3: Lot Specifics ── */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">3 — Specifičnosti lota</p>

              {/* 3.1 Stvari koje biste trebali znati */}
              <CollapsibleSection title="Stvari koje biste trebali znati">
                {/* Access Type */}
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

                {/* Parking Type */}
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


                {/* Height / Width */}
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

                {/* Exotic vehicles */}
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

                {/* Owner comment */}
                <div>
                  <label className={labelClass}>Komentar Vlasnika</label>
                  <textarea
                    placeholder={"npr. Parking je zaštićen 24/7 video nadzorom. Molimo vozače da ne parkiraju ispred rampe. Za hitne slučajeve nazovite broj na ulazu."}
                    value={ownerComment}
                    onChange={(e) => setOwnerComment(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors resize-none"
                  />
                </div>

                {/* Upute za pristup */}
                <div>
                  <label className={labelClass}>Upute za pristup</label>
                  <textarea
                    placeholder={"npr. Uđite s Ulice kralja Tomislava, rampa se otvara automatski skeniranjem QR koda iz aplikacije. Lift se nalazi odmah lijevo od ulaza. Vaše mjesto je označeno brojem rezervacije."}
                    value={accessInstructions}
                    onChange={(e) => setAccessInstructions(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Prikazuje se vozaču nakon rezervacije i u mobilnom skeneru.</p>
                </div>
              </CollapsibleSection>

              {/* 3.2 Dodaci */}
              <CollapsibleSection title="Dodaci (10)">
                <div className="flex flex-wrap gap-2">
                  {ADDONS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleAddon(a)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${addons.includes(a) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              {/* 3.3 Radno Vrijeme */}
              <CollapsibleSection title="Radno Vrijeme (Pristupno vrijeme)">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">24/7</p>
                    <p className="text-xs text-gray-400">Otvoreno cijelo vrijeme</p>
                  </div>
                  <Toggle checked={is247} onChange={setIs247} />
                </div>

                {!is247 && (
                  <div className="space-y-3 pt-1" translate="no">
                    {/* Days */}
                    <div>
                      <label className={subLabelClass} translate="no">Dani</label>
                      <div className="flex gap-1.5 flex-wrap" translate="no">
                        {['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].map((d) => (
                          <button key={d} type="button" translate="no" onClick={() => toggleDay(d)}
                            className={`w-10 h-8 rounded text-xs font-bold border transition-colors ${openDays.includes(d) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-500'}`}>
                            <span translate="no">{d}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Hours */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={subLabelClass} translate="no">Od</label>
                        <input type="time" value={hoursFrom} onChange={(e) => setHoursFrom(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={subLabelClass} translate="no">Do</label>
                        <input type="time" value={hoursTo} onChange={(e) => setHoursTo(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  </div>
                )}
              </CollapsibleSection>

              {/* 3.4 Kapacitet */}
              <CollapsibleSection title="Kapacitet">
                <div>
                  <label className={labelClass}>Broj mjesta</label>
                  <input type="number" placeholder="10" min="1" value={baseSpots} onChange={(e) => setBaseSpots(e.target.value)} className={inputClass} required />
                </div>

                <div className="space-y-3">
                  <CalendarScheduler baseSpots={baseSpots} onConfigsChange={setCalendarConfigs} />
                </div>
              </CollapsibleSection>

              {/* 3.5 Vrsta mjesta */}
              <CollapsibleSection title="Vrsta mjesta">
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">Razlikujte kategoriju mjesta — odaberite koje ćete smjestiti uz množitelj standardne cijene</p>
                <div className="space-y-2">
                  {SPOT_TYPES.map((st) => (
                    <div key={st.key}
                      onClick={() => toggleSpotType(st.key)}
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

              {/* 3.6 Cijena */}
              <CollapsibleSection title="Cijena">
                {/* Info box */}
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-black mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-violet-600 flex-shrink-0" /> Nema provizije</p>
                  <p className="text-xs text-black leading-relaxed space-y-2" translate="no">
                    <span className="block">PayParq na Vašu cijenu dodaje marginalnu naknadu za uslugu koja uključuje: Zajamčeno mjesto, Prioritetnu podršku, SOS poziv za zamjenu mjesta, i Dinamičko određivanje cijena.</span>
                    <span className="block">Za udaljene lotove — prazne parcele bez nadzora uz zračne luke, događaje i plaže — dodaje se dodatna naknada.</span>
                  </p>
                </div>

                {/* Standard pricing */}
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Standard</p>
                  <div className="grid grid-cols-3 gap-2">
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

                {/* Dynamic Price Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Dinamičko određivanje cijena</p>
                    <p className="text-xs text-gray-400">PayParq će prilagoditi cijene na temelju potražnje</p>
                  </div>
                  <Toggle checked={useDynamicPrice} onChange={setUseDynamicPrice} />
                </div>

                {useDynamicPrice && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Minimalne cijene koje ćete prihvatiti</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className={labelClass} translate="no">Satna (€/h)</label>
                        <input type="number" placeholder="1.00" min="0" step="0.10" value={minPriceHourly} onChange={(e) => setMinPriceHourly(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass} translate="no">Dnevna (€/dan)</label>
                        <input type="number" placeholder="5.00" min="0" step="0.10" value={minPriceDaily} onChange={(e) => setMinPriceDaily(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass} translate="no">Mjesečna (€/mj)</label>
                        <input type="number" placeholder="100.00" min="0" step="10" value={minPriceMonthly} onChange={(e) => setMinPriceMonthly(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  </div>
                )}
              </CollapsibleSection>

              {/* 3.7 Fotografije */}
              <CollapsibleSection title="Fotografije (Neobavezno)" defaultOpen={false}>
                {/* Info box */}
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-black mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-violet-600 flex-shrink-0" /> Povećajte konverzije</p>
                  <p className="text-xs text-black leading-relaxed">Ogledni parkingi s fotografijama imaju 33-72% veće stope konverzije. Preporučujemo dodavanje 3-5 kvalitetnih fotografija vašeg parking mjesta.</p>
                </div>

                {/* Photos upload */}
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

                  {photos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">{photos.length} {photos.length === 1 ? 'fotografija' : 'fotografija'} učitano</p>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img src={URL.createObjectURL(photo)} alt={`Fotografija ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
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
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </div>

            {/* ── Toggles ── */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Besplatni dodaci</p>
              {[
                { state: wantQR, setter: setWantQR, label: 'Da, želim besplatni PayParq QR Pay za plaćanje na licu mjesta' },
                { state: wantLPR, setter: setWantLPR, label: 'Da, želim besplatnu LPR aplikaciju i upravljačku ploču' },
                { state: wantHotel, setter: setWantHotel, label: 'Da, želim se pridružiti PayParq Hotel Partnership programu' },
              ].map(({ state, setter, label }) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <p className="text-xs font-medium text-gray-800 leading-relaxed">{label}</p>
                  <Toggle checked={state} onChange={setter} />
                </div>
              ))}
            </div>

            {/* CTA */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3.5">
                <p className="text-xs text-red-700 font-medium">{submitError}</p>
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full py-4 rounded-lg font-bold text-base text-white disabled:opacity-60 transition-opacity shadow-sm bg-gray-900 hover:bg-gray-800">
              {submitting ? 'Slanje...' : 'Pošalji zahtjev'}
            </button>
            <p className="text-center text-xs text-gray-400 pb-4">
              Slanjem se slažete s našim{' '}
              <a href="/terms" className="underline hover:text-gray-600">Uvjetima korištenja</a>.
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-gray-400">
          <span>© 2026 PayParq</span>
          <div className="flex items-center gap-4">
            <a href="/terms" className="hover:text-gray-600 transition-colors">Uvjeti</a>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/contact" className="hover:text-gray-600 transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
