import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/referrals/create
 * Create a referral record when a booking is completed
 *
 * Supports both:
 * - Legacy: booking_id, location_id, promo_code_id, amount_cents
 * - New: booking_id, location_id, referral_code, referrer_id, amount_cents
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const {
      booking_id,
      location_id,
      amount_cents,
      referral_code,
      referrer_id,
      // Legacy fields
      promo_code_id,
    } = body;

    if (!booking_id || !amount_cents) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Calculate referral amounts
    const amountNum = Number(amount_cents);
    const traveler_discount_cents = Math.round(amountNum * 0.1);
    const referrer_earning_cents = Math.round(amountNum * 0.1);

    // Handle legacy promo codes (auto_promo_codes)
    if (promo_code_id && !referral_code) {
      const { data, error } = await supabaseAdmin
        .from('referrals')
        .insert([
          {
            booking_id,
            location_id,
            promo_code_id,
            referral_amount: referrer_earning_cents,
            status: 'pending',
            created_at: new Date(),
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ referral: data, type: 'legacy' });
    }

    // Handle new referral codes (user or listing codes)
    if (referral_code && referrer_id) {
      const { data: created, error } = await supabaseAdmin
        .from('booking_referral_codes')
        .insert([
          {
            booking_id,
            referral_code,
            referrer_id,
            referrer_earning_cents,
            traveler_discount_cents,
            booking_status: 'pending',
            created_at: new Date(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update parking_sessions to track referral
      await supabaseAdmin
        .from('parking_sessions')
        .update({
          referral_code,
          referrer_id,
          referral_discount_cents: traveler_discount_cents,
        })
        .eq('id', booking_id);

      return NextResponse.json({
        referral: created,
        type: 'v2',
        traveler_discount_cents,
        referrer_earning_cents,
      });
    }

    return NextResponse.json({ error: 'Invalid referral parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}
