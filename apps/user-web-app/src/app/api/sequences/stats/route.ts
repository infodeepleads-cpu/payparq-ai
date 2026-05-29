import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const [enrollments, sentToday] = await Promise.all([
    supabaseAdmin
      .from('email_sequence_enrollments')
      .select('*')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('email_sequence_enrollments')
      .select('id', { count: 'exact' })
      .gte('last_sent_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  const rows = enrollments.data || [];
  const totalSentToday = sentToday.count || 0;

  const stats = {
    total: rows.length,
    active: rows.filter(r => r.status === 'active').length,
    completed: rows.filter(r => r.status === 'completed').length,
    unsubscribed: rows.filter(r => r.status === 'unsubscribed').length,
    onEmail1: rows.filter(r => r.next_email_number === 1 && r.status === 'active').length,
    onEmail2: rows.filter(r => r.next_email_number === 2 && r.status === 'active').length,
    onEmail3: rows.filter(r => r.next_email_number === 3 && r.status === 'active').length,
    sentToday: totalSentToday,
    enrollments: rows.map(r => ({
      id: r.id,
      email: r.recipient_email,
      name: r.recipient_name,
      status: r.status,
      nextEmailNumber: r.next_email_number,
      lastSentAt: r.last_sent_at,
      nextSendAt: r.next_send_at,
      createdAt: r.created_at,
    })),
  };

  return NextResponse.json(stats);
}
