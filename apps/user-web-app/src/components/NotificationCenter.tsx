'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { initializeFirebase, getFCMToken } from '@/lib/firebase';

interface NotificationCenterProps {
  userId: string | null;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const { notifications, unread, markRead } = useNotifications(userId);

  const handleRequestPermission = async () => {
    try {
      setRequestingPermission(true);
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await initializeFirebase();
          const token = await getFCMToken();
          console.log('FCM token obtained:', token);
        }
      }
    } catch (err) {
      console.error('Permission request failed:', err);
    } finally {
      setRequestingPermission(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
          <button
            onClick={handleRequestPermission}
            disabled={requestingPermission}
            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            title="Enable notifications"
          >
            {requestingPermission ? 'Requesting...' : 'Enable Notifications'}
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
