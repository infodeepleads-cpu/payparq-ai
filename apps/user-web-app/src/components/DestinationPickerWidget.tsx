'use client';

import { useState, useEffect } from 'react';

interface Venue {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: string;
}

interface ParkingLot {
  id: string;
  name: string;
  address?: string;
  distance: number;
  lat?: number;
  lng?: number;
  price: number;
  spots: number;
  href: string;
}

const MAJOR_VENUES: Venue[] = [
  // CITY CENTERS (20)
  { name: 'Split City Center', city: 'Split', country: 'Croatia', lat: 43.5086, lng: 16.4399, type: 'city' },
  { name: 'Dubrovnik Old Town', city: 'Dubrovnik', country: 'Croatia', lat: 42.6408, lng: 18.1085, type: 'city' },
  { name: 'Zagreb City Center', city: 'Zagreb', country: 'Croatia', lat: 45.8150, lng: 15.9819, type: 'city' },
  { name: 'Zadar Old Town', city: 'Zadar', country: 'Croatia', lat: 44.1194, lng: 15.2314, type: 'city' },
  { name: 'Venice City Center', city: 'Venice', country: 'Italy', lat: 45.4379, lng: 12.3412, type: 'city' },
  { name: 'Milan City Center', city: 'Milan', country: 'Italy', lat: 45.4655, lng: 9.1910, type: 'city' },
  { name: 'Rome City Center', city: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, type: 'city' },
  { name: 'Vienna City Center', city: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738, type: 'city' },
  { name: 'Munich City Center', city: 'Munich', country: 'Germany', lat: 48.1372, lng: 11.5755, type: 'city' },
  { name: 'Berlin City Center', city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, type: 'city' },
  { name: 'Budapest City Center', city: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402, type: 'city' },
  { name: 'Ljubljana City Center', city: 'Ljubljana', country: 'Slovenia', lat: 46.0569, lng: 14.5058, type: 'city' },
  { name: 'Prague Old Town Square', city: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378, type: 'city' },
  { name: 'Warsaw City Center', city: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122, type: 'city' },
  { name: 'Krakow Old Town', city: 'Krakow', country: 'Poland', lat: 50.0647, lng: 19.9450, type: 'city' },
  { name: 'Sarajevo City Center', city: 'Sarajevo', country: 'Bosnia', lat: 43.8564, lng: 18.4131, type: 'city' },
  { name: 'Mostar Old Town', city: 'Mostar', country: 'Bosnia', lat: 43.2019, lng: 17.8047, type: 'city' },
  { name: 'Podgorica City Center', city: 'Podgorica', country: 'Montenegro', lat: 42.0157, lng: 19.2671, type: 'city' },
  { name: 'Belgrade City Center', city: 'Belgrade', country: 'Serbia', lat: 44.8176, lng: 20.4653, type: 'city' },
  { name: 'Kotor Old Town', city: 'Kotor', country: 'Montenegro', lat: 42.4219, lng: 18.7683, type: 'city' },

  // AIRPORTS (20)
  { name: 'Split Airport (SPU)', city: 'Split', country: 'Croatia', lat: 43.5388, lng: 16.2973, type: 'airport' },
  { name: 'Zagreb Airport (ZAG)', city: 'Zagreb', country: 'Croatia', lat: 45.7429, lng: 16.0688, type: 'airport' },
  { name: 'Dubrovnik Airport (DBV)', city: 'Dubrovnik', country: 'Croatia', lat: 42.5623, lng: 18.2683, type: 'airport' },
  { name: 'Zadar Airport (ZAD)', city: 'Zadar', country: 'Croatia', lat: 44.0888, lng: 15.3500, type: 'airport' },
  { name: 'Venice Marco Polo (VCE)', city: 'Venice', country: 'Italy', lat: 45.5050, lng: 12.3267, type: 'airport' },
  { name: 'Milan Malpensa (MXP)', city: 'Milan', country: 'Italy', lat: 45.6306, lng: 8.7282, type: 'airport' },
  { name: 'Rome Fiumicino (FCO)', city: 'Rome', country: 'Italy', lat: 41.8002, lng: 12.2388, type: 'airport' },
  { name: 'Vienna Airport (VIE)', city: 'Vienna', country: 'Austria', lat: 48.1102, lng: 16.5719, type: 'airport' },
  { name: 'Munich Airport (MUC)', city: 'Munich', country: 'Germany', lat: 48.3521, lng: 11.7758, type: 'airport' },
  { name: 'Frankfurt Airport (FRA)', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622, type: 'airport' },
  { name: 'Berlin Brandenburg (BER)', city: 'Berlin', country: 'Germany', lat: 52.3667, lng: 13.5033, type: 'airport' },
  { name: 'Budapest Ferenc Liszt (BUD)', city: 'Budapest', country: 'Hungary', lat: 47.4312, lng: 19.2509, type: 'airport' },
  { name: 'Ljubljana Jože Pučnik (LJU)', city: 'Ljubljana', country: 'Slovenia', lat: 46.2239, lng: 14.4581, type: 'airport' },
  { name: 'Prague Václav Havel (PRG)', city: 'Prague', country: 'Czech Republic', lat: 50.1008, lng: 14.2600, type: 'airport' },
  { name: 'Warsaw Chopin (WAW)', city: 'Warsaw', country: 'Poland', lat: 52.1656, lng: 21.0214, type: 'airport' },
  { name: 'Krakow John Paul II (KRK)', city: 'Krakow', country: 'Poland', lat: 50.0777, lng: 19.7850, type: 'airport' },
  { name: 'Sarajevo International (SJJ)', city: 'Sarajevo', country: 'Bosnia', lat: 43.8164, lng: 18.3319, type: 'airport' },
  { name: 'Mostar Airport (OMO)', city: 'Mostar', country: 'Bosnia', lat: 43.1975, lng: 17.9189, type: 'airport' },
  { name: 'Podgorica Airport (TGD)', city: 'Podgorica', country: 'Montenegro', lat: 42.0208, lng: 19.3808, type: 'airport' },
  { name: 'Belgrade Nikola Tesla (BEG)', city: 'Belgrade', country: 'Serbia', lat: 44.8184, lng: 20.2781, type: 'airport' },
  // FOOTBALL STADIUMS (27)
  { name: 'Stadion Maksimir (Dinamo Zagreb)', city: 'Zagreb', country: 'Croatia', lat: 45.8234, lng: 16.0089, type: 'event' },
  { name: 'Stadion Poljud (Hajduk Split)', city: 'Split', country: 'Croatia', lat: 43.5150, lng: 16.4200, type: 'event' },
  { name: 'Stadion Gradski vrt (Osijek)', city: 'Osijek', country: 'Croatia', lat: 45.5500, lng: 18.9894, type: 'event' },
  { name: 'Stadio Giuseppe Meazza (Milan)', city: 'Milan', country: 'Italy', lat: 45.4774, lng: 9.1142, type: 'event' },
  { name: 'Stadio Olimpico (Roma)', city: 'Rome', country: 'Italy', lat: 41.9340, lng: 12.4540, type: 'event' },
  { name: 'Stadio San Paolo (Napoli)', city: 'Naples', country: 'Italy', lat: 40.8359, lng: 14.2200, type: 'event' },
  { name: 'Allianz Stadium (Juventus)', city: 'Turin', country: 'Italy', lat: 45.1054, lng: 7.6927, type: 'event' },
  { name: 'Allianz Stadion (Austria Wien)', city: 'Vienna', country: 'Austria', lat: 48.2024, lng: 16.3181, type: 'event' },
  { name: 'Red Bull Arena (Salzburg)', city: 'Salzburg', country: 'Austria', lat: 47.8150, lng: 13.0489, type: 'event' },
  { name: 'Allianz Arena (Bayern Munich)', city: 'Munich', country: 'Germany', lat: 48.2189, lng: 11.6241, type: 'event' },
  { name: 'Signal Iduna Park (Dortmund)', city: 'Dortmund', country: 'Germany', lat: 51.4432, lng: 7.4415, type: 'event' },
  { name: 'Volkswagen Arena (Stuttgart)', city: 'Stuttgart', country: 'Germany', lat: 48.8895, lng: 9.2403, type: 'event' },
  { name: 'Puskás Aréna (Budapest)', city: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.4008, type: 'event' },
  { name: 'Eden Arena (Slavia Praha)', city: 'Prague', country: 'Czech Republic', lat: 50.0950, lng: 14.4761, type: 'event' },
  { name: 'Generali Arena (Sparta Praha)', city: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378, type: 'event' },
  { name: 'Stadion Stožice (Ljubljana)', city: 'Ljubljana', country: 'Slovenia', lat: 46.0650, lng: 14.4628, type: 'event' },
  { name: 'Stadion Narodowy (Warsaw)', city: 'Warsaw', country: 'Poland', lat: 52.0588, lng: 21.0461, type: 'event' },
  { name: 'Stadion Miejski (Legia Warsaw)', city: 'Warsaw', country: 'Poland', lat: 52.2419, lng: 21.0319, type: 'event' },
  { name: 'Olimpijski stadion (Sarajevo)', city: 'Sarajevo', country: 'Bosnia', lat: 43.8457, lng: 18.3828, type: 'event' },
  { name: 'Stadion Asim Ferhatović (Mostar)', city: 'Mostar', country: 'Bosnia', lat: 43.2019, lng: 17.8047, type: 'event' },
  { name: 'Stadion Grbavica (Željezničar)', city: 'Sarajevo', country: 'Bosnia', lat: 43.8372, lng: 18.3920, type: 'event' },
  { name: 'Stadion Pod Goricom (Partizan)', city: 'Podgorica', country: 'Montenegro', lat: 42.0483, lng: 19.3311, type: 'event' },
  { name: 'Stadion Rajko Mitić (Crvena Zvezda)', city: 'Podgorica', country: 'Montenegro', lat: 42.0308, lng: 19.3775, type: 'event' },
  { name: 'Stadion Gradski (Podgorica)', city: 'Podgorica', country: 'Montenegro', lat: 42.0208, lng: 19.3808, type: 'event' },
  { name: 'Stadion Partizana (Belgrade)', city: 'Belgrade', country: 'Serbia', lat: 44.8228, lng: 20.3789, type: 'event' },
  { name: 'Stadion Crvena Zvezda (Belgrade)', city: 'Belgrade', country: 'Serbia', lat: 44.8242, lng: 20.4089, type: 'event' },
  { name: 'Stadion Rajko Mitić (Serbia)', city: 'Belgrade', country: 'Serbia', lat: 44.8228, lng: 20.3789, type: 'event' },
  // CONCERT VENUES (26)
  { name: 'Arena Zagreb', city: 'Zagreb', country: 'Croatia', lat: 45.8130, lng: 15.9835, type: 'event' },
  { name: 'Poreč Arena (Concert Venue)', city: 'Poreč', country: 'Croatia', lat: 45.2271, lng: 13.5933, type: 'event' },
  { name: 'INmusic Festival (Brioni)', city: 'Fažana', country: 'Croatia', lat: 45.2182, lng: 13.7633, type: 'event' },
  { name: 'Outlook Festival (Pula)', city: 'Pula', country: 'Croatia', lat: 44.8511, lng: 13.8342, type: 'event' },
  { name: 'La Scala (Milan)', city: 'Milan', country: 'Italy', lat: 45.4679, lng: 9.1904, type: 'event' },
  { name: 'Stadio Olimpico (Roma Concerts)', city: 'Rome', country: 'Italy', lat: 41.9340, lng: 12.4540, type: 'event' },
  { name: 'Teatro San Carlo (Naples)', city: 'Naples', country: 'Italy', lat: 40.8359, lng: 14.2200, type: 'event' },
  { name: 'Musikverein (Vienna)', city: 'Vienna', country: 'Austria', lat: 48.2008, lng: 16.3755, type: 'event' },
  { name: 'Staatsoper (Vienna)', city: 'Vienna', country: 'Austria', lat: 48.2020, lng: 16.3681, type: 'event' },
  { name: 'Salzburg Festival Hall', city: 'Salzburg', country: 'Austria', lat: 47.8131, lng: 13.0597, type: 'event' },
  { name: 'Philharmonie Berlin', city: 'Berlin', country: 'Germany', lat: 52.5101, lng: 13.3622, type: 'event' },
  { name: 'Staatsoper Berlin', city: 'Berlin', country: 'Germany', lat: 52.5170, lng: 13.3888, type: 'event' },
  { name: 'Gasteig Munich', city: 'Munich', country: 'Germany', lat: 48.1203, lng: 11.5879, type: 'event' },
  { name: 'Hungarian State Opera House', city: 'Budapest', country: 'Hungary', lat: 47.5020, lng: 19.0554, type: 'event' },
  { name: 'Palace of Arts (Budapest)', city: 'Budapest', country: 'Hungary', lat: 47.4712, lng: 19.0442, type: 'event' },
  { name: 'Prague National Theatre', city: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378, type: 'event' },
  { name: 'Kraków Philharmonic Hall', city: 'Krakow', country: 'Poland', lat: 50.0647, lng: 19.9450, type: 'event' },
  { name: 'Warsaw National Philharmonic', city: 'Warsaw', country: 'Poland', lat: 52.2324, lng: 21.0122, type: 'event' },
  { name: 'National Theatre Sarajevo', city: 'Sarajevo', country: 'Bosnia', lat: 43.8457, lng: 18.3828, type: 'event' },
  { name: 'Concert Hall Sarajevo', city: 'Sarajevo', country: 'Bosnia', lat: 43.8500, lng: 18.3900, type: 'event' },
  { name: 'National Theatre Podgorica', city: 'Podgorica', country: 'Montenegro', lat: 42.0413, lng: 19.2626, type: 'event' },
  { name: 'Concert Hall Podgorica', city: 'Podgorica', country: 'Montenegro', lat: 42.0308, lng: 19.3775, type: 'event' },
  { name: 'National Theatre Belgrade', city: 'Belgrade', country: 'Serbia', lat: 44.8187, lng: 20.4635, type: 'event' },
  { name: 'Kombank Arena (Belgrade)', city: 'Belgrade', country: 'Serbia', lat: 44.8410, lng: 20.3661, type: 'event' },
  { name: 'Sava Centar (Belgrade)', city: 'Belgrade', country: 'Serbia', lat: 44.8050, lng: 20.4097, type: 'event' },
  { name: 'Belgrade Philharmonic Hall', city: 'Belgrade', country: 'Serbia', lat: 44.8180, lng: 20.4530, type: 'event' },
];

const toLocalISOString = (date: Date) => {
  const y = date.getFullYear(), mo = String(date.getMonth() + 1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  const h = String(date.getHours()).padStart(2,'0'), m = String(date.getMinutes()).padStart(2,'0');
  return `${y}-${mo}-${d}T${h}:${m}`;
};

const generateDateOptions = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const formatted = date.toISOString().slice(0, 10);
    const label = date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    dates.push({ value: formatted, label });
  }
  return dates;
};

const generateTimeOptions = () => {
  const times: Array<{ value: string; label: string }> = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      times.push({ value: timeStr, label: timeStr });
    }
  }
  return times;
};

const getLocalTimeString = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

interface DestinationPickerWidgetProps {
  onClose: () => void;
  onSelect: (venue: Venue, startTime: string, endTime: string) => void;
  defaultTab?: 'airport' | 'city' | 'event';
}

export function DestinationPickerWidget({ onClose, onSelect, defaultTab = 'airport' }: DestinationPickerWidgetProps) {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [startTime, setStartTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0);
    return toLocalISOString(now);
  });
  const [endTime, setEndTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0);
    now.setHours(now.getHours() + 3);
    return toLocalISOString(now);
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'airport' | 'city' | 'event'>(defaultTab);
  const [showVenues, setShowVenues] = useState(false);

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const filteredVenues = MAJOR_VENUES.filter(
    (v) => v.type === activeTab && (v.name.toLowerCase().includes(searchFilter.toLowerCase()) || v.city.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
  };

  const handleSearch = () => {
    if (selectedVenue) {
      onSelect(selectedVenue, startTime, endTime);
      onClose();
    }
  };


  const handleStartDateChange = (newDate: string) => {
    const [year, month, day] = newDate.split('-').map(Number);
    const updated = new Date(startDate);
    updated.setFullYear(year, month - 1, day);
    setStartTime(toLocalISOString(updated));
  };

  const handleStartTimeChange = (newTime: string) => {
    const [hours, minutes] = newTime.split(':').map(Number);
    const updated = new Date(startDate);
    updated.setHours(hours, minutes, 0, 0);
    setStartTime(toLocalISOString(updated));
  };

  const handleEndDateChange = (newDate: string) => {
    const [year, month, day] = newDate.split('-').map(Number);
    const updated = new Date(endDate);
    updated.setFullYear(year, month - 1, day);
    setEndTime(toLocalISOString(updated));
  };

  const handleEndTimeChange = (newTime: string) => {
    const [hours, minutes] = newTime.split(':').map(Number);
    const updated = new Date(endDate);
    updated.setHours(hours, minutes, 0, 0);
    setEndTime(toLocalISOString(updated));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 md:items-center md:justify-center">
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5 md:slide-in-from-bottom-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Kamo ideš?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4">
              {/* Tab selector */}
              <div className="flex gap-2">
                {(['airport', 'city', 'event'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSearchFilter(''); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === tab ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tab === 'airport' ? 'Airports' : tab === 'city' ? 'City Centers' : 'Events'}
                  </button>
                ))}
              </div>

              {/* Search Bar with 3 nearest options */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search venues..."
                  value={searchFilter}
                  onChange={(e) => { setSearchFilter(e.target.value); setShowVenues(true); }}
                  onFocus={() => setShowVenues(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm text-gray-900"
                />

                {/* Venues dropdown - shown when focused or searching */}
                {showVenues && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-[140px] overflow-y-auto">
                    {searchFilter.length === 0 && (
                      <div className="p-1.5 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 px-2 py-0.5">3 nearest:</p>
                      </div>
                    )}
                    {filteredVenues.length === 0 ? (
                      <p className="text-gray-500 text-center py-2 text-xs">No venues found</p>
                    ) : (
                      filteredVenues.slice(0, searchFilter.length === 0 ? 3 : undefined).map((venue) => (
                        <button
                          key={`${venue.name}-${venue.country}`}
                          onClick={() => {
                            handleVenueSelect(venue);
                            setSearchFilter(venue.name);
                            setShowVenues(false);
                          }}
                          className="w-full text-left p-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <p className="font-medium text-gray-900 text-xs">{venue.name}</p>
                          <p className="text-xs text-gray-600">{venue.city}, {venue.country}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Date and time pickers */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                <p className="text-xs font-semibold text-gray-700">When do you need parking?</p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={startDate.toISOString().slice(0, 10)} onChange={(e) => handleStartDateChange(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black">
                    {generateDateOptions().map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <select value={getLocalTimeString(startDate)} onChange={(e) => handleStartTimeChange(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black">
                    {generateTimeOptions().map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={endDate.toISOString().slice(0, 10)} onChange={(e) => handleEndDateChange(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black">
                    {generateDateOptions().map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <select value={getLocalTimeString(endDate)} onChange={(e) => handleEndTimeChange(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black">
                    {generateTimeOptions().map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Search button - shown when venue is selected */}
              {selectedVenue && (
                <button
                  onClick={handleSearch}
                  className="w-full bg-white border border-black text-black font-semibold text-sm py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Search Parking
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
