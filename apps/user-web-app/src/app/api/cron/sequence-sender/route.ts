import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const FROM = process.env.EMAIL_FROM || 'Payparq <team@info.payparq.com>';
const DAILY_LIMIT = 10;

export async function GET() {
  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'resend_not_configured' }, { status: 500 });

  const resend = new Resend(resendKey);
  const now = new Date().toISOString();

  // Get up to 10 enrollments due for sending
  const { data: due } = await client
    .from('email_sequence_enrollments')
    .select('*')
    .eq('status', 'active')
    .lte('next_send_at', now)
    .order('next_send_at', { ascending: true })
    .limit(DAILY_LIMIT);

  if (!due || due.length === 0) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const enrollment of due) {
    const emailNum = enrollment.next_email_number;

    // Get the template for this email number
    const { data: template } = await client
      .from('email_sequence_templates')
      .select('subject, html_content, delay_days')
      .eq('sequence_name', enrollment.sequence_name)
      .eq('email_number', emailNum)
      .single();

    if (!template) {
      // No more emails in sequence — mark completed
      await client
        .from('email_sequence_enrollments')
        .update({ status: 'completed' })
        .eq('id', enrollment.id);
      continue;
    }

    // Send the email
    const { error } = await resend.emails.send({
      from: FROM,
      to: enrollment.recipient_email,
      subject: template.subject,
      html: template.html_content,
    });

    if (error) continue;

    sent++;

    // Check if there's a next email in the sequence
    const { data: nextTemplate } = await client
      .from('email_sequence_templates')
      .select('email_number, delay_days')
      .eq('sequence_name', enrollment.sequence_name)
      .eq('email_number', emailNum + 1)
      .single();

    if (nextTemplate) {
      // Schedule next email
      const nextSendAt = new Date();
      nextSendAt.setDate(nextSendAt.getDate() + (nextTemplate.delay_days || 3));

      await client
        .from('email_sequence_enrollments')
        .update({
          next_email_number: emailNum + 1,
          last_sent_at: now,
          next_send_at: nextSendAt.toISOString(),
        })
        .eq('id', enrollment.id);
    } else {
      // Last email sent — mark completed
      await client
        .from('email_sequence_enrollments')
        .update({
          status: 'completed',
          last_sent_at: now,
        })
        .eq('id', enrollment.id);
    }
  }

  return NextResponse.json({ sent, checked: due.length });
}
