"use client";

import { useState, useEffect } from "react";
import { useEspressoSystem } from "../hooks/useEspressoSystem";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSupabase, getCurrentUser, isSuperAdmin } from "../lib/supabase";
import PermitsForm from "./PermitsForm";
import ActivationKitForm from "./ActivationKitForm";
import AirportForm from "./AirportForm";
import CompetitionForm from "./CompetitionForm";
import LotActivationForm from "./LotActivationForm";
import DocumentSubmissionModal from "./DocumentSubmissionModal";

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

type BrainLead = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  score: number;
  source: string;
};

type BrainTask = {
  type: string;
  leadId: string;
};

type BrainPlan = {
  date: string;
  quotas: {
    calls: number;
    emails: number;
    messages: number;
    walk_in_zones: number;
    ads: number;
  };
  zone: { lat: number; lon: number };
  leads: BrainLead[];
  tasks: BrainTask[];
};

async function loadContacts(): Promise<Contact[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("crm_contacts").select("*");
    
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
    return [];
  }
}

export default function EspressoDashboard() {
  const { progress } = useEspressoSystem();
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUserProgress, setAllUserProgress] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const { t, language } = useLanguage();

  const [brainPlan, setBrainPlan] = useState<BrainPlan | null>(null);
  const [brainLoading, setBrainLoading] = useState(false);
  const [brainError, setBrainError] = useState<string | null>(null);

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
    loadContacts().then(setContacts);
    const handler = () => loadContacts().then(setContacts);
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
  // "Contract Status (Contractual Obligation)" is the activated status
  const lotsActivated = contacts.filter((c) => c.decisionStatus === "Contract Status (Contractual Obligation)").length;
  const currentValue = contacts
    .filter((c) => c.decisionStatus === "Contract Status (Contractual Obligation)")
    .reduce((acc, c) => acc + (c.estimatedCapacity || 0) * 100, 0);

  const buildBrainTaskTitle = (task: BrainTask, lead?: BrainLead) => {
    const name = lead?.name || "Lead";
    const type = lead?.type || "poi";
    if (task.type === "call") {
      if (type === "parking") {
        return `Nazovi vlasnika parkinga ${name} o Payparq i Park&Taxi`;
      }
      if (type === "hotel") {
        return `Nazovi hotel ${name} o Park&Taxi i Payparq`;
      }
      return `Nazovi ${name} o Payparq rješenju`;
    }
    if (task.type === "email") {
      return `Pošalji email ${name} s Payparq prezentacijom`;
    }
    if (task.type === "message") {
      return `Pošalji WhatsApp poruku ${name} o Park&Taxi`;
    }
    return `Follow up s ${name}`;
  };

  const syncBrainTasksToLocal = (plan: BrainPlan) => {
    try {
      const TASKS_KEY = "pp_tasks";
      const rawTasks = localStorage.getItem(TASKS_KEY);
      const tasks = rawTasks ? JSON.parse(rawTasks) : [];
      const leadsMap: Record<string, BrainLead> = {};
      plan.leads.forEach((l) => {
        leadsMap[l.id] = l;
      });
      let updated = false;
      const next = [...tasks];

      plan.tasks.forEach((task) => {
        const id = `brain-${task.type}-${task.leadId}`;
        const lead = leadsMap[task.leadId];
        const title = buildBrainTaskTitle(task, lead);
        const existingIdx = next.findIndex((t: any) => t.id === id);
        if (existingIdx >= 0) {
          if (next[existingIdx].title !== title) {
            next[existingIdx].title = title;
            updated = true;
          }
        } else {
          next.push({
            id,
            title,
            completed: false,
            confirmed: false,
            createdAt: Date.now()
          });
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(TASKS_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error("Failed to sync brain tasks", e);
    }
  };

  const runBrainPlan = async (auto: boolean) => {
    try {
      setBrainLoading(true);
      setBrainError(null);
      const res = await fetch("/api/planner/daily");
      if (!res.ok) {
        throw new Error("Failed to load daily plan");
      }
      const json = (await res.json()) as BrainPlan;
      setBrainPlan(json);
      syncBrainTasksToLocal(json);
      const today = json.date || new Date().toISOString().slice(0, 10);
      localStorage.setItem("pp_brain_last_date", today);
      localStorage.setItem("pp_brain_plan", JSON.stringify(json));
    } catch (err) {
      console.error("Brain plan failed", err);
      if (!auto) {
        setBrainError("Ne mogu učitati dnevni plan. Pokušaj ponovno.");
      }
    } finally {
      setBrainLoading(false);
    }
  };

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem("pp_brain_last_date");
      if (last === today) {
        const saved = localStorage.getItem("pp_brain_plan");
        if (saved) {
          const parsed = JSON.parse(saved) as BrainPlan;
          setBrainPlan(parsed);
          syncBrainTasksToLocal(parsed);
          return;
        }
      }
      runBrainPlan(true);
    } catch (e) {
      console.error("Failed to initialize brain plan", e);
    }
  }, []);

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
  const [submissionStatuses, setSubmissionStatuses] = useState<Record<string, { status: string, timestamp: string }>>({});
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
        .select("type, status, updated_at")
        .eq("user_id", user.id)
        .eq("tier", tier);
        
      if (data) {
        const statuses: Record<string, { status: string, timestamp: string }> = {};
        data.forEach((s: any) => {
          statuses[s.type] = { status: s.status, timestamp: s.updated_at };
        });
        setSubmissionStatuses(statuses);
      }
    } catch (e) {
      console.error("Failed to fetch statuses", e);
    }
  };

  // Helper to get status badge
  const getStatusBadge = (type: string, isFilled: boolean) => {
    const info = submissionStatuses[type];
    const status = info?.status;
    const timestamp = info?.timestamp ? new Date(info.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
    
    if (status === "approved") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">{t('passed')}</span>
          <span className="text-[10px] text-gray-400">{timestamp}</span>
        </div>
      );
    }
    if (status === "rejected") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">{t('rejected')}</span>
          <span className="text-[10px] text-gray-400">{timestamp}</span>
        </div>
      );
    }
    if (status === "pending") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded">{t('pending_review')}</span>
          <span className="text-[10px] text-gray-400">{timestamp}</span>
        </div>
      );
    }
    if (isFilled) {
       return <span className="text-[10px] text-blue-600 font-bold">{t('filled')}</span>;
    }
    return <span className="text-[10px] text-gray-500 font-bold">{t('fill_form')}</span>;
  };

  const canOpenForm = (type: string) => {
    const status = submissionStatuses[type]?.status;
    return status !== "pending" && status !== "approved";
  };

  const handleFormClick = (type: string, showFn: (show: boolean) => void) => {
    if (canOpenForm(type)) {
      showFn(true);
    } else {
      alert(t('under_review_alert'));
    }
  };


  const handleStakeholderSubmitted = () => {
    localStorage.setItem(`pp_espresso_stakeholder_${progress.currentTier}`, "true");
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-specific`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
  };

  const submitDocument = async (tier: number, type: string, content: any) => {
    try {
      const supabase = getSupabase();
      const user = await getCurrentUser();
      
      if (!user) throw new Error("Not authenticated");

      let finalContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      
      // Check if a submission already exists for this tier and type
      const { data: existing } = await supabase
        .from("document_submissions")
        .select("id")
        .eq("user_id", user.id)
        .eq("tier", tier)
        .eq("type", type)
        .single();

      let error;
      if (existing) {
        // Update existing submission
        const result = await supabase
          .from("document_submissions")
          .update({
            content: finalContent,
            status: "pending",
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
        error = result.error;
      } else {
        // Create new submission
        const result = await supabase
          .from("document_submissions")
          .insert({
            user_id: user.id,
            tier,
            type,
            content: finalContent,
            status: "pending"
          });
        error = result.error;
      }

      if (error) throw error;
      
      // Update local state to reflect submission
      // Triggers re-render via useEspressoSystem sync usually, but we can alert user
      // alert("Document submitted successfully! It is now under review.");
      
    } catch (e) {
      console.error("Submission failed", e);
      alert(t('submission_failed_alert'));
    }
  };

  const handlePermitsSave = async (data: any) => {
    setPermitsData(data);
    localStorage.setItem(`pp_espresso_permits_data_t${progress.currentTier}`, JSON.stringify(data));
    await submitDocument(progress.currentTier, "permits", data);
    setShowPermitsForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-permits`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
  };

  const handleActivationSave = async (data: any) => {
    setActivationData(data);
    localStorage.setItem(`pp_espresso_activation_data_t${progress.currentTier}`, JSON.stringify(data));
    await submitDocument(progress.currentTier, "hub_activation", data);
    setShowActivationForm(false);
    fetchSubmissionStatuses(progress.currentTier);
  };

  const handleCompetitionSave = async (data: any) => {
    setCompetitionData(data);
    localStorage.setItem(`pp_espresso_competition_data_t${progress.currentTier}`, JSON.stringify(data));
    await submitDocument(progress.currentTier, "competition", data);
    setShowCompetitionForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-competition`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
  };

  const handleAirportSave = async (data: any) => {
    setAirportData(data);
    localStorage.setItem(`pp_espresso_airport_data_t${progress.currentTier}`, JSON.stringify(data));
    await submitDocument(progress.currentTier, "airport", data);
    setShowAirportForm(false);
    setDocsState(s => ({ ...s, [`t${progress.currentTier}-specific`]: true }));
    fetchSubmissionStatuses(progress.currentTier);
  };
  
  const handleLotSave = async (data: any) => {
    setLotData(data);
    localStorage.setItem(`pp_espresso_lot_data_t${progress.currentTier}`, JSON.stringify(data));
    await submitDocument(progress.currentTier, "lot_activation", data);
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
          title: `${t('fill_permits_task')} (Tier ${progress.currentTier})`,
          completed: !!docsState[`t${progress.currentTier}-permits`]
        },
        { 
          id: `daily-competition-t${progress.currentTier}`, 
          title: `${t('fill_competition_task')} (Tier ${progress.currentTier})`,
          completed: !!docsState[`t${progress.currentTier}-competition`]
        },
        { 
          id: `daily-activation-t${progress.currentTier}`, 
          title: `${t('fill_lot_activation_task')} (Tier ${progress.currentTier})`,
          completed: !!docsState[`t${progress.currentTier}-activation`]
        },
        { 
          id: `daily-specific-t${progress.currentTier}`, 
          title: `Fill ${progress.currentTier === 1 ? t('airport_analysis') : progress.currentTier === 6 ? t('hotel_analysis') : progress.currentTier === 7 ? t('whales_analysis') : t('area_analysis')} (Tier ${progress.currentTier})`,
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
    return <div className="p-8 text-center text-sm text-gray-500">{t('loading_mission_control')}</div>;
  }

  if (isAdmin) {
    return (
      <div className="w-full py-8 pb-32 overflow-x-hidden">
        <div className="w-full">
          <div className="flex items-center justify-start border-b border-gray-200 mb-8 pb-4 pl-1">
            <span className="text-sm font-bold tracking-tight text-black mr-4">{t('mission_control')}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{t('super_admin_view')}</span>
          </div>

          <div className="space-y-8">
            {/* Mission Status Overview */}
            <section className="text-left pl-1">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-left">{t('global_progress')}</h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm text-left table-auto">
                    <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold">
                      <tr>
                        <th className="px-1 py-3 font-bold text-gray-900 text-left pl-2">{t('user_id')}</th>
                        <th className="px-1 py-3 font-bold text-gray-900 text-left pl-2">Tier</th>
                        <th className="px-1 py-3 font-bold text-gray-900 text-left pl-2">{t('last_active')}</th>
                        <th className="px-1 py-3 font-bold text-gray-900 text-left pl-2">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allUserProgress.map((user) => (
                        <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-1 py-4 font-medium text-black truncate pl-2" title={user.user_id}>
                            {user.user_id.substring(0, 8)}...
                          </td>
                          <td className="px-1 py-4 pl-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-black text-white">
                              Tier {user.current_tier}
                            </span>
                          </td>
                          <td className="px-1 py-4 text-gray-500 pl-2 text-xs">
                            {new Date(user.updated_at).toLocaleDateString()}
                          </td>
                          <td className="px-1 py-4 pl-2">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium justify-center ${
                              user.current_tier >= 7 
                                ? "bg-green-100 text-green-800" 
                                : "bg-blue-50 text-blue-700"
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${user.current_tier >= 7 ? "bg-green-500" : "bg-blue-500"}`}></span>
                              {user.current_tier >= 7 ? t('completed') : t('active')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {allUserProgress.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            {t('no_users')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 text-left">
                {t('inbox_link_note').split(language === 'hr' ? 'Sandučiću' : 'Inbox')[0]}
                <a href="/inbox" className="text-black underline">{t('inbox')}</a>
                {t('inbox_link_note').split(language === 'hr' ? 'Sandučiću' : 'Inbox')[1]}
              </p>
            </section>
          </div>
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
            title={progress.currentTier === 6 ? `${t('hotel_analysis')} (Essay)` : `${t('whales_analysis')} (Essay)`}
            placeholder={progress.currentTier === 6 
              ? t('hotel_analysis_placeholder')
              : t('whales_analysis_placeholder')
            }
          />
        )}

        {/* 0. Documents */}
        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">{t('documents')}</h2>
          <div className="space-y-1">


            {/* Permits */}
            <div 
              onClick={() => handleFormClick("permits", setShowPermitsForm)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-permits`] ? "bg-gray-50/50" : ""
              } ${canOpenForm("permits") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-black">{t('permits_public')}</h3>
                  <div className="mt-1">
                    {getStatusBadge("permits", !!docsState[`t${progress.currentTier}-permits`])}
                  </div>
                </div>
              </div>

            </div>

            {/* Competition */}
            <div 
              onClick={() => handleFormClick("competition", setShowCompetitionForm)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-competition`] ? "bg-gray-50/50" : ""
              } ${canOpenForm("competition") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-black">{t('competition_analysis')}</h3>
                  <div className="mt-1">
                    {getStatusBadge("competition", !!docsState[`t${progress.currentTier}-competition`])}
                  </div>
                </div>
              </div>

            </div>

            {/* Lot Activation */}
            <div 
              onClick={() => handleFormClick("lot_activation", setShowLotForm)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between ${
                docsState[`t${progress.currentTier}-activation`] ? "bg-gray-50/50" : ""
              } ${canOpenForm("lot_activation") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xs font-bold text-black">{t('lot_activation_list')}</h3>
                  <div className="mt-1">
                    {getStatusBadge("lot_activation", !!docsState[`t${progress.currentTier}-activation`])}
                  </div>
                </div>
              </div>

            </div>

            {/* Special Forms Logic */}
            {progress.currentTier === 1 && (
              <div 
                onClick={() => handleFormClick("airport", setShowAirportForm)}
                className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between ${docsState[`t${progress.currentTier}-specific`] ? "bg-gray-50/50" : ""} ${canOpenForm("airport") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
              >
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-black">{t('airport_analysis')}</h3>
                    <div className="mt-1">
                      {getStatusBadge("airport", !!docsState[`t${progress.currentTier}-specific`])}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(progress.currentTier === 6 || progress.currentTier === 7) && (
              <div 
                onClick={() => handleFormClick("stakeholder", setShowStakeholderModal)}
                className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between ${docsState[`t${progress.currentTier}-specific`] ? "bg-gray-50/50" : ""} ${canOpenForm("stakeholder") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
              >
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-black">{t('stakeholder_analysis')}</h3>
                    <div className="mt-1">
                      {getStatusBadge("stakeholder", !!docsState[`t${progress.currentTier}-specific`])}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HUB Activation Form (Moved to end) */}
            <div 
              onClick={() => handleFormClick("hub_activation", setShowActivationForm)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between ${
                activationData ? "bg-gray-50/50" : ""
              } ${canOpenForm("hub_activation") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
            >
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-tight">{t('hub_activation_form')}</h3>
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
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 pl-2">{t('daily_tasks')}</h2>
          
          <div className="space-y-1">
            <div 
              onClick={() => handleFormClick("permits", setShowPermitsForm)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between gap-2 ${canOpenForm("permits") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-permits`] ? "text-gray-400 line-through" : "text-black"}`}>
                  {t('fill_permits_task')}
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
              onClick={() => handleFormClick("competition", setShowCompetitionForm)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between gap-2 ${canOpenForm("competition") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-competition`] ? "text-gray-400 line-through" : "text-black"}`}>
                  {t('fill_competition_task')}
                </h3>
                <p className="text-[10px] text-gray-500">{t('tier_label')} {progress.currentTier}</p>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-competition`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-competition`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>

            <div 
              onClick={() => handleFormClick("lot_activation", setShowLotForm)}
              className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between gap-2 ${canOpenForm("lot_activation") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-activation`] ? "text-gray-400 line-through" : "text-black"}`}>
                  {t('fill_lot_activation_task')}
                </h3>
                <p className="text-[10px] text-gray-500">{t('tier_label')} {progress.currentTier}</p>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                docsState[`t${progress.currentTier}-activation`] ? "bg-black border-black" : "border-gray-300 bg-white"
              }`}>
                {docsState[`t${progress.currentTier}-activation`] && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>

            {progress.currentTier === 1 && (
              <div 
                onClick={() => handleFormClick("airport", setShowAirportForm)}
                className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between gap-3 ${canOpenForm("airport") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
              >
                <div className="flex-1">
                  <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-specific`] ? "text-gray-400 line-through" : "text-black"}`}>
                    {t('fill_airport_analysis_task')}
                  </h3>
                  <p className="text-[10px] text-gray-500">{t('tier_label')} {progress.currentTier}</p>
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
                onClick={() => handleFormClick("stakeholder", setShowStakeholderModal)}
                className={`group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex items-center justify-between gap-3 ${canOpenForm("stakeholder") ? "cursor-pointer" : "cursor-not-allowed opacity-75"}`}
              >
                <div className="flex-1">
                  <h3 className={`text-xs font-bold ${docsState[`t${progress.currentTier}-specific`] ? "text-gray-400 line-through" : "text-black"}`}>
                  {t('fill_analysis').replace('{type}', progress.currentTier === 6 ? t('hotel') : t('whales_corporation'))}
                </h3>
                <p className="text-[10px] text-gray-500">{t('tier_label')} {progress.currentTier}</p>
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
                {t('map_relevant_lots')}
              </h3>
              <p className="text-[10px] text-gray-500">{t('tier_label')} {progress.currentTier}</p>
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
                {t('activate_1_lot_goal')}
              </h3>
              <p className="text-[10px] text-gray-500">{t('tier_label')} {progress.currentTier}</p>
            </div>
            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
              activateLotCompleted ? "bg-black border-black" : "border-gray-300 bg-white"
            }`}>
              {activateLotCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 pl-2">Brain plan</h2>
        <div className="border border-gray-100 rounded-lg px-2 py-3 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-black">Dnevni plan leadova</p>
              {brainPlan && (
                <p className="text-[10px] text-gray-500">
                  {brainPlan.date} • zona {brainPlan.zone.lat.toFixed(3)}, {brainPlan.zone.lon.toFixed(3)}
                </p>
              )}
            </div>
            <button
              onClick={() => runBrainPlan(false)}
              disabled={brainLoading}
              className="text-[10px] px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              {brainLoading ? "Generiram..." : "Regeneriraj"}
            </button>
          </div>
          {brainError && (
            <p className="text-[10px] text-red-500 mb-1">
              {brainError}
            </p>
          )}
          {brainPlan ? (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {brainPlan.tasks.slice(0, 15).map((task, idx) => {
                const lead = brainPlan.leads.find((l) => l.id === task.leadId);
                const title = buildBrainTaskTitle(task, lead);
                return (
                  <div key={`${task.type}-${task.leadId}-${idx}`} className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full bg-black mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-black">
                        {title}
                      </span>
                      {lead && (
                        <span className="text-[10px] text-gray-500">
                          {lead.name} • {lead.type}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {brainPlan.tasks.length > 15 && (
                <p className="text-[10px] text-gray-400">
                  + još zadataka u taskbaru
                </p>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-gray-500">
              Plan se učitava iz Brain sloja...
            </p>
          )}
        </div>
      </section>

      {/* Mission Section */}
      <section>
        <div className="flex items-center border-b border-gray-100 mb-4 pb-2 pl-2 mt-8">
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
                onClick={() => setSmartProgram(!smartProgram)}
              />
              <MissionItem 
                label={t('airport_hub_contract')} 
                value={airportHub ? t('yes') : t('no')} 
                onClick={() => setAirportHub(!airportHub)}
              />
              <MissionItem 
                label={t('city_hub_contract')} 
                value={cityHub ? t('yes') : t('no')} 
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
