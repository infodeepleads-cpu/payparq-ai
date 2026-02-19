 "use client";
 import { useEffect, useState } from "react";
 
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
 
 export default function CurrentTasksWidget() {
   const [tasks, setTasks] = useState<Task[]>([]);
   useEffect(() => {
     setTasks(load());
     const handler = () => setTasks(load());
     window.addEventListener("storage", handler);
     return () => window.removeEventListener("storage", handler);
   }, []);
 
   const active = tasks.filter(t => !t.confirmed);
 
   return (
     <div className="border border-gray-200 rounded-md p-3 bg-white">
       <div className="text-xs font-semibold mb-2">Current Tasks</div>
       {active.length === 0 ? (
         <div className="text-[11px] text-gray-500">None</div>
       ) : (
         <ul className="space-y-1">
           {active.slice(0, 5).map(t => (
             <li key={t.id} className="flex items-center justify-between">
               <span className={`text-xs ${t.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                 {t.title}
               </span>
               <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.completed ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                 {t.completed ? "Done" : "Active"}
               </span>
             </li>
           ))}
         </ul>
       )}
     </div>
   );
 }
