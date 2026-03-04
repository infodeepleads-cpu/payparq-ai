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
  const isDostavaPage = pathname?.startsWith("/dostava");
  const isPaymentPage = pathname?.startsWith("/payment") || pathname === "/pay";
  const isCalendarPage = pathname?.startsWith("/calendar");
  const isRidesPage = pathname?.startsWith("/rides");
  const isProfilePage = pathname === "/profile";
  const isMachineIoOpen = searchParams?.get("show_chat") === "1" || searchParams?.get("show_chat") === "true";
  const actionParam = searchParams?.get("action");
  const isLocateAction = actionParam === "locate";
  const showChat = !isDostavaPage && isMachineIoOpen;
  const hasRepresentativeRole = (currentUser: any) => {
    const metadata = currentUser?.user_metadata || {};
    const roles = Array.isArray(metadata.roles)
      ? metadata.roles
      : [metadata.original_role || metadata.role];
    return roles.filter(Boolean).map((role: any) => String(role)).includes("3");
  };
  const getPrimaryRole = (currentUser: any) => {
    const metadata = currentUser?.user_metadata || {};
    const roles = Array.isArray(metadata.roles)
      ? metadata.roles
      : [metadata.original_role || metadata.role];
    const primary = roles.find((role: any) => role !== null && role !== undefined && role !== "");
    return primary !== undefined ? String(primary) : null;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        setUserRole(hasRepresentativeRole(currentUser) ? "3" : getPrimaryRole(currentUser));
        
        // If not authenticated, check if the page/action is allowed for guests
        // Allowed: Home (/), Auth (/auth), Map, and Rides (/rides)
        const isGuestAllowed = isHomePage || isAuthPage || isMapPage || isRidesPage || isDostavaPage;

        if (!currentUser && !isGuestAllowed) {
          router.replace("/");
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          const newUser = session?.user ?? null;
          setUser(newUser);
          setUserRole(hasRepresentativeRole(newUser) ? "3" : getPrimaryRole(newUser));
          const currentIsGuestAllowed = isHomePage || isAuthPage || isMapPage || isRidesPage || isDostavaPage;
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

  const isSuperAdmin = user?.email?.toLowerCase() === "payparq@outlook.com";
  const isZastupnik = userRole === "3";
  const canUseFullLayout = isSuperAdmin || isZastupnik;
  const shouldShowHeader = showChat
    ? true
    : (!hideLayout && !isMapPage && !isDostavaPage && !isPaymentPage && !isCalendarPage && !isRidesPage && !isProfilePage && !!user && !(isHomePage && !isMachineIoOpen));
  const shouldShowSidebar = shouldShowHeader && canUseFullLayout;

  if (isLoading && !isHomePage && !isAuthPage && !isMapPage) {
    return <div className="h-full w-full flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7C3AED]"></div>
    </div>;
  }

  if ((isAuthPage || isNewNotePage || isCalendarPage || isPaymentPage || isRidesPage || isProfilePage || isDostavaPage) && !showChat) {
    return <main className={`h-full w-full ${isProfilePage || isDostavaPage ? 'bg-black' : 'bg-white'} ${isAuthPage || isProfilePage || isDostavaPage ? '' : 'overflow-hidden overscroll-none'}`}>{children}</main>;
  }

  return (
    <Suspense fallback={null}>
      <div className="flex flex-col h-[100dvh] w-full overflow-hidden overscroll-none bg-background">
        {shouldShowHeader && <Header />}
        <div className={`flex-1 flex overflow-hidden ${shouldShowHeader ? 'pt-[40px]' : ''} relative`}>
          {shouldShowSidebar && <Sidebar />}
          <main className={`flex-1 flex flex-col ${shouldShowSidebar && !showChat ? 'pl-[40px]' : ''} h-full overflow-hidden w-full relative`}>
            <div className="flex-1 overflow-hidden relative">
              <div className="h-full w-full overflow-y-auto scrollbar-hide">
                <div className={`max-w-3xl w-full mx-auto h-full ${!shouldShowHeader ? 'max-w-none px-0' : ''} ${isHomePage ? 'pb-8' : 'pb-8'} ${showChat ? 'hidden' : ''}`}>
                    {children}
                  </div>
              </div>
            </div>
            {showChat && (
              <div className={`absolute inset-0 ${shouldShowSidebar ? "left-[40px]" : "left-0"} z-[2000] pointer-events-none flex flex-col overflow-hidden overscroll-none bg-white`}>
                <div className="w-full pointer-events-auto flex-1 flex flex-col h-full overflow-hidden overscroll-none bg-white relative">
                  <MachineIo />
                </div>
              </div>
            )}
          </main>
        </div>
        {shouldShowSidebar && !showChat && <DailyRecap />}
      </div>
    </Suspense>
  );
}
