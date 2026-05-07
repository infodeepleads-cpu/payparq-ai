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

  // iOS: custom instructions (no beforeinstallprompt on Safari)
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 text-white p-4 shadow-2xl z-50 md:hidden" style={{ background: `linear-gradient(135deg, ${themeColor}, #0a0a0a)` }}>
        <div className="max-w-md mx-auto">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-bold text-sm">Install {appName}</p>
              <p className="text-xs opacity-80 mt-0.5">Add to your home screen for quick access</p>
            </div>
            <button onClick={handleDismiss} className="p-1 hover:bg-white/20 rounded transition-colors shrink-0 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-white/20 rounded-lg p-1.5">
                <Share className="w-4 h-4" />
              </span>
              <span className="opacity-80">Tap</span>
              <span className="font-semibold">Share</span>
            </div>
            <span className="text-white/40 text-xs">→</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-white/20 rounded-lg p-1.5">
                <Plus className="w-4 h-4" />
              </span>
              <span className="font-semibold">Add to Home Screen</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop: native install prompt
  return (
    <div className="fixed bottom-0 left-0 right-0 text-white p-4 shadow-2xl z-50 md:hidden" style={{ background: `linear-gradient(135deg, ${themeColor}, #0a0a0a)` }}>
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-sm">Install {appName}</p>
          <p className="text-xs opacity-80">Quick access, works offline</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-white rounded-lg font-bold text-xs transition-colors"
            style={{ color: themeColor }}
          >
            Install
          </button>
          <button onClick={handleDismiss} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
