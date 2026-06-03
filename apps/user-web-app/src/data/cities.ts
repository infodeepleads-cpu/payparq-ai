export interface City {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  description: string;
}

export const CITIES: Record<string, City> = {
  makarska: {
    id: 'makarska',
    name: 'Makarska',
    region: 'Dalmatia',
    lat: 43.2972,
    lng: 17.0183,
    description: 'Find parking in Makarska with 50+ reservable spaces. Secure beach town parking at the best prices.',
  },
  brela: {
    id: 'brela',
    name: 'Brela',
    region: 'Dalmatia',
    lat: 43.3683,
    lng: 16.9467,
    description: 'Find parking in Brela with 40+ reservable spaces. Easy access to beautiful Adriatic coast.',
  },
  baska_voda: {
    id: 'baska_voda',
    name: 'Baška Voda',
    region: 'Dalmatia',
    lat: 43.3606,
    lng: 16.9619,
    description: 'Find parking in Baška Voda with 45+ reservable spaces. Book your spot near the waterfront.',
  },
  okrug_gornji: {
    id: 'okrug_gornji',
    name: 'Okrug Gornji',
    region: 'Dalmatia',
    lat: 43.4928,
    lng: 16.2764,
    description: 'Find parking in Okrug Gornji with 35+ reservable spaces. Convenient coastal parking.',
  },
  trogir: {
    id: 'trogir',
    name: 'Trogir',
    region: 'Dalmatia',
    lat: 43.5167,
    lng: 16.2500,
    description: 'Find parking in Trogir with 60+ reservable spaces. Historic town parking made easy.',
  },
  kastela: {
    id: 'kastela',
    name: 'Kaštela',
    region: 'Dalmatia',
    lat: 43.5417,
    lng: 16.4500,
    description: 'Find parking in Kaštela with 55+ reservable spaces. Central Dalmatian location.',
  },
  sinj: {
    id: 'sinj',
    name: 'Sinj',
    region: 'Dalmatia',
    lat: 43.7017,
    lng: 16.6378,
    description: 'Find parking in Sinj with 30+ reservable spaces. Inland Dalmatian parking.',
  },
  imotski: {
    id: 'imotski',
    name: 'Imotski',
    region: 'Dalmatia',
    lat: 43.4469,
    lng: 17.2119,
    description: 'Find parking in Imotski with 25+ reservable spaces. Mountain town parking.',
  },
  bol: {
    id: 'bol',
    name: 'Bol',
    region: 'Dalmatia',
    lat: 43.2625,
    lng: 16.6556,
    description: 'Find parking in Bol with 35+ reservable spaces. Brač island parking.',
  },
  hvar: {
    id: 'hvar',
    name: 'Hvar',
    region: 'Dalmatia',
    lat: 43.1728,
    lng: 16.4417,
    description: 'Find parking in Hvar with 40+ reservable spaces. Luxury island destination.',
  },
  vis: {
    id: 'vis',
    name: 'Vis',
    region: 'Dalmatia',
    lat: 43.0603,
    lng: 16.1803,
    description: 'Find parking in Vis with 20+ reservable spaces. Remote island parking.',
  },
  korcula: {
    id: 'korcula',
    name: 'Korčula',
    region: 'Dalmatia',
    lat: 42.9597,
    lng: 17.1333,
    description: 'Find parking in Korčula with 38+ reservable spaces. Medieval island town.',
  },
  orebic: {
    id: 'orebic',
    name: 'Orebić',
    region: 'Dalmatia',
    lat: 42.9819,
    lng: 17.1864,
    description: 'Find parking in Orebić with 30+ reservable spaces. Stunning peninsula parking.',
  },
  metaković: {
    id: 'metakovic',
    name: 'Metaković',
    region: 'Dalmatia',
    lat: 43.0581,
    lng: 17.6453,
    description: 'Find parking in Metaković with 25+ reservable spaces. Neretva valley parking.',
  },
  mostar: {
    id: 'mostar',
    name: 'Mostar',
    region: 'Bosnia',
    lat: 43.3436,
    lng: 17.8078,
    description: 'Find parking in Mostar with 50+ reservable spaces. Historic bridge city parking.',
  },
};
