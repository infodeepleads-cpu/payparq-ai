import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const emails = searchParams.getAll('email');

    if (!emails || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }

    // Get enrollment status for all emails
    const { data: enrollments } = await supabaseAdmin
      .from('sequence_enrollments')
      .select('recipient_email, status, current_email_number, next_send_at, reply_detected_at, language')
      .in('recipient_email', emails);

    // Get replies for all emails
    const { data: replies } = await supabaseAdmin
      .from('email_replies')
      .select('enrollment_id, recipient_email, detected_at')
      .in('recipient_email', emails);

    // Get email sends for all emails (today only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: sends } = await supabaseAdmin
      .from('email_sends')
      .select('recipient_email, email_number')
      .in('recipient_email', emails)
      .gte('sent_at', todayISO);

    const statusMap: Record<string, any> = {};

    emails.forEach(email => {
      const enrollment = (enrollments || []).find(e => e.recipient_email === email.toLowerCase());
      const repliesCount = (replies || []).filter(r => r.recipient_email === email.toLowerCase()).length;
      const sendCount = (sends || []).filter(s => s.recipient_email === email.toLowerCase()).length;

      statusMap[email] = {
        status: enrollment?.status || 'none',
        currentEmailNumber: enrollment?.current_email_number || 0,
        nextSendAt: enrollment?.next_send_at,
        hasReplied: repliesCount > 0,
        sentToday: sendCount,
        language: enrollment?.language || 'en'
      };
    });

    return NextResponse.json(statusMap);
  } catch (error) {
    console.error('Enrollment status error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
