"use client";

import { useEffect, useState } from "react";
import Taskbar from "../../components/Taskbar";
import ModelsPanel from "../../components/ModelsPanel";
import TasksPanel from "../../components/TasksPanel";

// Duplicate Contact type to avoid dependency issues for now, or export from a shared file later
type Contact = {
  id: string;
  tier: number;
  decisionMaker: string;
  city: string;
  estimatedCapacity: number;
  decisionStatus: "ENTRY" | "DEMO" | "TRIAL" | "CONTRACT" | "NO" | "FOLLOW UP";
  noReason?: string;
  cooldownUntil?: string;
  notes?: string;
  createdAt: number;
};

const CRM_KEY = "pp_crm_contacts";

function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CRM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    setContacts(loadContacts());
    const handler = () => setContacts(loadContacts());
    window.addEventListener("crm_storage", handler);
    return () => window.removeEventListener("crm_storage", handler);
  }, []);

  // KPIs
  const lotsMapped = contacts.length;
  const lotsClosed = contacts.filter((c) => c.decisionStatus === "CONTRACT").length;
  // Calculate current status (revenue/value) - assuming estimatedCapacity * arbitrary value or just sum of capacity for now
  // Prompt says: "Current Status /100 000€". Let's assume estimatedCapacity translates to value roughly, or just use 0 if no formula provided.
  // For now, I'll use a placeholder calculation: Sum of estimatedCapacity of CLOSED deals * 10 (example rate).
  const currentValue = contacts
    .filter((c) => c.decisionStatus === "CONTRACT")
    .reduce((acc, c) => acc + (c.estimatedCapacity || 0) * 100, 0); // Example: 1 capacity = 100€

  return (
    <div className="h-screen bg-white">
      <Taskbar />
      <div className="hidden md:flex h-[calc(100vh-44px)]">
        <div className="w-[70%] overflow-y-auto p-6">
          <TasksPanel />
          <h1 className="text-2xl font-semibold mb-6">Mission Control</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* KPI 1: Current Status */}
            <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Status</div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{currentValue.toLocaleString()}€</span>
                <span className="text-sm text-gray-400 mb-1">/ 100,000€</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-black h-1.5 rounded-full" 
                  style={{ width: `${Math.min((currentValue / 100000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* KPI 2: Lots Stats */}
            <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col justify-center">
               <div className="flex justify-between items-center mb-2">
                 <div className="text-xs text-gray-500 uppercase tracking-wider">Lots Mapped</div>
                 <div className="text-xl font-bold">{lotsMapped}</div>
               </div>
               <div className="flex justify-between items-center">
                 <div className="text-xs text-gray-500 uppercase tracking-wider">Lots Closed</div>
                 <div className="text-xl font-bold text-green-600">{lotsClosed}</div>
               </div>
            </div>
          </div>

          <div className="space-y-3">
             {/* Status Flags */}
             <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
               <span className="text-sm font-medium text-gray-700">Main City Smart City Status</span>
               <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">In Progress</span>
             </div>
             
             <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
               <span className="text-sm font-medium text-gray-700">Airport HUB Contract</span>
               <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Pending</span>
             </div>

             <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
               <span className="text-sm font-medium text-gray-700">Main City HUB Contract</span>
               <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">Not Started</span>
             </div>
          </div>

        </div>
        <ModelsPanel />
      </div>
      <div className="md:hidden p-6">
        <div className="text-sm text-gray-600">Desktop only.</div>
      </div>
    </div>
  );
}
