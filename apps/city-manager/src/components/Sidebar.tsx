"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="fixed left-0 top-[40px] bottom-0 w-[40px] bg-white border-r border-black flex flex-col items-center py-4 z-[100]">
      <div className="px-2 py-2 flex flex-col gap-4 overflow-visible">
        <Link href={{ pathname: "/", query: { show_chat: "1" } }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname === "/" ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </Link>
        <Link href={{ pathname: "/reminders" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes("reminders") ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" /></svg>
        </Link>
        <Link href={{ pathname: "/browser" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes("browser") ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M3 12h18M3 19h18" /></svg>
        </Link>
        <Link href={{ pathname: "/resources" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes("resources") ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
        </Link>
        <Link href={{ pathname: "/settings" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes("settings") ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
        <Link href={{ pathname: "/inbox" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes("inbox") ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </Link>
        <Link href={{ pathname: "/espresso" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes("espresso") ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M6 3h12l-1 7H7L6 3z" /></svg>
        </Link>
        <Link href={{ pathname: "/daily-recap" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes("daily-recap") ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h5" /></svg>
        </Link>
        <Link href={{ pathname: "/crm" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes("crm") ? "text-black" : "text-black/60 hover:text-black"}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c-4 0-7 2-7 4v3h14v-3c0-2-3-4-7-4z" /></svg>
        </Link>
      </div>
    </aside>
  );
}
