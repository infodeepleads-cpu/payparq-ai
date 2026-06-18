import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('email_sequence_events')
      .select('*')
      .in('event_type', ['email.replied', 'email.bounced', 'email.complained'])
      .order('occurred_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const emails = (data || []).map((event: any) => ({
      id: event.id,
      recipient_email: event.recipient_email,
      subject: event.subject || '(reply)',
      status: event.event_type === 'email.replied' ? 'replied' : 'bounced',
      sent_at: event.occurred_at,
    }));

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json({ emails: [] });
  }
}
