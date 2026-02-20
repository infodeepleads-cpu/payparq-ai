"use client";

import { useEffect, useState } from "react";

type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type CrmStatus = 
  | "Entry Prewarm (Mail)"
  | "Entry Prewarm (Call/Walk In)"
  | "Live DEMO"
  | "Contract Status (Non Contractual)"
  | "Contract Status (Contractual Obligation)"
  | "Restart Time";

type ContractSubStatus = 
  | "Non Contractual" 
  | "Contractual Obligation";

type ContractAction = 
  | "Yes" 
  | "Yes (Expiration)" 
  | "Follow Up" 
  | "No";

type Contact = {
  id: string;
  tier: Tier;
  decisionMaker: string;
  location: string;
  estimatedCapacity: number;
  
  status: string;
  nextStep?: string;
  
  // Complex status fields
  contractType?: ContractSubStatus;
  contractAction?: ContractAction;
  
  expirationDate?: string;
  followUpDate?: string;
  noReason?: string;
  restartTime?: string;
  
  notes?: string;
  createdAt: number;
  
  // Legacy support
  city?: string;
  decisionStatus?: string;
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
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.map((c: any) => {
      // Migrate city -> location
      if (c.city && !c.location) {
        c.location = c.city;
      }
      
      // Ensure migration of legacy status
      if (!c.status && c.decisionStatus) {
        if (c.decisionStatus === "ENTRY") c.status = "Entry Prewarm (Mail)";
        else if (c.decisionStatus === "DEMO") c.status = "Live DEMO";
        else if (c.decisionStatus === "CONTRACT") {
            c.status = "Contract Status (Contractual Obligation)";
            c.contractType = "Contractual Obligation";
            c.contractAction = "Yes";
        }
        else if (c.decisionStatus === "NO") {
            c.status = "Contract Status (Contractual Obligation)";
            c.contractType = "Contractual Obligation";
            c.contractAction = "No";
            c.noReason = c.noReason || "";
        }
        else if (c.decisionStatus === "FOLLOW UP") {
            c.status = "Contract Status (Contractual Obligation)";
            c.contractType = "Contractual Obligation";
            c.contractAction = "Follow Up";
        }
        else c.status = "Entry Prewarm (Mail)";
      }
      return c;
    });
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
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setContacts(loadContacts());
    const handler = () => setContacts(loadContacts());
    window.addEventListener("crm_storage", handler);
    return () => window.removeEventListener("crm_storage", handler);
  }, []);

  const updateContact = (id: string, updates: Partial<Contact>) => {
    const next = contacts.map(c => c.id === id ? { ...c, ...updates } : c);
    setContacts(next);
    saveContacts(next);
  };

  const deleteContact = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      const next = contacts.filter(c => c.id !== id);
      setContacts(next);
      saveContacts(next);
    }
  };

  // Group contacts by Tier for display
  const contactsByTier = TIERS.reduce((acc, tier) => {
    acc[tier.id] = contacts.filter(c => c.tier === tier.id);
    return acc;
  }, {} as Record<Tier, Contact[]>);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center mb-4">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">CRM</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all contacts including their name, location, capacity, and current status.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
        <h4 className="text-sm font-bold uppercase text-black mb-4 tracking-wide border-b border-gray-100 pb-2">Status Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-sm text-gray-600">
          <div><span className="font-bold text-gray-900">1. Entry:</span> Date</div>
          <div><span className="font-bold text-gray-900">2. Live DEMO:</span> Date</div>
          <div><span className="font-bold text-gray-900">3. Yes Date:</span> Expiration date if contract</div>
          <div><span className="font-bold text-gray-900">4. No Date:</span> Reason/Improvement</div>
          <div><span className="font-bold text-gray-900">5. Follow Up Date:</span> Date</div>
        </div>
      </div>

      <div className="flex flex-col space-y-8">
        {TIERS.map((tier) => {
          const tierContacts = contactsByTier[tier.id];

          return (
            <div key={tier.id} className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 min-w-full">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Tier {tier.id}: {tier.label}
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6 w-12">
                      #
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">
                      a) Decision Maker
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      b) Location
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      c) Cap
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      d) Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      e) Next Step
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      f) Notes
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tierContacts.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-500" colSpan={7}>
                        No records
                      </td>
                    </tr>
                  ) : tierContacts.map((contact) => {
                    // Find global index for display
                    const globalIndex = contacts.findIndex(c => c.id === contact.id) + 1;
                    
                    return (
                      <tr key={contact.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900 sm:pl-6">
                          {globalIndex}.
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {editingId === contact.id ? (
                            <input
                              type="text"
                              value={contact.decisionMaker}
                              onChange={(e) => updateContact(contact.id, { decisionMaker: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          ) : (
                            contact.decisionMaker
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {editingId === contact.id ? (
                            <input
                              type="text"
                              value={contact.location || contact.city || ""}
                              onChange={(e) => updateContact(contact.id, { location: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          ) : (
                            contact.location || contact.city
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {editingId === contact.id ? (
                            <input
                              type="number"
                              value={contact.estimatedCapacity}
                              onChange={(e) => updateContact(contact.id, { estimatedCapacity: Number(e.target.value) })}
                              className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          ) : (
                            contact.estimatedCapacity
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 min-w-[200px]">
                          {editingId === contact.id ? (
                            <input
                              type="text"
                              value={contact.status || ""}
                              onChange={(e) => updateContact(contact.id, { status: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          ) : (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800`}>
                              {contact.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 min-w-[200px]">
                          {editingId === contact.id ? (
                            <input
                              type="text"
                              value={contact.nextStep || ""}
                              onChange={(e) => updateContact(contact.id, { nextStep: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          ) : (
                            <span className="whitespace-pre-wrap truncate max-w-xs">{contact.nextStep}</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {editingId === contact.id ? (
                            <textarea
                              value={contact.notes || ""}
                              onChange={(e) => updateContact(contact.id, { notes: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              rows={3}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap truncate max-w-xs">{contact.notes}</p>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {editingId === contact.id ? (
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingId(contact.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => deleteContact(contact.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
