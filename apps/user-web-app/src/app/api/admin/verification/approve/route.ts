import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/verification/approve
 * Admin endpoint: Approve a listing in the verification inbox
 * Automatically generates a referral code if referral is enabled
 *
 * Request body:
 * {
 *   location_id: string,
 *   verification_inbox_id?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify token and check admin access
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile?.role as string || '').toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { location_id } = await req.json() as { location_id?: string };
    if (!location_id) {
      return NextResponse.json({ error: 'Missing location_id' }, { status: 400 });
    }

    // Fetch location to check verification status
    const { data: location, error: locError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', location_id)
      .maybeSingle();

    if (locError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Update location verification status
    await supabaseAdmin
      .from('locations')
      .update({
        verification_status: 'verified',
      })
      .eq('id', location_id);

    // Generate referral code if want_referral is enabled in verification metadata
    const verificationMetadata = location.verification_metadata || {};
    const wantReferral = (verificationMetadata as Record<string, unknown>).want_referral === true;

    if (wantReferral) {
      // Call the listing-code generation endpoint
      const codeResponse = await fetch(
        new URL('/api/referrals/listing-code', req.url),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ location_id }),
        }
      );

      if (!codeResponse.ok) {
        console.warn('Failed to generate referral code for approved listing:', location_id);
      } else {
        const codeData = await codeResponse.json() as { code?: string };
        return NextResponse.json({
          message: 'Listing approved and referral code generated',
          code: codeData.code,
          location_id,
        });
      }
    }

    return NextResponse.json({
      message: 'Listing approved',
      location_id,
    });
  } catch (error) {
    console.error('Error approving listing:', error);
    return NextResponse.json({ error: 'Failed to approve listing' }, { status: 500 });
  }
}
