import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { booking_id, location_id, promo_code_id, amount_cents } = await req.json();

    if (!booking_id || !location_id || !promo_code_id || amount_cents === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Calculate 10% referral
    const referral_amount = Math.round(amount_cents * 0.1);

    // Create referral record
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .insert([
        {
          booking_id,
          location_id,
          promo_code_id,
          referral_amount,
          status: 'pending',
          created_at: new Date(),
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ referral: data });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}
