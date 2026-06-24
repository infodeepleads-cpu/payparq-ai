import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    console.log('[webhook] Received:', { type, from: data?.from, to: data?.to, email_id: data?.email_id });

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
      'email.received': 'email.received',
    };

    const eventType = eventTypeMap[type];
    if (!eventType) {
      return NextResponse.json({ ok: true }); // Ignore unknown events
    }

    // Extract data - for incoming emails, use 'to' field, fallback to 'from' if not present
    const { email_id, to, created_at } = data;
    const recipient_email = to || data?.from;

    // Log event to database
    const { error: insertError } = await supabaseAdmin.from('email_sequence_events').insert({
      recipient_email: recipient_email,
      email_id: email_id,
      event_type: eventType,
      occurred_at: created_at || new Date().toISOString(),
    });

    if (insertError && insertError.code !== '23505') {
      console.error('Resend webhook insert error:', insertError.message, { email_id, recipient_email, eventType });
    } else {
      console.log('[webhook] Inserted:', { email_id, recipient_email, eventType });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Resend
  }
}
