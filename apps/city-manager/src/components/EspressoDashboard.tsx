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
  const [task1Completed, setTask1Completed] = useState(false);
  const [task2Completed, setTask2Completed] = useState(false);

  // Load state from local storage
  useEffect(() => {
    // Reset daily tasks on new day logic could go here, but keeping it simple for now
    const savedTasks = localStorage.getItem("pp_mission_daily_tasks");
    if (savedTasks) {
      const { t1, t2, date } = JSON.parse(savedTasks);
      if (new Date(date).toDateString() === new Date().toDateString()) {
        setTask1Completed(t1);
        setTask2Completed(t2);
      }
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
    localStorage.setItem("pp_mission_daily_tasks", JSON.stringify({
      t1: task1Completed,
      t2: task2Completed,
      date: new Date().getTime()
    }));
  }, [task1Completed, task2Completed]);

  return (
    <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-6">
      <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-black uppercase">ESPRESSO</h1>
        <div className="text-right">
           <span className="text-sm font-bold text-gray-900">TIER {progress.currentTier}</span>
        </div>
      </div>

      <div className="space-y-12">
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
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
            Documents
          </h2>
          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
            <div className={`p-3 border rounded flex items-center justify-between ${docsState[`t${progress.currentTier}-permits`] ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
              <div>
                <h3 className="font-semibold text-xs text-black">Permits & Public</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {docsState[`t${progress.currentTier}-permits`] ? "Filled" : "Required"}
                </p>
              </div>
              <button
                onClick={() => setShowPermitsForm(true)}
                className={`text-[10px] px-2 py-1 rounded font-medium cursor-pointer transition-colors inline-block uppercase tracking-wide border ${
                  docsState[`t${progress.currentTier}-permits`]
                    ? "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
                    : "border-black bg-black text-white hover:bg-gray-800"
                }`}
              >
                {docsState[`t${progress.currentTier}-permits`] ? "EDIT FORM" : "FILL FORM"}
              </button>
            </div>
            <div className={`p-3 border rounded flex items-center justify-between ${docsState[`t${progress.currentTier}-competition`] ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
              <div>
                <h3 className="font-semibold text-xs text-black">Competition Analysis</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {docsState[`t${progress.currentTier}-competition`] ? "Filled" : "Required"}
                </p>
              </div>
              <button
                onClick={() => setShowCompetitionForm(true)}
                className={`text-[10px] px-2 py-1 rounded font-medium cursor-pointer transition-colors inline-block uppercase tracking-wide border ${
                  docsState[`t${progress.currentTier}-competition`]
                    ? "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
                    : "border-black bg-black text-white hover:bg-gray-800"
                }`}
              >
                {docsState[`t${progress.currentTier}-competition`] ? "EDIT FORM" : "FILL FORM"}
              </button>
            </div>
            <div className={`p-3 border rounded flex items-center justify-between ${docsState[`t${progress.currentTier}-activation`] ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
              <div>
                <h3 className="font-semibold text-xs text-black">Lot Activation List</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {docsState[`t${progress.currentTier}-activation`] ? "Filled" : "Required"}
                </p>
              </div>
              <button
                onClick={() => setShowLotForm(true)}
                className={`text-[10px] px-2 py-1 rounded font-medium cursor-pointer transition-colors inline-block uppercase tracking-wide border ${
                  docsState[`t${progress.currentTier}-activation`]
                    ? "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
                    : "border-black bg-black text-white hover:bg-gray-800"
                }`}
              >
                {docsState[`t${progress.currentTier}-activation`] ? "EDIT FORM" : "FILL FORM"}
              </button>
            </div>
            <div className={`p-3 border rounded flex items-center justify-between ${docsState[`t${progress.currentTier}-specific`] ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
              <div>
                <h3 className="font-semibold text-xs text-black">
                  {progress.currentTier === 1 ? "Airport Analysis" : progress.currentTier === 6 ? "Hotel Analysis" : progress.currentTier === 7 ? "Whales Corporation Analysis" : "Area Analysis"}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {docsState[`t${progress.currentTier}-specific`] ? "Filled" : "Required"}
                </p>
              </div>
              <button
                onClick={() => setShowAirportForm(true)}
                className={`text-[10px] px-2 py-1 rounded font-medium cursor-pointer transition-colors inline-block uppercase tracking-wide border ${
                  docsState[`t${progress.currentTier}-specific`]
                    ? "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
                    : "border-black bg-black text-white hover:bg-gray-800"
                }`}
              >
                {docsState[`t${progress.currentTier}-specific`] ? "EDIT FORM" : "FILL FORM"}
              </button>
            </div>
          </div>
        </section>

        {/* 2. Activation Form */}
        <section>
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
            Activation Form
          </h2>
          <div className="grid gap-2 grid-cols-1">
            <div className={`p-3 border rounded flex items-center justify-between ${
              activationData ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
            }`}>
              <div>
                <h3 className="font-semibold text-xs text-black">Activation Kit Form</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {activationData ? "Filled for each Lot Managed by PayParq" : "Required"}
                </p>
              </div>
              <button
                onClick={() => setShowActivationForm(true)}
                className={`text-[10px] px-2 py-1 rounded font-medium cursor-pointer transition-colors inline-block uppercase tracking-wide border ${
                  activationData
                    ? "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
                    : "border-black bg-black text-white hover:bg-gray-800"
                }`}
              >
                {activationData ? "EDIT" : "FILL"}
              </button>
            </div>
          </div>
        </section>

        {/* 3. Daily Tasks */}
        <section>
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
            Daily Tasks (2 Main Tasks)
          </h2>
          
          <div className="space-y-3">
            <div 
              onClick={() => setTask1Completed(!task1Completed)}
              className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-4 ${
                task1Completed ? "bg-gray-50 border-gray-300" : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                task1Completed ? "bg-black border-black" : "border-gray-300"
              }`}>
                {task1Completed && <span className="text-white font-bold text-sm">✓</span>}
              </div>
              <div>
                <h3 className={`font-bold text-sm uppercase tracking-wide ${task1Completed ? "text-gray-500 line-through" : "text-gray-900"}`}>
                  1. Fill in documents for Selected Tier
                </h3>
                <p className="text-xs text-gray-500 mt-1">Complete all necessary documentation for Tier {progress.currentTier}.</p>
              </div>
            </div>

            <div 
              onClick={() => setTask2Completed(!task2Completed)}
              className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-4 ${
                task2Completed ? "bg-gray-50 border-gray-300" : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                task2Completed ? "bg-black border-black" : "border-gray-300"
              }`}>
                {task2Completed && <span className="text-white font-bold text-sm">✓</span>}
              </div>
              <div>
                <h3 className={`font-bold text-sm uppercase tracking-wide ${task2Completed ? "text-gray-500 line-through" : "text-gray-900"}`}>
                  2. Activate 1 Lot
                </h3>
                <p className="text-xs text-gray-500 mt-1">Activate at least one parking lot for Tier {progress.currentTier}.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
