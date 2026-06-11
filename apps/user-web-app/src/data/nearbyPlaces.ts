export interface NearbyPlace {
  name: string;
  distance: number;
  lat: number;
  lng: number;
  type?: string;
  image?: string;
}

export const NEARBY_PLACES: Record<string, NearbyPlace[]> = {
  split: [
    { name: 'Marjan Park', distance: 11.2, lat: 43.5167, lng: 16.4333, type: 'Park', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: "Diocletian's Palace", distance: 12.0, lat: 43.5084, lng: 16.4402, type: 'Landmark', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Split Town Center', distance: 11.8, lat: 43.5112, lng: 16.4381, type: 'City Center', image: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Bačvice Beach', distance: 12.7, lat: 43.5067, lng: 16.4489, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Split Dalmatian Museum', distance: 12.0, lat: 43.5084, lng: 16.4402, type: 'Museum', image: 'https://images.unsplash.com/photo-1532619927891-8a373008e6f3?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Fruit Palace', distance: 12.1, lat: 43.5077, lng: 16.4415, type: 'Market', image: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec09?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Mestrović Gallery', distance: 7.4, lat: 43.5200, lng: 16.3850, type: 'Gallery', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Split Archaeological Museum', distance: 11.4, lat: 43.5150, lng: 16.4350, type: 'Museum', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  zadar: [
    { name: 'Zadar Old Town', distance: 9.4, lat: 44.1149, lng: 15.2298, type: 'City Center', image: 'https://images.unsplash.com/photo-1516595104734-47fc24e4bfed?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Sea Organ', distance: 10.1, lat: 44.1196, lng: 15.2214, type: 'Landmark', image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Sun Salutation', distance: 10.1, lat: 44.1195, lng: 15.2213, type: 'Installation', image: 'https://images.unsplash.com/photo-1495446815901-a7297e3ffe35?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Museum of Ancient Glass', distance: 9.4, lat: 44.1148, lng: 15.2297, type: 'Museum', image: 'https://images.unsplash.com/photo-1532619927891-8a373008e6f3?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'St. Donatus Church', distance: 9.4, lat: 44.1146, lng: 15.2296, type: 'Landmark', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Cosmacendi Palace', distance: 9.3, lat: 44.1150, lng: 15.2305, type: 'Palace', image: 'https://images.unsplash.com/photo-1504681869696-d977e9d34c4b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Zadar City Beaches', distance: 9.0, lat: 44.1200, lng: 15.2350, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Zadar Town Walls', distance: 9.4, lat: 44.1140, lng: 15.2290, type: 'Historical Site', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  zagreb: [
    { name: 'Ban Jelačić Square', distance: 10.5, lat: 45.8150, lng: 15.9819, type: 'City Center', image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Croatian National Theatre', distance: 10.2, lat: 45.8085, lng: 15.9769, type: 'Theatre', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Mirogoj Cemetery', distance: 12.2, lat: 45.8270, lng: 15.9680, type: 'Cemetery', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Museum of Broken Relationships', distance: 10.9, lat: 45.8166, lng: 15.9769, type: 'Museum', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Zagreb Botanical Garden', distance: 11.0, lat: 45.8163, lng: 15.9730, type: 'Park', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: "St. Mark's Church", distance: 10.9, lat: 45.8168, lng: 15.9769, type: 'Church', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Museum of Contemporary Art', distance: 10.9, lat: 45.8205, lng: 15.9823, type: 'Museum', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Maksimir Park', distance: 11.1, lat: 45.8300, lng: 16.0000, type: 'Park', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  dubrovnik: [
    { name: 'Dubrovnik Old Town', distance: 15.8, lat: 42.6416, lng: 18.1087, type: 'City Center', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'City Walls', distance: 15.8, lat: 42.6418, lng: 18.1089, type: 'Landmark', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: "Rector's Palace", distance: 15.8, lat: 42.6413, lng: 18.1093, type: 'Palace', image: 'https://images.unsplash.com/photo-1504681869696-d977e9d34c4b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Lokrum Island', distance: 15.2, lat: 42.6380, lng: 18.1150, type: 'Island', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
  ],

  // Cities
  makarska: [
    { name: 'Makarska Riviera Beach', distance: 0.3, lat: 43.295, lng: 17.017, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Biokovo Nature Park', distance: 8.0, lat: 43.338, lng: 17.054, type: 'Nature', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Makarska Old Town', distance: 0.5, lat: 43.298, lng: 17.022, type: 'City Center', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Brela Beach', distance: 11.0, lat: 43.368, lng: 16.947, type: 'Beach', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  brela: [
    { name: 'Punta Rata Beach', distance: 0.4, lat: 43.374, lng: 16.943, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Makarska', distance: 11.0, lat: 43.297, lng: 17.018, type: 'City', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Baška Voda', distance: 4.5, lat: 43.361, lng: 16.962, type: 'Town', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Biokovo Skywalk', distance: 15.0, lat: 43.338, lng: 17.054, type: 'Attraction', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  baska_voda: [
    { name: 'Baška Voda Promenade', distance: 0.3, lat: 43.361, lng: 16.963, type: 'Promenade', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Brela', distance: 4.5, lat: 43.368, lng: 16.947, type: 'Town', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Makarska', distance: 7.0, lat: 43.297, lng: 17.018, type: 'City', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Biokovo Nature Park', distance: 12.0, lat: 43.338, lng: 17.054, type: 'Nature', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  okrug_gornji: [
    { name: 'Okrug Gornji Beach', distance: 0.5, lat: 43.490, lng: 16.280, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Trogir Old Town', distance: 4.0, lat: 43.517, lng: 16.250, type: 'UNESCO Site', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Čiovo Island', distance: 1.0, lat: 43.496, lng: 16.275, type: 'Island', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Split Airport', distance: 8.0, lat: 43.539, lng: 16.298, type: 'Airport', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  trogir: [
    { name: 'Trogir Old Town (UNESCO)', distance: 0.2, lat: 43.517, lng: 16.250, type: 'UNESCO Site', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Kamerlengo Fortress', distance: 0.4, lat: 43.515, lng: 16.247, type: 'Fortress', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Čiovo Island', distance: 0.5, lat: 43.496, lng: 16.275, type: 'Island', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Split Airport', distance: 7.0, lat: 43.539, lng: 16.298, type: 'Airport', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  kastela: [
    { name: 'Kaštel Gomilica', distance: 1.5, lat: 43.546, lng: 16.433, type: 'Fortress', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Kaštela Bay', distance: 0.5, lat: 43.540, lng: 16.440, type: 'Bay', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Split', distance: 15.0, lat: 43.508, lng: 16.440, type: 'City', image: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Trogir', distance: 10.0, lat: 43.517, lng: 16.250, type: 'UNESCO Town', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  sinj: [
    { name: 'Sinjska Alka Arena', distance: 0.3, lat: 43.702, lng: 16.638, type: 'Arena', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Cetina River', distance: 3.0, lat: 43.690, lng: 16.610, type: 'River', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Our Lady of Sinj Shrine', distance: 0.4, lat: 43.703, lng: 16.640, type: 'Church', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Trilj', distance: 12.0, lat: 43.629, lng: 16.708, type: 'Town', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  imotski: [
    { name: 'Blue Lake (Modro jezero)', distance: 1.0, lat: 43.446, lng: 17.216, type: 'Lake', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Red Lake (Crveno jezero)', distance: 1.5, lat: 43.449, lng: 17.208, type: 'Lake', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Imotski Old Town', distance: 0.3, lat: 43.448, lng: 17.213, type: 'Town', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Topana Fortress', distance: 0.5, lat: 43.450, lng: 17.215, type: 'Fortress', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  bol: [
    { name: 'Zlatni Rat Beach', distance: 1.8, lat: 43.256, lng: 16.637, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Dominican Monastery', distance: 0.6, lat: 43.263, lng: 16.657, type: 'Monastery', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Bol Promenade', distance: 0.2, lat: 43.263, lng: 16.655, type: 'Promenade', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Vidova Gora Peak', distance: 7.0, lat: 43.310, lng: 16.670, type: 'Mountain', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  hvar: [
    { name: 'Hvar Fortress (Fortica)', distance: 0.8, lat: 43.175, lng: 16.439, type: 'Fortress', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Hvar Town Square', distance: 0.2, lat: 43.172, lng: 16.442, type: 'Landmark', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Pakleni Islands', distance: 3.0, lat: 43.155, lng: 16.408, type: 'Islands', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Stari Grad Plain (UNESCO)', distance: 22.0, lat: 43.184, lng: 16.594, type: 'UNESCO Site', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  vis: [
    { name: 'Vis Town', distance: 0.3, lat: 43.061, lng: 16.180, type: 'Town', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Blue Cave (Modra špilja)', distance: 12.0, lat: 43.003, lng: 16.096, type: 'Cave', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Komiža', distance: 10.0, lat: 43.044, lng: 16.088, type: 'Town', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Stiniva Cove', distance: 8.0, lat: 43.031, lng: 16.204, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  korcula: [
    { name: 'Korčula Old Town', distance: 0.2, lat: 42.960, lng: 17.133, type: 'UNESCO Site', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: "Marco Polo's House", distance: 0.3, lat: 42.961, lng: 17.136, type: 'Museum', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Badija Island', distance: 4.0, lat: 42.940, lng: 17.100, type: 'Island', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Pelješac Peninsula', distance: 3.0, lat: 42.982, lng: 17.186, type: 'Peninsula', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  orebic: [
    { name: 'Orebić Beach', distance: 0.4, lat: 42.980, lng: 17.183, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Franciscan Monastery', distance: 1.0, lat: 42.985, lng: 17.178, type: 'Monastery', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Korčula (ferry)', distance: 3.5, lat: 42.960, lng: 17.133, type: 'Town', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Pelješac Wine Route', distance: 5.0, lat: 43.010, lng: 17.250, type: 'Wine Region', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  metaković: [
    { name: 'Neretva Delta', distance: 5.0, lat: 43.022, lng: 17.443, type: 'Nature', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Narona Archaeological Museum', distance: 2.0, lat: 43.052, lng: 17.617, type: 'Museum', image: 'https://images.unsplash.com/photo-1532619927891-8a373008e6f3?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Ploče', distance: 10.0, lat: 43.057, lng: 17.432, type: 'Town', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Mostar', distance: 35.0, lat: 43.344, lng: 17.808, type: 'City', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  mostar: [
    { name: 'Stari Most (Old Bridge)', distance: 0.3, lat: 43.337, lng: 17.815, type: 'UNESCO Bridge', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Kujundžiluk Bazaar', distance: 0.4, lat: 43.338, lng: 17.814, type: 'Bazaar', image: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec09?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Blagaj Tekke', distance: 12.0, lat: 43.255, lng: 17.903, type: 'Monastery', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Kravice Waterfalls', distance: 40.0, lat: 43.155, lng: 17.608, type: 'Waterfall', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
  ],

  rijeka: [
    { name: 'Rijeka City Center', distance: 0.3, lat: 45.3271, lng: 14.4422, type: 'City Center', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Trsat Castle', distance: 2.5, lat: 45.3338, lng: 14.4500, type: 'Castle', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Korzo Promenade', distance: 0.4, lat: 45.3261, lng: 14.4414, type: 'Promenade', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Rijeka Harbor', distance: 0.5, lat: 45.3255, lng: 14.4380, type: 'Harbor', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Natural History Museum', distance: 1.0, lat: 45.3290, lng: 14.4460, type: 'Museum', image: 'https://images.unsplash.com/photo-1532619927891-8a373008e6f3?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Opatija', distance: 15.0, lat: 45.3378, lng: 14.3050, type: 'Riviera Town', image: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  porec: [
    { name: 'Euphrasian Basilica (UNESCO)', distance: 0.3, lat: 45.2272, lng: 13.5943, type: 'UNESCO Site', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Poreč Old Town', distance: 0.2, lat: 45.2268, lng: 13.5942, type: 'City Center', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Zelena Laguna Beach', distance: 4.5, lat: 45.2000, lng: 13.5700, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Rovinj', distance: 40.0, lat: 45.0808, lng: 13.6360, type: 'Town', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Vrsar', distance: 12.0, lat: 45.1500, lng: 13.6000, type: 'Town', image: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  rovinj: [
    { name: 'Rovinj Old Town', distance: 0.2, lat: 45.0808, lng: 13.6390, type: 'City Center', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: "St. Euphemia's Church", distance: 0.5, lat: 45.0815, lng: 13.6385, type: 'Church', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Golden Cape Forest Park', distance: 1.5, lat: 45.0650, lng: 13.6300, type: 'Nature Park', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Rovinj Archipelago', distance: 2.0, lat: 45.0700, lng: 13.6200, type: 'Islands', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Poreč', distance: 40.0, lat: 45.2208, lng: 13.5960, type: 'Town', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  pula: [
    { name: 'Pula Arena (Roman Amphitheatre)', distance: 0.3, lat: 44.8732, lng: 13.8497, type: 'Landmark', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Temple of Augustus', distance: 0.5, lat: 44.8685, lng: 13.8482, type: 'Landmark', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Pula City Center', distance: 0.4, lat: 44.8683, lng: 13.8481, type: 'City Center', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Verudela Beach', distance: 4.0, lat: 44.8400, lng: 13.8500, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Rovinj', distance: 38.0, lat: 45.0808, lng: 13.6360, type: 'Town', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  osijek: [
    { name: 'Osijek Tvrđa (Fortress)', distance: 0.4, lat: 45.5570, lng: 18.6950, type: 'Fortress', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Osijek City Center', distance: 0.3, lat: 45.5550, lng: 18.6940, type: 'City Center', image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Copacabana Beach', distance: 3.0, lat: 45.5700, lng: 18.7100, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Zoo Osijek', distance: 2.5, lat: 45.5600, lng: 18.7200, type: 'Zoo', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Drava River Promenade', distance: 0.8, lat: 45.5620, lng: 18.6980, type: 'Promenade', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
  ],

  // Venues
  poljud: [
    { name: 'Marjan Hill Park', distance: 1.5, lat: 43.517, lng: 16.433, type: 'Park', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: "Diocletian's Palace", distance: 3.2, lat: 43.508, lng: 16.440, type: 'Landmark', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Bačvice Beach', distance: 4.0, lat: 43.507, lng: 16.449, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Split City Center', distance: 2.8, lat: 43.511, lng: 16.438, type: 'City Center', image: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  maksimir: [
    { name: 'Maksimir Park', distance: 0.5, lat: 45.830, lng: 16.000, type: 'Park', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Zagreb Zoo', distance: 0.8, lat: 45.826, lng: 15.998, type: 'Zoo', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Ban Jelačić Square', distance: 5.0, lat: 45.815, lng: 15.982, type: 'City Center', image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Zagreb Cathedral', distance: 4.8, lat: 45.814, lng: 15.978, type: 'Church', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  arena_zagreb: [
    { name: 'Ban Jelačić Square', distance: 3.5, lat: 45.815, lng: 15.982, type: 'City Center', image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Bundek Lake', distance: 1.0, lat: 45.788, lng: 15.985, type: 'Park', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Jarun Lake', distance: 2.5, lat: 45.788, lng: 15.943, type: 'Recreation', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Zagreb Museum of Art', distance: 3.8, lat: 45.810, lng: 15.979, type: 'Museum', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  spaladium_arena: [
    { name: 'Split City Center', distance: 3.0, lat: 43.511, lng: 16.438, type: 'City Center', image: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: "Diocletian's Palace", distance: 3.2, lat: 43.508, lng: 16.440, type: 'Landmark', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Bačvice Beach', distance: 3.5, lat: 43.507, lng: 16.449, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Kaštelet Church', distance: 2.8, lat: 43.515, lng: 16.410, type: 'Church', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  gradski_vrt: [
    { name: 'Osijek City Center', distance: 2.5, lat: 45.555, lng: 18.695, type: 'City Center', image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Osijek Fortress (Tvrđa)', distance: 2.8, lat: 45.561, lng: 18.697, type: 'Fortress', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Drava River Promenade', distance: 2.0, lat: 45.562, lng: 18.680, type: 'Promenade', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Copacabana Beach Osijek', distance: 3.0, lat: 45.570, lng: 18.643, type: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
  rujevica: [
    { name: 'Rijeka City Center', distance: 2.5, lat: 45.327, lng: 14.442, type: 'City Center', image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Trsat Castle', distance: 3.2, lat: 45.338, lng: 14.455, type: 'Castle', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Rijeka Korzo Promenade', distance: 2.8, lat: 45.327, lng: 14.441, type: 'Promenade', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Opatija Riviera', distance: 15.0, lat: 45.337, lng: 14.307, type: 'Riviera', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
};
