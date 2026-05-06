import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { initializeFirebase, getFCMToken } from '@/lib/firebase';

export function useDeviceToken(userId: string | null) {
  useEffect(() => {
    if (!userId || !supabase) return;

    const storeToken = async () => {
      try {
        if (!supabase) return;

        // Request notification permission first
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        // Initialize Firebase and get FCM token
        await initializeFirebase();
        let token = await getFCMToken();

        // Fallback to local token if FCM not available
        if (!token) {
          token = localStorage.getItem('deviceToken');
          if (!token) {
            token = 'web_' + Math.random().toString(36).substr(2, 9) + Date.now();
          }
        }

        localStorage.setItem('deviceToken', token);

        // Store in database
        await supabase
          .from('device_tokens')
          .upsert(
            { user_id: userId, token, platform: 'web' },
            { onConflict: 'user_id,token' }
          );
      } catch (err) {
        console.error('Failed to store device token:', err);
      }
    };

    storeToken();
  }, [userId]);
}
