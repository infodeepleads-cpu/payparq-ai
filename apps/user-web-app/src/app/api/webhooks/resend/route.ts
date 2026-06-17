import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Resend webhook - tracks email opens, clicks, bounces, unsubscribes
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const body = await req.json();
  const { type, data } = body;

  if (!type || !data) return NextResponse.json({ ok: true });

  const email = data.to?.[0] || data.email;
  if (!email) return NextResponse.json({ ok: true });

  const emailId = data.email_id;

  if (type === 'email.bounced' || type === 'email.complained') {
    await supabaseAdmin
      .from('email_sequence_enrollments')
      .update({ status: 'unsubscribed' })
      .eq('recipient_email', email.toLowerCase());
  }

  // Log event to email_sequence_events (for non-A/B emails)
  await supabaseAdmin.from('email_sequence_events').upsert({
    recipient_email: email.toLowerCase(),
    event_type: type,
    email_id: emailId,
    occurred_at: data.created_at || new Date().toISOString(),
  }, { onConflict: 'email_id,event_type', ignoreDuplicates: true });

  // Try to find and update the campaign event for A/B testing
  if (emailId) {
    try {
      const { data: campaignEvent } = await supabaseAdmin
        .from('email_campaign_events')
        .select('id, variant, campaign_id')
        .eq('email_id', emailId)
        .single();

      if (campaignEvent) {
        // Map Resend event types to our event types
        let eventType = type;
        if (type === 'email.opened') eventType = 'opened';
        else if (type === 'email.clicked') eventType = 'clicked';
        else if (type === 'email.bounced') eventType = 'bounced';

        // Update or insert campaign event
        await supabaseAdmin.from('email_campaign_events').upsert({
          campaign_id: campaignEvent.campaign_id,
          recipient_email: email.toLowerCase(),
          variant: campaignEvent.variant,
          event_type: eventType,
          email_id: emailId,
          occurred_at: data.created_at || new Date().toISOString(),
        }, { onConflict: 'campaign_id,recipient_email,event_type,variant', ignoreDuplicates: true });
      }
    } catch (err) {
      console.error('Error updating campaign event:', err);
      // Non-fatal - continue
    }
  }

  return NextResponse.json({ ok: true });
}
