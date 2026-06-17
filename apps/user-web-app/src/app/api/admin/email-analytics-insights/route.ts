import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  try {
    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Fetch email sends and replies
    const [{ data: sends }, { data: replies }] = await Promise.all([
      supabaseAdmin.from('email_sends').select('*').gte('sent_at', sevenDaysAgoISO),
      supabaseAdmin.from('email_replies').select('*').gte('detected_at', sevenDaysAgoISO)
    ]);

    // Calculate reply rate
    const totalSends = sends?.length || 0;
    const totalReplies = replies?.length || 0;
    const replyRate = totalSends > 0 ? Math.round((totalReplies / totalSends) * 100) : 0;

    // Find best performing email
    const emailCounts: Record<number, number> = {};
    sends?.forEach((send: any) => {
      const num = send.email_number || 1;
      emailCounts[num] = (emailCounts[num] || 0) + 1;
    });
    const bestEmail = Object.entries(emailCounts).length > 0
      ? { number: parseInt(Object.entries(emailCounts).sort(([, a], [, b]) => b - a)[0][0]), count: Math.max(...Object.values(emailCounts)) }
      : null;

    // Find best language
    const languageCounts: Record<string, number> = {};
    sends?.forEach((send: any) => {
      const lang = send.language || 'en';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
    const bestLanguage = Object.entries(languageCounts).length > 0
      ? { code: Object.entries(languageCounts).sort(([, a], [, b]) => b - a)[0][0], count: Math.max(...Object.values(languageCounts)) }
      : null;

    // Build 7-day trend
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateISO = date.toISOString();
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayISO = nextDay.toISOString();

      const daySends = sends?.filter((s: any) => s.sent_at >= dateISO && s.sent_at < nextDayISO).length || 0;
      const dayReplies = replies?.filter((r: any) => r.detected_at >= dateISO && r.detected_at < nextDayISO).length || 0;

      dailyTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sends: daySends,
        replies: dayReplies
      });
    }

    // Generate AI suggestions
    const suggestions = [];
    if (replyRate > 20) {
      suggestions.push('High reply rate! Consider this language/content for expansion');
    } else if (replyRate < 5 && totalSends > 0) {
      suggestions.push('Low engagement - test shorter subject lines or different call-to-action');
    }

    if (bestEmail && bestEmail.number === 1) {
      suggestions.push('Email #1 performing best - increase volume of initial outreach');
    } else if (bestEmail && bestEmail.number > 2) {
      suggestions.push('Later emails getting more responses - consider extending sequences');
    }

    if (bestLanguage?.code === 'hr' || bestLanguage?.code === 'it') {
      suggestions.push(`${bestLanguage.code.toUpperCase()} shows best performance - target more ${bestLanguage.code.toUpperCase()} markets`);
    }

    if (totalSends > 0 && totalSends < 10) {
      suggestions.push('Low volume detected - increase daily sends to build momentum');
    }

    return NextResponse.json({
      replyRate,
      bestEmail,
      bestLanguage,
      dailyTrend,
      suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
    });
  } catch (error) {
    console.error('Analytics insights error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
