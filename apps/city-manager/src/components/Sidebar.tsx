 "use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    setThreads(readThreads());
    setCurrentId(localStorage.getItem(CURRENT_KEY));
    const onStorage = () => {
      setThreads(readThreads());
      setCurrentId(localStorage.getItem(CURRENT_KEY));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pp-current-thread", onStorage as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pp-current-thread", onStorage as any);
    };
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-[280px] h-full bg-sidebar border-r border-gray-100 text-sidebarText text-sm pt-4 pb-4">
      <div className="px-3 pb-3">
        <span className="text-sm font-semibold tracking-tight text-black">machine.io</span>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="pb-2 px-3">
          <h3 className="text-xs font-semibold text-gray-500">Your chats</h3>
        </div>
        
        <div className="space-y-1">
          {threads.length === 0 && (
            <div className="px-3 py-2 text-gray-400">No chats yet</div>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                currentId === t.id ? "bg-gray-200 text-black" : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <button
                className="flex-1 text-left truncate"
                onClick={() => setCurrent(t.id)}
                title={t.title}
              >
                <span className="truncate">{t.title || "Untitled"}</span>
              </button>
              <button
                aria-label="Delete chat"
                onClick={() => removeThread(t.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-gray-200 transition-opacity"
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
      
      <div className="px-3 mt-auto pt-4 border-t border-gray-100 mb-10">
        <div className="flex items-center gap-3 px-3 py-3 w-full">
          <div className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
            KŽ
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-medium text-black">Karlo Žamić</span>
             <span className="text-xs text-gray-500">Basic</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
