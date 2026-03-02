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
  const [userRole, setUserRole] = useState<string | null>(null);
  const isAuthPage = pathname?.startsWith("/auth");
  const isHomePage = pathname === "/";
  const isNewNotePage = pathname === "/resources/notes/new";
  const isMapPage = pathname?.startsWith("/map");
  const isPaymentPage = pathname?.startsWith("/payment") || pathname === "/pay";
  const isCalendarPage = pathname?.startsWith("/calendar");
  const isRidesPage = pathname?.startsWith("/rides");
  const isProfilePage = pathname === "/profile";
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
        setUserRole(currentUser?.user_metadata?.role || null);
        
        // If not authenticated, check if the page/action is allowed for guests
        // Allowed: Home (/), Auth (/auth), Map, and Rides (/rides)
        const isGuestAllowed = isHomePage || isAuthPage || isMapPage || isRidesPage;

        if (!currentUser && !isGuestAllowed) {
          router.replace("/");
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          const newUser = session?.user ?? null;
          setUser(newUser);
          setUserRole(newUser?.user_metadata?.role || null);
          const currentIsGuestAllowed = isHomePage || isAuthPage || isMapPage || isRidesPage;
          if (!newUser && !currentIsGuestAllowed) {
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

  const isSuperAdmin = user?.email === "payparq@outlook.com";
  const isDeepleads = user?.email?.toLowerCase()?.startsWith('info.deepleads');
  const isZastupnik = userRole === "3" || isDeepleads;
  const isAdmin = isSuperAdmin || isZastupnik;
  const isLimitedRole = (userRole === "0" || userRole === "1" || userRole === "2" || userRole === "4") && !isDeepleads;

  const shouldHideLayout = (isLimitedRole || hideLayout || isMapPage || isPaymentPage || isCalendarPage || isRidesPage || isProfilePage || !user || (isHomePage && !isMachineIoOpen)) && (!isMachineIoOpen || isLimitedRole);

  if (isLoading && !isHomePage && !isAuthPage && !isMapPage) {
    return <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7C3AED]"></div>
    </div>;
  }

  if ((isAuthPage || isNewNotePage || isCalendarPage || isPaymentPage || isRidesPage || isProfilePage) && !showChat) {
    return <main className={`h-full w-full bg-white ${isAuthPage || isProfilePage ? '' : 'overflow-hidden overscroll-none'}`}>{children}</main>;
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
              <div className={`fixed inset-0 z-[2000] pointer-events-none flex flex-col ${isAdmin && !shouldHideLayout ? 'pt-[40px] pl-[40px]' : ''}`}>
                <div className="w-full pointer-events-auto flex-1 flex flex-col h-full bg-white relative">
                  {/* Close/Back Button */}
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams(searchParams?.toString());
                      params.delete("show_chat");
                      const targetUrl = pathname + (params.toString() ? "?" + params.toString() : "");
                      router.replace(targetUrl as any);
                    }}
                    className="absolute top-4 left-4 z-[2001] h-10 w-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors group"
                    title="Zatvori chat"
                  >
                    <svg className="w-5 h-5 text-black/40 group-hover:text-black/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
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
