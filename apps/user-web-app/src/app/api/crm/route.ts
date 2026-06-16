import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('crm_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet — return empty array instead of crashing
      if (error.code === '42P01') {
        return NextResponse.json([]);
      }
      throw error;
    }

    const formattedData = (data || []).map((row: any) => ({
      id: row.id,
      company: row.company || '',
      contact: row.contact || '',
      email: row.email || '',
      status: row.status || '',
      nextAction: row.next_action || '',
      date: row.date || '',
      notes: row.notes || '',
      city: row.city || '',
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching CRM:', error);
    return NextResponse.json({ error: 'Failed to fetch CRM data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const rows = await req.json();

    // Delete all existing rows
    await supabaseAdmin.from('crm_entries').delete().neq('id', '');

    // Insert new rows
    if (rows.length > 0) {
      const formattedRows = rows.map((row: any) => ({
        id: row.id,
        company: row.company,
        contact: row.contact,
        email: row.email || '',
        status: row.status,
        next_action: row.nextAction,
        date: row.date,
        notes: row.notes,
        city: row.city || '',
      }));

      const { error } = await supabaseAdmin
        .from('crm_entries')
        .insert(formattedRows);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving CRM:', error);
    return NextResponse.json({ error: 'Failed to save CRM data' }, { status: 500 });
  }
}
