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

    // Get existing auto code
    const { data: existingCode, error: fetchError } = await supabaseAdmin
      .from('auto_promo_codes')
      .select('*')
      .eq('location_id', locationId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // If exists and not expired, return it
    if (existingCode) {
      const expiresAt = new Date(existingCode.expires_at);
      if (expiresAt > new Date()) {
        return NextResponse.json({ code: existingCode.code });
      }
    }

    // Generate new code
    const newCode = generateCode();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days

    if (existingCode) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from('auto_promo_codes')
        .update({ code: newCode, created_at: createdAt, expires_at: expiresAt })
        .eq('id', existingCode.id);

      if (updateError) throw updateError;
    } else {
      // Create new record
      const { error: insertError } = await supabaseAdmin
        .from('auto_promo_codes')
        .insert([{ location_id: locationId, code: newCode, created_at: createdAt, expires_at: expiresAt }]);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ code: newCode });
  } catch (error) {
    console.error('Error getting auto promo code:', error);
    return NextResponse.json({ error: 'Failed to get promo code' }, { status: 500 });
  }
}
