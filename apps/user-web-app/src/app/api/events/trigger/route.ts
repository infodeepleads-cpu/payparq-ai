import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getMessaging } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { type, lot_id, data, triggered_by } = await req.json();

    if (!type || !lot_id) {
      return NextResponse.json(
        { error: 'Missing required fields: type, lot_id' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 500 }
      );
    }

    // Log the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('notification_events')
      .insert({
        event_type: type,
        triggered_by,
        lot_id,
        metadata: data,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Trigger notification broadcasting
    await broadcastNotification(type, lot_id, data, event.id);

    return NextResponse.json({ success: true, event_id: event.id });
  } catch (error) {
    console.error('Event trigger error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

async function broadcastNotification(
  type: string,
  lot_id: string,
  data: any,
  event_id: string
) {
  try {
    if (!supabaseAdmin) {
      console.log('Supabase admin not available for broadcast');
      return;
    }

    // Determine who should receive notifications based on event type
    let recipients: any[] = [];

    if (type === 'p2t_checkout') {
      // P&T checkout → notify all available drivers in that lot
      const { data: drivers } = await supabaseAdmin
        .from('push_subscriptions')
        .select('user_id, fcm_token, device_type')
        .eq('is_active', true)
        .in('device_type', ['android', 'ios', 'web']);

      recipients = drivers || [];
    } else if (type === 'enforcement_ticket') {
      // Enforcement ticket → notify all officers in that lot + manager
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('user_id, fcm_token, device_type')
        .eq('is_active', true);

      recipients = subscriptions || [];
    } else if (type === 'enforcement_done') {
      // Enforcement done → notify manager
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('user_id, fcm_token, device_type')
        .eq('is_active', true);

      recipients = subscriptions || [];
    }

    if (recipients.length === 0) {
      console.log(`No recipients for event type: ${type}`);
      return;
    }

    // Group by device type
    const fcmTokens = recipients
      .filter((r) => r.fcm_token && r.device_type !== 'web')
      .map((r) => r.fcm_token);

    const webUsers = recipients
      .filter((r) => r.device_type === 'web')
      .map((r) => r.user_id);

    // Send FCM notifications (mobile)
    if (fcmTokens.length > 0) {
      await sendFCMNotifications(fcmTokens, type, data, event_id);
    }

    // Send Web Push notifications
    if (webUsers.length > 0) {
      await sendWebPushNotifications(webUsers, type, data, event_id);
    }

    // Update sent count
    await supabaseAdmin
      .from('notification_events')
      .update({ sent_to_count: recipients.length })
      .eq('id', event_id);

    console.log(
      `Broadcast complete: ${fcmTokens.length} FCM, ${webUsers.length} Web Push`
    );
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}

async function sendFCMNotifications(
  tokens: string[],
  type: string,
  data: any,
  event_id: string
) {
  try {
    const messaging = getMessaging();

    if (!messaging) {
      console.warn('Firebase not configured, skipping FCM notifications');
      return;
    }

    const message = {
      notification: {
        title: getNotificationTitle(type),
        body: getNotificationBody(type, data),
      },
      data: {
        event_type: type,
        event_id,
        lot_id: data.lot_id || '',
        url: getNotificationLink(type, data),
      },
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    };

    const response = await messaging.sendMulticast({
      ...message,
      tokens,
    });

    console.log(
      `FCM sent: ${response.successCount} succeeded, ${response.failureCount} failed`
    );

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = response.responses
        .map((resp, idx) => (!resp.success ? tokens[idx] : null))
        .filter(Boolean);
      console.warn('Failed FCM tokens:', failedTokens);
    }
  } catch (error) {
    console.error('FCM error:', error);
  }
}

async function sendWebPushNotifications(
  userIds: string[],
  type: string,
  data: any,
  event_id: string
) {
  try {
    // Get user subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, auth, p256dh')
      .in('user_id', userIds)
      .eq('device_type', 'web');

    if (!subscriptions) return;

    const notification = {
      title: getNotificationTitle(type),
      body: getNotificationBody(type, data),
      tag: type,
      badge: '/badge-72x72.png',
      icon: '/icon-192x192.png',
      data: {
        url: getNotificationLink(type, data),
      },
    };

    // Send via Web Push Protocol
    // This would use web-push library
    for (const sub of subscriptions) {
      try {
        await sendWebPush(sub, notification);
      } catch (error) {
        console.error(`Web push failed for subscription:`, error);
      }
    }

    console.log(`Web Push sent to ${subscriptions.length} users`);
  } catch (error) {
    console.error('Web Push error:', error);
  }
}

async function sendWebPush(
  subscription: any,
  notification: any
) {
  const webpush = await import('web-push');

  webpush.default.setVapidDetails(
    'mailto:admin@payparq.ai',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  await webpush.default.sendNotification(subscription, JSON.stringify(notification));
}

function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    p2t_checkout: '🚗 New Ride Available',
    enforcement_ticket: '📋 New Enforcement Ticket',
    enforcement_done: '✅ Enforcement Completed',
    driver_approaching: '🚕 Driver Approaching',
    shift_start: '⏰ Shift Starting Soon',
  };
  return titles[type] || 'Payparq Notification';
}

function getNotificationBody(type: string, data: any): string {
  const bodies: Record<string, string> = {
    p2t_checkout: `Ride available at ${data.lot_name || 'your lot'}`,
    enforcement_ticket: `New ticket for ${data.lot_name || 'your lot'}`,
    enforcement_done: `Enforcement shift ended with ${data.fines_count || 0} fines`,
    driver_approaching: `Driver ${data.driver_name} is 15 minutes away`,
    shift_start: 'Your shift is starting soon',
  };
  return bodies[type] || 'New notification';
}

function getNotificationLink(type: string, data: any): string {
  const base = '/members/mapa';
  const links: Record<string, string> = {
    p2t_checkout: `${base}?lot_id=${data.lot_id}`,
    enforcement_ticket: `${base}?lot_id=${data.lot_id}`,
    enforcement_done: `${base}?lot_id=${data.lot_id}`,
    driver_approaching: `/driver/dashboard`,
    shift_start: `/officers/dashboard`,
  };
  return links[type] || '/members/mapa';
}
