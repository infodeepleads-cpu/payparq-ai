import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateUserReferralCode } from '@/lib/referralCodeGenerator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/referrals/user-code
 * Get or create the user's permanent referral code
 * Requires authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Extract user ID from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Check if user already has a referral code
    const { data: existingCode, error: fetchError } = await supabaseAdmin
      .from('referral_codes_user')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // If code exists, return it
    if (existingCode) {
      return NextResponse.json({
        code: existingCode.code,
        userId: existingCode.user_id,
        createdAt: existingCode.created_at,
        permanent: true,
      });
    }

    // Generate new code (deterministic based on userId)
    const newCode = generateUserReferralCode(userId);

    // Insert new code
    const { data: createdCode, error: insertError } = await supabaseAdmin
      .from('referral_codes_user')
      .insert([{
        user_id: userId,
        code: newCode,
      }])
      .select()
      .single();

    if (insertError) {
      // Handle race condition: another request may have created the code
      if (insertError.code === '23505') { // unique_violation
        const { data: retryCode } = await supabaseAdmin
          .from('referral_codes_user')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (retryCode) {
          return NextResponse.json({
            code: retryCode.code,
            userId: retryCode.user_id,
            createdAt: retryCode.created_at,
            permanent: true,
          });
        }
      }
      throw insertError;
    }

    return NextResponse.json({
      code: createdCode.code,
      userId: createdCode.user_id,
      createdAt: createdCode.created_at,
      permanent: true,
    });
  } catch (error) {
    console.error('Error getting/creating user referral code:', error);
    return NextResponse.json({ error: 'Failed to get referral code' }, { status: 500 });
  }
}
