"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MachineIo from "./MachineIo";
import DailyRecap from "./DailyRecap";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hideLayout, setHideLayout] = useState(false);
  const isAuthPage = pathname?.startsWith("/auth");
  const isHomePage = pathname === "/";
  const isNewNotePage = pathname === "/resources/notes/new";

  useEffect(() => {
    const handleToggle = (e: any) => setHideLayout(e.detail);
    window.addEventListener('toggle-layout', handleToggle);
    return () => window.removeEventListener('toggle-layout', handleToggle);
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initStatusBar = async () => {
        try {
          await StatusBar.show();
          await StatusBar.setBackgroundColor({ color: '#F9F9F9' });
          await StatusBar.setOverlaysWebView({ overlay: false });
          // Set to LIGHT style (dark icons) because background is light gray (#F9F9F9)
          await StatusBar.setStyle({ style: 'LIGHT' as any });
        } catch (e) {
          console.error('StatusBar error:', e);
        }
      };
      initStatusBar();
    }
  }, []);

  if (isAuthPage || isNewNotePage) {
    return <main className="h-full w-full bg-white">{children}</main>;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-background">
      {!hideLayout && <Header />}
      <div className={`flex-1 flex overflow-hidden ${!hideLayout ? 'pt-[40px]' : ''} relative`}>
        {!hideLayout && <Sidebar />}
        <main className={`flex-1 flex flex-col ${!hideLayout ? 'pl-[40px]' : ''} h-full overflow-hidden w-full relative`}>
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full w-full overflow-y-auto scrollbar-hide">
              <div className={`max-w-3xl w-full mx-auto h-full ${hideLayout ? 'max-w-none px-0' : ''} ${isHomePage ? 'pb-8' : 'pb-8'}`}>
                  {children}
                </div>
            </div>
          </div>
          {isHomePage && !hideLayout && (
            <div className="absolute top-0 right-0 bottom-0 left-[40px] z-50 pointer-events-none flex flex-col justify-end">
              <div className="w-full pointer-events-auto max-h-full flex flex-col h-full">
                <MachineIo />
              </div>
            </div>
          )}
        </main>
      </div>
      <DailyRecap />
    </div>
  );
}
