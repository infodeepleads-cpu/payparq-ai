'use client';

import { X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useEffect, useState } from 'react';

export function PWAInstallPrompt() {
  const { showPrompt, handleInstall, handleDismiss } = useInstallPrompt();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));
  }, []);

  if (!showPrompt || !isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#5F3DFC] to-[#7c5cff] text-white p-4 shadow-2xl z-50 md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Install Payparq App</p>
          <p className="text-xs opacity-90">Quick access to manage parking</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-white text-[#5F3DFC] rounded-lg font-semibold text-xs hover:bg-gray-100 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
