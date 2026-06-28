import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { to, subject, text, html } = await req.json();

    const payload: any = {
      from: 'PayParq <team@info.payparq.com>',
      to,
      subject,
    };

    if (html) {
      payload.html = html;
    } else if (text) {
      payload.text = text;
    }

    const result = await resend.emails.send(payload);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const emailId = result.data?.id;

    // Log to database for AdminCRM
    if (emailId && supabaseAdmin) {
      try {
        const { error: insertError } = await supabaseAdmin.from('email_sequence_events').insert({
          recipient_email: to,
          email_id: emailId,
          event_type: 'email.sent',
          occurred_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error('[send-email] Database error:', insertError.message, { emailId, to });
        } else {
          console.log('[send-email] Logged email:', { emailId, to });
        }
      } catch (dbError) {
        console.error('[send-email] Unexpected error:', dbError, { emailId, to });
      }
    } else {
      console.warn('[send-email] No emailId or supabaseAdmin', { emailId, hasAdmin: !!supabaseAdmin });
    }

    return NextResponse.json({ success: true, id: emailId });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
