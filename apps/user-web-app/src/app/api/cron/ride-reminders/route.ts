import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function sendWebPush(subscription: { endpoint: string; auth: string; p256dh: string }, payload: object) {
  const webpush = await import('web-push');
  webpush.default.setVapidDetails(
    'mailto:admin@payparq.ai',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  await webpush.default.sendNotification(
    { endpoint: subscription.endpoint, keys: { auth: subscription.auth, p256dh: subscription.p256dh } },
    JSON.stringify(payload)
  );
}

export async function POST(req: NextRequest) {
  // Vercel Cron authenticates via CRON_SECRET header
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 14 * 60 * 1000).toISOString();
  const windowEnd   = new Date(now.getTime() + 16 * 60 * 1000).toISOString();

  // Find P&T sessions with check_in in the 14–16 min window
  const { data: sessions } = await supabaseAdmin
    .from('parking_sessions')
    .select('stripe_session_id, email, entry_time')
    .eq('type', 'park_now')
    .gte('entry_time', windowStart)
    .lte('entry_time', windowEnd);

  if (!sessions?.length) {
    return NextResponse.json({ ok: true, fired: 0 });
  }

  let fired = 0;
  for (const session of sessions) {
    const email = (session.email ?? '').trim().toLowerCase();
    if (!email) continue;

    // Find the Supabase user by email to get user_id for push subscription lookup
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.find(u => (u.email ?? '').toLowerCase() === email);
    if (!user) continue;

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, auth, p256dh')
      .eq('user_id', user.id)
      .eq('device_type', 'web')
      .eq('is_active', true);

    if (!subs?.length) continue;

    const trackUrl = `https://www.payparq.com/api/track?session=${encodeURIComponent(session.stripe_session_id)}`;

    for (const sub of subs) {
      try {
        await sendWebPush(sub as { endpoint: string; auth: string; p256dh: string }, {
          title: 'Vaša vožnja kreće za 15 minuta',
          body: 'Vozač je pozvan i dolazi po vas.',
          data: { url: trackUrl },
          icon: '/icon-192.png',
        });
        fired++;
      } catch {
        // Subscription may be expired — mark inactive
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', sub.endpoint);
      }
    }
  }

  return NextResponse.json({ ok: true, fired });
}
