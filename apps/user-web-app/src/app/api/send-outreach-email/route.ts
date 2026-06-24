import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { to, subject, text, html, nameVariant, variant, campaignId } = await req.json();

    let senderName = 'Karlo Zamic <team@info.payparq.com>';
    if (nameVariant === 'yugoslavia') {
      senderName = 'Karlo Žamić <team@info.payparq.com>';
    }

    const payload: any = {
      from: senderName,
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

    // Log to email_sequence_events for AdminCRM
    if (emailId && supabaseAdmin) {
      try {
        const { error: insertError } = await supabaseAdmin.from('email_sequence_events').insert({
          recipient_email: to,
          email_id: emailId,
          event_type: 'email.sent',
          occurred_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error('[send-outreach-email] Database error:', insertError.message, { emailId, to, variant });
        } else {
          console.log('[send-outreach-email] Logged email:', { emailId, to, variant });
        }
      } catch (dbError) {
        console.error('[send-outreach-email] Unexpected error:', dbError, { emailId, to });
      }
    } else {
      console.warn('[send-outreach-email] No emailId or supabaseAdmin', { emailId, hasAdmin: !!supabaseAdmin });
    }

    // Track A/B test if variant is specified
    if (variant && campaignId && supabaseAdmin && emailId) {
      try {
        // Create event record for tracking
        await supabaseAdmin.from('email_campaign_events').upsert({
          campaign_id: campaignId,
          recipient_email: to.toLowerCase(),
          variant: variant,
          event_type: 'sent',
          email_id: emailId,
        }, { onConflict: 'campaign_id,recipient_email,event_type,variant', ignoreDuplicates: true });
      } catch (trackingError) {
        console.error('Error tracking campaign event:', trackingError);
        // Don't fail the email send if tracking fails
      }
    }

    return NextResponse.json({ success: true, id: emailId });
  } catch (error) {
    console.error('Error sending outreach email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
