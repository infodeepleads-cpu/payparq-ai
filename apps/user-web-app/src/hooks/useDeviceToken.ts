import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { initializeFirebase, getFCMToken } from '@/lib/firebase';

export function useDeviceToken(userId: string | null) {
  useEffect(() => {
    if (!userId || !supabase) return;

    const storeToken = async () => {
      try {
        if (typeof window === 'undefined') return;

        // If permission already granted, register FCM immediately
        if ('Notification' in window && Notification.permission === 'granted') {
          await initializeFirebase();
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            await supabase!.from('device_tokens').upsert(
              { user_id: userId, token: fcmToken, platform: 'web' },
              { onConflict: 'user_id,token' }
            );
            localStorage.setItem('deviceToken', fcmToken);
            return;
          }
        }

        // Fallback to stored token
        const stored = localStorage.getItem('deviceToken');
        if (stored && !stored.startsWith('web_')) return; // already a real FCM token

        // Generate placeholder if nothing stored
        if (!stored) {
          const placeholder = 'web_' + Math.random().toString(36).substr(2, 9) + Date.now();
          localStorage.setItem('deviceToken', placeholder);
          await supabase!.from('device_tokens').upsert(
            { user_id: userId, token: placeholder, platform: 'web' },
            { onConflict: 'user_id,token' }
          );
        }
      } catch (err) {
        console.error('Failed to store device token:', err);
      }
    };

    storeToken();
  }, [userId]);
}
