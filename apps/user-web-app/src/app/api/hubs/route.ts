import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: locations } = await supabaseAdmin
      .from('locations')
      .select('id,name,address,display_id,latitude,longitude,verification_metadata,city')
      .contains('verification_metadata', { hub_enabled: true })
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
    };

    const hubs: Hub[] = (locations || []).map((loc: DbLocation) => {
      const name = String(loc.name || '');
      const label = 'PayParq hub';
      const displayId = String(loc.display_id || '');
      const slug = displayId.replace(/\s+/g, '-').toLowerCase();
      const href = `/locations/${slug}`;
      const lat = typeof loc.latitude === 'number' ? loc.latitude! : 0;
      const lng = typeof loc.longitude === 'number' ? loc.longitude! : 0;
      return { id: displayId || loc.id, name, label, href, lat, lng };
    });

    return NextResponse.json({ hubs });
  } catch {
    return NextResponse.json({ hubs: [] }, { status: 200 });
  }
}
