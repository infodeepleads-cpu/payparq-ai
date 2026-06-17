import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
    }

    const { emails, sequenceId, sequenceName, firstEmailDelay = 0 } = await req.json();

    if (!Array.isArray(emails) || !sequenceId || !sequenceName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: sequenceData } = await supabaseAdmin
      .from('email_sequences')
      .select('config')
      .eq('id', sequenceId)
      .single();

    const totalEmails = sequenceData?.config?.emails?.length || 4;
    const firstEmailDelay_ms = (sequenceData?.config?.emails?.[0]?.delay_days || 0) || firstEmailDelay;

    const enrollments = emails.map((emailInfo: any) => ({
      recipient_email: emailInfo.email.toLowerCase(),
      recipient_name: emailInfo.name,
      sequence_id: sequenceId,
      sequence_name: sequenceName,
      current_email_number: 1,
      total_emails: totalEmails,
      next_send_at: getNextSendDate(firstEmailDelay_ms).toISOString(),
      status: 'active',
    }));

    const { data, error } = await supabaseAdmin
      .from('sequence_enrollments')
      .upsert(enrollments, { onConflict: 'recipient_email,sequence_id', ignoreDuplicates: false })
      .select();

    if (error) {
      console.error('Enrollment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, enrolled: data?.length || 0, sequenceName });
  } catch (error) {
    console.error('Error enrolling in sequence:', error);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}
