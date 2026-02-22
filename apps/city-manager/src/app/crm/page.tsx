"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";

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

async function loadContacts(): Promise<Contact[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("crm_contacts").select("*").order("created_at", { ascending: false });
    
    console.log("loadContacts: Raw DB data:", data);
    
    if (!data) return [];

    const mapped = data.map((c: any) => ({
      id: c.id,
      tier: c.tier,
      decisionMaker: c.decision_maker,
      location: c.location,
      estimatedCapacity: c.estimated_capacity,
      status: c.status,
      nextStep: c.next_step,
      contractType: c.contract_type,
      contractAction: c.contract_action,
      expirationDate: c.expiration_date,
      followUpDate: c.follow_up_date,
      noReason: c.no_reason,
      restartTime: c.restart_time,
      notes: c.notes,
      createdAt: new Date(c.created_at).getTime(),
      
      // Legacy support mappings if needed
      city: c.location,
      decisionStatus: c.status
    }));
    
    console.log("loadContacts: Mapped contacts:", mapped);
    return mapped;
  } catch (err) {
    console.error("loadContacts: Error loading contacts:", err);
    return [];
  }
}

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const loadAndSetContacts = async () => {
      const loaded = await loadContacts();
      console.log("CRM: Loaded contacts:", loaded.length, loaded);
      setContacts(loaded);
    };
    loadAndSetContacts();
    
    const handler = () => {
      console.log("CRM: crm_storage event received");
      loadAndSetContacts();
    };
    window.addEventListener("crm_storage", handler);
    
    // Listen for cross-tab updates
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "crm_update_signal") {
        console.log("CRM: crm_update_signal received");
        loadAndSetContacts();
      }
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("crm_storage", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    // Optimistic update
    const next = contacts.map(c => c.id === id ? { ...c, ...updates } : c);
    setContacts(next);

    const supabase = getSupabase();
    const dbUpdates: any = {};
    
    if (updates.tier) dbUpdates.tier = updates.tier;
    if (updates.decisionMaker) dbUpdates.decision_maker = updates.decisionMaker;
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.estimatedCapacity) dbUpdates.estimated_capacity = updates.estimatedCapacity;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.nextStep) dbUpdates.next_step = updates.nextStep;
    if (updates.contractType) dbUpdates.contract_type = updates.contractType;
    if (updates.contractAction) dbUpdates.contract_action = updates.contractAction;
    if (updates.expirationDate) dbUpdates.expiration_date = updates.expirationDate;
    if (updates.followUpDate) dbUpdates.follow_up_date = updates.followUpDate;
    if (updates.noReason) dbUpdates.no_reason = updates.noReason;
    if (updates.restartTime) dbUpdates.restart_time = updates.restartTime;
    if (updates.notes) dbUpdates.notes = updates.notes;

    const { error } = await supabase.from("crm_contacts").update(dbUpdates).eq("id", id);
    
    if (!error) {
      window.dispatchEvent(new Event("crm_storage"));
    } else {
      console.error("Failed to update contact:", error);
      // Revert if needed, or just reload
      loadContacts().then(setContacts);
    }
  };

  const deleteContact = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      // Optimistic delete
      const next = contacts.filter(c => c.id !== id);
      setContacts(next);
      
      const supabase = getSupabase();
      const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
      
      if (!error) {
        window.dispatchEvent(new Event("crm_storage"));
        localStorage.setItem("crm_update_signal", Date.now().toString());
      } else {
        console.error("Failed to delete contact:", error);
        loadContacts().then(setContacts);
      }
    }
  };

  const [expandedTier, setExpandedTier] = useState<Tier | null>(null);

  const filteredContacts = contacts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.decisionMaker.toLowerCase().includes(q) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.status && c.status.toLowerCase().includes(q))
    );
  });

  // Group contacts by Tier for display
  const contactsByTier = TIERS.reduce((acc, tier) => {
    acc[tier.id] = filteredContacts.filter(c => c.tier === tier.id);
    return acc;
  }, {} as Record<Tier, Contact[]>);

  return (
    <div className="max-w-4xl w-full mx-auto px-2 md:px-8 py-6 pb-32 overflow-x-hidden">
      <div className="flex items-center border-b border-gray-100 mb-4 pb-2 pl-2">
        <span className="text-xs font-semibold tracking-tight text-black mr-4">CRM</span>
        <span className="text-[10px] text-gray-400">Contacts & Status</span>
      </div>

      <div className="px-2 mb-4">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-8 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all"
          />
          <svg className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 mx-2">
        <h4 className="text-xs font-bold uppercase text-black mb-3 tracking-wide border-b border-gray-100 pb-2">Status Requirements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-gray-600">
          <div><span className="font-bold text-gray-900">1. Entry:</span> Date</div>
          <div><span className="font-bold text-gray-900">2. Live DEMO:</span> Date</div>
          <div><span className="font-bold text-gray-900">3. Yes Date:</span> Expiration date if contract</div>
          <div><span className="font-bold text-gray-900">4. No Date:</span> Reason/Improvement</div>
          <div><span className="font-bold text-gray-900">5. Follow Up Date:</span> Date</div>
        </div>
      </div>

      <div className="space-y-1">
        {TIERS.map((tier) => {
          const tierContacts = contactsByTier[tier.id];
          const isExpanded = expandedTier === tier.id;

          return (
            <div key={tier.id} className="border-b border-gray-100 last:border-0">
              <div 
                onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                className={`group py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${isExpanded ? "bg-gray-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold text-black">Tier {tier.id}: {tier.label}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center min-w-[20px] h-5 text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 rounded-full">
                    {tierContacts.length}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="pl-4 pr-2 pb-4 space-y-3 mt-2 overflow-x-hidden">
                  {tierContacts.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">No contacts in this tier.</p>
                  ) : (
                    tierContacts.map((contact, idx) => (
                      <div key={contact.id} className="p-0 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column (3 fields): a, b, c */}
                          <div className="flex flex-col gap-3">
                            {/* a) Decision Maker */}
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">a) Decision Maker</span>
                              <div className="text-sm font-bold text-gray-900 break-words">
                                {editingId === contact.id ? (
                                  <input
                                    type="text"
                                    value={contact.decisionMaker}
                                    onChange={(e) => updateContact(contact.id, { decisionMaker: e.target.value })}
                                    className="border-gray-300 rounded text-sm p-1.5 w-full"
                                    placeholder="Decision Maker"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : contact.decisionMaker}
                              </div>
                            </div>

                            {/* b) Location */}
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">b) Location</span>
                              <div className="text-xs text-gray-700 break-words">
                                {editingId === contact.id ? (
                                  <input
                                    type="text"
                                    value={contact.location || ""}
                                    onChange={(e) => updateContact(contact.id, { location: e.target.value })}
                                    className="border-gray-300 rounded text-xs p-1.5 w-full"
                                    placeholder="Location"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (contact.location || contact.city)}
                              </div>
                            </div>

                            {/* c) Capacity */}
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">c) Capacity</span>
                              <div className="text-xs text-gray-700">
                                {editingId === contact.id ? (
                                  <input
                                    type="number"
                                    value={contact.estimatedCapacity}
                                    onChange={(e) => updateContact(contact.id, { estimatedCapacity: Number(e.target.value) })}
                                    className="border-gray-300 rounded text-xs p-1.5 w-full"
                                    placeholder="Capacity"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : contact.estimatedCapacity}
                              </div>
                            </div>
                          </div>

                          {/* Right Column (3 fields): d, e, f */}
                          <div className="flex flex-col gap-3">
                            {/* d) Status */}
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">d) Status</span>
                              <div>
                                {editingId === contact.id ? (
                                  <input
                                    type="text"
                                    value={contact.status || ""}
                                    onChange={(e) => updateContact(contact.id, { status: e.target.value })}
                                    className="border-gray-300 rounded text-xs p-1.5 w-full"
                                    placeholder="Status"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 break-words max-w-full">
                                    {contact.status}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* e) Next Step */}
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">e) Next Step</span>
                              <div className="text-xs text-gray-700 break-words">
                                {editingId === contact.id ? (
                                  <input
                                    type="text"
                                    value={contact.nextStep || ""}
                                    onChange={(e) => updateContact(contact.id, { nextStep: e.target.value })}
                                    className="border-gray-300 rounded text-xs p-1.5 w-full"
                                    placeholder="Next Step"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (contact.nextStep || "-")}
                              </div>
                            </div>

                            {/* f) Notes */}
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">f) Notes</span>
                              <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                                {editingId === contact.id ? (
                                  <textarea
                                    value={contact.notes || ""}
                                    onChange={(e) => updateContact(contact.id, { notes: e.target.value })}
                                    className="border-gray-300 rounded text-xs p-1.5 w-full"
                                    rows={3}
                                    placeholder="Notes"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (contact.notes || "-")}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-start gap-3 mt-4 flex-wrap">
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (navigator.share) {
                                navigator.share({
                                  title: `Contact: ${contact.decisionMaker}`,
                                  text: `Decision Maker: ${contact.decisionMaker}\nLocation: ${contact.location}\nStatus: ${contact.status}\nNext Step: ${contact.nextStep}`,
                                }).catch(console.error);
                              } else {
                                alert("Share not supported on this device");
                              }
                            }}
                            className="text-[10px] font-bold text-black hover:text-gray-700 uppercase"
                          >
                            SHARE
                          </button>
                          {editingId === contact.id ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                              className="text-[10px] font-bold text-black hover:text-gray-700 uppercase"
                            >
                              SAVE
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(contact.id); }}
                              className="text-[10px] font-bold text-black hover:text-gray-700 uppercase"
                            >
                              EDIT
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteContact(contact.id); }}
                            className="text-[10px] font-bold text-black hover:text-gray-700 uppercase"
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
