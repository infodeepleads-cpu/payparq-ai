import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { initializeFirebase, getFCMToken } from '@/lib/firebase';

export function useDeviceToken(userId: string | null) {
  useEffect(() => {
    if (!userId || !supabase) return;

    const storeToken = async () => {
      try {
        if (typeof window === 'undefined') return;

        // If permission already granted, always get fresh FCM token
        if ('Notification' in window && Notification.permission === 'granted') {
          await initializeFirebase();
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            localStorage.setItem('deviceToken', fcmToken);
            // Replace all old tokens with the fresh one
            await supabase!.from('device_tokens').delete().eq('user_id', userId);
            await supabase!.from('device_tokens').insert(
              { user_id: userId, token: fcmToken, platform: 'web' }
            );
            return;
          }
        }
      } catch (err) {
        console.error('Failed to store device token:', err);
      }
    };

    storeToken();
  }, [userId]);
}
