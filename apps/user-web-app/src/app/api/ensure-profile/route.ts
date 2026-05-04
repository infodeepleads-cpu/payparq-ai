import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || !supabaseAdmin) {
      return NextResponse.json({ error: 'Neovlašteno' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Neovlašteno' }, { status: 401 });
    }

    // Try insert first (new users)
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: user.id, email: user.email, role: 'user' });

    // If insert fails due to conflict, update the existing profile
    if (insertError && insertError.code === 'PGRST116') {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ email: user.email, role: 'user' })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    } else if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
