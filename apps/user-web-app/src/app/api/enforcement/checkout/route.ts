import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { lot_id, shift_start, notes } = await req.json();
    const user = req.headers.get('x-user-id');

    if (!user || !lot_id || !shift_start) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Create enforcement checkout
    const { data, error } = await supabaseAdmin
      .from('enforcement_checkouts')
      .insert({
        officer_id: user,
        lot_id,
        shift_start: new Date(shift_start).toISOString(),
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const lot_id = searchParams.get('lot_id');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    let query = supabaseAdmin
      .from('enforcement_checkouts')
      .select('*')
      .eq('officer_id', user)
      .order('shift_start', { ascending: false });

    if (lot_id) {
      query = query.eq('lot_id', lot_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, enforcement_done_at, fines_count, tickets_issued, notes } = await req.json();
    const user = req.headers.get('x-user-id');

    if (!id || !user) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Verify officer owns this checkout
    const { data: checkout } = await supabaseAdmin
      .from('enforcement_checkouts')
      .select('officer_id')
      .eq('id', id)
      .single();

    if (!checkout || checkout.officer_id !== user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('enforcement_checkouts')
      .update({
        enforcement_done_at: enforcement_done_at ? new Date(enforcement_done_at).toISOString() : null,
        shift_end: enforcement_done_at ? new Date(enforcement_done_at).toISOString() : null,
        fines_count: fines_count ?? null,
        tickets_issued: tickets_issued ?? null,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
