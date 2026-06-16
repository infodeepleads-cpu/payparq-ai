import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { rawData, city } = await req.json();

    if (!rawData || !city) {
      return NextResponse.json({ error: 'Missing rawData or city' }, { status: 400 });
    }

    // Parse tab-separated data
    const lines = rawData.trim().split('\n').filter((line: string) => line.trim());
    const rows = [];

    for (const line of lines) {
      const parts = line.split('\t').map((p: string) => p.trim());
      
      // Skip header rows and empty rows
      if (!parts[0] || parts[0].toLowerCase() === 'company' || parts[0] === 'Tier 1' || parts[0] === 'Tier 2') {
        continue;
      }

      const company = parts[0] || '';
      const contact = parts[1] || '';
      const status = parts[2] || '';
      const nextAction = parts[3] || '';
      const date = parts[4] || '';
      const notes = parts[5] || '';

      if (company) {
        rows.push({
          id: `${city}-${company}-${Date.now()}`,
          company,
          contact,
          status,
          next_action: nextAction,
          date,
          notes,
          city,
        });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid data found to import' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Insert rows
    const { error } = await supabaseAdmin
      .from('crm_entries')
      .insert(rows);

    if (error) throw error;

    return NextResponse.json({ success: true, imported: rows.length });
  } catch (error) {
    console.error('Error importing CRM:', error);
    return NextResponse.json({ error: 'Failed to import CRM data' }, { status: 500 });
  }
}
