"use client";

import { useState, useEffect } from "react";
import { useEspressoSystem } from "../hooks/useEspressoSystem";
import PermitsForm from "./PermitsForm";
import ActivationKitForm from "./ActivationKitForm";
import AirportForm from "./AirportForm";
import CompetitionForm from "./CompetitionForm";
import LotActivationForm from "./LotActivationForm";

export default function EspressoDashboard() {
  const { progress } = useEspressoSystem();

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

  return (
    <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-6">
      {/* Header matching Inbox style */}
      <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
        <span className="text-xs font-semibold tracking-tight text-black mr-4">ESPRESSO</span>
        <span className="text-[10px] text-gray-400">Tier {progress.currentTier}</span>
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
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Documents</h2>
          <div className="space-y-1">
            {/* Permits */}
            <div 
              onClick={() => setShowPermitsForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-permits`] ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${docsState[`t${progress.currentTier}-permits`] ? "bg-green-500" : "bg-black"}`}></div>
                <div>
                  <h3 className="text-xs font-bold text-black">Permits & Public</h3>
                  <p className="text-[10px] text-gray-500">
                    {docsState[`t${progress.currentTier}-permits`] ? "Filled" : "Required"}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-1 rounded border ${
                docsState[`t${progress.currentTier}-permits`] 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : "border-gray-200 text-gray-600 bg-white group-hover:border-gray-300"
              }`}>
                {docsState[`t${progress.currentTier}-permits`] ? "EDIT" : "FILL"}
              </span>
            </div>

            {/* Competition */}
            <div 
              onClick={() => setShowCompetitionForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-competition`] ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${docsState[`t${progress.currentTier}-competition`] ? "bg-green-500" : "bg-black"}`}></div>
                <div>
                  <h3 className="text-xs font-bold text-black">Competition Analysis</h3>
                  <p className="text-[10px] text-gray-500">
                    {docsState[`t${progress.currentTier}-competition`] ? "Filled" : "Required"}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-1 rounded border ${
                docsState[`t${progress.currentTier}-competition`] 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : "border-gray-200 text-gray-600 bg-white group-hover:border-gray-300"
              }`}>
                {docsState[`t${progress.currentTier}-competition`] ? "EDIT" : "FILL"}
              </span>
            </div>

            {/* Lot Activation */}
            <div 
              onClick={() => setShowLotForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-activation`] ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${docsState[`t${progress.currentTier}-activation`] ? "bg-green-500" : "bg-black"}`}></div>
                <div>
                  <h3 className="text-xs font-bold text-black">Lot Activation List</h3>
                  <p className="text-[10px] text-gray-500">
                    {docsState[`t${progress.currentTier}-activation`] ? "Filled" : "Required"}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-1 rounded border ${
                docsState[`t${progress.currentTier}-activation`] 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : "border-gray-200 text-gray-600 bg-white group-hover:border-gray-300"
              }`}>
                {docsState[`t${progress.currentTier}-activation`] ? "EDIT" : "FILL"}
              </span>
            </div>

            {/* Area Analysis */}
            <div 
              onClick={() => setShowAirportForm(true)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-specific`] ? "bg-gray-50/50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${docsState[`t${progress.currentTier}-specific`] ? "bg-green-500" : "bg-black"}`}></div>
                <div>
                  <h3 className="text-xs font-bold text-black">
                    {progress.currentTier === 1 ? "Airport Analysis" : progress.currentTier === 6 ? "Hotel Analysis" : progress.currentTier === 7 ? "Whales Corporation Analysis" : "Area Analysis"}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {docsState[`t${progress.currentTier}-specific`] ? "Filled" : "Required"}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-1 rounded border ${
                docsState[`t${progress.currentTier}-specific`] 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : "border-gray-200 text-gray-600 bg-white group-hover:border-gray-300"
              }`}>
                {docsState[`t${progress.currentTier}-specific`] ? "EDIT" : "FILL"}
              </span>
            </div>
          </div>
        </section>

        {/* 1. Activation Kit */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Activation Kit</h2>
          <div 
            onClick={() => setShowActivationForm(true)}
            className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between ${
              activationData ? "bg-gray-50/50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${activationData ? "bg-green-500" : "bg-black"}`}></div>
              <div>
                <h3 className="text-xs font-bold text-black">Activation Kit Form</h3>
                <p className="text-[10px] text-gray-500">
                  {activationData ? "Filled" : "Required for every activation"}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-medium px-2 py-1 rounded border ${
              activationData 
                ? "border-green-200 text-green-700 bg-green-50" 
                : "border-gray-200 text-gray-600 bg-white group-hover:border-gray-300"
            }`}>
              {activationData ? "EDIT" : "FILL"}
            </span>
          </div>
        </section>

        {/* 3. Daily Tasks */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Daily Tasks</h2>
          
          <div className="space-y-1">
            <div 
              onClick={() => setShowPermitsForm(true)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center gap-3"
            >
               <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-permits`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-permits`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-permits`] ? "text-gray-400 line-through" : "text-black"}`}>
                  Fill Permits & Public Form
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
            </div>

            <div 
              onClick={() => setShowCompetitionForm(true)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center gap-3"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-competition`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-competition`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-competition`] ? "text-gray-400 line-through" : "text-black"}`}>
                  Fill Competition Analysis Form
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
            </div>

            <div 
              onClick={() => setShowLotForm(true)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center gap-3"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-activation`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-activation`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-activation`] ? "text-gray-400 line-through" : "text-black"}`}>
                  Fill Lot Activation List
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
            </div>

            <div 
              onClick={() => setShowAirportForm(true)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center gap-3"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-specific`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-specific`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-specific`] ? "text-gray-400 line-through" : "text-black"}`}>
                  Fill {progress.currentTier === 1 ? "Airport" : progress.currentTier === 6 ? "Hotel" : progress.currentTier === 7 ? "Whales Corporation" : "Area"} Analysis
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
            </div>

            <div 
              onClick={() => setMapLotsCompleted(!mapLotsCompleted)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center gap-3"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                mapLotsCompleted ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {mapLotsCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${mapLotsCompleted ? "text-gray-400 line-through" : "text-black"}`}>
                  Map All Relevant Lots
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
            </div>

            <div 
              onClick={() => setActivateLotCompleted(!activateLotCompleted)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center gap-3"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                activateLotCompleted ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {activateLotCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${activateLotCompleted ? "text-gray-400 line-through" : "text-black"}`}>
                  Activate 1 Lot (Try to close best first)
                </h3>
                <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
