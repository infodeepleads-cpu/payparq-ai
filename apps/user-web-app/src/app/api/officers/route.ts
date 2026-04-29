import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const user = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // City manager gets their officers
    if (role === 'city_manager') {
      const { data, error } = await supabaseAdmin
        .from('officer_assignments')
        .select('officer_id, lot_id, assigned_at, is_active')
        .eq('city_manager_id', user)
        .eq('is_active', true);

      if (error) throw error;

      return NextResponse.json({ data });
    }

    // Officer sees their own profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user)
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({ data: profile });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { officer_id, lot_id } = await req.json();
    const manager_id = req.headers.get('x-user-id');

    if (!manager_id || !officer_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Only city_manager role can assign officers
    const { data: managerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', manager_id)
      .single();

    if (managerProfile?.role !== 'city_manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create assignment
    const { data, error } = await supabaseAdmin
      .from('officer_assignments')
      .insert({
        city_manager_id: manager_id,
        officer_id,
        lot_id,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { assignment_id } = await req.json();
    const manager_id = req.headers.get('x-user-id');

    if (!manager_id || !assignment_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Verify manager owns this assignment
    const { data: assignment } = await supabaseAdmin
      .from('officer_assignments')
      .select('city_manager_id')
      .eq('id', assignment_id)
      .single();

    if (!assignment || assignment.city_manager_id !== manager_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('officer_assignments')
      .update({ is_active: false })
      .eq('id', assignment_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
