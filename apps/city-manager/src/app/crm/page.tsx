"use client";

import { useEffect, useState } from "react";
import Taskbar from "../../components/Taskbar";
import ModelsPanel from "../../components/ModelsPanel";
import TasksPanel from "../../components/TasksPanel";

type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Contact = {
  id: string;
  tier: Tier;
  decisionMaker: string;
  city: string;
  estimatedCapacity: number;
  decisionStatus: "ENTRY" | "DEMO" | "TRIAL" | "CONTRACT" | "NO" | "FOLLOW UP";
  noReason?: string; // For "NO(WHY)"
  cooldownUntil?: string; // Date string
  notes?: string;
  createdAt: number;
};

const TIERS: { id: Tier; label: string }[] = [
  { id: 1, label: "Airport land" },
  { id: 2, label: "Empty land (City lots)" },
  { id: 3, label: "Crowded Lots (Restaurants/Bars/Shops/Homeowners)" },
  { id: 4, label: "Villas / Apartments" },
  { id: 5, label: "Single-power owners (Lots, Garages, Multi-Owners)" },
  { id: 6, label: "Hotels" },
  { id: 7, label: "Whales (corporations / multi-decision)" },
];

const KEY = "pp_crm_contacts";

function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveContacts(contacts: Contact[]) {
  localStorage.setItem(KEY, JSON.stringify(contacts));
  window.dispatchEvent(new Event("crm_storage"));
}

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTier, setActiveTier] = useState<Tier>(1);

  useEffect(() => {
    setContacts(loadContacts());
    const handler = () => setContacts(loadContacts());
    window.addEventListener("crm_storage", handler);
    return () => window.removeEventListener("crm_storage", handler);
  }, []);

  const filteredContacts = contacts.filter((c) => c.tier === activeTier);

  return (
    <div className="h-screen bg-white">
      <div className="hidden md:flex h-[calc(100vh-20px)]">
        <div className="w-[70%] overflow-y-auto p-6">
          <TasksPanel />
          <h1 className="text-2xl font-semibold mb-6">CRM</h1>

          {/* Tier Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  activeTier === tier.id
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {tier.id}. {tier.label}
              </button>
            ))}
          </div>

          {/* Contacts Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="p-3">Decision Maker</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                      No contacts in this tier yet.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{c.decisionMaker}</td>
                      <td className="p-3 text-gray-600">{c.city}</td>
                      <td className="p-3 text-gray-600">{c.estimatedCapacity}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.decisionStatus === "CONTRACT"
                              ? "bg-green-100 text-green-700"
                              : c.decisionStatus === "NO"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {c.decisionStatus}
                          {c.decisionStatus === "NO" && c.noReason ? ` (${c.noReason})` : ""}
                        </span>
                        {c.cooldownUntil && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            Cooldown: {c.cooldownUntil}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-gray-500 truncate max-w-[200px]" title={c.notes}>
                        {c.notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
