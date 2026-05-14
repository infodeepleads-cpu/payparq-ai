import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const EARTH_RADIUS_KM = 6371;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseInt(searchParams.get('radius') || '100');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'latitude and longitude required' },
        { status: 400 }
      );
    }

    const client = supabaseAdmin;
    if (!client) {
      return NextResponse.json({ lots: [], error: 'supabase_not_configured' }, { status: 500 });
    }

    const { data: locations, error } = await client
      .from('locations')
      .select('id,name,address,latitude,longitude,display_id,canonical_slug,rate_per_hour,base_price_hourly,total_spots')
      .eq('verification_status', 'verified')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ lots: [], error: error.message }, { status: 500 });
    }

    type Location = {
      id: string;
      name: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      display_id?: string;
      canonical_slug?: string;
      rate_per_hour?: number;
      base_price_hourly?: number;
      total_spots?: number;
    };

    const nearbyLots = (locations || [])
      .map((loc: Location) => {
        const distance = haversineDistance(
          lat,
          lng,
          loc.latitude || 0,
          loc.longitude || 0
        );
        return { ...loc, distance };
      })
      .filter((loc) => loc.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20)
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        distance: Math.round(loc.distance * 10) / 10,
        lat: loc.latitude,
        lng: loc.longitude,
        displayId: loc.display_id,
        href: `/locations/${loc.canonical_slug}`,
        price: loc.rate_per_hour || loc.base_price_hourly || 0,
        spots: loc.total_spots || 0,
      }));

    return NextResponse.json({ lots: nearbyLots, count: nearbyLots.length });
  } catch (error) {
    console.error('Nearby parking API error:', error);
    return NextResponse.json(
      { lots: [], error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
