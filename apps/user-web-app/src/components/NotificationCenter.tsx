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
  const [subscribed, setSubscribed] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const { notifications, unread, markRead } = useNotifications(userId);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      // Check if actually subscribed
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          const checks = regs.map((r) => r.pushManager.getSubscription());
          Promise.all(checks).then((subs) => {
            setSubscribed(subs.some(Boolean));
          });
        });
      }
    }
  };

  const handleEnable = async () => {
    try {
      setShowSettingsHint(false);
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        await initializeFirebase();
        const token = await getFCMToken();
        if (token && userId && supabase) {
          await supabase.from('device_tokens').upsert(
            { user_id: userId, token, platform: 'web' },
            { onConflict: 'user_id,token' }
          );
        }
        setSubscribed(true);
      } else if (result === 'denied') {
        // Browser-level denied — user must go to settings
        setShowSettingsHint(true);
      }
    } catch (err) {
      console.error('Enable notifications failed:', err);
    }
  };

  const handleSettingsHintDismiss = () => {
    setShowSettingsHint(false);
    // Re-check permission in case user changed browser settings
    setTimeout(checkPermission, 500);
  };

  const handleDisable = async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('Disable notifications failed:', err);
    }
  };

  const isEnabled = permission === 'granted' && subscribed;
  const isBrowserDenied = permission === 'denied';

  return (
    <>
      <div className="flex items-center gap-1 md:gap-2">
        {isBrowserDenied ? (
          <button
            onClick={() => setShowSettingsHint(true)}
            className="px-2 py-1 text-[11px] font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
            title="Notifications blocked — open browser settings to enable"
          >
            <BellOff className="w-3 h-3" />
            <span className="hidden md:inline">Blokirano</span>
          </button>
        ) : isEnabled ? (
          <button
            onClick={handleDisable}
            className="px-2 py-1 text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1"
            title="Disable notifications"
          >
            <BellRing className="w-3 h-3" />
            <span className="hidden md:inline">Uključeno</span>
          </button>
        ) : (
          <button
            onClick={handleEnable}
            className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
            title="Enable notifications"
          >
            <BellRing className="w-3 h-3" />
            <span className="hidden md:inline">Omogući obavijesti</span>
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

      {/* Browser-level blocked hint */}
      {showSettingsHint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleSettingsHintDismiss}>
          <div className="bg-white rounded-xl w-full max-w-sm mx-4 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-black">Obavijesti su blokirane</h3>
            <p className="text-sm text-black/70">
              Vaš preglednik blokira obavijesti za ovu stranicu. Da biste ih omogućili, otvorite postavke preglednika i dopustite obavijesti za payparq.com.
            </p>
            <button
              onClick={handleSettingsHintDismiss}
              className="w-full px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors"
            >
              Razumijem
            </button>
          </div>
        </div>
      )}

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
                    {notif.data?.body && (
                      <p className="text-xs text-black/70 mt-0.5">{notif.data.body}</p>
                    )}
                    <p className="text-xs text-black/40 mt-1">
                      {new Date(notif.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
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
