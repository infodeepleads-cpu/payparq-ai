// Notification Service Logic
// Strategy: Multi-channel delivery
// 1. Email: ALWAYS sent (Standard/Free)
// 2. Push: Sent if user has an FCM token (Free)
// 3. WhatsApp: Paid Lot Feature ONLY. Sent if location is paid tier AND user has mobile.

export type NotificationChannel = 'push' | 'whatsapp' | 'email';

export interface UserProfile {
  id: string;
  email: string;
  mobile?: string;
  fcm_token?: string;
}

export interface LocationProfile {
  id: string;
  is_paid_tier: boolean; // 15€/spot tier
  whatsapp_enabled?: boolean; // Explicit toggle for LPR lot user
}

export async function determineNotificationChannels(
  user: UserProfile,
  location: LocationProfile
): Promise<NotificationChannel[]> {
  const channels: NotificationChannel[] = ['email']; // Email is mandatory/fallback

  // 1. Push Notification (If available)
  if (user.fcm_token) {
    channels.push('push');
  }

  // 2. WhatsApp (Paid Feature + Explicitly Enabled)
  // Rule: WhatsApp is a cost, so only allowed if:
  // - Location is on "Paid Tier" (15€/spot)
  // - LPR User has turned it on (whatsapp_enabled)
  // - User has a mobile number
  if (location.is_paid_tier && location.whatsapp_enabled && user.mobile) {
    channels.push('whatsapp');
  }

  return channels;
}

export async function sendNotification(
  userId: string,
  locationId: string,
  message: string,
  context: { user: UserProfile; location: LocationProfile }
) {
  const channels = await determineNotificationChannels(context.user, context.location);
  
  console.log(`[NotificationService] Dispatching to [${channels.join(', ')}]: "${message}" to user ${userId}`);

  const results = await Promise.all(channels.map(async (channel) => {
    try {
      switch (channel) {
        case 'push':
          // await fcm.send(...)
          console.log(' -> Push sent');
          break;
        case 'email':
          // await resend.send(...)
          console.log(' -> Email sent');
          break;
        case 'whatsapp':
          // await whatsapp.sendTemplate(...)
          console.log(' -> WhatsApp sent');
          break;
      }
      return { channel, success: true };
    } catch (error) {
      console.error(` -> Error sending ${channel}:`, error);
      return { channel, success: false, error };
    }
  }));

  return { sent: true, results };
}
