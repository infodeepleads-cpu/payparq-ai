import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    const { id } = await params;

    const { data: email, error: fetchError } = await supabaseAdmin
      .from('email_sequence_events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    await supabaseAdmin.from('email_sequence_events').update({ status: 'pending' }).eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error retrying email:', error);
    return NextResponse.json({ error: 'Failed to retry' }, { status: 500 });
  }
}
