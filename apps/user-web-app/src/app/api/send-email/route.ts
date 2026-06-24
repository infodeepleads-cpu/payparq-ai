import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
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
        await supabaseAdmin.from('email_sequence_events').insert({
          id: emailId,
          recipient_email: to,
          subject: subject,
          event_type: 'email.sent',
          occurred_at: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error('Error logging email to database:', dbError);
        // Don't fail the response if logging fails
      }
    }

    return NextResponse.json({ success: true, id: emailId });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
