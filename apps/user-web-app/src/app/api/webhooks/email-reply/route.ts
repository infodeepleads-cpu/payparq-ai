import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  try {
    const body = await req.json();

    const replyEmail = body.from || body.reply_from;
    const subject = body.subject || body.reply_subject;
    const text = body.text || body.body || body.reply_body;

    if (!replyEmail) {
      return NextResponse.json({ error: 'No reply email found' }, { status: 400 });
    }

    // Find the enrollment for this recipient
    const { data: enrollments } = await supabaseAdmin
      .from('sequence_enrollments')
      .select('id')
      .eq('recipient_email', replyEmail)
      .eq('status', 'active')
      .limit(1);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: 'No active enrollment found' });
    }

    const enrollmentId = enrollments[0].id;

    // Log the reply
    const { error: insertError } = await supabaseAdmin
      .from('email_replies')
      .insert({
        enrollment_id: enrollmentId,
        recipient_email: replyEmail,
        reply_from: replyEmail,
        reply_subject: subject,
        reply_body: text,
      });

    if (insertError) throw insertError;

    // Pause the enrollment
    const { error: updateError } = await supabaseAdmin
      .from('sequence_enrollments')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
        reply_detected_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);

    if (updateError) throw updateError;

    console.log(`Enrollment ${enrollmentId} paused due to reply from ${replyEmail}`);

    return NextResponse.json({ success: true, paused: true });
  } catch (error) {
    console.error('Reply webhook error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
