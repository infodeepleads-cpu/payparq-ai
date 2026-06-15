'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollableDateTimePicker } from './ScrollableDateTimePicker';
import { useLocale } from './LocaleProvider';
import { MapPin, Calendar, ArrowRight, ChevronDown } from 'lucide-react';

interface AirportBookingFlowProps {
  defaultLat: number;
  defaultLng: number;
  defaultName: string;
  showEvents?: boolean;
  onLocationClick?: () => void;
}

type Step = null | 'arrival' | 'departure';
type BookingType = 'hourly_daily' | 'monthly' | 'event';
interface Event {
  id: string;
  name: string;
  date: string;
}

export function AirportBookingFlow({ defaultLat, defaultLng, defaultName, showEvents = false, onLocationClick }: AirportBookingFlowProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [step, setStep] = useState<Step>(null);
  const [bookingType, setBookingType] = useState<BookingType>('hourly_daily');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [arrivalDateTime, setArrivalDateTime] = useState(() => {
    const now = new Date();
    now.setHours(15, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  });
  const [departureDateTime, setDepartureDateTime] = useState(() => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    future.setHours(15, 0, 0, 0);
    return future.toISOString().slice(0, 16);
  });

  useEffect(() => {
    // Fetch upcoming events for this venue/city
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/events?location=${defaultName}`);
        if (res.ok) {
          const data = await res.json();
          setUpcomingEvents(data);
        }
      } catch (error) {
        console.log('No events available');
      }
    };
    fetchEvents();
  }, [defaultName]);

  useEffect(() => {
    if (step) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add('booking-popup-open');
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.classList.remove('booking-popup-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.classList.remove('booking-popup-open');
    };
  }, [step]);

  const handleSearch = () => {
    if (!arrivalDateTime || !departureDateTime) {
      setStep('arrival');
      return;
    }
    const params = new URLSearchParams({
      lat: String(defaultLat),
      lng: String(defaultLng),
      name: defaultName,
      start: arrivalDateTime,
      end: departureDateTime,
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleDepartureConfirm = () => {
    let finalDeparture = departureDateTime;
    if (!finalDeparture && arrivalDateTime) {
      const d = new Date(arrivalDateTime);
      d.setHours(d.getHours() + 3);
      finalDeparture = d.toISOString().slice(0, 16);
    }
    if (arrivalDateTime && finalDeparture) {
      setDepartureDateTime(finalDeparture);
      setStep(null);
    }
  };

  const formatDateDisplay = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'hr-HR', { month: 'long', day: 'numeric' });
  };

  const formatTimeDisplay = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString(locale === 'en' ? 'en-US' : 'hr-HR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Widget Fields */}
      <div className="w-full space-y-3">
        {/* Event Selector */}
        {bookingType === 'event' && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
              {locale === 'en' ? 'Select Event' : 'Odaberite događaj'}
            </label>
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const event = upcomingEvents.find(ev => ev.id === e.target.value);
                if (event) {
                  setSelectedEvent(event);
                  setArrivalDateTime(event.date);
                  const departure = new Date(event.date);
                  departure.setHours(departure.getHours() + 4);
                  setDepartureDateTime(departure.toISOString().slice(0, 16));
                }
              }}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-black focus:outline-none focus:border-gray-600"
              style={{ color: '#000', backgroundColor: '#fff' }}
            >
              <option value="" style={{ color: '#000', backgroundColor: '#fff' }}>{locale === 'en' ? 'Choose event...' : 'Odaberite...'}</option>
              {upcomingEvents.map(event => (
                <option key={event.id} value={event.id} style={{ color: '#000', backgroundColor: '#fff' }}>{event.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Park at Location - Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
            {locale === 'en' ? 'Park at' : 'Parkiraj u'}
          </label>
          <button
            onClick={onLocationClick}
            className="w-full flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 transition relative text-left"
          >
            <MapPin size={18} className="text-gray-600 flex-shrink-0" />
            <input
              type="text"
              value={defaultName}
              disabled
              className="flex-1 bg-transparent text-sm font-medium text-black outline-none disabled:cursor-default"
            />
            <ChevronDown size={18} className="text-gray-600 flex-shrink-0" />
          </button>
        </div>

        {/* Hourly/Daily: From & Until - Separate Rows */}
        {bookingType === 'hourly_daily' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                {locale === 'en' ? 'From' : 'Od'}
              </label>
              <button
                onClick={() => setStep('arrival')}
                className="w-full flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 transition text-left relative"
              >
                <Calendar size={18} className="text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-black truncate">
                    {arrivalDateTime
                      ? `${formatDateDisplay(arrivalDateTime)} at ${formatTimeDisplay(arrivalDateTime)}`
                      : (locale === 'en' ? 'Today at 15:00' : 'Danas u 15:00')}
                  </div>
                </div>
                <ChevronDown size={18} className="text-gray-600 flex-shrink-0" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                {locale === 'en' ? 'To' : 'Do'}
              </label>
              <button
                onClick={() => arrivalDateTime && setStep('departure')}
                disabled={!arrivalDateTime}
                className="w-full flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 transition text-left disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                <Calendar size={18} className="text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-black truncate">
                    {departureDateTime
                      ? `${formatDateDisplay(departureDateTime)} at ${formatTimeDisplay(departureDateTime)}`
                      : (locale === 'en' ? 'Today at 19:00' : 'Danas u 19:00')}
                  </div>
                </div>
                <ChevronDown size={18} className="text-gray-600 flex-shrink-0" />
              </button>
            </div>
          </>
        )}

        {/* Monthly: Start Date Only */}
        {bookingType === 'monthly' && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
              {locale === 'en' ? 'Start Date' : 'Početni datum'}
            </label>
            <button
              onClick={() => setStep('arrival')}
              className="w-full flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 transition text-left"
            >
              <Calendar size={18} className="text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-black truncate">
                  {arrivalDateTime ? formatDateDisplay(arrivalDateTime) : (locale === 'en' ? 'Select date' : 'Odaberite datum')}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Event: Event Dates Display (Read-only) */}
        {bookingType === 'event' && selectedEvent && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                {locale === 'en' ? 'Event Date' : 'Datum događaja'}
              </label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3">
                <Calendar size={18} className="text-gray-600 flex-shrink-0" />
                <div className="text-sm font-medium text-black">{formatDateDisplay(selectedEvent.date)}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                {locale === 'en' ? 'Checkout' : 'Odlazak'}
              </label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3">
                <Calendar size={18} className="text-gray-600 flex-shrink-0" />
                <div className="text-sm font-medium text-black">{formatDateDisplay(departureDateTime)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={bookingType === 'event' ? !selectedEvent : (!arrivalDateTime || (bookingType === 'hourly_daily' && !departureDateTime))}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {locale === 'en' ? 'Search parking' : 'Pretraži parkirna mjesta'}
        </button>
      </div>

      {/* Date Picker Modals */}
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
          confirmLabel={locale === 'en' ? 'Book Now →' : 'Odabir →'}
        />
      )}
    </>
  );
}
