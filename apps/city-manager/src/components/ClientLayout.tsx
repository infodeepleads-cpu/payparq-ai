"use client";

import { useEffect, useState, Suspense } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DailyRecap from "./DailyRecap";
import { getSupabase } from "../lib/supabase";

const MachineIo = dynamic(() => import("./MachineIo"), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hideLayout, setHideLayout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const isAuthPage = pathname?.startsWith("/auth");
  const isHomePage = pathname === "/";
  const isNewNotePage = pathname === "/resources/notes/new";
  const isMapPage = pathname?.startsWith("/map");
  const isPaymentPage = pathname?.startsWith("/payment") || pathname === "/pay";
  const isCalendarPage = pathname?.startsWith("/calendar");
  const isRidesPage = pathname?.startsWith("/rides");
  const isMachineIoOpen = searchParams?.get("show_chat") === "1" || searchParams?.get("show_chat") === "true";
  const actionParam = searchParams?.get("action");
  const isLocateAction = actionParam === "locate";
  const showChat = isMachineIoOpen;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
        // If not authenticated, check if the page/action is allowed for guests
        // Allowed: Home (/), Auth (/auth), Map, and Rides (/rides)
        const isGuestAllowed = isHomePage || isAuthPage || isMapPage || isRidesPage;

        if (!currentUser && !isGuestAllowed) {
          router.replace("/");
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          setUser(session?.user ?? null);
          const currentIsGuestAllowed = isHomePage || isAuthPage || isMapPage || isRidesPage;
          if (!session?.user && !currentIsGuestAllowed) {
            router.replace("/");
          }
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, isHomePage, isAuthPage, isMapPage, isLocateAction, showChat, router]);

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

  const shouldHideLayout = (hideLayout || isMapPage || isPaymentPage || isCalendarPage || isRidesPage || !user || (isHomePage && !isMachineIoOpen)) && !isMachineIoOpen;

  if (isLoading && !isHomePage && !isAuthPage && !isMapPage) {
    return <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7C3AED]"></div>
    </div>;
  }

  if ((isAuthPage || isNewNotePage || isCalendarPage || isPaymentPage || isRidesPage) && !showChat) {
    return <main className={`h-full w-full bg-white ${isAuthPage ? '' : 'overflow-hidden overscroll-none'}`}>{children}</main>;
  }

  return (
    <Suspense fallback={null}>
      <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-background">
        {!shouldHideLayout && <Header />}
        <div className={`flex-1 flex overflow-hidden ${!shouldHideLayout ? 'pt-[40px]' : ''} relative`}>
          {!shouldHideLayout && <Sidebar />}
          <main className={`flex-1 flex flex-col ${!shouldHideLayout ? 'pl-[40px]' : ''} h-full overflow-hidden w-full relative`}>
            <div className="flex-1 overflow-hidden relative">
              <div className="h-full w-full overflow-y-auto scrollbar-hide">
                <div className={`max-w-3xl w-full mx-auto h-full ${shouldHideLayout ? 'max-w-none px-0' : ''} ${isHomePage ? 'pb-8' : 'pb-8'}`}>
                    {children}
                  </div>
              </div>
            </div>
            {showChat && (
              <div className="fixed inset-0 z-[2000] pointer-events-none flex flex-col">
                <div className="w-full pointer-events-auto flex-1 flex flex-col h-full bg-white">
                  <MachineIo />
                </div>
              </div>
            )}
          </main>
        </div>
        {!shouldHideLayout && <DailyRecap />}
      </div>
    </Suspense>
  );
}
