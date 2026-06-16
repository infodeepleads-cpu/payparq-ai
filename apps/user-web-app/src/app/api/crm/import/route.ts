import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function generateStableId(city: string, company: string, contact: string): string {
  // Create stable ID from city+company+contact to avoid duplicates
  const key = `${city}::${company}::${contact}`.toLowerCase();
  // Simple hash: take first 8 chars + last 8 chars of base64 encoded string
  const hash = Buffer.from(key).toString('base64').slice(0, 16);
  return `${city.toLowerCase()}-${company.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}-${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const { rows, city } = await req.json();

    if (!rows || !Array.isArray(rows) || !city) {
      return NextResponse.json(
        { error: 'Missing rows array or city' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get existing entries for this city to detect duplicates
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('crm_entries')
      .select('company, contact')
      .eq('city', city);

    if (fetchError && fetchError.code !== '42P01') {
      console.error('Error fetching existing entries:', fetchError);
    }

    const existingSet = new Set(
      (existing || []).map((e: any) => `${e.company}::${e.contact}`.toLowerCase())
    );

    // Filter out duplicates and prepare rows
    const newRows = rows
      .filter((row: any) => {
        const key = `${row.company}::${row.contact}`.toLowerCase();
        return !existingSet.has(key);
      })
      .map((row: any) => ({
        id: generateStableId(city, row.company, row.contact),
        company: row.company || '',
        contact: row.contact || '',
        status: row.status || '',
        next_action: row.nextAction || '',
        date: row.date || '',
        notes: row.notes || '',
        city: city,
      }));

    if (newRows.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: 'All entries already exist in the database',
      });
    }

    // Insert only new rows
    const { error } = await supabaseAdmin
      .from('crm_entries')
      .insert(newRows);

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: newRows.length,
      duplicatesSkipped: rows.length - newRows.length,
    });
  } catch (error) {
    console.error('Error importing CRM:', error);
    return NextResponse.json(
      { error: 'Failed to import CRM data' },
      { status: 500 }
    );
  }
}
