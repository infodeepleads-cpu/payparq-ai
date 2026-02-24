"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

import Link from "next/link";

export default function Header() {
  const [userName, setUserName] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    // Auth check
    try {
      const supabase = getSupabase();
      supabase.auth.getUser().then(({ data }) => {
        const u = data?.user;
        const name = (u?.user_metadata as any)?.name || u?.email || null;
        setUserName(name);
      });
    } catch {}
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      localStorage.clear(); // Ensure all local data is wiped
      window.location.href = "/auth";
    } catch {
      // Force clear even if signOut fails
      localStorage.clear();
      window.location.href = "/auth";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full border-b border-gray-100 bg-sidebar shrink-0 z-[999] overflow-visible flex flex-col">
      {/* Status Bar background for mobile/APK - Matches bg-sidebar (#F9F9F9) */}
      <div className="h-[env(safe-area-inset-top,0px)] bg-[#F9F9F9] w-full" />
      
      <div className="w-full h-[40px] flex items-center px-4 relative">
        {/* Logo - Left aligned */}
        <Link href="/" className="text-xl font-bold text-black tracking-tight hover:opacity-80 transition-opacity no-underline shrink-0 z-20">
          PayParq
        </Link>

        {/* Icons - Centered relative to screen and shifted right by ~1.0cm (38px) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex items-center justify-center gap-[14px] md:gap-[22px] pointer-events-auto translate-x-[38px]">
            {/* Reminders */}
            <Link 
              href={{ pathname: "/reminders" }}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-black focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </Link>

            {/* Browser */}
            <Link 
              href={{ pathname: "/browser" }}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-black focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0118 0z" /></svg>
            </Link>

            {/* Resources */}
            <Link 
              href={{ pathname: "/resources" }}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-black focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            </Link>

            {/* Settings Cog */}
            <Link 
              href={{ pathname: "/settings" }}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-black focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-black focus:outline-none shrink-0 bg-transparent border-none p-0"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
