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

    // Bounding box ~55km around the requested coordinates
    const delta = 0.5;
    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', lat - delta)
      .lte('latitude', lat + delta)
      .gte('longitude', lng - delta)
      .lte('longitude', lng + delta)
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
        const hourlyPrice = loc.base_price_hourly || loc.rate_per_hour || 0;
        const monthlyPrice = loc.base_price_monthly || dailyPrice * 25 || 0;
        const photos = loc.verification_photos || [];

        return {
          id: loc.id,
          display_id: loc.display_id,
          name: loc.name,
          address: loc.address,
          slug: loc.canonical_slug,
          distance,
          dailyPrice,
          hourlyPrice,
          monthlyPrice,
          image: photos[0],
          shuttle_enabled: loc.shuttle_enabled,
          valet_enabled: loc.valet_enabled,
          rating: loc.review_score || 0,
          ratings_count: loc.review_count || 0,
          verification_metadata: loc.verification_metadata,
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
