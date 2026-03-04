"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentUser, getSupabase } from "../../lib/supabase";

// Duplicate Contact type to avoid dependency issues for now
type Contact = {
  id: string;
  tier: number;
  decisionMaker: string;
  city: string;
  estimatedCapacity: number;
  decisionStatus: string;
  noReason?: string;
  cooldownUntil?: string;
  notes?: string;
  createdAt: number;
};

const CRM_KEY = "pp_crm_contacts";

function loadContactsFromLocal(): Contact[] {
  try {
    const raw = localStorage.getItem(CRM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function loadContacts(): Promise<Contact[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return loadContactsFromLocal();
    }
    const supabase = getSupabase();
    const { data } = await supabase.from("crm_contacts").select("*").order("created_at", { ascending: false });
    if (!data) return [];
    return data.map((c: any) => ({
      id: c.id,
      tier: c.tier,
      decisionMaker: c.decision_maker,
      city: c.location,
      estimatedCapacity: c.estimated_capacity,
      decisionStatus: c.status,
      noReason: c.no_reason,
      cooldownUntil: c.follow_up_date,
      notes: c.notes,
      createdAt: new Date(c.created_at).getTime(),
    }));
  } catch {
    return loadContactsFromLocal();
  }
}

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [smartProgram, setSmartProgram] = useState(false);
  const [airportHub, setAirportHub] = useState(false);
  const [cityHub, setCityHub] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const refreshContacts = () => loadContacts().then(setContacts);
    refreshContacts();
    const handler = () => refreshContacts();
    window.addEventListener("crm_storage", handler);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "crm_update_signal") {
        refreshContacts();
      }
    };
    window.addEventListener("storage", storageHandler);
    
    // Load hub state
    const savedHubs = localStorage.getItem("pp_mission_hubs");
    if (savedHubs) {
      const { city, airport, smart } = JSON.parse(savedHubs);
      setCityHub(city);
      setAirportHub(airport);
      setSmartProgram(smart);
    }

    return () => {
      window.removeEventListener("crm_storage", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  // Save hub state
  useEffect(() => {
    localStorage.setItem("pp_mission_hubs", JSON.stringify({
      city: cityHub,
      airport: airportHub,
      smart: smartProgram
    }));
  }, [cityHub, airportHub, smartProgram]);

  // KPIs
  const lotsMapped = contacts.length;
  const lotsActivated = contacts.filter((c) => c.decisionStatus === "CONTRACT").length;
  const currentValue = contacts
    .filter((c) => c.decisionStatus === "CONTRACT")
    .reduce((acc, c) => acc + (c.estimatedCapacity || 0) * 100, 0);

  const MissionItem = ({ label, value, onClick }: { label: string; value: string | number; onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex flex-col items-start gap-1 ${onClick ? "cursor-pointer" : ""}`}
    >
      <span className="text-xs font-bold text-black shrink-0">{label}</span>
      <span className="text-[10px] text-gray-500 font-bold">{value}</span>
    </div>
  );

  return (
    <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-4 overflow-x-hidden">
      <div className="flex items-center border-b border-gray-100 mb-4 pb-2 pl-2">
        <span className="text-xs font-semibold tracking-tight text-black mr-4">{t('mission')}</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Primary Metrics */}
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">{t('performance')}</h2>
          <div className="flex flex-col space-y-1">
            <MissionItem label={t('current_revenue')} value={`${currentValue.toLocaleString()}€`} />
            <MissionItem label={t('lots_mapped')} value={lotsMapped} />
            <MissionItem label={t('lots_activated')} value={lotsActivated} />
          </div>
        </div>

        {/* Strategic Initiatives */}
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">{t('strategic_initiatives')}</h2>
          <div className="flex flex-col space-y-1">
            <MissionItem 
              label={t('smart_city_program')} 
              value={smartProgram ? t('yes') : t('no')} 
            />
            <MissionItem 
              label={t('airport_hub_contract')} 
              value={airportHub ? t('yes') : t('no')} 
            />
            <MissionItem 
              label={t('city_hub_contract')} 
              value={cityHub ? t('yes') : t('no')} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
