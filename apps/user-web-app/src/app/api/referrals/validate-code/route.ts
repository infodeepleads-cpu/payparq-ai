import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validateReferralCodeFormat } from '@/lib/referralCodeGenerator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/referrals/validate-code
 * Validate a referral code and return discount information
 *
 * Request body:
 * {
 *   code: string,
 *   user_id?: string (for checking if already used),
 *   location_id?: string (optional, for limiting code to specific listing)
 * }
 *
 * Response:
 * {
 *   valid: boolean,
 *   code: string,
 *   type: 'user' | 'listing',
 *   referrer_id: string,
 *   discount_percent: 10,
 *   earning_percent: 10,
 *   applicable_to_all_listings: boolean,
 *   referrer_name?: string,
 *   already_used?: boolean
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: string;
      user_id?: string;
      location_id?: string;
    };

    const { code, user_id, location_id } = body;

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Missing code' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check for universal PAYPARQ code
    if (code.toUpperCase() === 'PAYPARQ') {
      return NextResponse.json({
        valid: true,
        code: 'PAYPARQ',
        type: 'universal',
        referrer_id: null,
        referrer_name: 'PayParq',
        discount_percent: 10,
        earning_percent: 0,
      });
    }

    const formatCheck = validateReferralCodeFormat(code);
    if (!formatCheck.valid || formatCheck.type !== 'listing') {
      return NextResponse.json({ valid: false, error: 'Invalid code format' });
    }

    // Validate listing code (CITY-TYPE-ID format)
    const { data: listingCode, error: listingError } = await supabaseAdmin
      .from('referral_codes_listing')
      .select('owner_id, approval_status')
      .eq('code', code)
      .maybeSingle();

    if (listingError && listingError.code !== 'PGRST116') {
      throw listingError;
    }

    if (!listingCode) {
      return NextResponse.json({ valid: false, error: 'Code not found' });
    }

    if (listingCode.approval_status !== 'approved') {
      return NextResponse.json({
        valid: false,
        error: 'Code is not yet active',
      });
    }

    const { data: owner } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', listingCode.owner_id)
      .maybeSingle();

    return NextResponse.json({
      valid: true,
      code,
      type: 'listing',
      referrer_id: listingCode.owner_id,
      referrer_name: (owner?.full_name as string) || 'Owner',
      discount_percent: 10,
      earning_percent: 10,
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 });
  }
}
