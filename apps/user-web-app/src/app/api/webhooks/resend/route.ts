import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Map Resend event types to our schema
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'email.sent',
      'email.delivered': 'email.delivered',
      'email.open': 'email.opened',
      'email.click': 'email.clicked',
      'email.bounce': 'email.bounced',
      'email.complaint': 'email.complained',
      'email.reply': 'email.replied',
    };

    const eventType = eventTypeMap[type];
    if (!eventType) {
      return NextResponse.json({ ok: true }); // Ignore unknown events
    }

    // Extract data
    const { email_id, to, subject, created_at } = data;

    // Log event to database
    await supabaseAdmin.from('email_sequence_events').insert({
      id: email_id,
      recipient_email: to,
      subject: subject || '(email)',
      event_type: eventType,
      occurred_at: created_at || new Date().toISOString(),
    }).then(result => {
      // Ignore if record already exists (upsert behavior)
      if (result.error?.code === '23505') {
        return; // Duplicate key error is OK
      }
      if (result.error) throw result.error;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Resend
  }
}
