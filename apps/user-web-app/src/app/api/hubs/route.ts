import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';
import { formatEuroLabel, normalizeLocationName, resolveScannerTruthPriceEuro } from '@/lib/locationPricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = supabaseAdmin ?? supabase;
    if (!client) {
      return NextResponse.json({ hubs: [], error: 'supabase_not_configured' }, { status: 500 });
    }
    const { data: locations, error } = await client
      .from('locations')
      .select('id,name,address,display_id,canonical_slug,latitude,longitude,verification_metadata,rate_per_hour,base_price_hourly,base_price_daily,base_price_monthly,rate_per_hour_floor,rate_per_hour_ceiling,base_price_daily_floor,base_price_daily_ceiling,base_price_monthly_floor,base_price_monthly_ceiling')
      .contains('verification_metadata', { hub_enabled: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .not('canonical_slug', 'is', null)
      .limit(200);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        hubs: [],
        error: error.message
      }, { status: 500 });
    }

    {
      const typed = (locations || []) as DbLocation[];
      console.log('Hubs API locations sample canonical_slugs:',
        typed.slice(0, 8).map((l) => l.canonical_slug));
    }

    type DbLocation = {
      id: string;
      name: string;
      address?: string;
      display_id?: string;
      canonical_slug?: string;
      latitude?: number;
      longitude?: number;
      verification_metadata?: Record<string, unknown>;
      rate_per_hour?: number;
      base_price_hourly?: number;
      base_price_daily?: number;
      base_price_monthly?: number;
      rate_per_hour_floor?: number;
      rate_per_hour_ceiling?: number;
      base_price_daily_floor?: number;
      base_price_daily_ceiling?: number;
      base_price_monthly_floor?: number;
      base_price_monthly_ceiling?: number;
    };

    type Hub = {
      id: string;
      displayId: string;
      name: string;
      label: string;
      href: string;
      lat: number;
      lng: number;
      priceLabel: string;
    };

    const hubs: Hub[] = await Promise.all(
      (locations || []).map(async (loc: DbLocation) => {
        const name = normalizeLocationName(loc.name);
        const label = 'PayParq hub';
        const href = `/locations/${String(loc.canonical_slug ?? '').trim()}`;
        const lat = typeof loc.latitude === 'number' ? loc.latitude : 0;
        const lng = typeof loc.longitude === 'number' ? loc.longitude : 0;
        const displayId = String(loc.display_id || loc.id);

        const finalPrice = resolveScannerTruthPriceEuro(loc, 'hourly');
        const priceLabel = formatEuroLabel(finalPrice);

        return { id: loc.id, displayId, name, label, href, lat, lng, priceLabel };
      })
    );

    console.log(`Hubs API returned ${hubs.length} hubs`);
    console.log('Hubs API href sample:', hubs.slice(0, 8).map((h) => h.href));
    return NextResponse.json({ hubs });
  } catch (error) {
    console.error('Hubs API error:', error);
    return NextResponse.json({
      hubs: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
