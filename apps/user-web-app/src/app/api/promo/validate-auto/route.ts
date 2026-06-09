import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// V2 listing referral code pattern: CITY-TYPE-ID (e.g. DBK-CAR-482)
const V2_LISTING_PATTERN = /^[A-Z]{3}-[A-Z]{3}-[A-Z0-9]{3}$/;

export async function POST(req: NextRequest) {
  try {
    const { code, location_id, user_id } = await req.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Missing parameters' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ valid: false, error: 'Database not configured' }, { status: 500 });
    }

    const upperCode = String(code).toUpperCase().trim();

    // Check for universal PAYPARQ code
    if (upperCode === 'PAYPARQ') {
      return NextResponse.json({
        valid: true,
        discount_percent: 10,
        promo_code_id: null,
        is_referral_v2: true,
        referrer_id: null,
        referral_code: 'PAYPARQ',
      });
    }

    // Check V2 listing referral code format (CITY-TYPE-ID)
    if (V2_LISTING_PATTERN.test(upperCode)) {
      const { data: listingCode } = await supabaseAdmin
        .from('referral_codes_listing')
        .select('location_id, owner_id, approval_status')
        .eq('code', upperCode)
        .maybeSingle();

      if (!listingCode?.location_id) {
        return NextResponse.json({ valid: false, error: 'Referral code not found' });
      }

      if (listingCode.approval_status !== 'approved') {
        return NextResponse.json({ valid: false, error: 'Referral code is not yet active' });
      }

      return NextResponse.json({
        valid: true,
        discount_percent: 10,
        promo_code_id: null,
        is_referral_v2: true,
        referrer_id: listingCode.owner_id || null,
        referral_code: upperCode,
      });
    }

    // Legacy auto_promo_codes lookup requires location_id
    if (!location_id) {
      return NextResponse.json({ valid: false, error: 'Missing parameters' }, { status: 400 });
    }

    // Find the promo code
    const { data: promoCode, error: fetchError } = await supabaseAdmin
      .from('auto_promo_codes')
      .select('*')
      .eq('code', upperCode)
      .eq('location_id', location_id)
      .single();

    if (fetchError || !promoCode) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code' }, { status: 400 });
    }

    const expiresAt = new Date(promoCode.expires_at);
    const now = new Date();

    // Check if expired
    if (expiresAt <= now) {
      // Lazy regenerate
      const newCode = generateCode();
      const newCreatedAt = new Date();
      const newExpiresAt = new Date(newCreatedAt.getTime() + 15 * 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from('auto_promo_codes')
        .update({ code: newCode, created_at: newCreatedAt, expires_at: newExpiresAt })
        .eq('id', promoCode.id);

      return NextResponse.json({
        valid: true,
        discount_percent: 10,
        referral_percent: 10,
        promo_code_id: promoCode.id
      });
    }

    return NextResponse.json({
      valid: true,
      discount_percent: 10,
      referral_percent: 10,
      promo_code_id: promoCode.id
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate code' }, { status: 500 });
  }
}
