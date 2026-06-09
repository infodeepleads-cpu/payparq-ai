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

export async function GET(req: NextRequest) {
  try {
    const locationId = req.nextUrl.searchParams.get('location_id');
    if (!locationId) {
      return NextResponse.json({ error: 'Missing location_id' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check for approved referral code (CITY-TYPE-ID format)
    const { data: referralCode } = await supabaseAdmin
      .from('referral_codes_listing')
      .select('code')
      .eq('location_id', locationId)
      .eq('approval_status', 'approved')
      .maybeSingle();

    if (referralCode?.code) {
      return NextResponse.json({ code: referralCode.code, type: 'referral' });
    }

    // Fallback: return universal PAYPARQ code
    return NextResponse.json({ code: 'PAYPARQ', type: 'universal' });
  } catch (error) {
    console.error('Error getting auto promo code:', error);
    return NextResponse.json({ code: 'PAYPARQ', type: 'universal' }, { status: 200 });
  }
}
