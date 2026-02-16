import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: locations, error } = await supabaseAdmin
      .from('locations')
      .select('id,name,address,display_id,latitude,longitude,verification_metadata')
      .contains('verification_metadata', { hub_enabled: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(200);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        hubs: [],
        error: error.message
      }, { status: 500 });
    }

    type DbLocation = {
      id: string;
      name: string;
      address?: string;
      display_id?: string;
      latitude?: number;
      longitude?: number;
      verification_metadata?: Record<string, unknown>;
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
      (locations || []).map(async (loc: DbLocation) => {
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
            const match = rulesText.match(/(?:€|\$|eur)?\s*(\d+(?:[.,]\d+)?)\s*(?:per\s*)?(?:\/)?\s*(?:hr|hour|hours|hourly)\b/i);
            if (match) {
              const v = match[1].replace(',', '.');
              priceLabel = `€${v}/hr`;
            }
          }
        } catch {}

        return { id: loc.id, name, label, href, lat, lng, priceLabel };
      })
    );

    console.log(`Hubs API returned ${hubs.length} hubs`);
    return NextResponse.json({ hubs });
  } catch (error) {
    console.error('Hubs API error:', error);
    return NextResponse.json({
      hubs: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
