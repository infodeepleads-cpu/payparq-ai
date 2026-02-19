"use client";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "../lib/supabase";

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
    window.dispatchEvent(new Event("pp-current-thread", { bubbles: true, composed: true }));
  };

  const removeThread = (id: string) => {
    const next = threads.filter((t) => t.id !== id);
    localStorage.setItem(THREADS_KEY, JSON.stringify(next));
    setThreads(next);
    if (currentId === id) {
      localStorage.removeItem(CURRENT_KEY);
      setCurrent(null);
      window.dispatchEvent(new Event("pp-current-thread"));
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
      <div className="hidden md:block w-[60px] shrink-0" />
      <aside className="hidden md:flex flex-col h-full bg-white border-r border-gray-100 text-black fixed left-0 top-[60px] bottom-0 z-40 w-[60px] pt-2">
        
        {/* Main Categories (Overflow visible for tooltips) */}
        <div className="px-2 py-2 space-y-2 overflow-visible border-b border-gray-100">
          <a href="/" className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname === '/' ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Chat</span>
          </a>
          <a href="/inbox" className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('inbox') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Inbox</span>
          </a>
          <a href="/mission" className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('mission') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.866 0-7 1.79-7 4v4h14v-4c0-2.21-3.134-4-7-4z" /></svg>
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Mission</span>
          </a>
          <a href="/espresso" className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('espresso') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M6 3h12l-1 7H7L6 3z" /></svg>
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Espresso</span>
          </a>
          <a href="/daily-recap" className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('daily-recap') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h5" /></svg>
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Daily Recap</span>
          </a>
          <a href="/crm" className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('crm') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14c-4 0-7 2-7 4v3h14v-3c0-2-3-4-7-4z" /></svg>
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">CRM</span>
          </a>
          <a href="/resources" className={`group relative flex items-center justify-center p-2 rounded-md transition-colors ${pathname.includes('resources') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Resources</span>
          </a>
        </div>

        {/* Chat History (Scrollable, uses native title for tooltips) */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {threads.length > 0 && (
             <div className="px-1 mb-2">
                <div className="h-px bg-gray-100 mx-2" />
             </div>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center justify-center px-2 py-1.5 mx-2 rounded-md relative ${
                currentId === t.id ? "bg-gray-50 text-black" : "text-gray-600 hover:bg-gray-50 hover:text-black"
              }`}
            >
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setCurrentThread(t.id)}
                title={t.title || "Untitled"}
              >
                {/* Chat Icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </button>
              
              {/* Delete button (only visible on hover, small overlay) */}
              <button
                aria-label="Delete chat"
                onClick={(e) => { e.stopPropagation(); removeThread(t.id); }}
                className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 shadow-sm"
                title={`Delete ${t.title}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
