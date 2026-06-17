import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabaseAdmin
      .from('email_sequences')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching sequences:', error);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Sequences error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
    }

    const sequences = await req.json();

    // Delete all existing sequences
    await supabaseAdmin
      .from('email_sequences')
      .delete()
      .neq('id', '');

    // Insert new sequences
    if (Array.isArray(sequences) && sequences.length > 0) {
      const rows = sequences.map((seq: any) => ({
        id: seq.id || `seq-${Date.now()}-${Math.random()}`,
        name: seq.name,
        description: seq.description,
        config: seq, // Store full config as JSON
      }));

      const { error } = await supabaseAdmin
        .from('email_sequences')
        .insert(rows);

      if (error) {
        console.error('Error saving sequences:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: sequences.length });
  } catch (error) {
    console.error('Error processing sequences:', error);
    return NextResponse.json({ error: 'Failed to save sequences' }, { status: 500 });
  }
}
