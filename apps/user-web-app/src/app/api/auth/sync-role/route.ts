import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SUPERADMIN_EMAIL = 'payparq@outlook.com';

export async function POST(req: NextRequest) {
  try {
    const { user_id, email } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // Check if this is the hardcoded superadmin
    if (email === SUPERADMIN_EMAIL) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: user_id,
          role: 'superadmin',
        }, {
          onConflict: 'id',
        });

      if (updateError) throw updateError;

      return NextResponse.json({
        user_id,
        role: 'superadmin',
        synced: true,
      });
    }

    // Get user's role from mobile scanner (profiles table)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    // If user has a role set by mobile scanner, return it
    if (profile?.role && profile.role !== 'superadmin') {
      return NextResponse.json({
        user_id,
        role: profile.role,
        synced: false,
      });
    }

    // If no role set, default to 'member'
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user_id,
        role: 'member',
      }, {
        onConflict: 'id',
      });

    if (updateError) throw updateError;

    return NextResponse.json({
      user_id,
      role: 'member',
      synced: true,
    });
  } catch (error) {
    console.error('Role sync error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    const email = req.nextUrl.searchParams.get('email');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // Check if this is the hardcoded superadmin
    if (email === SUPERADMIN_EMAIL) {
      return NextResponse.json({
        role: 'superadmin',
      });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({
        role: 'member', // default if not found
      });
    }

    return NextResponse.json({
      role: profile?.role || 'member',
    });
  } catch (error) {
    return NextResponse.json(
      { role: 'member' }, // default on error
      { status: 200 }
    );
  }
}
