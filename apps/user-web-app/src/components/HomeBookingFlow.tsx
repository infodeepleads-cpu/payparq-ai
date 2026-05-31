'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { ScrollableDateTimePicker } from './ScrollableDateTimePicker';
import { ArrowRight, MapPin, X } from 'lucide-react';

const LIBRARIES: ('places')[] = ['places'];

type Step = 'location' | 'arrival' | 'departure';

export function HomeBookingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [arrivalDateTime, setArrivalDateTime] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (step) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [step]);

  const handlePlaceSelected = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      setSelectedLat(place.geometry.location.lat());
      setSelectedLng(place.geometry.location.lng());
      setSelectedName(place.name || place.formatted_address || '');
    }
  };

  const handleDepartureConfirm = () => {
    let finalDeparture = departureDateTime;
    if (!finalDeparture && arrivalDateTime) {
      const d = new Date(arrivalDateTime);
      d.setHours(d.getHours() + 3);
      finalDeparture = d.toISOString().slice(0, 16);
    }
    if (arrivalDateTime && selectedLat && selectedLng) {
      const params = new URLSearchParams({
        lat: String(selectedLat),
        lng: String(selectedLng),
        name: selectedName,
        start: arrivalDateTime,
        end: finalDeparture,
      });
      router.push(`/search?${params.toString()}`);
    } else if (arrivalDateTime) {
      const params = new URLSearchParams({ start: arrivalDateTime, end: finalDeparture });
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setStep('location')}
        className="md:hidden bg-black text-white font-semibold py-3.5 px-7 rounded-xl hover:bg-black/90 transition inline-flex items-center gap-2 text-base"
      >
        Pronađi Parking <ArrowRight size={18} />
      </button>

      {/* Step 1: Location */}
      {step === 'location' && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-black/50 uppercase tracking-wide">Korak 1 od 3</div>
                <h2 className="text-2xl font-bold text-black mt-0.5">Gdje želite parkirati?</h2>
                <p className="text-xs text-black/60 mt-0.5">Unesite lokaciju ili odaberite prijedlog</p>
              </div>
              <button onClick={() => setStep(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X size={20} className="text-black/60" />
              </button>
            </div>

            {isLoaded ? (
              <Autocomplete
                onLoad={(ac) => { autocompleteRef.current = ac; }}
                onPlaceChanged={handlePlaceSelected}
                options={{ componentRestrictions: { country: 'hr' }, types: ['geocode', 'establishment'] }}
              >
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                  <input
                    type="text"
                    placeholder="npr. Split Airport, Zagreb Centar..."
                    className="w-full pl-9 pr-4 py-3 border border-black/20 rounded-xl text-sm focus:outline-none focus:border-black"
                    autoFocus
                  />
                </div>
              </Autocomplete>
            ) : (
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="text"
                  placeholder="Učitavanje..."
                  disabled
                  className="w-full pl-9 pr-4 py-3 border border-black/20 rounded-xl text-sm bg-black/5"
                />
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setStep('arrival')}
                className="w-full bg-black text-white font-bold py-3 rounded-2xl hover:bg-gray-900 active:scale-95 transition-all"
              >
                Nastavi →
              </button>
              <button
                onClick={() => setStep(null)}
                className="w-full border-2 border-black/10 text-black font-semibold py-3 rounded-2xl hover:bg-black/5 active:scale-95 transition-all"
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Arrival */}
      {step === 'arrival' && (
        <ScrollableDateTimePicker
          value={arrivalDateTime}
          onChange={setArrivalDateTime}
          onConfirm={() => { if (arrivalDateTime) setStep('departure'); }}
          onCancel={() => setStep('location')}
          title="Kada dolazite?"
          subtitle="Odaberite datum i vrijeme dolaska"
          step="Korak 2 od 3"
        />
      )}

      {/* Step 3: Departure */}
      {step === 'departure' && (
        <ScrollableDateTimePicker
          value={departureDateTime}
          onChange={setDepartureDateTime}
          onConfirm={handleDepartureConfirm}
          onCancel={() => setStep('arrival')}
          title="Kada odlazite?"
          subtitle="Odaberite datum i vrijeme odlaska"
          step="Korak 3 od 3"
          initialDateTime={arrivalDateTime}
        />
      )}
    </>
  );
}
