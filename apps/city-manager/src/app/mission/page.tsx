"use client";

import { useEffect, useState } from "react";

// Duplicate Contact type to avoid dependency issues for now
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
  const lotsActivated = contacts.filter((c) => c.decisionStatus === "CONTRACT").length;
  const currentValue = contacts
    .filter((c) => c.decisionStatus === "CONTRACT")
    .reduce((acc, c) => acc + (c.estimatedCapacity || 0) * 100, 0);

  const MissionItem = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 px-2 transition-colors">
      <span className="text-xs font-bold text-black uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold text-black font-mono">{value}</span>
    </div>
  );

  return (
    <div className="h-screen bg-white">
      <div className="hidden md:flex h-[calc(100vh-20px)] flex-col items-center overflow-y-auto w-full">
        <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-6">
          <div className="flex items-center justify-between mb-8 border-b border-black pb-2">
            <h1 className="text-xl font-bold tracking-tight text-black">MISSION CONTROL</h1>
            <div className="flex items-center gap-4">
              <span className="text-xs text-black font-bold uppercase tracking-wider">SYSTEM: ONLINE</span>
            </div>
          </div>

          <div className="space-y-8">
            {/* Primary Metrics */}
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-100 pb-1">Performance</h2>
              <div className="flex flex-col">
                <MissionItem label="Current Revenue" value={`${currentValue.toLocaleString()}€`} />
                <MissionItem label="Lots Mapped" value={lotsMapped} />
                <MissionItem label="Lots Activated" value={lotsActivated} />
              </div>
            </div>

            {/* Strategic Initiatives */}
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-100 pb-1">Strategic Initiatives</h2>
              <div className="flex flex-col">
                <MissionItem label="Smart City Integration" value="+" />
                <MissionItem label="Airport HUB Expansion" value="-" />
                <MissionItem label="City HUB Network" value="NO" />
              </div>
            </div>
            
            {/* System Status - Simplified */}
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-100 pb-1">System</h2>
              <div className="flex flex-col">
                 <MissionItem label="Data Sync" value="YES" />
                 <MissionItem label="Server Status" value="NOMINAL" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden p-6">
        <div className="text-sm text-gray-600">Desktop only.</div>
      </div>
    </div>
  );
}
