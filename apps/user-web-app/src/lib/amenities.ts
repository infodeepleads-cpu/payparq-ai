import { Users, Zap, Lock, Waves, ParkingCircle, Repeat2, Accessibility, Bus } from 'lucide-react';

export interface Amenity {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AMENITIES_LIST: Amenity[] = [
  { id: 'valet', label: 'Valet', icon: Users },
  { id: 'shuttle', label: 'Shuttle', icon: Bus },
  { id: 'ev_charging', label: 'EV Charging', icon: Zap },
  { id: 'garage', label: 'Garage', icon: Lock },
  { id: 'wheelchair_accessible', label: 'Wheelchair Access', icon: Accessibility },
  { id: 'on_site_staff', label: 'On-Site Staff', icon: Users },
  { id: 'lot_uncovered', label: 'Uncovered Lot', icon: ParkingCircle },
  { id: 'alley_access', label: 'Alley Access', icon: Repeat2 },
  { id: 'touchless', label: 'Touchless', icon: Waves },
  { id: 'in_out_allowed', label: 'In/Out Allowed', icon: Repeat2 },
  { id: 'self_park', label: 'Self Park', icon: ParkingCircle },
];

export const getAmenityLabel = (id: string): string => {
  return AMENITIES_LIST.find(a => a.id === id)?.label || id;
};

export const getAmenityIcon = (id: string) => {
  return AMENITIES_LIST.find(a => a.id === id)?.icon;
};
