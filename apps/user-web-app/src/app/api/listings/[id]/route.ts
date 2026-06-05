import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = supabaseAdmin;
    if (!client) {
      return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
    }

    const { data, error } = await client
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ location: data });
  } catch (err) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = supabaseAdmin;
    if (!client) {
      return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
    }

    const body = await req.json();
    const { dateConfigs } = body;

    if (!dateConfigs || typeof dateConfigs !== 'object') {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await client
      .from('locations')
      .select('verification_metadata')
      .eq('id', id)
      .single();

    if (fetchErr) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const meta = existing?.verification_metadata || {};

    // Check if any manually-priced date config exists — update base price columns so search reflects the change
    const today = new Date().toISOString().slice(0, 10);
    const todayConfig = dateConfigs[today];
    const locationUpdate: Record<string, unknown> = { verification_metadata: { ...meta, dateConfigs } };

    // Find the most recent manual price (prefer today, else latest date in configs)
    let latestManualHourly: number | null = null;
    let latestManualDaily: number | null = null;
    let latestManualMonthly: number | null = null;

    if (todayConfig?.priceMode === 'manual') {
      latestManualHourly = todayConfig.priceHourly ?? null;
      latestManualDaily = todayConfig.priceDaily ?? null;
      latestManualMonthly = todayConfig.priceMonthly ?? null;
    } else {
      // Use nearest future date with manual pricing
      const futureDates = Object.keys(dateConfigs)
        .filter(d => d >= today && dateConfigs[d].priceMode === 'manual')
        .sort();
      if (futureDates.length > 0) {
        const nearest = dateConfigs[futureDates[0]];
        latestManualHourly = nearest.priceHourly ?? null;
        latestManualDaily = nearest.priceDaily ?? null;
        latestManualMonthly = nearest.priceMonthly ?? null;
      }
    }

    if (latestManualHourly != null) locationUpdate.rate_per_hour = latestManualHourly;
    if (latestManualHourly != null) locationUpdate.base_price_hourly = latestManualHourly;
    if (latestManualDaily != null) locationUpdate.base_price_daily = latestManualDaily;
    if (latestManualMonthly != null) locationUpdate.base_price_monthly = latestManualMonthly;

    const { error: updateErr } = await client
      .from('locations')
      .update(locationUpdate)
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
