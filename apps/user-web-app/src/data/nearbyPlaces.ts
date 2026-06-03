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
    { name: 'City Walls', distance: 15.8, lat: 42.6418, lng: 18.1089, type: 'Landmark', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: "Rector's Palace", distance: 15.8, lat: 42.6413, lng: 18.1093, type: 'Palace', image: 'https://images.unsplash.com/photo-1504681869696-d977e9d34c4b?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Dubrovnik Cathedral', distance: 15.8, lat: 42.6410, lng: 18.1088, type: 'Church', image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'St. Blaise Church', distance: 16.0, lat: 42.6425, lng: 18.1075, type: 'Church', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'War Photography Museum', distance: 15.9, lat: 42.6420, lng: 18.1080, type: 'Museum', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Lokrum Island', distance: 15.2, lat: 42.6380, lng: 18.1150, type: 'Island', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format&q=80' },
    { name: 'Lapad Beach', distance: 17.3, lat: 42.6500, lng: 18.0950, type: 'Beach', image: 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=400&h=300&fit=crop&auto=format&q=80' },
  ],
};
