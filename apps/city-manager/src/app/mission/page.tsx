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
  const [smartProgram, setSmartProgram] = useState(false);
  const [airportHub, setAirportHub] = useState(false);
  const [cityHub, setCityHub] = useState(false);

  useEffect(() => {
    setContacts(loadContacts());
    const handler = () => setContacts(loadContacts());
    window.addEventListener("crm_storage", handler);
    
    // Load hub state
    const savedHubs = localStorage.getItem("pp_mission_hubs");
    if (savedHubs) {
      const { city, airport, smart } = JSON.parse(savedHubs);
      setCityHub(city);
      setAirportHub(airport);
      setSmartProgram(smart);
    }

    return () => window.removeEventListener("crm_storage", handler);
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
    <div className="max-w-3xl w-full mx-auto px-1 md:px-0 py-4 overflow-x-hidden">
      <div className="flex items-center border-b border-gray-100 mb-4 pb-2 pl-2">
        <span className="text-xs font-semibold tracking-tight text-black mr-4">MISSION</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Primary Metrics */}
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Performance</h2>
          <div className="flex flex-col space-y-1">
            <MissionItem label="Current Revenue" value={`${currentValue.toLocaleString()}€`} />
            <MissionItem label="Lots Mapped" value={lotsMapped} />
            <MissionItem label="Lots Activated" value={lotsActivated} />
          </div>
        </div>

        {/* Strategic Initiatives */}
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Strategic Initiatives</h2>
          <div className="flex flex-col space-y-1">
            <MissionItem 
              label="SMART CITY PROGRAM" 
              value={smartProgram ? "YES" : "NO"} 
            />
            <MissionItem 
              label="AIRPORT HUB(CONTRACT)" 
              value={airportHub ? "YES" : "NO"} 
            />
            <MissionItem 
              label="CITY HUB(CONTRACT)" 
              value={cityHub ? "YES" : "NO"} 
            />
          </div>
        </div>
        
        
      </div>
    </div>
  );
}
