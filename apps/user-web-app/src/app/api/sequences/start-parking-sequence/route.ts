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

    const { emails, language = 'en' } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }

    if (!['hr', 'en', 'de', 'it', 'fr'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    // Create enrollments for the parking sequence (4 emails)
    const enrollments = emails.map((emailInfo: any) => ({
      recipient_email: emailInfo.email.toLowerCase(),
      recipient_name: emailInfo.name || emailInfo.email,
      sequence_id: 'parking-owner-sequence',
      sequence_name: 'Parking Owner Revenue Sequence',
      current_email_number: 1,
      total_emails: 4,
      language: language,
      next_send_at: getNextSendDate(0).toISOString(), // Send first email immediately
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert or update enrollments
    const { data, error } = await supabaseAdmin
      .from('sequence_enrollments')
      .upsert(enrollments, {
        onConflict: 'recipient_email,sequence_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Enrollment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Enrolled ${data?.length || 0} leads in parking sequence (${language})`);

    return NextResponse.json({
      success: true,
      enrolled: data?.length || 0,
      language: language,
      sequenceName: 'Parking Owner Revenue Sequence'
    });
  } catch (error) {
    console.error('Error starting parking sequence:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
