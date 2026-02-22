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
  created_at: string; // Changed to match Inbox
  subject: string;
  preview: string;
  tasks: Task[];
  read: boolean;
  from_address: string; // Added to match Inbox
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
        yesterday.setHours(22, 0, 0, 0); // Mock time
        
        // Set today's time to now or specific time
        today.setHours(22, 0, 0, 0); 

        const formatSubjectDate = (d: Date) => d.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        const generatedEmails: RecapEmail[] = [
          {
            id: "today",
            created_at: today.toISOString(),
            subject: `Daily Recap - ${formatSubjectDate(today)}`,
            preview: `Tasks: ${tasks.length} total, ${tasks.filter(t => t.completed).length} completed.`,
            tasks: tasks,
            read: false,
            from_address: "PayParq System"
          },
          {
            id: "yesterday",
            created_at: yesterday.toISOString(),
            subject: `Daily Recap - ${formatSubjectDate(yesterday)}`,
            preview: "Tasks: 12 total, 10 completed.",
            tasks: [], // Mock empty for past
            read: true,
            from_address: "PayParq System"
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
        <div className="max-w-3xl w-full mx-auto px-5 md:px-0 py-0.5 flex items-center border-b border-gray-100 mt-4 mb-4">
          <span className="text-xs font-semibold tracking-tight text-black mr-4 shrink-0">DAILY RECAP</span>
          <div className="flex items-center gap-4 flex-1">
          </div>
        </div>

        <div className="max-w-3xl w-full mx-auto px-5 md:px-0 overflow-y-auto">
          <div className="space-y-1">
            {emails.map((email) => {
              const isExpanded = expandedId === email.id;
              return (
                <div
                  key={email.id}
                  className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
                  onClick={() => setExpandedId(isExpanded ? null : email.id)}
                >
                  <div className="flex items-center justify-between mb-1 gap-4">
                    <span className={`text-xs truncate ${email.read ? "font-normal text-gray-600" : "font-bold text-black"}`}>
                      {email.subject}
                    </span>
                  </div>
                  <div className="">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-[10px] text-gray-500 truncate">
                        From: <span className="text-gray-800">{email.from_address}</span>
                      </p>
                    </div>
                    {!isExpanded && (
                      <div className="text-[10px] text-gray-500 truncate">
                        {email.preview}
                      </div>
                    )}
                    {isExpanded && (
                      <div className="mt-2 text-sm text-gray-800 bg-gray-50 p-4 rounded border border-gray-100 w-full">
                        <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 mb-4 border-b border-gray-200 pb-2 gap-1">
                          <span className="font-medium break-all">From: {email.from_address}</span>
                          <span className="shrink-0">{new Date(email.created_at).toLocaleString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <div className="space-y-2 overflow-x-auto">
                          {email.tasks.length > 0 ? (
                            email.tasks.map(task => (
                              <div key={task.id} className="flex items-start gap-2 break-words">
                                <div className={`w-3 h-3 border flex items-center justify-center shrink-0 mt-0.5 ${task.completed ? "bg-black border-black" : "border-gray-400 bg-white"}`}>
                                  {task.completed && <div className="w-1.5 h-1.5 bg-white" />}
                                </div>
                                <span className={`text-xs ${task.completed ? "text-gray-400 line-through" : "text-black"} break-words whitespace-normal`}>
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
