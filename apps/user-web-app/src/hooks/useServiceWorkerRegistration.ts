import { useEffect } from 'react';

export function useServiceWorkerRegistration(scope: string) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Only register if not already registered for this scope
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
                      console.log('✓ New SW update available - refresh to apply');
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

        console.log(`✓ Service Worker registered for scope: ${scope}`, registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            registration.installing.addEventListener('statechange', () => {
              if (registration.installing?.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✓ New SW update available - refresh to apply');
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
