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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = supabaseAdmin;
    if (!client) {
      return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
    }

    const body = await req.json();
    const { verification_metadata: incomingMeta, ...topLevelFields } = body;

    console.log('[PATCH /api/listings] ID:', id);
    console.log('[PATCH /api/listings] Incoming payment_method_mode:', incomingMeta?.payment_method_mode);

    // Read existing metadata via supabaseAdmin (bypasses RLS)
    const { data: existing, error: fetchErr } = await client
      .from('locations')
      .select('verification_metadata')
      .eq('id', id)
      .single();

    if (fetchErr) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const existingMeta = existing?.verification_metadata || {};

    // Deep clone existing metadata to preserve nested structures
    const mergedMeta = JSON.parse(JSON.stringify(existingMeta));

    // Remove old payment method format field
    delete mergedMeta.ticketing_enabled;

    // Override with incoming metadata (form values take precedence)
    // Only merge provided fields to avoid conflicts
    if (incomingMeta) {
      for (const key in incomingMeta) {
        if (incomingMeta[key] !== undefined) {
          mergedMeta[key] = incomingMeta[key];
        }
      }
    }

    // Ensure old ticketing_enabled is completely removed
    delete mergedMeta.ticketing_enabled;

    console.log('[PATCH /api/listings] Merged payment_method_mode:', mergedMeta.payment_method_mode);

    const updatePayload: Record<string, unknown> = {
      ...topLevelFields,
      verification_metadata: mergedMeta,
    };

    console.log('[PATCH /api/listings] Final updatePayload.verification_metadata:', updatePayload.verification_metadata);

    const { error: updateErr } = await client
      .from('locations')
      .update(updatePayload)
      .eq('id', id);

    if (updateErr) {
      console.error('[PATCH /api/listings] Update error:', updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    console.log('[PATCH /api/listings] Update successful for ID:', id);

    // Verify the update by reading it back
    const { data: verified } = await client
      .from('locations')
      .select('verification_metadata')
      .eq('id', id)
      .single();

    console.log('[PATCH /api/listings] Verification read - payment_method_mode:', verified?.verification_metadata?.payment_method_mode);

    // Alert if the saved value doesn't match what we tried to save
    if (incomingMeta?.payment_method_mode && verified?.verification_metadata?.payment_method_mode !== incomingMeta.payment_method_mode) {
      console.warn('[PATCH /api/listings] WARNING: Saved value differs from incoming!', {
        incoming: incomingMeta.payment_method_mode,
        verified: verified?.verification_metadata?.payment_method_mode
      });
    }

    return NextResponse.json({ ok: true, savedPaymentMode: verified?.verification_metadata?.payment_method_mode });
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

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { dateConfigs } = body;

    if (!dateConfigs || typeof dateConfigs !== 'object') {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await client
      .from('locations')
      .select('owner_id, verification_metadata')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (existing.owner_id !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const meta = existing.verification_metadata || {};

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
