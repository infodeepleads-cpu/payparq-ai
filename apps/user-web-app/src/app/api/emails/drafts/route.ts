import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('email_sequences')
      .select('*')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const emails = (data || []).map((seq: any) => ({
      id: seq.id,
      recipient_email: seq.recipient_email || '(pending)',
      subject: seq.subject || '(draft)',
      status: 'draft',
      sent_at: seq.created_at,
    }));

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ emails: [] });
  }
}
