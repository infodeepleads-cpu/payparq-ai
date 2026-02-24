"use client";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  confirmed: boolean;
  createdAt: number;
};

const KEY = "pp_tasks";

function load(): Task[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(tasks: Task[]) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event("storage"));
}

export default function TopControlsWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    setTasks(load());
    const handler = () => setTasks(load());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const activeTasks = tasks.filter(t => !t.completed);
  const currentTask = activeTasks.length > 0 ? activeTasks[0] : null;

  const addTask = () => {
    const title = input.trim();
    if (!title) return;
    const t: Task = { id: String(Date.now()), title, completed: false, confirmed: false, createdAt: Date.now() };
    const newTasks = [t, ...tasks];
    setTasks(newTasks);
    save(newTasks);
    setInput("");
    setIsCreating(false);
  };

  const toggleComplete = (id: string) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    save(newTasks);
  };

  const confirmTask = (id: string) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, confirmed: true } : t);
    setTasks(newTasks);
    save(newTasks);
  };

  const removeTask = (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    save(newTasks);
  };

  return (
    <div className="relative z-20 w-full mb-2">
      <div className="w-full max-w-3xl mx-auto transition-all duration-200 px-4 md:px-0 relative">
        {isExpanded && (
          <div className="absolute bottom-full left-0 right-0 mb-2 max-h-40 overflow-y-auto p-2 space-y-1 thin-scrollbar bg-white border border-gray-100 rounded-lg shadow-sm">
            {tasks.length === 0 && <div className="text-center text-gray-400 py-4 text-[10px]">{t('no_tasks_yet')}</div>}
            {tasks.map(t_item => (
              <div key={t_item.id} className="group flex items-center justify-between p-1.5 rounded transition-all">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <button 
                      onClick={() => toggleComplete(t_item.id)}
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${t_item.completed ? "bg-green-100 border-green-500" : "border-gray-300 group-hover:border-gray-400"}`}
                    >
                      {t_item.completed && <svg className="w-2 h-2 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span className={`text-[11px] truncate ${t_item.completed ? "text-gray-400 line-through" : "text-gray-500 group-hover:text-black"}`}>
                      {t_item.title}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t_item.completed && !t_item.confirmed && (
                    <button 
                      onClick={() => confirmTask(t_item.id)}
                      className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full hover:bg-gray-800"
                    >
                      {t('confirm')}
                    </button>
                  )}
                  {t_item.confirmed && <span className="text-[9px] text-green-600 px-1.5 bg-green-50 rounded-full py-0.5">{t('confirmed')}</span>}
                  <button 
                    onClick={() => removeTask(t_item.id)}
                    className="text-gray-400 hover:text-red-500 p-0.5"
                    title={t('remove')}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center w-full py-2 bg-transparent transition-all group cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="text-sm font-normal text-gray-500 truncate group-hover:text-black transition-colors flex items-center gap-2 leading-none">
              {tasks.filter(t => t.completed).length}/{tasks.length} {t('tasks_done')}
              <svg className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
