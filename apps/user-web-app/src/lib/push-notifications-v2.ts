import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Register Service Worker for Web Push
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    console.log('✓ Service Worker registered');
    return registration;
  } catch (error) {
    console.error('✗ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to Web Push + FCM notifications
 * Handles both browser and mobile subscriptions
 */
export async function subscribeToNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Subscribe to Web Push (browser)
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    await subscribeToWebPush(user.id);
  }

  // Subscribe to FCM (mobile app - handled by mobile app itself)
  // Mobile scanner sends FCM token via /api/subscriptions endpoint

  return true;
}

/**
 * Subscribe to Web Push notifications
 */
async function subscribeToWebPush(userId: string) {
  try {
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    // Create new subscription if doesn't exist
    if (!subscription) {
      if (!VAPID_PUBLIC_KEY) {
        console.error('VAPID_PUBLIC_KEY not configured');
        return;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Save subscription to database
    const subscriptionData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      auth: subscription.toJSON().keys?.auth,
      p256dh: subscription.toJSON().keys?.p256dh,
      device_type: 'web',
      is_active: true,
    };

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id,endpoint',
      });

    if (error) throw error;

    console.log('✓ Web Push subscription saved');
    return subscription;
  } catch (error) {
    console.error('✗ Web Push subscription failed:', error);
    return null;
  }
}

/**
 * Save FCM token from mobile scanner
 * Called by mobile app after getting FCM token
 */
export async function saveFCMToken(fcmToken: string, deviceType: 'android' | 'ios') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !fcmToken) return null;

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        fcm_token: fcmToken,
        device_type: deviceType,
        is_active: true,
        endpoint: `fcm://${fcmToken}`, // Dummy endpoint for FCM
        auth: null,
        p256dh: null,
      });

    if (error) throw error;

    console.log(`✓ FCM token saved (${deviceType})`);
    return true;
  } catch (error) {
    console.error('✗ FCM token save failed:', error);
    return false;
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return 'denied';
}

/**
 * Listen for push messages from Service Worker
 * Updates UI in real-time when notifications arrive
 */
export function setupRealtimeListeners(
  onNotification: (data: any) => void
) {
  const { data: { user } } = supabase.auth.getUser();
  if (!user) return;

  // Listen for ride requests in real-time
  const rideSubscription = supabase
    .channel(`rides:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ride_requests',
        filter: `driver_id=eq.${user.id}`,
      },
      (payload) => {
        onNotification({
          type: 'new_ride',
          data: payload.new,
        });
      }
    )
    .subscribe();

  // Listen for enforcement checkouts
  const enforcementSubscription = supabase
    .channel(`enforcement:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'enforcement_checkouts',
        filter: `officer_id=eq.${user.id}`,
      },
      (payload) => {
        onNotification({
          type: 'enforcement_update',
          data: payload.new,
        });
      }
    )
    .subscribe();

  // Cleanup function
  return () => {
    rideSubscription.unsubscribe();
    enforcementSubscription.unsubscribe();
  };
}

/**
 * Helper: Convert VAPID key for Web Push
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Trigger notification event from frontend
 * (for testing or internal events)
 */
export async function triggerNotificationEvent(
  type: string,
  lot_id: string,
  data: any
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const response = await fetch('/api/events/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        lot_id,
        data,
        triggered_by: user?.id,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('✗ Failed to trigger notification:', error);
    return null;
  }
}
