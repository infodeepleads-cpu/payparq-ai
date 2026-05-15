import { Users, Zap, Lock, Accessibility, Bus, Fuel, Repeat2, ParkingCircle } from 'lucide-react';

export interface Amenity {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AMENITIES_LIST: Amenity[] = [
  { id: 'valet', label: 'Valet', icon: Users },
  { id: 'shuttle', label: 'Shuttle', icon: Bus },
  { id: 'ev-charging', label: 'EV Charging', icon: Zap },
  { id: 'wheelchair-accessible', label: 'Wheelchair Access', icon: Accessibility },
  { id: 'rampa', label: 'Rampa', icon: Lock },
  { id: 'in-out-allowed', label: 'In/Out Allowed', icon: Repeat2 },
  { id: 'tank-refill', label: 'Tank Refill', icon: Fuel },
  { id: 'garage', label: 'Garaža', icon: Lock },
  { id: 'self-park', label: 'Self Park', icon: ParkingCircle },
];

export const getAmenityLabel = (id: string): string => {
  return AMENITIES_LIST.find(a => a.id === id)?.label || id;
};

export const getAmenityIcon = (id: string) => {
  return AMENITIES_LIST.find(a => a.id === id)?.icon;
};
