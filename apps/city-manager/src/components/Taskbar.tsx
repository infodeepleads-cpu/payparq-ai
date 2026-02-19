"use client";
import { useEffect, useState, useRef } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  confirmed: boolean;
  createdAt: number;
};

const TASKS_KEY = "pp_tasks";

export default function Taskbar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [now, setNow] = useState<string>("");
  const [notifications, setNotifications] = useState<number>(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragX = useRef<number>(0);
  const apps = [
    { id: "start", label: "Start" },
    { id: "chat", label: "Chat" },
    { id: "crm", label: "CRM" },
    { id: "mail", label: "Inbox" },
    { id: "mission", label: "Mission" },
  ];

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(TASKS_KEY);
        setTasks(raw ? JSON.parse(raw) : []);
      } catch {
        setTasks([]);
      }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      setNow(`${h}:${m}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pp_notifications");
      const data = raw ? JSON.parse(raw) : [];
      setNotifications(Array.isArray(data) ? data.length : 0);
    } catch {
      setNotifications(0);
    }
    const handler = () => {
      try {
        const raw = localStorage.getItem("pp_notifications");
        const data = raw ? JSON.parse(raw) : [];
        setNotifications(Array.isArray(data) ? data.length : 0);
      } catch {
        setNotifications(0);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleComplete = (id: string) => {
    const next = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(next);
    localStorage.setItem(TASKS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("storage"));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    dragX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !scrollerRef.current) return;
    const dx = dragX.current - e.clientX;
    scrollerRef.current.scrollLeft += dx;
    dragX.current = e.clientX;
  };
  const onPointerUp = () => {
    setDragging(false);
  };

  return (
    <div className="w-full border-t border-gray-100 bg-white">
      <div className="max-w-3xl w-full mx-auto px-0 py-1 flex items-center gap-2">
        <button
          className="h-11 min-w-11 w-11 rounded-md border border-gray-200 text-[11px] font-semibold text-black bg-white hover:bg-gray-50 shrink-0"
          aria-label="Start"
        >
          ●
        </button>
        <div
          className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide"
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {apps.slice(1).map(app => (
            <button
              key={app.id}
              className="h-11 min-w-11 w-11 rounded-md border border-gray-200 text-[11px] font-medium text-black bg-white hover:bg-gray-50 shrink-0"
              aria-label={app.label}
            >
              {app.label.substring(0,1)}
            </button>
          ))}
          {tasks.map(t => (
            <div 
              key={t.id} 
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group shrink-0 h-11"
              onClick={() => toggleComplete(t.id)}
            >
              <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                t.completed ? "bg-black border-black" : "border-black bg-white group-hover:bg-gray-100"
              }`}>
                {t.completed && (
                  <div className="w-2 h-2 bg-white" />
                )}
              </div>
              <span className={`text-[11px] font-medium ${t.completed ? "text-gray-400 line-through" : "text-black"} truncate max-w-[140px]`}>
                {t.title}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="relative h-11 min-w-11 w-11 rounded-md border border-gray-200 text-[11px] font-medium text-black bg-white hover:bg-gray-50"
            aria-label="Notifications"
          >
            🔔
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-black text-white rounded-full px-1">
                {notifications}
              </span>
            )}
          </button>
          <div className="h-11 min-w-11 w-16 rounded-md border border-gray-200 bg-white flex items-center justify-center text-[11px] font-medium text-black">
            {now}
          </div>
        </div>
      </div>
    </div>
  );
}
