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
    <header className="fixed top-0 left-0 right-0 w-full h-[40px] border-b border-gray-100 bg-sidebar shrink-0 z-50 overflow-visible">
      <div className="w-full h-full flex items-center px-4 relative">
        {/* Logo - Left aligned */}
        <Link href="/" className="text-xl font-bold text-black tracking-tight hover:opacity-80 transition-opacity no-underline shrink-0 z-20">
          PayParq
        </Link>

        {/* Icons - Centered relative to screen and shifted right by ~1.0cm (38px) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex items-center justify-center gap-2 md:gap-4 pointer-events-auto translate-x-[38px]">
            {/* Reminders */}
            <Link 
              href={{ pathname: "/reminders" }}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">{t('reminders')}</span>
            </Link>

            {/* Browser */}
            <Link 
              href={{ pathname: "/browser" }}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0118 0z" /></svg>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">{t('browser')}</span>
            </Link>

            {/* Resources */}
            <Link 
              href={{ pathname: "/resources" }}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">{t('resources')}</span>
            </Link>

            {/* Settings Wrench */}
            <Link 
              href={{ pathname: "/settings" }}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
              </svg>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">{t('settings')}</span>
            </Link>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="group relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-black focus:outline-none shrink-0 bg-transparent border-none p-0"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white border border-gray-100 text-gray-600 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-sm">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
