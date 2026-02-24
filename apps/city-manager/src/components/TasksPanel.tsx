 "use client";
 import { useEffect, useState } from "react";
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
 }
 
 export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    setTasks(load());
  }, []);

  useEffect(() => {
    const handler = () => setTasks(load());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    save(tasks);
  }, [tasks]);

  const toggleComplete = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
     <div className="w-1/2 aspect-square flex flex-col border border-gray-200 rounded-xl p-4 bg-white shadow-sm mb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('tasks_list')}</div>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
        {tasks.length === 0 && (
          <div className="text-xs text-gray-400 italic">{t('no_tasks_yet')}</div>
        )}
        {tasks.map((t_item) => (
          <div
            key={t_item.id}
            className="flex items-center justify-between p-2 border border-gray-100 rounded-lg bg-gray-50 hover:bg-white transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="checkbox"
                checked={t_item.completed}
                onChange={() => toggleComplete(t_item.id)}
                className="accent-black w-3 h-3 cursor-pointer shrink-0"
              />
              <span
                className={`text-xs truncate ${
                  t_item.completed ? "line-through text-gray-400" : "text-gray-700"
                }`}
              >
                {t_item.title}
              </span>
            </div>
            {/* Show actions only on hover or if needed, keeping it clean */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                onClick={() => removeTask(t_item.id)}
                className="text-[10px] text-gray-400 hover:text-red-500 px-1"
                title={t('remove')}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
   );
 }
