import { useEffect } from 'react';

export function useServiceWorkerRegistration(scope: string) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

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
