import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function resolveStripeSecretKey(): string | null {
  const candidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_KEY,
    process.env.STRIPE_API_SECRET,
    process.env.STRIPE_PRIVATE_KEY,
    process.env.STRIPE_LIVE_SECRET_KEY,
    process.env.STRIPE_TEST_SECRET_KEY,
    process.env.NEXT_PRIVATE_STRIPE_SECRET_KEY,
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY,
  ];
  for (const rawValue of candidates) {
    const secret = (rawValue ?? '').trim().replace(/^['"]+|['"]+$/g, '');
    if (!secret) continue;
    if (!/^sk_(test|live)_/i.test(secret)) continue;
    if (/your_stripe|replace_me|changeme|example/i.test(secret)) continue;
    return secret;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const secretKey = resolveStripeSecretKey();
    if (!secretKey) {
      return NextResponse.json({ valid: false, error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-03-31.basil' as unknown as Stripe.LatestApiVersion,
    });

    const { code, location_id, amount_cents } = await req.json();

    if (!code || !location_id) {
      return NextResponse.json({ valid: false, error: 'Missing parameters' }, { status: 400 });
    }

    const upperCode = String(code).toUpperCase().trim();

    // Fetch the location's promo code label from Supabase
    let locationPromoLabel = 'FREE100';
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('locations')
        .select('verification_metadata')
        .eq('id', location_id)
        .limit(1)
        .single();

      if (data?.verification_metadata) {
        const meta = data.verification_metadata as Record<string, unknown>;
        const raw = (
          meta['promotion_code_label'] ??
          meta['promotionCodeLabel'] ??
          meta['coupon_name'] ??
          ''
        ) as string;
        if (raw?.trim()) locationPromoLabel = raw.trim().toUpperCase();
      }
    }

    // Code must match what the admin set for this location
    if (upperCode !== locationPromoLabel) {
      return NextResponse.json({ valid: false, error: 'Nevažeći promo kod' });
    }

    // Look up or create the Stripe promotion code
    const existingCodes = await stripe.promotionCodes.list({ active: true, limit: 100 });
    let matchedPromo = existingCodes.data.find(
      (pc) => pc.code.toUpperCase().trim() === upperCode
    );

    if (!matchedPromo) {
      // Ensure a 100% off coupon exists
      let couponId = 'FREE100_COUPON';
      try {
        await stripe.coupons.retrieve(couponId);
      } catch {
        const newCoupon = await stripe.coupons.create({
          id: couponId,
          percent_off: 100,
          duration: 'once',
          name: upperCode,
        });
        couponId = newCoupon.id;
      }

      matchedPromo = await stripe.promotionCodes.create({
        coupon: couponId,
        code: upperCode,
      });
    }

    // Resolve discount
    const coupon = matchedPromo.coupon;
    let discountPercent = 0;
    let discountCents = 0;

    if (coupon.percent_off) {
      discountPercent = coupon.percent_off;
      discountCents = Math.round((amount_cents * coupon.percent_off) / 100);
    } else if (coupon.amount_off) {
      discountCents = coupon.amount_off;
      discountPercent = amount_cents > 0 ? Math.round((coupon.amount_off / amount_cents) * 100) : 0;
    }

    const finalAmountCents = Math.max(0, amount_cents - discountCents);

    return NextResponse.json({
      valid: true,
      discount_percent: discountPercent,
      discount_cents: discountCents,
      final_amount_cents: finalAmountCents,
      promotion_code_id: matchedPromo.id,
    });
  } catch (error) {
    console.error('Validate promo error:', error);
    return NextResponse.json({ valid: false, error: 'Greška pri provjeri koda' }, { status: 500 });
  }
}
