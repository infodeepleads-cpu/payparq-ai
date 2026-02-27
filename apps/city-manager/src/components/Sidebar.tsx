"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

type Thread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

const THREADS_KEY = "pp_chat_threads";
const CURRENT_KEY = "pp_current_thread";
const MSG_PREFIX = "pp_chat_messages_";

function readThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeThreads(threads: Thread[]) {
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}
function setCurrent(id: string | null) {
  if (id) localStorage.setItem(CURRENT_KEY, id);
  else localStorage.removeItem(CURRENT_KEY);
  window.dispatchEvent(new CustomEvent("pp-current-thread", { detail: { id } }));
}
function removeThread(id: string) {
  const threads = readThreads().filter(t => t.id !== id);
  writeThreads(threads);
  localStorage.removeItem(MSG_PREFIX + id);
  const cur = localStorage.getItem(CURRENT_KEY);
  if (cur === id) setCurrent(threads[0]?.id ?? null);
  window.dispatchEvent(new Event("storage"));
}
function createThread(): Thread {
  const t: Thread = {
    id: String(Date.now()),
    title: "Untitled",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const threads = readThreads();
  threads.unshift(t);
  writeThreads(threads);
  setCurrent(t.id);
  return t;
}

export default function Sidebar() {
  const [threads, setThreads] = useState<any[]>([]);
  const [currentId, setCurrent] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const { t } = useLanguage();
  const pathname = usePathname() || "";

  const THREADS_KEY = "pp_chat_threads";
  const CURRENT_KEY = "pp_current_thread";

  useEffect(() => {
    // ... (rest of the effect logic remains the same)
    const load = () => {
      try {
        const raw = localStorage.getItem(THREADS_KEY);
        setThreads(raw ? JSON.parse(raw) : []);
        setCurrent(localStorage.getItem(CURRENT_KEY));
      } catch {}
    };
    load();
    window.addEventListener("storage", load);
    
    // Auth check
    try {
      const supabase = getSupabase();
      supabase.auth.getUser().then(({ data }) => {
        const u = data?.user;
        const name = (u?.user_metadata as any)?.name || u?.email || null;
        setUserName(name);
      });
    } catch {}

    return () => window.removeEventListener("storage", load);
  }, []);

  const setCurrentThread = (id: string) => {
    localStorage.setItem(CURRENT_KEY, id);
    setCurrent(id);
    window.dispatchEvent(new CustomEvent("pp-current-thread", { detail: { id } }));
  };

  const removeThread = (id: string) => {
    const next = threads.filter((t) => t.id !== id);
    localStorage.setItem(THREADS_KEY, JSON.stringify(next));
    setThreads(next);
    if (currentId === id) {
      localStorage.removeItem(CURRENT_KEY);
      setCurrent(null);
      window.dispatchEvent(new CustomEvent("pp-current-thread", { detail: { id: null } }));
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch {}
  };

  return (
    <>
      {/* Removed spacer to prevent horizontal overflow; layout now uses padding on content container */}
      <aside className="fixed left-0 top-[40px] bottom-0 w-[40px] bg-white border-r border-black flex flex-col items-center py-4 z-[100]">
        
        {/* Main Categories (Overflow visible for tooltips) */}
        <div className="px-2 py-2 space-y-3 overflow-visible border-b border-black">

          {/* Chat Icon - First Place */}
          <div>
            <Link href={{ pathname: "/", query: { show_chat: "1" } }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname === '/' ? 'text-black' : 'text-black/60 hover:text-black'}`}>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </Link>
          </div>


          <Link href={{ pathname: "/inbox" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('inbox') ? 'text-black' : 'text-black/60 hover:text-black'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </Link>

          <Link href={{ pathname: "/espresso" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('espresso') ? 'text-black' : 'text-black/60 hover:text-black'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M6 3h12l-1 7H7L6 3z" /></svg>
          </Link>
          <Link href={{ pathname: "/daily-recap" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('daily-recap') ? 'text-black' : 'text-black/60 hover:text-black'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h5" /></svg>
          </Link>
          <Link href={{ pathname: "/crm" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('crm') ? 'text-black' : 'text-black/60 hover:text-black'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c-4 0-7 2-7 4v3h14v-3c0-2-3-4-7-4z" /></svg>
          </Link>
          <Link href={{ pathname: "/" }} className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname === '/' ? 'text-black' : 'text-black/60 hover:text-black'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </Link>
        </div>


      </aside>
    </>
  );
}
