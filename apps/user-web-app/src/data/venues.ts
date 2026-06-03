export interface Venue {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  capacity: number;
  type: 'stadium' | 'arena' | 'hall';
}

export const VENUES: Record<string, Venue> = {
  poljud: {
    id: 'poljud',
    name: 'Poljud Stadium',
    city: 'Split',
    lat: 43.5067,
    lng: 16.3417,
    capacity: 35000,
    type: 'stadium',
  },
  maksimir: {
    id: 'maksimir',
    name: 'Maksimir Stadium',
    city: 'Zagreb',
    lat: 45.8317,
    lng: 16.0367,
    capacity: 40000,
    type: 'stadium',
  },
  arena_zagreb: {
    id: 'arena_zagreb',
    name: 'Arena Zagreb',
    city: 'Zagreb',
    lat: 45.8217,
    lng: 16.0267,
    capacity: 20000,
    type: 'arena',
  },
  spaladium_arena: {
    id: 'spaladium_arena',
    name: 'Spaladium Arena',
    city: 'Bol',
    lat: 42.7583,
    lng: 17.1167,
    capacity: 3000,
    type: 'hall',
  },
  poreč_arena: {
    id: 'porec_arena',
    name: 'Poreč Sports Hall',
    city: 'Poreč',
    lat: 45.2,
    lng: 13.6167,
    capacity: 2500,
    type: 'hall',
  },
  zamet_hall: {
    id: 'zamet_hall',
    name: 'Zamet Hall',
    city: 'Rijeka',
    lat: 45.3333,
    lng: 14.4333,
    capacity: 3500,
    type: 'hall',
  },
  osijek_stadium: {
    id: 'osijek_stadium',
    name: 'Gradski vrt Stadium',
    city: 'Osijek',
    lat: 45.55,
    lng: 18.4167,
    capacity: 18800,
    type: 'stadium',
  },
  dinamo_stadium: {
    id: 'dinamo_stadium',
    name: 'Dinamo Stadium',
    city: 'Zagreb',
    lat: 45.7917,
    lng: 16.2167,
    capacity: 36000,
    type: 'stadium',
  },
  jarun: {
    id: 'jarun',
    name: 'Jarun Lake',
    city: 'Zagreb',
    lat: 45.815,
    lng: 15.9833,
    capacity: 50000,
    type: 'arena',
  },
  marjan_split: {
    id: 'marjan_split',
    name: 'Marjan Outdoor',
    city: 'Split',
    lat: 43.5167,
    lng: 16.4167,
    capacity: 10000,
    type: 'arena',
  },
};
