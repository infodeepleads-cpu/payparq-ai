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
    city: 'Split',
    lat: 43.5083,
    lng: 16.3983,
    capacity: 12000,
    type: 'arena',
  },
  gradski_vrt: {
    id: 'gradski_vrt',
    name: 'Gradski vrt',
    city: 'Osijek',
    lat: 45.5508,
    lng: 18.6958,
    capacity: 18800,
    type: 'stadium',
  },
  rujevica: {
    id: 'rujevica',
    name: 'Stadion Rujevica',
    city: 'Rijeka',
    lat: 45.3253,
    lng: 14.4378,
    capacity: 8279,
    type: 'stadium',
  },
};
