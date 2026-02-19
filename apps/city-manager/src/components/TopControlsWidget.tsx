"use client";
import { useEffect, useState, useRef } from "react";

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
    <div className="hidden md:block z-20 w-full">
      <div className={`relative w-full max-w-[49.5rem] mx-auto translate-x-3 transition-all duration-200`}>
        {isExpanded && (
          <div className="absolute bottom-full left-0 right-0 mb-[-1px] max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200 bg-white rounded-t-2xl border-x border-t border-gray-200 shadow-xl z-10">
            {tasks.length === 0 && <div className="text-center text-gray-400 py-4 text-xs">No tasks yet.</div>}
            {tasks.map(t => (
              <div key={t.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <button 
                      onClick={() => toggleComplete(t.id)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${t.completed ? "bg-green-100 border-green-500" : "border-gray-300 group-hover:border-gray-400"}`}
                    >
                      {t.completed && <svg className="w-2.5 h-2.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span className={`text-sm truncate ${t.completed ? "text-gray-400 line-through" : "text-gray-700 group-hover:text-black"}`}>
                      {t.title}
                    </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.completed && !t.confirmed && (
                    <button 
                      onClick={() => confirmTask(t.id)}
                      className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full hover:bg-gray-800"
                    >
                      Confirm
                    </button>
                  )}
                  {t.confirmed && <span className="text-[10px] text-green-600 px-2 bg-green-50 rounded-full py-0.5">Confirmed</span>}
                  <button 
                    onClick={() => removeTask(t.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={`text-black overflow-hidden transition-all duration-200 h-full flex items-center justify-between px-3 py-1 relative z-20 ${isExpanded ? 'bg-white rounded-b-2xl border-x border-b border-gray-200 shadow-xl' : 'bg-white rounded-2xl border border-gray-100 shadow-pill'}`}>
            <div className="flex-1 flex items-center gap-3 overflow-hidden mr-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              
              {isCreating ? (
                <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-left-2 duration-200">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    placeholder="What needs to be done?"
                    className="flex-1 bg-transparent border-none text-sm text-black placeholder:text-gray-500 focus:outline-none focus:ring-0 min-w-0 py-0.5"
                  />
                  <button onClick={addTask} className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-medium hover:bg-gray-800 shrink-0">Add</button>
                  <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-black shrink-0"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                </div>
              ) : (
                <div className="flex items-center overflow-hidden w-full">
                  {currentTask ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden w-full">
                      <button 
                        onClick={() => toggleComplete(currentTask.id)}
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${currentTask.completed ? "bg-green-100 border-green-500" : "border-gray-400 hover:border-gray-600"}`}
                      >
                        {currentTask.completed && <svg className="w-2.5 h-2.5 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                      <span className={`text-sm truncate ${currentTask.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {currentTask.title}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic truncate">No active tasks</span>
                  )}
                  {activeTasks.length > 1 && !isCreating && (
                     <span className="text-[10px] text-gray-400 ml-2 shrink-0 whitespace-nowrap">+{activeTasks.length - 1} more</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
               <div className="h-3 w-px bg-gray-200 mx-1"></div>
               <button 
                 onClick={() => setIsExpanded(!isExpanded)}
                 className={`p-1 rounded-full transition-colors ${isExpanded ? "bg-gray-100 text-black" : "text-gray-400 hover:text-black hover:bg-gray-50"}`}
                 title={isExpanded ? "Collapse" : "Expand"}
               >
                 <svg className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                 </svg>
               </button>
            </div>
        </div>
      </div>
    </div>
  );
}
