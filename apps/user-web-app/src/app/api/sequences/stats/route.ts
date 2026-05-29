import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const [enrollments, sentToday, events] = await Promise.all([
    supabaseAdmin
      .from('email_sequence_enrollments')
      .select('*')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('email_sequence_enrollments')
      .select('id', { count: 'exact' })
      .gte('last_sent_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabaseAdmin
      .from('email_sequence_events')
      .select('recipient_email, event_type'),
  ]);

  const rows = enrollments.data || [];
  const totalSentToday = sentToday.count || 0;
  const eventRows = events.data || [];

  // Calculate engagement metrics
  const uniqueDeliveries = new Set<string>();
  const uniqueOpens = new Set<string>();
  const uniqueClicks = new Set<string>();
  const uniqueBounces = new Set<string>();
  const uniqueComplaints = new Set<string>();

  eventRows.forEach(event => {
    const email = event.recipient_email.toLowerCase();
    if (event.event_type === 'email.sent') uniqueDeliveries.add(email);
    if (event.event_type === 'email.opened') uniqueOpens.add(email);
    if (event.event_type === 'email.clicked') uniqueClicks.add(email);
    if (event.event_type === 'email.bounced') uniqueBounces.add(email);
    if (event.event_type === 'email.complained') uniqueComplaints.add(email);
  });

  const totalDelivered = uniqueDeliveries.size;
  const totalOpened = uniqueOpens.size;
  const totalClicked = uniqueClicks.size;

  const stats = {
    total: rows.length,
    active: rows.filter(r => r.status === 'active').length,
    completed: rows.filter(r => r.status === 'completed').length,
    unsubscribed: rows.filter(r => r.status === 'unsubscribed').length,
    onEmail1: rows.filter(r => r.next_email_number === 1 && r.status === 'active').length,
    onEmail2: rows.filter(r => r.next_email_number === 2 && r.status === 'active').length,
    onEmail3: rows.filter(r => r.next_email_number === 3 && r.status === 'active').length,
    sentToday: totalSentToday,
    // Engagement metrics
    delivered: totalDelivered,
    deliveryRate: rows.length > 0 ? Math.round((totalDelivered / rows.length) * 100) : 0,
    opened: totalOpened,
    openRate: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
    clicked: totalClicked,
    clickRate: totalDelivered > 0 ? Math.round((totalClicked / totalDelivered) * 100) : 0,
    bounced: uniqueBounces.size,
    complained: uniqueComplaints.size,
    enrollments: rows.map(r => ({
      id: r.id,
      email: r.recipient_email,
      name: r.recipient_name,
      status: r.status,
      nextEmailNumber: r.next_email_number,
      lastSentAt: r.last_sent_at,
      nextSendAt: r.next_send_at,
      createdAt: r.created_at,
      hasOpened: uniqueOpens.has(r.recipient_email.toLowerCase()),
      hasClicked: uniqueClicks.has(r.recipient_email.toLowerCase()),
      isBounced: uniqueBounces.has(r.recipient_email.toLowerCase()),
    })),
  };

  return NextResponse.json(stats);
}
