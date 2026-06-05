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
      .select('id, name, address, capacity, verification_status, display_id, verification_metadata, verification_photos, base_price_hourly, base_price_daily, base_price_monthly, rate_per_hour')
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
    const { error: updateErr } = await client
      .from('locations')
      .update({ verification_metadata: { ...meta, dateConfigs } })
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
