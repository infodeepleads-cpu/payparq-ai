import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { rows, city } = await req.json();

    if (!rows || !Array.isArray(rows) || !city) {
      return NextResponse.json({ error: 'Missing rows array or city' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Delete all existing entries for this city first
    await supabaseAdmin.from('crm_entries').delete().eq('city', city);

    // Build rows with guaranteed unique IDs using index
    const newRows = rows.map((row: any, i: number) => ({
      id: `${city}-${i}-${Date.now()}`,
      company: row.company || '',
      contact: row.contact || '',
      email: row.email || '',
      status: row.status || '',
      next_action: row.nextAction || '',
      date: row.date || '',
      notes: row.notes || '',
      city: city,
    }));

    const { error } = await supabaseAdmin.from('crm_entries').insert(newRows);

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, imported: newRows.length });
  } catch (error) {
    console.error('Error importing CRM:', error);
    return NextResponse.json({ error: 'Failed to import CRM data' }, { status: 500 });
  }
}
