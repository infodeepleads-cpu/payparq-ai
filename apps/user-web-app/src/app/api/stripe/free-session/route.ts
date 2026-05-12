import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location_id, email, plate, phone, check_in, check_out, promo_code } = body;

    if (!location_id) {
      return NextResponse.json({ error: 'missing_location_id' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 500 });
    }

    // Parse ISO datetime strings
    const entryTime = check_in ? new Date(check_in).toISOString() : new Date().toISOString();
    const exitTime = check_out ? new Date(check_out).toISOString() : new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 60000));

    // Create session ID (use timestamp-based ID since no Stripe session)
    const sessionId = `free_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const { error } = await supabaseAdmin.from('parking_sessions').insert({
      location_id,
      plate: plate || 'FREE_SESSION',
      mobile: phone || '',
      email: email || '',
      price: 0,
      currency: 'eur',
      stripe_session_id: sessionId,
      payment_status: 'paid',
      status: 'active',
      entry_time: entryTime,
      exit_time: exitTime,
      quantity: 1,
      duration_minutes: durationMinutes,
      stripe_metadata: JSON.stringify({
        location_id,
        check_in,
        check_out,
        ...(promo_code ? { promo_code } : {}),
        source: 'free_promo',
      }),
    });

    if (error) {
      console.error('Free session insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, session_id: sessionId });
  } catch (err) {
    console.error('Free session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
