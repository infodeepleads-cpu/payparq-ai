"use client";

import { useState, useEffect } from "react";
import { useEspressoSystem } from "../hooks/useEspressoSystem";
import PermitsForm from "./PermitsForm";
import ActivationKitForm from "./ActivationKitForm";
import AirportForm from "./AirportForm";
import CompetitionForm from "./CompetitionForm";
import LotActivationForm from "./LotActivationForm";

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

export default function EspressoDashboard() {
  const { progress } = useEspressoSystem();

  // Mission State
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

  // Daily Tasks State
  const [mapLotsCompleted, setMapLotsCompleted] = useState(false);
  const [activateLotCompleted, setActivateLotCompleted] = useState(false);

  // Load state from local storage
  useEffect(() => {
    const key = `pp_espresso_daily_${progress.currentTier}_${new Date().toDateString()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const obj = JSON.parse(saved);
      setMapLotsCompleted(!!obj.mapLots);
      setActivateLotCompleted(!!obj.activateLot);
    } else {
      setMapLotsCompleted(false);
      setActivateLotCompleted(false);
    }
  }, []);

  const [showPermitsForm, setShowPermitsForm] = useState(false);
  const [permitsData, setPermitsData] = useState<any>(null);
  const [showActivationForm, setShowActivationForm] = useState(false);
  const [activationData, setActivationData] = useState<any>(null);
  const [showCompetitionForm, setShowCompetitionForm] = useState(false);
  const [competitionData, setCompetitionData] = useState<any>(null);
  const [showAirportForm, setShowAirportForm] = useState(false);
  const [airportData, setAirportData] = useState<any>(null);
  const [showLotForm, setShowLotForm] = useState(false);
  const [lotData, setLotData] = useState<any>(null);
  const [docsState, setDocsState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedPermits = localStorage.getItem("pp_espresso_permits_data");
    if (savedPermits) setPermitsData(JSON.parse(savedPermits));
    const savedActivation = localStorage.getItem("pp_espresso_activation_data");
    if (savedActivation) setActivationData(JSON.parse(savedActivation));
    const savedCompetition = localStorage.getItem("pp_espresso_competition_data");
    if (savedCompetition) setCompetitionData(JSON.parse(savedCompetition));
    const savedAirport = localStorage.getItem("pp_espresso_airport_data");
    if (savedAirport) setAirportData(JSON.parse(savedAirport));
    const savedLot = localStorage.getItem("pp_espresso_lot_data");
    if (savedLot) setLotData(JSON.parse(savedLot));
    setDocsState({
      [`t${progress.currentTier}-permits`]: !!savedPermits,
      [`t${progress.currentTier}-competition`]: !!savedCompetition,
      [`t${progress.currentTier}-activation`]: !!savedLot,
      [`t${progress.currentTier}-specific`]: !!savedAirport
    });
  }, []);

  const handlePermitsSave = (data: any) => {
    setPermitsData(data);
    localStorage.setItem("pp_espresso_permits_data", JSON.stringify(data));
    setShowPermitsForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-permits`]: true }));
  };

  const handleActivationSave = (data: any) => {
    setActivationData(data);
    localStorage.setItem("pp_espresso_activation_data", JSON.stringify(data));
    setShowActivationForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-activation`]: true }));
  };
  
  const handleCompetitionSave = (data: any) => {
    setCompetitionData(data);
    localStorage.setItem("pp_espresso_competition_data", JSON.stringify(data));
    setShowCompetitionForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-competition`]: true }));
  };
  
  const handleAirportSave = (data: any) => {
    setAirportData(data);
    localStorage.setItem("pp_espresso_airport_data", JSON.stringify(data));
    setShowAirportForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-specific`]: true }));
  };
  
  const handleLotSave = (data: any) => {
    setLotData(data);
    localStorage.setItem("pp_espresso_lot_data", JSON.stringify(data));
    setShowLotForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-activation`]: true }));
  };

  // Save state
  useEffect(() => {
    const key = `pp_espresso_daily_${progress.currentTier}_${new Date().toDateString()}`;
    localStorage.setItem(key, JSON.stringify({
      mapLots: mapLotsCompleted,
      activateLot: activateLotCompleted,
      date: Date.now()
    }));
  }, [mapLotsCompleted, activateLotCompleted, progress.currentTier]);

  // Sync Daily Form Tasks to Chat Task List
  useEffect(() => {
    try {
      const TASKS_KEY = "pp_tasks";
      const rawTasks = localStorage.getItem(TASKS_KEY);
      const tasks = rawTasks ? JSON.parse(rawTasks) : [];
      let updated = false;

      const dailyFormTasks = [
        { 
          id: `daily-permits-t${progress.currentTier}`, 
          title: `Fill Permits & Public Form (Tier ${progress.currentTier})`,
          completed: !!docsState[`t${progress.currentTier}-permits`]
        },
        { 
          id: `daily-competition-t${progress.currentTier}`, 
          title: `Fill Competition Analysis Form (Tier ${progress.currentTier})`,
          completed: !!docsState[`t${progress.currentTier}-competition`]
        },
        { 
          id: `daily-activation-t${progress.currentTier}`, 
          title: `Fill Lot Activation List (Tier ${progress.currentTier})`,
          completed: !!docsState[`t${progress.currentTier}-activation`]
        },
        { 
          id: `daily-specific-t${progress.currentTier}`, 
          title: `Fill ${progress.currentTier === 1 ? "Airport" : progress.currentTier === 6 ? "Hotel" : progress.currentTier === 7 ? "Whales Corporation" : "Area"} Analysis (Tier ${progress.currentTier})`,
          completed: !!docsState[`t${progress.currentTier}-specific`]
        }
      ];

      dailyFormTasks.forEach(dt => {
        const existingIdx = tasks.findIndex((t: any) => t.id === dt.id);
        if (existingIdx >= 0) {
          if (tasks[existingIdx].completed !== dt.completed) {
            tasks[existingIdx].completed = dt.completed;
            updated = true;
          }
        } else {
          tasks.push({
            id: dt.id,
            title: dt.title,
            completed: dt.completed,
            confirmed: false,
            createdAt: Date.now()
          });
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Failed to sync daily tasks", e);
    }
  }, [docsState, progress.currentTier]);

  const sendEmail = (e: React.MouseEvent, subject: string, data: any) => {
    e.stopPropagation();
    if (!data) {
      alert("Please fill the form first before sending.");
      return;
    }
    const body = encodeURIComponent(JSON.stringify(data, null, 2));
    window.location.href = `mailto:payparq@outlook.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-1 md:px-0 py-6 pb-32 overflow-x-hidden">
      {/* Header matching Inbox style */}
      <div className="flex items-center border-b border-gray-100 mb-6 pb-2 pl-2">
        <span className="text-xs font-semibold tracking-tight text-black mr-4">ESPRESSO</span>
        <span className="text-[10px] text-gray-400">Tier {progress.currentTier}/7</span>
      </div>

      <div className="space-y-8">
        {showPermitsForm && (
          <PermitsForm 
            onClose={() => setShowPermitsForm(false)} 
            onSave={handlePermitsSave}
            initialData={permitsData}
          />
        )}
        {showActivationForm && (
          <ActivationKitForm 
            onClose={() => setShowActivationForm(false)} 
            onSave={handleActivationSave}
            initialData={activationData}
          />
        )}
        {showCompetitionForm && (
          <CompetitionForm 
            onClose={() => setShowCompetitionForm(false)} 
            onSave={handleCompetitionSave}
            initialData={competitionData}
          />
        )}
        {showAirportForm && (
          <AirportForm 
            onClose={() => setShowAirportForm(false)} 
            onSave={handleAirportSave}
            initialData={airportData}
          />
        )}
        {showLotForm && (
          <LotActivationForm 
            onClose={() => setShowLotForm(false)} 
            onSave={handleLotSave}
            initialData={lotData}
          />
        )}

        {/* 0. Documents */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Documents</h2>
          <div className="space-y-1">


            {/* Permits */}
            <div 
              onClick={() => setShowPermitsForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-permits`] ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-black">Permits & Public</h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">
                    {docsState[`t${progress.currentTier}-permits`] ? "FILLED" : "FILL FORM"}
                  </p>
                </div>
              </div>

            </div>

            {/* Competition */}
            <div 
              onClick={() => setShowCompetitionForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-competition`] ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-black">Competition Analysis</h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">
                    {docsState[`t${progress.currentTier}-competition`] ? "FILLED" : "FILL FORM"}
                  </p>
                </div>
              </div>

            </div>

            {/* Lot Activation */}
            <div 
              onClick={() => setShowLotForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-activation`] ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xs font-bold text-black">Lot Activation List</h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">
                    {docsState[`t${progress.currentTier}-activation`] ? "FILLED" : "FILL FORM"}
                  </p>
                </div>
              </div>

            </div>

            {/* Area Analysis */}
            <div 
              onClick={() => setShowAirportForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-specific`] ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-black">
                    {progress.currentTier === 1 ? "Airport Analysis" : progress.currentTier === 6 ? "Hotel Analysis" : progress.currentTier === 7 ? "Whales Corporation Analysis" : "Area Analysis"}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">
                    {docsState[`t${progress.currentTier}-specific`] ? "FILLED" : "FILL FORM"}
                  </p>
                </div>
              </div>

            </div>

            {/* HUB Activation Form (Moved to end) */}
            <div 
              onClick={() => setShowActivationForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                activationData ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-tight">HUB Activation Form</h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">
                    {activationData ? "READY FOR REVIEW" : "FILL FORM"}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 1. Daily Tasks */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 pl-2">Daily Tasks</h2>
          
          <div className="space-y-1">
            <div 
              onClick={() => setShowPermitsForm(true)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-2"
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-permits`] ? "text-gray-400 line-through" : "text-black"}`}>
                  Fill Permits & Public Form
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
               <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-permits`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-permits`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>

            <div 
              onClick={() => setShowCompetitionForm(true)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-2"
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-competition`] ? "text-gray-400 line-through" : "text-black"}`}>
                  Fill Competition Analysis Form
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-competition`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-competition`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>

            <div 
              onClick={() => setShowLotForm(true)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-2"
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-activation`] ? "text-gray-400 line-through" : "text-black"}`}>
                  Fill Lot Activation List
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-activation`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-activation`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>

            <div 
              onClick={() => setShowAirportForm(true)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-specific`] ? "text-gray-400 line-through" : "text-black"}`}>
                  Fill {progress.currentTier === 1 ? "Airport" : progress.currentTier === 6 ? "Hotel" : progress.currentTier === 7 ? "Whales Corporation" : "Area"} Analysis
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-specific`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-specific`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>

            <div 
              onClick={() => setMapLotsCompleted(!mapLotsCompleted)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${mapLotsCompleted ? "text-gray-400 line-through" : "text-black"}`}>
                  Map All Relevant Lots
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                mapLotsCompleted ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {mapLotsCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>

            <div 
              onClick={() => setActivateLotCompleted(!activateLotCompleted)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${activateLotCompleted ? "text-gray-400 line-through" : "text-black"}`}>
                  Activate 1 Lot (Try to close best first)
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                activateLotCompleted ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {activateLotCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section>
          <div className="flex items-center border-b border-gray-100 mb-4 pb-2 pl-2 mt-8">
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
                  onClick={() => setSmartProgram(!smartProgram)}
                />
                <MissionItem 
                  label="AIRPORT HUB(CONTRACT)" 
                  value={airportHub ? "YES" : "NO"} 
                  onClick={() => setAirportHub(!airportHub)}
                />
                <MissionItem 
                  label="CITY HUB(CONTRACT)" 
                  value={cityHub ? "YES" : "NO"} 
                  onClick={() => setCityHub(!cityHub)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
