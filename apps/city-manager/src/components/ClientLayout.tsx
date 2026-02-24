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

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.hide().catch(() => {});
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    }
  }, []);

  if (isAuthPage) {
    return <main className="h-full w-full bg-white">{children}</main>;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden pt-[calc(60px+env(safe-area-inset-top))] relative">
        <Sidebar />
        <main className="flex-1 flex flex-col pl-[60px] pr-[1.125rem] h-full overflow-hidden w-full relative">
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-hide">
              <div className="max-w-3xl w-full mx-auto px-4 md:px-0 overflow-x-hidden">
                  {children}
                </div>
            </div>
          </div>
          <div className="w-full bg-white border-t border-gray-100 shrink-0">
            <MachineIo />
          </div>
        </main>
      </div>
      <DailyRecap />
    </div>
  );
}
