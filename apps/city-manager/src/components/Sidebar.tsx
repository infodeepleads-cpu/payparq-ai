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
    <aside className="hidden md:flex flex-col w-[280px] h-full bg-sidebar border-r border-gray-100 text-sidebarText text-sm pt-4 pb-4">
      <div className="px-3 pb-3 sticky top-0 bg-sidebar border-b border-gray-100 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-black">PayParq</h1>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {/* Navigation Links */}
        <div className="pb-4 pt-2">
          <a href="/" className={`flex items-center gap-2 px-3 py-2 rounded-md ${!window.location.pathname.includes('inbox') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span>Chat</span>
          </a>
          <a href="/inbox" className={`flex items-center gap-2 px-3 py-2 rounded-md ${window.location.pathname.includes('inbox') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span>Inbox</span>
          </a>
        </div>

        <div className="pb-2 px-0">
          <h3 className="text-xs font-semibold text-gray-500">Your chats</h3>
        </div>
        
        <div className="space-y-1">
          {threads.length === 0 && (
            <div className="px-3 py-2 text-gray-400">No chats yet</div>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center justify-between px-0 py-1 ${
                currentId === t.id ? "text-black font-medium" : "text-gray-700 hover:text-black"
              }`}
            >
              <button
                className="flex-1 text-left truncate bg-transparent border-0 p-0"
                onClick={() => setCurrentThread(t.id)}
                title={t.title}
              >
                <span className="truncate">{t.title || "Untitled"}</span>
              </button>
              <button
                aria-label="Delete chat"
                onClick={() => removeThread(t.id)}
                className="bg-transparent border-0 p-0"
                title="Delete"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-9 4v6m6-6v6M9 7l1-2h4l1 2m1 0l-1 12a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </nav>
      {/* Bottom section removed as requested */}
    </aside>
  );
}
