import { Users, Zap, Lock, Accessibility, Bus, Fuel, Repeat2, ParkingCircle } from 'lucide-react';

export interface Amenity {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AMENITIES_LIST: Amenity[] = [
  { id: 'valet', label: 'Valet', icon: Users },
  { id: 'shuttle', label: 'Prijevoz', icon: Bus },
  { id: 'ev-charging', label: 'EV Punjenje', icon: Zap },
  { id: 'wheelchair-accessible', label: 'Pristup invalidskim kolicima', icon: Accessibility },
  { id: 'rampa', label: 'Rampa', icon: Lock },
  { id: 'in-out-allowed', label: 'Ulazak/Izlazak', icon: Repeat2 },
  { id: 'tank-refill', label: 'Punjenje goriva', icon: Fuel },
  { id: 'garage', label: 'Garaža', icon: Lock },
  { id: 'self-park', label: 'Samoparkirani', icon: ParkingCircle },
];

export const getAmenityLabel = (id: string): string => {
  return AMENITIES_LIST.find(a => a.id === id)?.label || id;
};

export const getAmenityIcon = (id: string) => {
  return AMENITIES_LIST.find(a => a.id === id)?.icon;
};
