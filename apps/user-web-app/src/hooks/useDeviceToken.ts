import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useDeviceToken(userId: string | null) {
  useEffect(() => {
    if (!userId || !supabase) return;

    const storeToken = async () => {
      try {
        // Generate or retrieve device token
        let token = localStorage.getItem('deviceToken');
        if (!token) {
          token = 'web_' + Math.random().toString(36).substr(2, 9) + Date.now();
          localStorage.setItem('deviceToken', token);
        }

        // Store in database
        await supabase
          .from('device_tokens')
          .upsert(
            { user_id: userId, token, platform: 'web' },
            { onConflict: 'user_id,token' }
          );

        // Request push notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch (err) {
        console.error('Failed to store device token:', err);
      }
    };

    storeToken();
  }, [userId]);
}
