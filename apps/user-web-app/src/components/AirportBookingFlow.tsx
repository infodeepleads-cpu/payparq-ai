'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollableDateTimePicker } from './ScrollableDateTimePicker';
import { useLocale } from './LocaleProvider';
import { ArrowRight } from 'lucide-react';

interface AirportBookingFlowProps {
  defaultLat: number;
  defaultLng: number;
  defaultName: string;
}

type Step = 'arrival' | 'departure';

export function AirportBookingFlow({ defaultLat, defaultLng, defaultName }: AirportBookingFlowProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [step, setStep] = useState<Step | null>(null);
  const [arrivalDateTime, setArrivalDateTime] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');

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

  const handleDepartureConfirm = () => {
    let finalDeparture = departureDateTime;
    if (!finalDeparture && arrivalDateTime) {
      const d = new Date(arrivalDateTime);
      d.setHours(d.getHours() + 3);
      finalDeparture = d.toISOString().slice(0, 16);
    }
    if (arrivalDateTime) {
      const params = new URLSearchParams({
        lat: String(defaultLat),
        lng: String(defaultLng),
        name: defaultName,
        start: arrivalDateTime,
        end: finalDeparture,
      });
      setStep(null);
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setStep('arrival')}
        className="md:hidden bg-black text-white font-semibold py-3 px-6 rounded-lg hover:bg-black/90 transition inline-flex items-center gap-2"
      >
        Book Now <ArrowRight size={18} />
      </button>

      {step === 'arrival' && (
        <ScrollableDateTimePicker
          value={arrivalDateTime}
          onChange={setArrivalDateTime}
          onConfirm={() => { if (arrivalDateTime) setStep('departure'); }}
          onCancel={() => setStep(null)}
          title={locale === 'en' ? 'When are you arriving?' : 'Kada dolazite?'}
          subtitle={locale === 'en' ? 'Select arrival date and time' : 'Odaberite datum i vrijeme dolaska'}
          step={locale === 'en' ? 'Step 1 of 2' : 'Korak 1 od 2'}
          locale={locale}
        />
      )}

      {step === 'departure' && (
        <ScrollableDateTimePicker
          value={departureDateTime}
          onChange={setDepartureDateTime}
          onConfirm={handleDepartureConfirm}
          onCancel={() => setStep('arrival')}
          title={locale === 'en' ? 'When are you leaving?' : 'Kada odlazite?'}
          subtitle={locale === 'en' ? 'Select departure date and time' : 'Odaberite datum i vrijeme odlaska'}
          step={locale === 'en' ? 'Step 2 of 2' : 'Korak 2 od 2'}
          initialDateTime={arrivalDateTime}
          locale={locale}
        />
      )}
    </>
  );
}
