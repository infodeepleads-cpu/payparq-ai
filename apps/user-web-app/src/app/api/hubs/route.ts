import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get('debug') === '1';

  try {
    // Try multiple query methods
    const { data: viaContains, error: e1 } = await supabaseAdmin
      .from('locations')
      .select('id,name,verification_metadata,latitude,longitude')
      .contains('verification_metadata', { hub_enabled: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(5);

    const { data: viaEq, error: e2 } = await supabaseAdmin
      .from('locations')
      .select('id,name,verification_metadata,latitude,longitude')
      .eq('verification_metadata->hub_enabled', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(5);

    const { data: viaFilter, error: e3 } = await supabaseAdmin
      .from('locations')
      .select('id,name,verification_metadata,latitude,longitude')
      .filter('verification_metadata->>hub_enabled', 'eq', 'true')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(5);

    if (debug) {
      return NextResponse.json({
        method1_contains: {
          count: viaContains?.length || 0,
          error: e1?.message,
          sample: viaContains?.[0]
        },
        method2_eq_json: {
          count: viaEq?.length || 0,
          error: e2?.message,
          sample: viaEq?.[0]
        },
        method3_filter_text: {
          count: viaFilter?.length || 0,
          error: e3?.message,
          sample: viaFilter?.[0]
        },
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        using_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
    }

    // Use whichever method returned data
    const locations = viaContains || viaEq || viaFilter;

    if (!locations || locations.length === 0) {
      return NextResponse.json({
        hubs: [],
        error: 'No locations found with any query method',
        errors: [e1?.message, e2?.message, e3?.message].filter(Boolean)
      });
    }

    // Get all hub locations (not just 5)
    const { data: allHubs } = await supabaseAdmin
      .from('locations')
      .select('id,name,address,display_id,latitude,longitude,verification_metadata,city')
      .contains('verification_metadata', { hub_enabled: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(200);

    type DbLocation = {
      id: string;
      name: string;
      address?: string;
      display_id?: string;
      latitude?: number;
      longitude?: number;
      verification_metadata?: Record<string, unknown>;
      city?: string;
    };

    type Hub = {
      id: string;
      name: string;
      label: string;
      href: string;
      lat: number;
      lng: number;
      priceLabel: string;
    };

    const hubs: Hub[] = await Promise.all(
      (allHubs || []).map(async (loc: DbLocation) => {
        const name = String(loc.name || '');
        const label = 'PayParq hub';
        const displayId = String(loc.display_id || '');
        const base = displayId ? displayId.replace(/\s+/g, '-').toLowerCase() : loc.id;
        const href = `/locations/${base}--${loc.id}`;
        const lat = typeof loc.latitude === 'number' ? loc.latitude : 0;
        const lng = typeof loc.longitude === 'number' ? loc.longitude : 0;

        let priceLabel = '€';
        try {
          const { data: pricing } = await supabaseAdmin
            .from('pricing_settings')
            .select('rules_text')
            .eq('location_id', loc.id)
            .eq('active', true)
            .limit(1);

          const rulesText = pricing?.[0]?.rules_text as string | undefined;
          if (rulesText) {
            const match = rulesText.match(/€?\s?(\d+)\s*\/\s*hr/i) || rulesText.match(/\$?\s?(\d+)\s*\/\s*hr/i);
            if (match) priceLabel = `€${match[1]}/hr`;
          }
        } catch {}

        return { id: loc.id, name, label, href, lat, lng, priceLabel };
      })
    );

    return NextResponse.json({ hubs });
  } catch (error) {
    return NextResponse.json({
      hubs: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
