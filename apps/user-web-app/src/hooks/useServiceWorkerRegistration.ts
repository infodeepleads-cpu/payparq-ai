import { useEffect } from 'react';

export function useServiceWorkerRegistration(scope: string) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const notifyUpdate = () => {
      const updateNotification = document.createElement('div');
      updateNotification.id = 'sw-update-notification';
      updateNotification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #5F3DFC;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      updateNotification.innerHTML = `
        <span>New version available</span>
        <button onclick="window.location.reload()" style="background: white; color: #5F3DFC; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500;">
          Refresh
        </button>
      `;
      document.body.appendChild(updateNotification);
    };

    const registerServiceWorker = async () => {
      try {
        // Register immediately — do not wait for load event so SW is ready before beforeinstallprompt fires
        const registrations = await navigator.serviceWorker.getRegistrations();
        const alreadyRegistered = registrations.some(r => r.scope === `${window.location.origin}${scope}`);

        if (alreadyRegistered) {
          // Still check for updates on existing registration
          registrations.forEach(r => {
            if (r.scope === `${window.location.origin}${scope}`) {
              r.update();
              r.addEventListener('updatefound', () => {
                if (r.installing) {
                  r.installing.addEventListener('statechange', () => {
                    if (r.installing?.state === 'installed' && navigator.serviceWorker.controller) {
                      notifyUpdate();
                    }
                  });
                }
              });
            }
          });
          return;
        }

        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: scope,
        });

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            registration.installing.addEventListener('statechange', () => {
              if (registration.installing?.state === 'installed' && navigator.serviceWorker.controller) {
                notifyUpdate();
              }
            });
          }
        });

        // Check for updates periodically
        const checkInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60000); // Check every minute

        return () => clearInterval(checkInterval);
      } catch (err: any) {
        console.error(`Failed to register Service Worker for scope ${scope}:`, err);
      }
    };

    registerServiceWorker();
  }, [scope]);
}
