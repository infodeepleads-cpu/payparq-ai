export interface Airport {
  id: string;
  name: string;
  slug: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  description: string;
  keyFeatures: string[];
  nearbyAreas: string[];
}

export const AIRPORTS: Record<string, Airport> = {
  split: {
    id: 'split',
    name: 'Split Airport',
    slug: 'split-airport',
    city: 'Split',
    region: 'Dalmatia',
    lat: 43.5388,
    lng: 16.2973,
    description: 'Find parking near Split Airport (SPU) with 100+ reservable spaces. Secure, affordable parking at the best rates. Reserve online and save time.',
    keyFeatures: [
      '100+ parking spaces',
      'Real-time availability',
      '24/7 access',
      'Secure monitored parking',
      'Covered spots available',
      'Long-term rates',
    ],
    nearbyAreas: ['Grad Split', 'Airport Area', 'Kastela'],
  },
  zagreb: {
    id: 'zagreb',
    name: 'Zagreb Airport',
    slug: 'zagreb-airport',
    city: 'Zagreb',
    region: 'Central Croatia',
    lat: 45.7325,
    lng: 16.0681,
    description: 'Reserve parking near Zagreb Airport (ZAG) with 150+ available spaces. Convenient airport parking with instant confirmation. Book online now.',
    keyFeatures: [
      '150+ parking spaces',
      'Real-time availability',
      '24/7 access',
      'Secure parking facility',
      'Monthly rates available',
      'Quick shuttle service',
    ],
    nearbyAreas: ['Airport Terminal', 'Velika Gorica', 'Zagreb City'],
  },
  dubrovnik: {
    id: 'dubrovnik',
    name: 'Dubrovnik Airport',
    slug: 'dubrovnik-airport',
    city: 'Dubrovnik',
    region: 'South Dalmatia',
    lat: 42.5619,
    lng: 18.2623,
    description: 'Book parking at Dubrovnik Airport (DBV) with 80+ reservable spaces. Affordable airport parking with guaranteed spot. Reserve in 2 minutes.',
    keyFeatures: [
      '80+ parking spaces',
      'Real-time availability',
      '24/7 access',
      'Secure monitored facility',
      'Short-term & long-term',
      'Easy airport access',
    ],
    nearbyAreas: ['Airport Terminal', 'Lapad', 'Old Town Area'],
  },
  zadar: {
    id: 'zadar',
    name: 'Zadar Airport',
    slug: 'zadar-airport',
    city: 'Zadar',
    region: 'North Dalmatia',
    lat: 44.1088,
    lng: 16.0444,
    description: 'Find parking near Zadar Airport (ZAD) with 60+ available spaces. Safe, affordable parking with instant booking confirmation.',
    keyFeatures: [
      '60+ parking spaces',
      'Real-time availability',
      '24/7 access',
      'Secure parking',
      'Hourly & daily rates',
      'Airport shuttle included',
    ],
    nearbyAreas: ['Airport Terminal', 'Zadar City', 'Coastal Area'],
  },
};
