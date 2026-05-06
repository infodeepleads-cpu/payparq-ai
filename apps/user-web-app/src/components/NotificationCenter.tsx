'use client';

import { useState, useEffect } from 'react';
import { Bell, X, BellOff, BellRing } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { initializeFirebase, getFCMToken } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

interface NotificationCenterProps {
  userId: string | null;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const { notifications, unread, markRead } = useNotifications(userId);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleTogglePushNotifications = async () => {
    try {
      if (permission === 'granted') {
        // Disable: unsubscribe from push
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
        }
        setPermission('denied');
      } else {
        // Enable: request permission
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
          await initializeFirebase();
          const token = await getFCMToken();
          console.log('[NC] Token:', token?.substring(0, 20), 'UserId:', userId, 'Supabase:', !!supabase);
          if (token && userId && supabase) {
            console.log('[NC] Saving token to Supabase...');
            const { error } = await supabase.from('device_tokens').upsert(
              { user_id: userId, token, platform: 'web' },
              { onConflict: 'user_id,token' }
            );
            if (error) {
              console.error('[NC] Supabase error:', error);
            } else {
              console.log('[NC] Token saved successfully');
            }
          } else {
            console.log('[NC] Missing required data - token:', !!token, 'userId:', !!userId, 'supabase:', !!supabase);
          }
        }
      }
    } catch (err) {
      console.error('Toggle push notifications failed:', err);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {permission === 'default' && (
          <button
            onClick={handleTogglePushNotifications}
            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <BellRing className="w-3.5 h-3.5" />
            Enable Notifications
          </button>
        )}
        {permission === 'granted' && (
          <button
            onClick={handleTogglePushNotifications}
            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5"
            title="Push notifications enabled"
          >
            <BellRing className="w-3.5 h-3.5" />
            On
          </button>
        )}
        {permission === 'denied' && (
          <button
            onClick={handleTogglePushNotifications}
            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
            title="Push notifications disabled"
          >
            <BellOff className="w-3.5 h-3.5" />
            Off
          </button>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-white" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-md h-96 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
              <h3 className="font-semibold text-black">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Close">
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 p-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-black/60 p-4 text-center">No notifications yet</p>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      notif.read ? 'bg-white hover:bg-black/5' : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${notif.read ? 'text-black/70' : 'text-black'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-black/60 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
