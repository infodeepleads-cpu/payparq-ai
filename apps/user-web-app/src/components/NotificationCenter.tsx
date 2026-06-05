'use client';

import { useState, useEffect } from 'react';
import { Bell, X, BellOff, BellRing, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useLocale } from '@/components/LocaleProvider';
import { initializeFirebase, getFCMToken } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

interface NotificationCenterProps {
  userId: string | null;
}

const NOTIFICATION_TRANSLATIONS: Record<string, { en: string; hr: string }> = {
  'Enabled': { en: 'Enabled', hr: 'Uključeno' },
};

const nt = (key: string, locale: 'en' | 'hr') => NOTIFICATION_TRANSLATIONS[key]?.[locale] ?? key;

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const [enableError, setEnableError] = useState<string | null>(null);
  const { notifications, unread, markRead } = useNotifications(userId);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
    if (Notification.permission !== 'granted' || !userId || !supabase) {
      setSubscribed(false);
      return;
    }
    // Subscribed = we have a saved device token for this user
    const { data } = await supabase
      .from('device_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'web')
      .limit(1);
    setSubscribed(!!(data && data.length > 0));
  };

  const handleEnable = async () => {
    setEnableError(null);
    setLoading(true);
    try {
      setShowSettingsHint(false);
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'denied') {
        setShowSettingsHint(true);
        return;
      }

      if (result !== 'granted') return;

      // Init Firebase
      await initializeFirebase();

      // Get FCM token — register fresh service worker
      let swReg: ServiceWorkerRegistration | undefined;
      try {
        // Unregister stale firebase SW and re-register fresh
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          if (r.active?.scriptURL.includes('firebase-messaging-sw')) {
            await r.unregister();
          }
        }
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.error('[FCM] SW registration failed:', swErr);
        setEnableError('Greška pri registraciji servisnog radnika.');
        return;
      }

      const token = await getFCMToken();
      if (!token) {
        setEnableError('Nije moguće dobiti FCM token. Provjeri postavke preglednika.');
        return;
      }

      if (userId && supabase) {
        // Check if token already exists
        const { data: existing } = await supabase
          .from('device_tokens')
          .select('id')
          .eq('token', token)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase.from('device_tokens').insert({
            user_id: userId,
            token,
            platform: 'web',
          });
          if (insertError) {
            console.error('[FCM] Insert error:', insertError);
            setEnableError('Greška pri spremanju tokena.');
            return;
          }
        }
      }

      setSubscribed(true);
    } catch (err: any) {
      console.error('[FCM] Enable failed:', err);
      setEnableError(err?.message || 'Nepoznata greška.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      // Remove device token from DB
      if (userId && supabase) {
        await supabase.from('device_tokens').delete().eq('user_id', userId).eq('platform', 'web');
      }
      // Unsubscribe push
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('[FCM] Disable failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsHintDismiss = () => {
    setShowSettingsHint(false);
    setTimeout(checkStatus, 500);
  };

  const isEnabled = permission === 'granted' && subscribed;
  const isBrowserDenied = permission === 'denied';

  return (
    <>
      <div className="flex items-center gap-1 md:gap-2">
        {loading ? (
          <div className="px-2 py-1 flex items-center gap-1">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </div>
        ) : isBrowserDenied ? (
          <button
            onClick={() => setShowSettingsHint(true)}
            className="px-2 py-1 text-[11px] font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
            title="Notifications blocked"
          >
            <BellOff className="w-3 h-3" />
            <span className="hidden md:inline">Blokirano</span>
          </button>
        ) : isEnabled ? (
          <button
            onClick={handleDisable}
            className="px-2 py-1 text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <BellRing className="w-3 h-3" />
            <span className="hidden md:inline">{nt('Enabled', locale)}</span>
          </button>
        ) : (
          <button
            onClick={handleEnable}
            className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <BellRing className="w-3 h-3" />
            <span className="hidden md:inline">Omogući obavijesti</span>
          </button>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Obavijesti"
        >
          <Bell className="w-5 h-5 text-white" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>

      {/* Error toast */}
      {enableError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          {enableError}
          <button onClick={() => setEnableError(null)} className="ml-1 font-bold">×</button>
        </div>
      )}

      {/* Browser-level blocked hint */}
      {showSettingsHint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleSettingsHintDismiss}>
          <div className="bg-white rounded-xl w-full max-w-sm mx-4 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-black">Obavijesti su blokirane</h3>
            <p className="text-sm text-black/70 font-medium">Kako omogućiti:</p>
            {/iPhone|iPad|iPod/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '') ? (
              <ol className="text-sm text-black/70 space-y-1 list-decimal list-inside">
                <li>Otvorite <strong>Postavke</strong> na iPhoneu</li>
                <li>Idite na <strong>Safari → Obavijesti</strong></li>
                <li>Pronađite <strong>payparq.com</strong> i odaberite <strong>Dopusti</strong></li>
                <li>Vratite se ovdje i kliknite <strong>Pokušaj ponovo</strong></li>
              </ol>
            ) : /Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '') ? (
              <ol className="text-sm text-black/70 space-y-1 list-decimal list-inside">
                <li>Kliknite na <strong>ikonicu zaključavanja</strong> u URL traci</li>
                <li>Odaberite <strong>Dozvole → Obavijesti → Dopusti</strong></li>
                <li>Kliknite <strong>Pokušaj ponovo</strong> ispod</li>
              </ol>
            ) : (
              <ol className="text-sm text-black/70 space-y-1 list-decimal list-inside">
                <li>Kliknite <strong>ikonu brave</strong> pored URL-a</li>
                <li>Odaberite <strong>Dozvole za stranicu → Obavijesti → Dopusti</strong></li>
                <li>Kliknite <strong>Pokušaj ponovo</strong> ispod</li>
              </ol>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSettingsHintDismiss}
                className="flex-1 px-4 py-2 rounded-full border border-black/20 text-black text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Zatvori
              </button>
              <button
                onClick={() => { handleSettingsHintDismiss(); setTimeout(handleEnable, 600); }}
                className="flex-1 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-900 transition-colors"
              >
                Pokušaj ponovo
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-md h-96 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
              <h3 className="font-semibold text-black">Obavijesti</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 p-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-black/60 p-4 text-center">Nema obavijesti</p>
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
                    {notif.data?.body && <p className="text-xs text-black/70 mt-0.5">{notif.data.body}</p>}
                    <p className="text-xs text-black/40 mt-1">
                      {new Date(notif.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
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
