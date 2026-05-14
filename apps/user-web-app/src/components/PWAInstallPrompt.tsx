'use client';

import { X, Share, Plus } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useEffect, useState } from 'react';

interface PWAInstallPromptProps {
  storageKey: string;
  appName: string;
  themeColor?: string;
}

export function PWAInstallPrompt({ storageKey, appName, themeColor = '#5F3DFC' }: PWAInstallPromptProps) {
  const { showPrompt, isIOS, handleInstall, handleDismiss } = useInstallPrompt(storageKey);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  if (!showPrompt || !isMobile) return null;

  // Minimal prompt for both iOS and Android
  return (
    <div className="fixed bottom-0 left-0 right-0 text-white p-4 shadow-2xl z-50 md:hidden" style={{ background: `linear-gradient(135deg, ${themeColor}, #0a0a0a)` }}>
      <div className="max-w-md mx-auto">
        <p className="font-bold text-sm mb-1">{appName}</p>
        <p className="text-xs opacity-80 mb-3">Instaliraj aplikaciju</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 px-3 py-2 bg-white rounded-lg font-bold text-xs transition-colors"
            style={{ color: themeColor }}
          >
            Instaliraj
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 bg-white/20 rounded-lg font-bold text-xs text-white hover:bg-white/30 transition-colors"
          >
            Kasnije
          </button>
        </div>
      </div>
    </div>
  );
}
