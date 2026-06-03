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
    lat: 43.2833,
    lng: 17.0167,
    description: 'Find parking in Makarska with 50+ reservable spaces. Secure beach town parking at the best prices.',
  },
  brela: {
    id: 'brela',
    name: 'Brela',
    region: 'Dalmatia',
    lat: 43.3167,
    lng: 16.9667,
    description: 'Find parking in Brela with 40+ reservable spaces. Easy access to beautiful Adriatic coast.',
  },
  baska_voda: {
    id: 'baska_voda',
    name: 'Baška Voda',
    region: 'Dalmatia',
    lat: 43.35,
    lng: 17.0,
    description: 'Find parking in Baška Voda with 45+ reservable spaces. Book your spot near the waterfront.',
  },
  okrug_gornji: {
    id: 'okrug_gornji',
    name: 'Okrug Gornji',
    region: 'Dalmatia',
    lat: 43.2117,
    lng: 16.9833,
    description: 'Find parking in Okrug Gornji with 35+ reservable spaces. Convenient coastal parking.',
  },
  trogir: {
    id: 'trogir',
    name: 'Trogir',
    region: 'Dalmatia',
    lat: 43.2167,
    lng: 16.2667,
    description: 'Find parking in Trogir with 60+ reservable spaces. Historic town parking made easy.',
  },
  kastela: {
    id: 'kastela',
    name: 'Kaštela',
    region: 'Dalmatia',
    lat: 43.1917,
    lng: 16.4167,
    description: 'Find parking in Kaštela with 55+ reservable spaces. Central Dalmatian location.',
  },
  sinj: {
    id: 'sinj',
    name: 'Sinj',
    region: 'Dalmatia',
    lat: 43.2,
    lng: 16.7667,
    description: 'Find parking in Sinj with 30+ reservable spaces. Inland Dalmatian parking.',
  },
  imotski: {
    id: 'imotski',
    name: 'Imotski',
    region: 'Dalmatia',
    lat: 43.4333,
    lng: 17.1833,
    description: 'Find parking in Imotski with 25+ reservable spaces. Mountain town parking.',
  },
  bol: {
    id: 'bol',
    name: 'Bol',
    region: 'Dalmatia',
    lat: 42.7667,
    lng: 17.1167,
    description: 'Find parking in Bol with 35+ reservable spaces. Brač island parking.',
  },
  hvar: {
    id: 'hvar',
    name: 'Hvar',
    region: 'Dalmatia',
    lat: 42.9417,
    lng: 16.8417,
    description: 'Find parking in Hvar with 40+ reservable spaces. Luxury island destination.',
  },
  vis: {
    id: 'vis',
    name: 'Vis',
    region: 'Dalmatia',
    lat: 42.8333,
    lng: 16.15,
    description: 'Find parking in Vis with 20+ reservable spaces. Remote island parking.',
  },
  korcula: {
    id: 'korcula',
    name: 'Korčula',
    region: 'Dalmatia',
    lat: 42.9667,
    lng: 17.1167,
    description: 'Find parking in Korčula with 38+ reservable spaces. Medieval island town.',
  },
  orebic: {
    id: 'orebic',
    name: 'Orebić',
    region: 'Dalmatia',
    lat: 42.95,
    lng: 17.1,
    description: 'Find parking in Orebić with 30+ reservable spaces. Stunning peninsula parking.',
  },
  metaković: {
    id: 'metakovic',
    name: 'Metaković',
    region: 'Dalmatia',
    lat: 43.0333,
    lng: 17.3333,
    description: 'Find parking in Metaković with 25+ reservable spaces. Neretva valley parking.',
  },
  mostar: {
    id: 'mostar',
    name: 'Mostar',
    region: 'Bosnia',
    lat: 43.2,
    lng: 17.8167,
    description: 'Find parking in Mostar with 50+ reservable spaces. Historic bridge city parking.',
  },
};
