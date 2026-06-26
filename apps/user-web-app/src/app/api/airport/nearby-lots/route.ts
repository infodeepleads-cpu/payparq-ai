import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('id, name, address, canonical_slug, latitude, longitude, base_price_hourly, base_price_daily, base_price_monthly, verification_metadata, verification_photos, shuttle_enabled, valet_enabled, rating, ratings_count')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(50);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ lots: [] });
    }

    if (!data?.length) {
      return NextResponse.json({ lots: [] });
    }

    const lotsWithDistance = data
      .map((loc: any) => {
        const R = 6371;
        const dLat = ((loc.latitude - lat) * Math.PI) / 180;
        const dLon = ((loc.longitude - lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat * Math.PI) / 180) * Math.cos((loc.latitude * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const dailyPrice = loc.base_price_daily || loc.base_price_hourly || loc.base_price_monthly || 0;
        const photos = loc.verification_photos || [];

        return {
          id: loc.id,
          name: loc.name,
          address: loc.address,
          slug: loc.canonical_slug,
          distance,
          dailyPrice,
          image: photos[0],
          shuttle_enabled: loc.shuttle_enabled,
          valet_enabled: loc.valet_enabled,
          rating: loc.rating || 0,
          ratings_count: loc.ratings_count || 0,
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);

    return NextResponse.json({ lots: lotsWithDistance });
  } catch (error) {
    console.error('Error fetching nearby lots:', error);
    return NextResponse.json({ lots: [] });
  }
}
