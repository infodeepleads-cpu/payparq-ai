import { useState, useEffect } from 'react';

export function useInstallPrompt(storageKey: string) {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const standalone = (window.navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;

    setIsIOS(ios);
    setIsInstalled(standalone);

    const dismissed = localStorage.getItem(storageKey);
    if (dismissed || standalone) return;

    if (ios) {
      // iOS: show custom instructions after short delay
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: wait for browser event
    const beforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', beforeInstallPrompt);
  }, [storageKey]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(storageKey, 'true');
      setShowPrompt(false);
      setInstallPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setShowPrompt(false);
  };

  return { installPrompt, showPrompt, isIOS, isInstalled, handleInstall, handleDismiss };
}
