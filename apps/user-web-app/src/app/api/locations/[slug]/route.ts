import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const client = supabaseAdmin;
    if (!client) {
      return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
    }

    const { data, error } = await client
      .from('locations')
      .select(
        'id, name, canonical_slug, address, display_id, latitude, longitude, ' +
        'base_price_hourly, base_price_daily, base_price_monthly, verification_metadata, verification_photos'
      )
      .eq('canonical_slug', slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ location: data });
  } catch (err) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
