import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get today's email sends
    const { data: sends, error: sendsError } = await supabaseAdmin
      .from('email_sends')
      .select('email_number, language, status')
      .gte('sent_at', todayISO);

    if (sendsError) throw sendsError;

    // Get today's replies
    const { data: replies, error: repliesError } = await supabaseAdmin
      .from('email_replies')
      .select('*')
      .gte('detected_at', todayISO);

    if (repliesError) throw repliesError;

    const byLanguage: Record<string, number> = {};
    const byEmail: Record<number, number> = {};
    let failedCount = 0;

    (sends || []).forEach((send) => {
      byLanguage[send.language] = (byLanguage[send.language] || 0) + 1;
      byEmail[send.email_number] = (byEmail[send.email_number] || 0) + 1;
      if (send.status === 'failed') failedCount++;
    });

    return NextResponse.json({
      totalSent: sends?.length || 0,
      repliesReceived: replies?.length || 0,
      failedSends: failedCount,
      byLanguage,
      byEmail
    });
  } catch (error) {
    console.error('Email analytics error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
