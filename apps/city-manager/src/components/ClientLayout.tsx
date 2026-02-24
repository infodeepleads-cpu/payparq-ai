"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MachineIo from "./MachineIo";
import DailyRecap from "./DailyRecap";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  const isHomePage = pathname === "/";

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.show().catch(() => {});
      StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    }
  }, []);

  if (isAuthPage) {
    return <main className="h-full w-full bg-white">{children}</main>;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden pt-[40px] relative">
        <Sidebar />
        <main className="flex-1 flex flex-col pl-[40px] h-full overflow-hidden w-full relative">
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full w-full overflow-y-auto scrollbar-hide">
              <div className={`max-w-3xl w-full mx-auto ${isHomePage ? 'pb-8' : 'pb-8'}`}>
                  {children}
                </div>
            </div>
          </div>
          {isHomePage && (
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
