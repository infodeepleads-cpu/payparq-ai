"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

import Link from "next/link";

export default function Header() {
  const [userName, setUserName] = useState<string | null>(null);

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
      window.location.href = "/auth";
    } catch {}
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full flex items-center justify-between h-[60px] px-4 border-b border-gray-100 bg-sidebar shrink-0 z-50">
      <div className="flex items-center h-full">
        <h1 className="text-xl font-bold text-black tracking-tight">PayParq</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Mission */}
        <Link 
          href={{ pathname: "/mission" }}
          className="group relative flex items-center justify-center p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.866 0-7 1.79-7 4v4h14v-4c0-2.21-3.134-4-7-4z" /></svg>
          <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Mission</span>
        </Link>

        {/* Reminders */}
        <Link 
          href={{ pathname: "/reminders" }}
          className="group relative flex items-center justify-center p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Reminders</span>
        </Link>

        {/* Browser */}
        <Link 
          href={{ pathname: "/browser" }}
          className="group relative flex items-center justify-center p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Browser</span>
        </Link>

        {/* Settings Wrench */}
        <Link 
          href={{ pathname: "/settings" }}
          className="group relative flex items-center justify-center p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Settings</span>
        </Link>

        {/* Credentials */}
        <Link 
          href={{ pathname: "/profile" }}
          className="group relative flex items-center justify-center p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700 border border-gray-200">
            {userName ? userName[0].toUpperCase() : 'U'}
          </div>
          <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            <div className="font-medium">{userName || 'User'}</div>
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mt-0.5">Credentials</div>
          </div>
        </Link>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="group relative flex items-center justify-center p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-black focus:outline-none bg-transparent border-none ring-0 shadow-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
