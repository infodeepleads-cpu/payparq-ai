"use client";

import { useEffect, useState } from "react";
import Taskbar from "../../components/Taskbar";

// Types matching other components
type Contact = {
  id: string;
  decisionStatus: "ENTRY" | "DEMO" | "TRIAL" | "CONTRACT" | "NO" | "FOLLOW UP";
  estimatedCapacity: number;
  createdAt: number;
};

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

type RecapItem = {
  date: string;
  lotsMapped: number;
  lotsActivated: number;
  contractsSigned: number;
  revenue: number;
  advice: string;
  recap: string;
};

const CRM_KEY = "pp_crm_contacts";
const TASKS_KEY = "pp_tasks";

export default function Page() {
  const [recaps, setRecaps] = useState<RecapItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load data and generate recaps
    try {
      const rawContacts = localStorage.getItem(CRM_KEY);
      const rawTasks = localStorage.getItem(TASKS_KEY);
      
      const contacts: Contact[] = rawContacts ? JSON.parse(rawContacts) : [];
      // const tasks: Task[] = rawTasks ? JSON.parse(rawTasks) : []; // Tasks might not be enough, relying on CRM mainly for prompt request

      // Group by date
      const groupedData = new Map<string, { mapped: number, activated: number, signed: number, revenue: number }>();

      contacts.forEach(c => {
        const date = new Date(c.createdAt).toLocaleDateString('en-GB'); // DD/MM/YYYY
        const current = groupedData.get(date) || { mapped: 0, activated: 0, signed: 0, revenue: 0 };
        
        current.mapped++;
        if (c.decisionStatus === "TRIAL" || c.decisionStatus === "CONTRACT") {
          current.activated++;
        }
        if (c.decisionStatus === "CONTRACT") {
          current.signed++;
          current.revenue += (c.estimatedCapacity || 0) * 100; // Mock revenue calculation
        }
        
        groupedData.set(date, current);
      });

      // Generate list
      const items: RecapItem[] = [];
      groupedData.forEach((stats, date) => {
        let advice = "Continue expanding your network.";
        let recap = "Steady progress made.";

        if (stats.signed > 0) {
          recap = "Excellent work closing deals today.";
          advice = "Focus on onboarding new clients smoothly.";
        } else if (stats.activated > 0) {
          recap = "Good traction with activations.";
          advice = "Push for signed contracts tomorrow.";
        } else if (stats.mapped > 5) {
          recap = "Strong scouting effort.";
          advice = "Start reaching out to these new leads.";
        } else {
          recap = "Slow day.";
          advice = "Prioritize mapping new lots tomorrow.";
        }

        items.push({
          date,
          lotsMapped: stats.mapped,
          lotsActivated: stats.activated,
          contractsSigned: stats.signed,
          revenue: stats.revenue,
          recap,
          advice
        });
      });

      // Sort by date descending
      items.sort((a, b) => {
        // Parse DD/MM/YYYY
        const [da, ma, ya] = a.date.split('/').map(Number);
        const [db, mb, yb] = b.date.split('/').map(Number);
        return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
      });

      // Add "Today" if not present and it's past 22:00 or just to show *something*
      // The prompt says "EACH DAY GIVE A NEW RECAP IN THE 22:00 PM EUROPE"
      // We will just show what we have. If today is empty, it won't show, effectively "waiting" for activity.
      
      setRecaps(items);

    } catch (e) {
      console.error("Failed to load recap data", e);
    }
  }, []);

  return (
    <div className="h-screen bg-white">
      <div className="hidden md:flex h-[calc(100vh-20px)] flex-col items-center overflow-y-auto w-full">
        {/* Daily Recap Header */}
        <div className="max-w-3xl w-full mx-auto px-0 py-0.5 flex items-center border-b border-gray-100 mt-4">
          <span className="text-xs font-semibold tracking-tight text-black mr-4 shrink-0">DAILY RECAP</span>
          <div className="flex items-center gap-4 flex-1">
             <span className="text-[10px] text-gray-400">
               Current Time: {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
             </span>
          </div>
        </div>

        {/* Email List View */}
        <div className="max-w-3xl w-full mx-auto mt-6 px-4 md:px-0 overflow-y-auto">
          {recaps.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-10">No activity recorded yet.</div>
          ) : (
            <div className="space-y-1">
              {recaps.map((item, idx) => (
                <div key={idx} className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-black"></div>
                      <span className="text-xs font-bold text-black">{item.date}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Automated Report</span>
                  </div>
                  
                  <div className="pl-4">
                    <p className="text-xs text-gray-800 font-medium mb-1">
                      {item.lotsMapped} LOTS MAPPED • {item.lotsActivated} ACTIVATED • {item.contractsSigned} CONTRACT SIGNED • {item.revenue}€ EARNED
                    </p>
                    <div className="text-[10px] text-gray-500 flex flex-col gap-0.5">
                      <span>RECAP: {item.recap}</span>
                      <span>ADVICE: {item.advice}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="md:hidden p-6">
        <div className="text-sm text-gray-600">Desktop only.</div>
      </div>
    </div>
  );
}
