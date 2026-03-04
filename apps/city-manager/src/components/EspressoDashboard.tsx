"use client";

import { useState, useEffect, useMemo } from "react";
import { useEspressoSystem } from "../hooks/useEspressoSystem";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSupabase, getCurrentUser, isSuperAdmin, pullMirroredTasksToLocal, queueTasksMirror } from "../lib/supabase";
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
  title?: string;
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
  rationale?: string;
};

async function loadContacts(): Promise<Contact[]> {
  try {
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
  // "Contract Status (Contractual Obligation)" is the activated status
  const lotsActivated = contacts.filter((c) => c.decisionStatus === "Contract Status (Contractual Obligation)").length;
  const currentValue = contacts
    .filter((c) => c.decisionStatus === "Contract Status (Contractual Obligation)")
    .reduce((acc, c) => acc + (c.estimatedCapacity || 0) * 100, 0);

  const buildBrainTaskTitle = (task: BrainTask, lead?: BrainLead) => {
    if (typeof task.title === "string" && task.title.trim()) {
      return task.title.trim();
    }
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

  const tierForLeadType = (type: string) => {
    const normalized = String(type || "").toLowerCase();
    if (normalized === "hotel") return 6;
    if (normalized === "apartment" || normalized === "villa") return 4;
    if (normalized === "restaurant" || normalized === "cafe" || normalized === "bar" || normalized === "bakery") return 3;
    if (normalized === "parking") return 5;
    return 2;
  };

  const buildBrainTaskId = (task: BrainTask, index: number, date?: string) => {
    return `brain-${date || "undated"}-${index}-${task.type}-${task.leadId}`;
  };

  const buildBrainRationale = (plan: BrainPlan) => {
    if (typeof plan.rationale === "string" && plan.rationale.trim()) {
      return plan.rationale.trim();
    }
    return `Brain selected ${plan.tasks.length} tasks using nearby lead density around ${plan.zone.lat.toFixed(3)}, ${plan.zone.lon.toFixed(3)} and today's outreach quotas (${plan.quotas.calls} calls, ${plan.quotas.emails} emails, ${plan.quotas.messages} messages, ${plan.quotas.walk_in_zones} walk-in zones, ${plan.quotas.ads} ads).`;
  };

  const persistBrainPlan = (plan: BrainPlan) => {
    const normalized = { ...plan, rationale: buildBrainRationale(plan) };
    setBrainPlan(normalized);
    localStorage.setItem("pp_brain_last_date", normalized.date || new Date().toISOString().slice(0, 10));
    localStorage.setItem("pp_brain_plan", JSON.stringify(normalized));
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
      const nextPlanTaskIds = new Set(plan.tasks.map((task, index) => buildBrainTaskId(task, index, plan.date)));
      const next = tasks.filter((task: any) => {
        if (typeof task?.id !== "string") return true;
        if (!task.id.startsWith("brain-")) return true;
        return nextPlanTaskIds.has(task.id);
      });
      if (next.length !== tasks.length) {
        updated = true;
      }

      plan.tasks.forEach((task, index) => {
        const id = buildBrainTaskId(task, index, plan.date);
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
        queueTasksMirror(next);
      }
    } catch (e) {
      console.error("Failed to sync brain tasks", e);
    }
  };

  const syncBrainLeadsToCRM = async (plan: BrainPlan) => {
    const date = plan.date || new Date().toISOString().slice(0, 10);
    const leadsById = new Map((plan.leads || []).map((lead) => [lead.id, lead]));
    const signatureCounters = new Map<string, number>();
    const taskEntries = (plan.tasks || []).map((task, index) => {
      const lead = leadsById.get(task.leadId);
      const title = buildBrainTaskTitle(task, lead);
      const signature = `${task.type}|${task.leadId}|${title}`;
      const count = (signatureCounters.get(signature) || 0) + 1;
      signatureCounters.set(signature, count);
      return {
        index,
        task,
        lead,
        title,
        marker: `${date}|${signature}|${count}`,
      };
    });
    if (taskEntries.length === 0) return;
    const user = await getCurrentUser();
    const userKey = user?.id || "guest";
    const markerKey = `pp_brain_crm_sync_${userKey}_${date}`;
    const markerValue = taskEntries.map((entry) => entry.marker).join("|");
    if (localStorage.getItem(markerKey) === markerValue) {
      await loadContacts().then(setContacts);
      return;
    }

    if (!user) {
      const raw = localStorage.getItem(CRM_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const existingMarkers = new Set<string>();
      existing.forEach((contact: any) => {
        const text = String(contact?.notes || "");
        const matches = text.match(/\[BRAIN_TASK:([^\]]+)\]/g) || [];
        matches.forEach((m: string) => existingMarkers.add(m.replace("[BRAIN_TASK:", "").replace("]", "")));
      });
      const toInsert = taskEntries
        .filter((entry) => !existingMarkers.has(entry.marker))
        .map((entry) => ({
          id: `brain-${entry.task.leadId}-${entry.index}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          tier: tierForLeadType(entry.lead?.type || "custom"),
          decisionMaker: entry.lead?.name || entry.title,
          city: entry.lead
            ? `${String(entry.lead.type || "lead").toUpperCase()} • (${entry.lead.lat.toFixed(3)}, ${entry.lead.lon.toFixed(3)})`
            : "CUSTOM • Feedback task",
          estimatedCapacity: Math.max(1, Math.round((entry.lead?.score || 1) * 5)),
          decisionStatus: `${entry.index + 1}. ${date}`,
          notes: `[BRAIN_TASK:${entry.marker}] [BRAIN_LEAD:${entry.task.leadId}] Source:${entry.lead?.source || "feedback"} Score:${entry.lead?.score || 1} Date:${date} Title:${entry.title}`,
          created_at: new Date().toISOString(),
        }));
      if (toInsert.length > 0) {
        localStorage.setItem(CRM_KEY, JSON.stringify([...toInsert, ...existing]));
        window.dispatchEvent(new Event("crm_storage"));
      }
      localStorage.setItem(markerKey, markerValue);
      await loadContacts().then(setContacts);
      return;
    }

    const supabase = getSupabase();
    const { data: existingRows } = await supabase
      .from("crm_contacts")
      .select("id,notes")
      .order("created_at", { ascending: false })
      .limit(5000);
    const existingMarkers = new Set<string>();
    (existingRows || []).forEach((row: any) => {
      const text = String(row?.notes || "");
      const matches = text.match(/\[BRAIN_TASK:([^\]]+)\]/g) || [];
      matches.forEach((m: string) => existingMarkers.add(m.replace("[BRAIN_TASK:", "").replace("]", "")));
    });
    const payload = taskEntries
      .filter((entry) => !existingMarkers.has(entry.marker))
      .map((entry) => ({
        user_id: user.id,
        tier: tierForLeadType(entry.lead?.type || "custom"),
        decision_maker: entry.lead?.name || entry.title,
        location: entry.lead
          ? `${String(entry.lead.type || "lead").toUpperCase()} • (${entry.lead.lat.toFixed(3)}, ${entry.lead.lon.toFixed(3)})`
          : "CUSTOM • Feedback task",
        estimated_capacity: Math.max(1, Math.round((entry.lead?.score || 1) * 5)),
        status: `${entry.index + 1}. ${date}`,
        next_step: `Contact from Brain daily task list (${date})`,
        notes: `[BRAIN_TASK:${entry.marker}] [BRAIN_LEAD:${entry.task.leadId}] Source:${entry.lead?.source || "feedback"} Score:${entry.lead?.score || 1} Date:${date} Title:${entry.title}`,
      }));
    if (payload.length > 0) {
      const { error } = await supabase.from("crm_contacts").insert(payload);
      if (error) {
        throw error;
      }
      window.dispatchEvent(new Event("crm_storage"));
      localStorage.setItem("crm_update_signal", Date.now().toString());
    }
    localStorage.setItem(markerKey, markerValue);
    await loadContacts().then(setContacts);
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
      persistBrainPlan(json);
      syncBrainTasksToLocal(json);
      await syncBrainLeadsToCRM(json);
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
          setBrainPlan({ ...parsed, rationale: buildBrainRationale(parsed) });
          syncBrainTasksToLocal(parsed);
          void syncBrainLeadsToCRM(parsed);
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

  const sortedContactsByTier = useMemo(() => {
    const grouped = contacts.reduce((acc: Record<number, Contact[]>, contact) => {
      const tier = Number(contact.tier) || 0;
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(contact);
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([tier, list]) => ({
        tier: Number(tier),
        list: [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      }))
      .sort((a, b) => b.tier - a.tier);
  }, [contacts]);

  const readLocalTasks = () => {
    const rawTasks = localStorage.getItem(TASKS_KEY);
    return rawTasks ? JSON.parse(rawTasks) : [];
  };

  const writeLocalTasks = (tasks: any[]) => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event("storage"));
    queueTasksMirror(tasks);
  };

  const refreshTaskCompletion = () => {
    try {
      const tasks = readLocalTasks();
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
    void pullMirroredTasksToLocal().then(() => refreshTaskCompletion());
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleTaskCompletion = (id: string, title: string) => {
    try {
      const tasks = readLocalTasks();
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
      writeLocalTasks(tasks);
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
      user_id: user.id,
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

  const extractRationaleOverride = (text: string) => {
    const match = text.match(/rationale\s*[: -]\s*([\s\S]+)/i);
    if (!match) return "";
    return match[1].trim();
  };

  const parseManualOperations = (text: string) => {
    const ops: any[] = [];
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const add = line.match(/^(add|create)\s+task[:\s-]+(.+)$/i);
        if (add) {
          ops.push({ action: "add_task", taskTitle: add[2].trim() });
          return;
        }
        const del = line.match(/^(delete|remove)\s+task[:\s-]+(.+)$/i);
        if (del) {
          ops.push({ action: "delete_task", taskTitle: del[2].trim() });
          return;
        }
        const done = line.match(/^(complete|finish)\s+task[:\s-]+(.+)$/i);
        if (done) {
          ops.push({ action: "complete_task", taskTitle: done[2].trim() });
          return;
        }
        const revert = line.match(/^(revert|undo)\s+task[:\s-]+(.+)$/i);
        if (revert) {
          ops.push({ action: "revert_task", taskTitle: revert[2].trim() });
          return;
        }
        const update = line.match(/^(update|edit)\s+task[:\s-]+(.+?)\s*(?:->|=>)\s*(.+)$/i);
        if (update) {
          ops.push({ action: "update_task", taskTitle: update[2].trim(), newTaskTitle: update[3].trim() });
        }
      });
    return ops;
  };

  const submitBrainFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackMessage("");
    try {
      let workingTasks = readLocalTasks();
      const crmContacts = await readCRM();
      const updateFeed: string[] = [];
      let nextPlan: BrainPlan | null = brainPlan
        ? { ...brainPlan, tasks: [...brainPlan.tasks], leads: [...brainPlan.leads], rationale: buildBrainRationale(brainPlan) }
        : null;

      const applyTaskOpToPlan = (op: any) => {
        if (!nextPlan || !op?.taskTitle) return;
        const title = String(op.taskTitle).trim();
        if (!title) return;
        if (op.action === "add_task") {
          const leadId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          nextPlan = {
            ...nextPlan,
            leads: [
              ...nextPlan.leads,
              { id: leadId, name: "Feedback task", type: "custom", lat: nextPlan.zone.lat, lon: nextPlan.zone.lon, score: 1, source: "feedback" },
            ],
            tasks: [...nextPlan.tasks, { type: "custom_feedback", leadId, title }],
          };
          return;
        }
        if (op.action === "delete_task") {
          nextPlan = {
            ...nextPlan,
            tasks: nextPlan.tasks.filter((task) => buildBrainTaskTitle(task, nextPlan!.leads.find((lead) => lead.id === task.leadId)).toLowerCase() !== title.toLowerCase()),
          };
          return;
        }
        if (op.action === "update_task" && op.newTaskTitle) {
          const nextTitle = String(op.newTaskTitle).trim();
          if (!nextTitle) return;
          nextPlan = {
            ...nextPlan,
            tasks: nextPlan.tasks.map((task) => {
              const currentTitle = buildBrainTaskTitle(task, nextPlan!.leads.find((lead) => lead.id === task.leadId));
              if (currentTitle.toLowerCase() !== title.toLowerCase()) return task;
              return { ...task, title: nextTitle };
            }),
          };
        }
      };

      const applyLocalTaskOp = (op: any) => {
        if (!op?.taskTitle) return;
        const title = String(op.taskTitle).trim();
        if (!title) return;
        if (op.action === "add_task") {
          workingTasks.push({
            id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title,
            completed: false,
            confirmed: false,
            createdAt: Date.now(),
          });
          writeLocalTasks(workingTasks);
          updateFeed.push(`Task added: ${title}`);
          applyTaskOpToPlan(op);
          return;
        }
        if (op.action === "complete_task") {
          const idx = workingTasks.findIndex((task: any) => String(task.title || "").toLowerCase() === title.toLowerCase());
          if (idx >= 0) {
            workingTasks[idx] = { ...workingTasks[idx], completed: true, completedAt: Date.now() };
          } else {
            workingTasks.push({
              id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              title,
              completed: true,
              confirmed: false,
              createdAt: Date.now(),
              completedAt: Date.now(),
            });
          }
          writeLocalTasks(workingTasks);
          updateFeed.push(`Task completed: ${title}`);
          return;
        }
        if (op.action === "revert_task") {
          const idx = workingTasks.findIndex((task: any) => String(task.title || "").toLowerCase() === title.toLowerCase());
          if (idx >= 0) {
            workingTasks[idx] = { ...workingTasks[idx], completed: false, completedAt: undefined };
            writeLocalTasks(workingTasks);
            updateFeed.push(`Task reverted: ${title}`);
          }
          return;
        }
        if (op.action === "delete_task") {
          workingTasks = workingTasks.filter((task: any) => String(task.title || "").toLowerCase() !== title.toLowerCase());
          writeLocalTasks(workingTasks);
          updateFeed.push(`Task removed: ${title}`);
          applyTaskOpToPlan(op);
          return;
        }
        if (op.action === "update_task" && op.newTaskTitle) {
          const nextTitle = String(op.newTaskTitle).trim();
          if (!nextTitle) return;
          const idx = workingTasks.findIndex((task: any) => String(task.title || "").toLowerCase() === title.toLowerCase());
          if (idx >= 0) {
            workingTasks[idx] = { ...workingTasks[idx], title: nextTitle };
            writeLocalTasks(workingTasks);
            updateFeed.push(`Task updated: ${title} → ${nextTitle}`);
            applyTaskOpToPlan(op);
          }
        }
      };

      const manualRationale = extractRationaleOverride(feedbackText);
      if (manualRationale && nextPlan) {
        nextPlan = { ...nextPlan, rationale: manualRationale };
        updateFeed.push("Rationale updated from feedback.");
      }
      parseManualOperations(feedbackText).forEach((op) => applyLocalTaskOp(op));
      refreshTaskCompletion();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          note: `Brain feedback. Update CRM when relevant and provide immediate next action: ${feedbackText.trim()}`,
          model: selectedFeedbackModel,
          tasks: workingTasks,
          crmContacts
        }),
      }).finally(() => clearTimeout(timeout));
      if (!res.ok) {
        throw new Error("Feedback request failed");
      }
      const data = await res.json();
      const parsed = typeof data === "string" ? JSON.parse(normalizeAiJson(data)) : data;
      const operations: any[] = [];
      if (parsed?.action) operations.push(parsed);
      if (Array.isArray(parsed?.actions)) operations.push(...parsed.actions);
      if (Array.isArray(parsed?.taskUpdates)) operations.push(...parsed.taskUpdates);
      if (Array.isArray(parsed?.crmUpdates)) operations.push(...parsed.crmUpdates);
      for (const op of operations) {
        if (op?.action === "add_crm_contact" && op?.crmContact) {
          await addCRMContact(op.crmContact);
          updateFeed.push(`Added CRM contact: ${op.crmContact.decisionMaker || op.crmContact.name || "Contact"}`);
          continue;
        }
        if (op?.action === "update_crm_contact" && op?.crmContact) {
          await updateCRMContact(op.crmContact);
          updateFeed.push(`Updated CRM contact: ${op.crmContact.decisionMaker || op.crmContact.name || "Contact"}`);
          continue;
        }
        applyLocalTaskOp(op);
      }
      if (parsed?.rationale && nextPlan) {
        nextPlan = { ...nextPlan, rationale: String(parsed.rationale) };
        updateFeed.push("Rationale updated by Brain feedback.");
      }

      if (updateFeed.length === 0) {
        updateFeed.push("No direct task or CRM changes from this feedback.");
      }
      setCrmUpdateFeed((prev) => [...updateFeed, ...prev].slice(0, 10));

      const immediateAdvice = parsed.nextStep || "Keep moving on highest-impact outreach and refresh CRM after each call.";
      setFeedbackAdvice(immediateAdvice);
      window.dispatchEvent(new CustomEvent("brain_feedback_processed", { detail: { advice: immediateAdvice, updates: updateFeed } }));
      refreshTaskCompletion();
      if (nextPlan) {
        persistBrainPlan(nextPlan);
        syncBrainTasksToLocal(nextPlan);
        await syncBrainLeadsToCRM(nextPlan);
      }
      setFeedbackMessage("Feedback processed.");
      setFeedbackText("");
    } catch (e) {
      console.error("Feedback submission failed", e);
      setFeedbackError("Network delay detected. Local feedback updates were applied immediately.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const editBrainTask = async (taskIndex: number) => {
    if (!brainPlan) return;
    const task = brainPlan.tasks[taskIndex];
    if (!task) return;
    const lead = brainPlan.leads.find((l) => l.id === task.leadId);
    const currentTitle = buildBrainTaskTitle(task, lead);
    const nextTitle = window.prompt("Edit daily task", currentTitle);
    if (!nextTitle || !nextTitle.trim() || nextTitle.trim() === currentTitle) return;
    const nextPlan: BrainPlan = {
      ...brainPlan,
      tasks: brainPlan.tasks.map((item, idx) => (idx === taskIndex ? { ...item, title: nextTitle.trim() } : item)),
    };
    persistBrainPlan(nextPlan);
    syncBrainTasksToLocal(nextPlan);
    await syncBrainLeadsToCRM(nextPlan);
    setCrmUpdateFeed((prev) => [`Task edited: ${currentTitle} → ${nextTitle.trim()}`, ...prev].slice(0, 10));
    refreshTaskCompletion();
  };

  const deleteBrainTask = async (taskIndex: number) => {
    if (!brainPlan) return;
    const task = brainPlan.tasks[taskIndex];
    if (!task) return;
    const lead = brainPlan.leads.find((l) => l.id === task.leadId);
    const title = buildBrainTaskTitle(task, lead);
    if (!window.confirm(`Delete task "${title}"?`)) return;
    const nextPlan: BrainPlan = {
      ...brainPlan,
      tasks: brainPlan.tasks.filter((_, idx) => idx !== taskIndex),
    };
    persistBrainPlan(nextPlan);
    syncBrainTasksToLocal(nextPlan);
    await syncBrainLeadsToCRM(nextPlan);
    setCrmUpdateFeed((prev) => [`Task deleted: ${title}`, ...prev].slice(0, 10));
    refreshTaskCompletion();
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
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {t('daily_tasks')} ({brainPlan?.tasks?.filter((task, index) => !!taskCompletionMap[buildBrainTaskId(task, index, brainPlan?.date)]).length || 0}/{brainPlan?.tasks?.length || 0})
            </h2>
            <span className="text-[10px] text-gray-400 pr-2">{brainLoading ? "Refreshing..." : "Auto daily refresh"}</span>
          </div>
          <div className="space-y-1">
            {brainError && (
              <p className="text-[10px] text-red-500 px-2 py-1">{brainError}</p>
            )}
            {brainPlan?.tasks?.map((task, index) => {
              const lead = brainPlan.leads.find((l) => l.id === task.leadId);
              const title = buildBrainTaskTitle(task, lead);
              const taskId = buildBrainTaskId(task, index, brainPlan?.date);
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
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void editBrainTask(index);
                      }}
                      className="text-[10px] px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteBrainTask(index);
                      }}
                      className="text-[10px] px-2 py-1 rounded border border-gray-300 text-black bg-white hover:bg-gray-100"
                    >
                      Delete
                    </button>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${completed ? "bg-black border-black" : "border-gray-300 bg-white"}`}>
                    {completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
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
                {buildBrainRationale(brainPlan)}
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
            <div className="border border-gray-100 rounded px-3 py-2 bg-gray-50/60">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">CRM Contacts by Tier ({contacts.length})</p>
              <div className="space-y-2">
                {sortedContactsByTier.length > 0 ? (
                  sortedContactsByTier.map((group) => (
                    <details key={`tier-${group.tier}`} className="border border-gray-100 rounded bg-white" open={group.tier === sortedContactsByTier[0]?.tier}>
                      <summary className="text-[10px] font-bold text-gray-600 px-2 py-2 cursor-pointer select-none">
                        Tier {group.tier} ({group.list.length})
                      </summary>
                      <div className="space-y-1 px-2 pb-2">
                        {group.list.map((contact) => (
                          <p key={contact.id} className="text-xs text-black">
                            {contact.decisionMaker} • {contact.city}
                          </p>
                        ))}
                      </div>
                    </details>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No CRM contacts available.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
