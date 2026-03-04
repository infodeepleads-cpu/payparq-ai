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
    if (task.type === "activate_lot") {
      return `Aktiviraj 1 lot: ${name}`;
    }
    if (task.type === "map_lot") {
      if (type === "hotel") return `Mapiraj parking potencijal za hotel ${name}`;
      if (type === "apartment" || type === "villa") return `Mapiraj parking potencijal za objekt ${name}`;
      if (type === "restaurant" || type === "cafe" || type === "bar" || type === "bakery") {
        return `Mapiraj parking potencijal za ${name}`;
      }
      return `Mapiraj relevantni lot za ${name}`;
    }
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
      const nextPlanTaskIds = new Set(plan.tasks.map((task) => `brain-${task.type}-${task.leadId}`));
      const next = tasks.filter((task: any) => {
        if (typeof task?.id !== "string") return true;
        if (!task.id.startsWith("brain-")) return true;
        return nextPlanTaskIds.has(task.id);
      });
      if (next.length !== tasks.length) {
        updated = true;
      }

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
            createdAt: Date.now(),
            planDate: plan.date
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

  const TASKS_KEY = "pp_tasks";
  const CRM_KEY = "pp_crm_contacts";
  const [taskCompletionMap, setTaskCompletionMap] = useState<Record<string, boolean>>({});
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [selectedFeedbackModel, setSelectedFeedbackModel] = useState("llama-3.3-70b-versatile");
  const [feedbackAdvice, setFeedbackAdvice] = useState("");
  const [crmUpdateFeed, setCrmUpdateFeed] = useState<string[]>([]);

  const refreshTaskCompletion = () => {
    try {
      const rawTasks = localStorage.getItem(TASKS_KEY);
      const tasks = rawTasks ? JSON.parse(rawTasks) : [];
      const map: Record<string, boolean> = {};
      tasks.forEach((task: any) => {
        if (typeof task?.id === "string") {
          map[task.id] = !!task.completed;
        }
      });
      setTaskCompletionMap(map);
    } catch {
      setTaskCompletionMap({});
    }
  };

  useEffect(() => {
    refreshTaskCompletion();
    const handler = () => refreshTaskCompletion();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleTaskCompletion = (id: string, title: string) => {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      const tasks = raw ? JSON.parse(raw) : [];
      const idx = tasks.findIndex((task: any) => task.id === id);
      if (idx >= 0) {
        const completed = !tasks[idx].completed;
        tasks[idx] = {
          ...tasks[idx],
          completed,
          completedAt: completed ? Date.now() : undefined,
        };
      } else {
        tasks.push({
          id,
          title,
          completed: true,
          confirmed: false,
          createdAt: Date.now(),
          completedAt: Date.now(),
        });
      }
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      window.dispatchEvent(new Event("storage"));
      refreshTaskCompletion();
    } catch {}
  };

  const readCRM = async () => {
    const user = await getCurrentUser();
    if (!user) {
      try {
        const raw = localStorage.getItem(CRM_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    const supabase = getSupabase();
    const { data } = await supabase.from("crm_contacts").select("*").order("created_at", { ascending: false });
    return data || [];
  };

  const addCRMContact = async (contact: any) => {
    const user = await getCurrentUser();
    if (!user) {
      const current = await readCRM();
      const next = [{ ...contact, id: String(Date.now()), created_at: new Date().toISOString() }, ...current];
      localStorage.setItem(CRM_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("crm_storage"));
      return;
    }
    const supabase = getSupabase();
    await supabase.from("crm_contacts").insert({
      tier: contact.tier,
      decision_maker: contact.decisionMaker,
      location: contact.location,
      estimated_capacity: contact.estimatedCapacity,
      status: contact.status,
      next_step: contact.nextStep,
      notes: contact.notes
    });
    window.dispatchEvent(new Event("crm_storage"));
    localStorage.setItem("crm_update_signal", Date.now().toString());
  };

  const updateCRMContact = async (contact: any) => {
    const user = await getCurrentUser();
    if (!user) {
      const contacts = await readCRM();
      const idx = contacts.findIndex((c: any) => c.decisionMaker?.toLowerCase() === String(contact.decisionMaker || "").toLowerCase());
      if (idx >= 0) {
        contacts[idx] = { ...contacts[idx], ...contact };
        localStorage.setItem(CRM_KEY, JSON.stringify(contacts));
        window.dispatchEvent(new Event("crm_storage"));
      }
      return;
    }
    const supabase = getSupabase();
    const { data: contacts } = await supabase.from("crm_contacts").select("*");
    if (!contacts) return;
    const match = contacts.find((c: any) => c.decision_maker?.toLowerCase() === String(contact.decisionMaker || "").toLowerCase());
    if (!match) return;
    await supabase.from("crm_contacts").update({
      tier: contact.tier,
      decision_maker: contact.decisionMaker,
      location: contact.location,
      estimated_capacity: contact.estimatedCapacity,
      status: contact.status,
      next_step: contact.nextStep,
      notes: contact.notes
    }).eq("id", match.id);
    window.dispatchEvent(new Event("crm_storage"));
    localStorage.setItem("crm_update_signal", Date.now().toString());
  };

  const normalizeAiJson = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.startsWith("```")) {
      return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    }
    return trimmed;
  };

  const submitBrainFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackMessage("");
    try {
      const rawTasks = localStorage.getItem(TASKS_KEY);
      const tasks = rawTasks ? JSON.parse(rawTasks) : [];
      const crmContacts = await readCRM();
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: `Brain feedback. Update CRM when relevant and provide immediate next action: ${feedbackText.trim()}`,
          model: selectedFeedbackModel,
          tasks,
          crmContacts
        }),
      });
      if (!res.ok) {
        throw new Error("Feedback request failed");
      }
      const data = await res.json();
      const parsed = typeof data === "string" ? JSON.parse(normalizeAiJson(data)) : data;
      let crmUpdateMessage = "";
      if (parsed.action === "add_task" && parsed.taskTitle) {
        toggleTaskCompletion(`manual-${Date.now()}`, parsed.taskTitle);
      } else if (parsed.action === "complete_task" && parsed.taskTitle) {
        const raw = localStorage.getItem(TASKS_KEY);
        const next = raw ? JSON.parse(raw) : [];
        const idx = next.findIndex((task: any) => String(task.title || "").toLowerCase() === String(parsed.taskTitle).toLowerCase());
        if (idx >= 0) {
          next[idx] = { ...next[idx], completed: true, completedAt: Date.now() };
          localStorage.setItem(TASKS_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("storage"));
          refreshTaskCompletion();
        }
      } else if (parsed.action === "delete_task" && parsed.taskTitle) {
        const raw = localStorage.getItem(TASKS_KEY);
        const next = raw ? JSON.parse(raw) : [];
        const filtered = next.filter((task: any) => String(task.title || "").toLowerCase() !== String(parsed.taskTitle).toLowerCase());
        localStorage.setItem(TASKS_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event("storage"));
        refreshTaskCompletion();
      } else if (parsed.action === "add_crm_contact" && parsed.crmContact) {
        await addCRMContact(parsed.crmContact);
        crmUpdateMessage = `Added CRM contact: ${parsed.crmContact.decisionMaker || parsed.crmContact.name || "Contact"}`;
      } else if (parsed.action === "update_crm_contact" && parsed.crmContact) {
        await updateCRMContact(parsed.crmContact);
        crmUpdateMessage = `Updated CRM contact: ${parsed.crmContact.decisionMaker || parsed.crmContact.name || "Contact"}`;
      } else {
        crmUpdateMessage = "No CRM changes from this feedback.";
      }
      if (crmUpdateMessage) {
        setCrmUpdateFeed((prev) => [crmUpdateMessage, ...prev].slice(0, 6));
      }
      setFeedbackAdvice(parsed.nextStep || "Keep moving on highest-impact outreach and refresh CRM after each call.");
      setFeedbackMessage("Feedback processed.");
      setFeedbackText("");
    } catch (e) {
      console.error("Feedback submission failed", e);
      setFeedbackError("Failed to process feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

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
      <div className="flex items-center border-b border-gray-100 mb-6 pb-2 pl-2">
        <span className="text-xs font-semibold tracking-tight text-black mr-4">BRAIN</span>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-2 pl-2">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('daily_tasks')}</h2>
            <button
              onClick={() => runBrainPlan(false)}
              disabled={brainLoading}
              className="text-[10px] px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              {brainLoading ? "Generating..." : "Regenerate"}
            </button>
          </div>
          <div className="space-y-1">
            {brainError && (
              <p className="text-[10px] text-red-500 px-2 py-1">{brainError}</p>
            )}
            {brainPlan?.tasks?.map((task, idx) => {
              const lead = brainPlan.leads.find((l) => l.id === task.leadId);
              const title = buildBrainTaskTitle(task, lead);
              const taskId = `brain-${task.type}-${task.leadId}-${idx}`;
              const completed = !!taskCompletionMap[taskId];
              return (
                <div
                  key={taskId}
                  onClick={() => toggleTaskCompletion(taskId, title)}
                  className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <h3 className={`text-xs font-bold ${completed ? "text-gray-400 line-through" : "text-black"}`}>{title}</h3>
                    {lead && <p className="text-[10px] text-gray-500">{lead.name} • {lead.type}</p>}
                  </div>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${completed ? "bg-black border-black" : "border-gray-300 bg-white"}`}>
                    {completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              );
            })}
            <div
              onClick={() => setMapLotsCompleted(!mapLotsCompleted)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${mapLotsCompleted ? "text-gray-400 line-through" : "text-black"}`}>{t('map_relevant_lots')}</h3>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${mapLotsCompleted ? "bg-black border-black" : "border-gray-300 bg-white"}`}>
                {mapLotsCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
            <div
              onClick={() => setActivateLotCompleted(!activateLotCompleted)}
              className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2 rounded-lg flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <h3 className={`text-xs font-bold ${activateLotCompleted ? "text-gray-400 line-through" : "text-black"}`}>{t('activate_1_lot_goal')}</h3>
              </div>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${activateLotCompleted ? "bg-black border-black" : "border-gray-300 bg-white"}`}>
                {activateLotCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Rationale</h2>
          <div className="border border-gray-100 rounded-lg px-3 py-3 bg-gray-50/50">
            {brainPlan ? (
              <p className="text-xs text-black leading-relaxed">
                Brain selected {brainPlan.tasks.length} tasks using nearby lead density around {brainPlan.zone.lat.toFixed(3)}, {brainPlan.zone.lon.toFixed(3)} and today&apos;s outreach quotas ({brainPlan.quotas.calls} calls, {brainPlan.quotas.emails} emails, {brainPlan.quotas.messages} messages, {brainPlan.quotas.walk_in_zones} walk-in zones, {brainPlan.quotas.ads} ads).
              </p>
            ) : (
              <p className="text-xs text-gray-500">Brain is generating a daily rationale.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Feedback</h2>
          <div className="border border-gray-100 rounded-lg px-3 py-3 bg-white space-y-3">
            <select
              value={selectedFeedbackModel}
              onChange={(e) => setSelectedFeedbackModel(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded px-2 py-2 bg-white"
            >
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
              <option value="meta-llama/llama-4-maverick-17b-128e-instruct">Llama 4 Maverick 17B (Groq)</option>
              <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B (Groq)</option>
              <option value="llama-3.1-8b-instant">Llama 3.1 8B (Groq)</option>
            </select>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full min-h-24 text-xs border border-gray-200 rounded px-2 py-2 resize-y"
              placeholder="Describe what should change in today’s plan."
            />
            <div className="flex items-center justify-between">
              <button
                onClick={submitBrainFeedback}
                disabled={feedbackLoading || !feedbackText.trim()}
                className="text-[10px] px-3 py-1.5 rounded border border-gray-300 bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {feedbackLoading ? "Processing..." : "Send Feedback"}
              </button>
              {feedbackMessage && <span className="text-[10px] text-green-600">{feedbackMessage}</span>}
              {feedbackError && <span className="text-[10px] text-red-600">{feedbackError}</span>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">CRM Updates & Advice</h2>
          <div className="border border-gray-100 rounded-lg px-3 py-3 bg-white space-y-3">
            <div className="border border-gray-100 rounded px-3 py-2 bg-gray-50/60">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Immediate Advice</p>
              <p className="text-xs text-black leading-relaxed">{feedbackAdvice || "Submit feedback to receive immediate next-course guidance."}</p>
            </div>
            <div className="border border-gray-100 rounded px-3 py-2 bg-gray-50/60">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">CRM Update Feed</p>
              <div className="space-y-1">
                {crmUpdateFeed.length > 0 ? (
                  crmUpdateFeed.map((entry, idx) => (
                    <p key={`${entry}-${idx}`} className="text-xs text-black">{entry}</p>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No CRM update events yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
