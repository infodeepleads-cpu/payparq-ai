"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

type RecapEmail = {
  id: string;
  date: string;
  subject: string;
  preview: string;
  tasks: Task[];
  read: boolean;
};

const TASKS_KEY = "pp_tasks";

export default function Page() {
  const [emails, setEmails] = useState<RecapEmail[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      try {
        const rawTasks = localStorage.getItem(TASKS_KEY);
        const tasks: Task[] = rawTasks ? JSON.parse(rawTasks) : [];
        
        // Simulate "Daily Recap" emails. 
        // In a real app, these would be stored historically.
        // For now, we show "Today" and a few mock past days.
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const generatedEmails: RecapEmail[] = [
          {
            id: "today",
            date: today.toLocaleDateString(),
            subject: `Daily Recap - ${today.toLocaleDateString()}`,
            preview: `Tasks: ${tasks.length} total, ${tasks.filter(t => t.completed).length} completed.`,
            tasks: tasks,
            read: false
          },
          {
            id: "yesterday",
            date: yesterday.toLocaleDateString(),
            subject: `Daily Recap - ${yesterday.toLocaleDateString()}`,
            preview: "Tasks: 12 total, 10 completed.",
            tasks: [], // Mock empty for past
            read: true
          }
        ];
        
        setEmails(generatedEmails);
        // Expand today by default
        setExpandedId("today");
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    };

    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  return (
    <div className="h-screen bg-white">
      <div className="flex h-[calc(100vh-20px)] flex-col items-center overflow-y-auto w-full">
        <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-0.5 flex items-center border-b border-gray-100 mt-4 mb-4">
          <span className="text-xs font-semibold tracking-tight text-black mr-4 shrink-0">INBOX</span>
          <div className="flex items-center gap-4 flex-1">
            <span className="text-[10px] text-gray-400">Daily Recaps</span>
          </div>
        </div>

        <div className="max-w-3xl w-full mx-auto px-4 md:px-0 overflow-y-auto">
          <div className="space-y-1">
            {emails.map((email) => {
              const isExpanded = expandedId === email.id;
              return (
                <div
                  key={email.id}
                  className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg"
                  onClick={() => setExpandedId(isExpanded ? null : email.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${email.read ? "bg-transparent border border-gray-300" : "bg-black"}`}></div>
                      <span className={`text-xs font-bold ${email.read ? "text-gray-700" : "text-black"}`}>
                        {email.subject}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                      22:00
                    </span>
                  </div>
                  <div className="pl-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-[10px] text-gray-500 truncate">
                        From: <span className="text-gray-800">PayParq System</span>
                      </p>
                      <span className="text-[10px] text-gray-400">{email.date}</span>
                    </div>
                    {!isExpanded && (
                      <div className="text-[10px] text-gray-500 truncate">
                        {email.preview}
                      </div>
                    )}
                    {isExpanded && (
                      <div className="mt-2 text-sm text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                        <div className="space-y-2">
                          {email.tasks.length > 0 ? (
                            email.tasks.map(task => (
                              <div key={task.id} className="flex items-center gap-2">
                                <div className={`w-3 h-3 border flex items-center justify-center ${task.completed ? "bg-black border-black" : "border-gray-400 bg-white"}`}>
                                  {task.completed && <div className="w-1.5 h-1.5 bg-white" />}
                                </div>
                                <span className={`text-xs ${task.completed ? "text-gray-400 line-through" : "text-black"}`}>
                                  {task.title}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">No detailed records for this date.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
