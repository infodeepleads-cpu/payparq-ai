import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateListingReferralCode } from '@/lib/referralCodeGenerator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/referrals/listing-code?location_id=...
 * Get the listing's referral code (if admin-approved)
 */
export async function GET(req: NextRequest) {
  try {
    const locationId = req.nextUrl.searchParams.get('location_id');
    if (!locationId) {
      return NextResponse.json({ error: 'Missing location_id' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Fetch the referral code for this location
    const { data: refCode, error: fetchError } = await supabaseAdmin
      .from('referral_codes_listing')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!refCode) {
      return NextResponse.json(
        { error: 'No referral code found for this location' },
        { status: 404 }
      );
    }

    if (refCode.approval_status !== 'approved') {
      return NextResponse.json(
        { error: 'Referral code pending admin approval' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      code: refCode.code,
      locationId: refCode.location_id,
      type: refCode.listing_type,
      approvedAt: refCode.approved_at,
      isMandatory: refCode.is_mandatory,
    });
  } catch (error) {
    console.error('Error getting listing referral code:', error);
    return NextResponse.json({ error: 'Failed to get referral code' }, { status: 500 });
  }
}

/**
 * POST /api/referrals/listing-code
 * Admin endpoint: Generate and approve a listing code
 * Called from verification inbox approval
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify token and get user (admin only)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
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

    // Fetch the location
    const { data: location, error: locError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', location_id)
      .maybeSingle();

    if (locError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Check if referral code already exists for this location
    const { data: existingCode } = await supabaseAdmin
      .from('referral_codes_listing')
      .select('*')
      .eq('location_id', location_id)
      .maybeSingle();

    if (existingCode && existingCode.approval_status === 'approved') {
      return NextResponse.json({
        code: existingCode.code,
        message: 'Referral code already approved',
        locationId: location_id,
      });
    }

    // Determine listing type from verification metadata or default to instant_listing
    const verificationMetadata = location.verification_metadata || {};
    const listingType = (verificationMetadata as Record<string, unknown>)?.listing_type
      || (location.type || 'instant_listing');

    // Generate the deterministic code
    const code = generateListingReferralCode(
      location.name,
      location_id,
      listingType as string,
      location.address
    );

    // Insert or update referral code record
    if (existingCode) {
      // Update pending record to approved
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('referral_codes_listing')
        .update({
          code,
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', existingCode.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update location to link the code
      await supabaseAdmin
        .from('locations')
        .update({
          referral_code_id: updated.id,
          referral_enabled: true,
          referral_created_at: new Date().toISOString(),
        })
        .eq('id', location_id);

      return NextResponse.json({
        code: updated.code,
        locationId: location_id,
        approvedAt: updated.approved_at,
        message: 'Referral code approved and activated',
      });
    } else {
      // Create new referral code record
      const { data: created, error: insertError } = await supabaseAdmin
        .from('referral_codes_listing')
        .insert([{
          location_id,
          code,
          listing_type: listingType,
          is_mandatory: ['rent_a_car', 'hotel'].includes(String(listingType).toLowerCase()),
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update location to link the code
      await supabaseAdmin
        .from('locations')
        .update({
          referral_code_id: created.id,
          referral_enabled: true,
          referral_created_at: new Date().toISOString(),
        })
        .eq('id', location_id);

      return NextResponse.json({
        code: created.code,
        locationId: location_id,
        approvedAt: created.approved_at,
        message: 'Referral code generated and approved',
      });
    }
  } catch (error) {
    console.error('Error generating listing referral code:', error);
    return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 });
  }
}
