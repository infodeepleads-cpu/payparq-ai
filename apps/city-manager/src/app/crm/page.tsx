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
  city: string;
  estimatedCapacity: number;
  
  status: CrmStatus;
  
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
            A list of all contacts including their name, city, capacity, and current status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <span className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none sm:w-auto">
            {contacts.length} Records
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
        <h4 className="text-sm font-bold uppercase text-black mb-4 tracking-wide border-b border-gray-100 pb-2">Status Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div><span className="font-bold text-gray-900">1. LIVE DEMO:</span> DATE</div>
          <div><span className="font-bold text-gray-900">2. YES:</span> DATE</div>
          <div><span className="font-bold text-gray-900">3. YES (EXPIRATION):</span> DATE (EXPIRATION DATE)</div>
          <div><span className="font-bold text-gray-900">4. NO:</span> DATE <span className="italic">P.S. (WHAT FEATURE WOULD MAKE THEM BUY) 60-90 DAY COOLING PERIOD</span></div>
          <div><span className="font-bold text-gray-900">5. NEXT STEP:</span> DATE (CALL/MEETING)</div>
        </div>
      </div>

      <div className="flex flex-col space-y-8">
        {TIERS.map((tier) => {
          const tierContacts = contactsByTier[tier.id];

          return (
            <div key={tier.id} className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Tier {tier.id}: {tier.label}
                </h3>
              </div>
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">
                      Decision Maker
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      City
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Cap
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Notes
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tierContacts.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-sm text-gray-500" colSpan={6}>
                        No records
                      </td>
                    </tr>
                  ) : tierContacts.map((contact) => (
                    <tr key={contact.id}>
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
                            value={contact.city}
                            onChange={(e) => updateContact(contact.id, { city: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        ) : (
                          contact.city
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
                      <td className="px-3 py-4 text-sm text-gray-500 min-w-[300px]">
                        {editingId === contact.id ? (
                          <div className="space-y-2">
                            <select
                              value={contact.status}
                              onChange={(e) => {
                                const ns = e.target.value as CrmStatus;
                                const updates: Partial<Contact> = { status: ns };
                                if (ns === "Contract Status (Non Contractual)") {
                                  updates.contractType = "Non Contractual";
                                  updates.contractAction = undefined;
                                  updates.expirationDate = undefined;
                                  updates.followUpDate = undefined;
                                  updates.noReason = undefined;
                                } else if (ns === "Contract Status (Contractual Obligation)") {
                                  updates.contractType = "Contractual Obligation";
                                  if (!contact.contractAction) updates.contractAction = "Yes";
                                } else {
                                  updates.contractType = undefined;
                                  updates.contractAction = undefined;
                                  updates.expirationDate = undefined;
                                  updates.followUpDate = undefined;
                                  updates.noReason = undefined;
                                }
                                updateContact(contact.id, updates);
                              }}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="Entry Prewarm (Mail)">Entry Prewarm (Mail)</option>
                              <option value="Entry Prewarm (Call/Walk In)">Entry Prewarm (Call/Walk In)</option>
                              <option value="Live DEMO">Live DEMO</option>
                              <option value="Contract Status (Non Contractual)">Contract Status (Non Contractual)</option>
                              <option value="Contract Status (Contractual Obligation)">Contract Status (Contractual Obligation)</option>
                              <option value="Restart Time">Restart Time</option>
                            </select>

                            {contact.status === "Contract Status (Contractual Obligation)" && (
                              <div className="pl-2 space-y-2 border-l-2 border-gray-200">
                                <select
                                  value={contact.contractAction || "Yes"}
                                  onChange={(e) => updateContact(contact.id, { contractAction: e.target.value as ContractAction })}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="Yes (Expiration)">Yes (Expiration)</option>
                                  <option value="Follow Up">Follow Up</option>
                                  <option value="No">No</option>
                                </select>
                                
                                {contact.contractAction === "Yes (Expiration)" && (
                                  <input
                                    type="date"
                                    value={contact.expirationDate || ""}
                                    onChange={(e) => updateContact(contact.id, { expirationDate: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                )}
                                {contact.contractAction === "Follow Up" && (
                                  <input
                                    type="date"
                                    value={contact.followUpDate || ""}
                                    onChange={(e) => updateContact(contact.id, { followUpDate: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                )}
                                {contact.contractAction === "No" && (
                                  <textarea
                                    placeholder="WHAT WOULD PRODUCT HAVE TO HAVE SO YOU SAY YES?"
                                    value={contact.noReason || ""}
                                    onChange={(e) => updateContact(contact.id, { noReason: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    rows={2}
                                  />
                                )}
                              </div>
                            )}

                            {contact.status === "Restart Time" && (
                               <input
                                 type="text"
                                 placeholder="Restart Time (e.g. 7 days)"
                                 value={contact.restartTime || ""}
                                 onChange={(e) => updateContact(contact.id, { restartTime: e.target.value })}
                                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                               />
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              contact.status === "Contract Status (Non Contractual)" || contact.status === "Contract Status (Contractual Obligation)" ? "bg-green-100 text-green-800" :
                              contact.status === "Live DEMO" ? "bg-blue-100 text-blue-800" :
                              contact.status === "Restart Time" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {contact.status}
                            </span>
                            {contact.status === "Contract Status (Contractual Obligation)" && (
                              <div className="mt-1 text-xs text-gray-500 space-y-1">
                                <div className="font-medium text-gray-700">
                                  Action: {contact.contractAction}
                                  {contact.contractAction === "Yes (Expiration)" && ` (${contact.expirationDate})`}
                                  {contact.contractAction === "Follow Up" && ` (${contact.followUpDate})`}
                                  {contact.contractAction === "No" && ` (Reason: ${contact.noReason})`}
                                </div>
                              </div>
                            )}
                            {contact.status === "Restart Time" && contact.restartTime && (
                              <div className="mt-1 text-xs text-gray-500">
                                Time: {contact.restartTime}
                              </div>
                            )}
                          </div>
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
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
