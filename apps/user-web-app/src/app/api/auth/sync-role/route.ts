import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin is not configured' },
        { status: 500 }
      );
    }

    // Get user's role from mobile scanner (profiles table)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    // If user has a role set by mobile scanner, return it
    if (profile?.role) {
      return NextResponse.json({
        user_id,
        role: profile.role,
      });
    }

    // Always default to 'member' if not found
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

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { role: 'member' },
        { status: 200 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      role: profile?.role || 'member',
    });
  } catch (error) {
    return NextResponse.json(
      { role: 'member' },
      { status: 200 }
    );
  }
}
