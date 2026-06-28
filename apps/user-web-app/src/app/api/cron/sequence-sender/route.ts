import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

function getNextSendDate(delayDays: number): Date {
  const now = new Date();
  const minDelay = Math.floor(delayDays * 0.66);
  const maxDelay = Math.ceil(delayDays * 1.33);
  const randomDelay = minDelay + Math.random() * (maxDelay - minDelay);

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + randomDelay);

  const dayOfWeek = nextDate.getDay();
  if (dayOfWeek === 6) {
    nextDate.setDate(nextDate.getDate() + 2);
  } else if (dayOfWeek === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}

async function logEmailSend(enrollmentId: string, recipientEmail: string, emailNumber: number, sequenceId: string, subject: string, language: string = 'en') {
  if (!supabaseAdmin) return;

  try {
    await supabaseAdmin
      .from('email_sends')
      .insert({
        enrollment_id: enrollmentId,
        recipient_email: recipientEmail,
        email_number: emailNumber,
        sequence_id: sequenceId,
        subject: subject,
        language: language,
        status: 'sent'
      });
  } catch (err) {
    console.error('Failed to log email send:', err);
  }
}

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const tokenParam = new URL(req.url).searchParams.get('token');
    const provided = authHeader?.replace('Bearer ', '') || tokenParam;
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date().toISOString();

    // Get all enrollments due to send
    const { data: dueEnrollments } = await supabaseAdmin
      .from('sequence_enrollments')
      .select('*')
      .eq('status', 'active')
      .lte('next_send_at', now)
      .order('next_send_at', { ascending: true })
      .limit(50);

    if (!dueEnrollments || dueEnrollments.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const enrollment of dueEnrollments) {
      try {
        // Get sequence config
        const { data: seqData } = await supabaseAdmin
          .from('email_sequences')
          .select('config')
          .eq('id', enrollment.sequence_id)
          .single();

        if (!seqData?.config?.emails) continue;

        const emailNum = enrollment.current_email_number;
        const emailConfig = seqData.config.emails[emailNum - 1];

        if (!emailConfig) {
          // Sequence complete
          await supabaseAdmin
            .from('sequence_enrollments')
            .update({ status: 'completed', updated_at: now })
            .eq('id', enrollment.id);
          continue;
        }

        // Check if enrollment has been paused due to reply
        const { data: replies } = await supabaseAdmin
          .from('email_replies')
          .select('*')
          .eq('enrollment_id', enrollment.id)
          .limit(1);

        if (replies && replies.length > 0) {
          // Pause enrollment if reply detected
          await supabaseAdmin
            .from('sequence_enrollments')
            .update({
              status: 'paused',
              paused_at: now,
              reply_detected_at: replies[0].detected_at
            })
            .eq('id', enrollment.id);
          continue;
        }

        // Send email
        const language = enrollment.language || 'en';
        const languageEmailConfig = emailConfig.templates?.[language] || emailConfig.templates?.en || emailConfig;

        const result = await resend.emails.send({
          from: 'Karlo Žamić <team@info.payparq.com>',
          to: enrollment.recipient_email,
          subject: languageEmailConfig.subject || emailConfig.subject,
          html: languageEmailConfig.html || emailConfig.html || `<p>${languageEmailConfig.subject}</p>`,
        });

        if (result.error) {
          console.error(`Send failed for ${enrollment.recipient_email}:`, result.error);
          failed++;
          continue;
        }

        // Log email send
        await logEmailSend(
          enrollment.id,
          enrollment.recipient_email,
          emailNum,
          enrollment.sequence_id,
          languageEmailConfig.subject || emailConfig.subject,
          language
        );

        // Check if there's a next email
        const nextEmailNum = emailNum + 1;
        const nextEmailDelay = emailConfig.delayDays || 3;

        const nextSendDate = getNextSendDate(nextEmailDelay);

        // Update enrollment
        await supabaseAdmin
          .from('sequence_enrollments')
          .update({
            current_email_number: nextEmailNum,
            last_sent_at: now,
            next_send_at: nextEmailNum > seqData.config.emails.length ? null : nextSendDate.toISOString(),
            status: nextEmailNum > seqData.config.emails.length ? 'completed' : 'active',
            updated_at: now,
          })
          .eq('id', enrollment.id);

        sent++;
      } catch (err) {
        console.error(`Error processing enrollment ${enrollment.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({ sent, failed, checked: dueEnrollments.length });
  } catch (error) {
    console.error('Sequence sender error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
