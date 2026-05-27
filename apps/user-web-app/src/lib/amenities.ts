import { Users, Zap, Lock, Accessibility, Bus, Fuel, Repeat2, ParkingCircle, Home } from 'lucide-react';

export interface Amenity {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AMENITIES_LIST: Amenity[] = [
  { id: 'valet', label: 'Valet', labelEn: 'Valet', icon: Users },
  { id: 'shuttle', label: 'Prijevoz', labelEn: 'Shuttle', icon: Bus },
  { id: 'ev-charging', label: 'EV Punjenje', labelEn: 'EV Charging', icon: Zap },
  { id: 'wheelchair-accessible', label: 'Pristup invalidskim kolicima', labelEn: 'Wheelchair Accessible', icon: Accessibility },
  { id: 'rampa', label: 'Rampa', labelEn: 'Ramp', icon: Lock },
  { id: 'in-out-allowed', label: 'Ulazak/Izlazak', labelEn: 'In/Out Access', icon: Repeat2 },
  { id: 'tank-refill', label: 'Punjenje goriva', labelEn: 'Fuel Refill', icon: Fuel },
  { id: 'garage', label: 'Garaža', labelEn: 'Garage', icon: Lock },
  { id: 'self-park', label: 'Samoparkirani', labelEn: 'Self-Park', icon: ParkingCircle },
  { id: 'on-site-staff', label: 'Osoblje', labelEn: 'Staff', icon: Users },
  { id: 'covered', label: 'Natkriveno', labelEn: 'Covered', icon: Home },
  { id: 'gate', label: 'Rampa/Brana', labelEn: 'Gate/Barrier', icon: Lock },
];

export const getAmenityLabel = (id: string, locale: 'en' | 'hr' = 'hr'): string => {
  const amenity = AMENITIES_LIST.find(a => a.id === id);
  if (!amenity) return id;
  return locale === 'en' ? amenity.labelEn : amenity.label;
};

export const getAmenityIcon = (id: string) => {
  return AMENITIES_LIST.find(a => a.id === id)?.icon;
};

export const getLabelToIdMap = () => {
  const map: { [key: string]: string } = {};
  AMENITIES_LIST.forEach(amenity => {
    map[amenity.label] = amenity.id;
    map[amenity.labelEn] = amenity.id;
  });
  return map;
};

export const normalizeAmenityLabels = (labels: string[]): string[] => {
  const labelToId = getLabelToIdMap();
  return labels
    .map(label => labelToId[label] || label)
    .filter((id, index, self) => self.indexOf(id) === index);
};
