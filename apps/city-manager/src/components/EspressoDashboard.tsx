"use client";

import { useState, useEffect } from "react";
import { useEspressoSystem } from "../hooks/useEspressoSystem";
import { getSupabase, getCurrentUser, isSuperAdmin } from "../lib/supabase";
import PermitsForm from "./PermitsForm";
import ActivationKitForm from "./ActivationKitForm";
import AirportForm from "./AirportForm";
import CompetitionForm from "./CompetitionForm";
import LotActivationForm from "./LotActivationForm";
import DocumentSubmissionModal from "./DocumentSubmissionModal";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUserProgress, setAllUserProgress] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const admin = await isSuperAdmin();
    setIsAdmin(admin);
    if (admin) {
      fetchAdminData();
    } else {
      setLoadingAdmin(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoadingAdmin(true);
      const supabase = getSupabase();
      
      // Fetch all user progress
      // Note: Joining auth.users directly might be restricted depending on Supabase config.
      // If it fails, we will just show user_id.
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      // For now, we might not get emails if we can't join auth.users easily.
      // But let's try to get emails from document_submissions if available, or just show IDs.
      // A better way is to use an edge function or a secure view, but for now we'll stick to what we have.
      // We can try to fetch emails from a public profile table if it exists, but we don't have one.
      // Let's see if we can get emails from the inbox logic which seems to work.
      
      setAllUserProgress(data || []);
    } catch (e) {
      console.error("Error fetching admin data", e);
    } finally {
      setLoadingAdmin(false);
    }
  };

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
  const [submissionStatuses, setSubmissionStatuses] = useState<Record<string, string>>({});
  const [showStakeholderModal, setShowStakeholderModal] = useState(false);

  useEffect(() => {
    const t = progress.currentTier;
    
    // Reset data when tier changes to avoid leaking previous tier data
    setPermitsData(null);
    setActivationData(null);
    setCompetitionData(null);
    setAirportData(null);
    setLotData(null);
    
    // Close all forms to ensure clean state
    setShowPermitsForm(false);
    setShowActivationForm(false);
    setShowCompetitionForm(false);
    setShowAirportForm(false);
    setShowLotForm(false);
    setShowStakeholderModal(false);

    const savedPermits = localStorage.getItem(`pp_espresso_permits_data_t${t}`);
    if (savedPermits) setPermitsData(JSON.parse(savedPermits));

    const savedActivation = localStorage.getItem(`pp_espresso_activation_data_t${t}`);
    if (savedActivation) setActivationData(JSON.parse(savedActivation));

    const savedCompetition = localStorage.getItem(`pp_espresso_competition_data_t${t}`);
    if (savedCompetition) setCompetitionData(JSON.parse(savedCompetition));

    const savedAirport = localStorage.getItem(`pp_espresso_airport_data_t${t}`);
    if (savedAirport) setAirportData(JSON.parse(savedAirport));

    const savedLot = localStorage.getItem(`pp_espresso_lot_data_t${t}`);
    if (savedLot) setLotData(JSON.parse(savedLot));
    
    // Check for stakeholder submission (Tier 6/7)
    const savedStakeholder = localStorage.getItem(`pp_espresso_stakeholder_${t}`);
    
    setDocsState({
      [`t${t}-permits`]: !!savedPermits,
      [`t${t}-competition`]: !!savedCompetition,
      [`t${t}-activation`]: !!savedLot,
      [`t${t}-specific`]: !!savedAirport || !!savedStakeholder
    });
    
    // Fetch submission statuses
    fetchSubmissionStatuses(t);
  }, [progress.currentTier]);

  const fetchSubmissionStatuses = async (tier: number) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      
      const supabase = getSupabase();
      const { data } = await supabase
        .from("document_submissions")
        .select("type, status")
        .eq("user_id", user.id)
        .eq("tier", tier);
        
      if (data) {
        const statuses: Record<string, string> = {};
        data.forEach((s: any) => {
          statuses[s.type] = s.status;
        });
        setSubmissionStatuses(statuses);
      }
    } catch (e) {
      console.error("Failed to fetch statuses", e);
    }
  };

  // Helper to get status badge
  const getStatusBadge = (type: string, isFilled: boolean) => {
    const status = submissionStatuses[type];
    
    if (status === "approved") {
      return <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">PASSED</span>;
    }
    if (status === "rejected") {
      return <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">REJECTED</span>;
    }
    if (status === "pending") {
      return <span className="text-[10px] text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded">PENDING REVIEW</span>;
    }
    if (isFilled) {
       return <span className="text-[10px] text-blue-600 font-bold">FILLED</span>;
    }
    return <span className="text-[10px] text-gray-500 font-bold">FILL FORM</span>;
  };


  const handleStakeholderSubmitted = () => {
    localStorage.setItem(`pp_espresso_stakeholder_${progress.currentTier}`, "true");
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-specific`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
  };

  const handlePermitsSave = (data: any) => {
    setPermitsData(data);
    localStorage.setItem(`pp_espresso_permits_data_t${progress.currentTier}`, JSON.stringify(data));
    setShowPermitsForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-permits`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
  };

  const handleActivationSave = (data: any) => {
    setActivationData(data);
    localStorage.setItem(`pp_espresso_activation_data_t${progress.currentTier}`, JSON.stringify(data));
    setShowActivationForm(false);
    fetchSubmissionStatuses(progress.currentTier);
  };

  const handleCompetitionSave = (data: any) => {
    setCompetitionData(data);
    localStorage.setItem(`pp_espresso_competition_data_t${progress.currentTier}`, JSON.stringify(data));
    setShowCompetitionForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-competition`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
  };
  
  const submitDocument = async (tier: number, type: "airport" | "stakeholder", content: any) => {
    try {
      const supabase = getSupabase();
      const user = await getCurrentUser();
      
      if (!user) throw new Error("Not authenticated");

      let finalContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      
      // For Stakeholder analysis, we append signature and date automatically if it's just text
      // But DocumentSubmissionModal handles that for stakeholder type.
      // If we are calling this from AirportForm (type='airport'), content is JSON string.
      
      const { error } = await supabase.from("document_submissions").insert({
        user_id: user.id,
        tier,
        type,
        content: finalContent,
        status: "pending"
      });

      if (error) throw error;
      
      // Update local state to reflect submission
      // Triggers re-render via useEspressoSystem sync usually, but we can alert user
      alert("Document submitted successfully! It is now under review.");
      
    } catch (e) {
      console.error("Submission failed", e);
      alert("Failed to submit document. Please try again.");
    }
  };

  const handleAirportSave = (data: any) => {
    setAirportData(data);
    localStorage.setItem(`pp_espresso_airport_data_t${progress.currentTier}`, JSON.stringify(data));
    setShowAirportForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-specific`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
  };
  
  const handleLotSave = (data: any) => {
    setLotData(data);
    localStorage.setItem(`pp_espresso_lot_data_t${progress.currentTier}`, JSON.stringify(data));
    setShowLotForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-activation`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
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

  if (loadingAdmin) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading mission control...</div>;
  }

  if (isAdmin) {
    return (
      <div className="max-w-4xl w-full mx-auto px-4 py-8 pb-32">
        <div className="flex items-center justify-start border-b border-gray-200 mb-8 pb-4 pl-1">
          <span className="text-sm font-bold tracking-tight text-black mr-4">MISSION CONTROL</span>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Super Admin View</span>
        </div>

        <div className="space-y-8">
          {/* Mission Status Overview */}
          <section className="text-left pl-1">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-left">Global Progress</h2>
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="w-full">
                <table className="w-full text-sm text-left table-fixed">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                    <tr>
                      <th className="px-2 py-3 font-bold text-gray-900 w-1/4 text-left pl-4">User ID</th>
                      <th className="px-2 py-3 font-bold text-gray-900 w-1/4 text-left pl-4">Tier</th>
                      <th className="px-2 py-3 font-bold text-gray-900 w-1/4 text-left pl-4">Last Active</th>
                      <th className="px-2 py-3 font-bold text-gray-900 w-1/4 text-left pl-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUserProgress.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-4 font-medium text-black truncate pl-4" title={user.user_id}>
                          {user.user_id.substring(0, 8)}...
                        </td>
                        <td className="px-2 py-4 pl-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white">
                            Tier {user.current_tier}
                          </span>
                        </td>
                        <td className="px-2 py-4 text-gray-500 pl-4">
                          {new Date(user.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-4 pl-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium justify-center ${
                            user.current_tier >= 7 
                              ? "bg-green-100 text-green-800" 
                              : "bg-blue-50 text-blue-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.current_tier >= 7 ? "bg-green-500" : "bg-blue-500"}`}></span>
                            {user.current_tier >= 7 ? "Completed" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {allUserProgress.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No active users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500 text-left">
              * Document review and approvals are handled in the <a href="/inbox" className="text-black underline">Inbox</a>.
            </p>
          </section>
        </div>
      </div>
    );
  }

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
            tier={progress.currentTier}
          />
        )}
        {showActivationForm && (
          <ActivationKitForm 
            onClose={() => setShowActivationForm(false)} 
            onSave={handleActivationSave}
            initialData={activationData}
            tier={progress.currentTier}
          />
        )}
        {showCompetitionForm && (
          <CompetitionForm 
            onClose={() => setShowCompetitionForm(false)} 
            onSave={handleCompetitionSave}
            initialData={competitionData}
            tier={progress.currentTier}
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
            tier={progress.currentTier}
          />
        )}
        {showStakeholderModal && (
          <DocumentSubmissionModal
            onClose={() => setShowStakeholderModal(false)}
            onSubmitted={() => {
              handleStakeholderSubmitted();
              setShowStakeholderModal(false);
            }}
            tier={progress.currentTier}
            type="stakeholder"
            title={progress.currentTier === 6 ? "Hotel Analysis (Essay)" : "Whales Corporation Analysis (Essay)"}
            placeholder={progress.currentTier === 6 
              ? "Analyze the hotel landscape in your area. Who are the key players? What are their parking needs? How can we approach them?"
              : "Analyze the major corporations (Whales) in your area. What is their parking situation? Who are the decision makers?"
            }
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
                  <div className="mt-1">
                    {getStatusBadge("permits", !!docsState[`t${progress.currentTier}-permits`])}
                  </div>
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
                  <div className="mt-1">
                    {getStatusBadge("competition", !!docsState[`t${progress.currentTier}-competition`])}
                  </div>
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
                  <div className="mt-1">
                    {getStatusBadge("lot_activation", !!docsState[`t${progress.currentTier}-activation`])}
                  </div>
                </div>
              </div>

            </div>

            {/* Special Forms Logic */}
            {progress.currentTier === 1 && (
              <div 
                onClick={() => setShowAirportForm(true)}
                className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex flex-col items-start gap-1 cursor-pointer ${docsState[`t${progress.currentTier}-specific`] ? "bg-gray-50/50" : ""}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-black shrink-0">Airport Analysis</span>
                  {getStatusBadge("airport", !!docsState[`t${progress.currentTier}-specific`])}
                </div>
              </div>
            )}
            
            {(progress.currentTier === 6 || progress.currentTier === 7) && (
              <div 
                onClick={() => setShowStakeholderModal(true)}
                className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex flex-col items-start gap-1 cursor-pointer ${docsState[`t${progress.currentTier}-specific`] ? "bg-gray-50/50" : ""}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-black shrink-0">Stakeholder Analysis</span>
                   {getStatusBadge("stakeholder", !!docsState[`t${progress.currentTier}-specific`])}
                </div>
              </div>
            )}

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
                  <div className="mt-1">
                    {getStatusBadge("hub_activation", !!activationData)}
                  </div>
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

            {progress.currentTier === 1 && (
              <div 
                onClick={() => setShowAirportForm(true)}
                className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-specific`] ? "text-gray-400 line-through" : "text-black"}`}>
                    Fill Airport Analysis
                  </h3>
                  <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  docsState[`t${progress.currentTier}-specific`] ? "bg-black border-black" : "border-gray-300 bg-white"
                }`}>
                  {docsState[`t${progress.currentTier}-specific`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            )}

            {(progress.currentTier === 6 || progress.currentTier === 7) && (
              <div 
                onClick={() => setShowStakeholderModal(true)}
                className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-specific`] ? "text-gray-400 line-through" : "text-black"}`}>
                    Fill {progress.currentTier === 6 ? "Hotel" : "Whales Corporation"} Analysis
                  </h3>
                  <p className="text-[10px] text-gray-500">Tier {progress.currentTier}</p>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  docsState[`t${progress.currentTier}-specific`] ? "bg-black border-black" : "border-gray-300 bg-white"
                }`}>
                  {docsState[`t${progress.currentTier}-specific`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            )}

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
