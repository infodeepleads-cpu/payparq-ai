"use client";

import { useEffect, useState } from "react";

export type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type EspressoTask = {
  id: string;
  title: string;
  description: string;
  tier: Tier;
  category: "mapping" | "legal" | "competition" | "ads" | "appointments" | "activation";
  leverage: number; // 1-10 scale for high leverage tasks
  completed: boolean;
  createdAt: number;
  completedAt?: number;
};

export type UserProgress = {
  currentTier: Tier;
  tiersCompleted: Record<Tier, {
    lotsMapped: number;
    lotsActivated: number;
    completed: boolean;
  }>;
  ultraMode: boolean;
  dailyTasksSelected: string[];
  lastTaskSelection: number;
};

type MainTask = {
  id: string;
  title: string;
  completed: boolean;
  confirmed: boolean;
  createdAt: number;
};

const TIERS = [
  { id: 1 as Tier, label: "Airport land", requiredLots: 3, requiredActivations: 1 },
  { id: 2 as Tier, label: "Empty land (City lots)", requiredLots: 5, requiredActivations: 1 },
  { id: 3 as Tier, label: "Crowded Lots", requiredLots: 7, requiredActivations: 1 },
  { id: 4 as Tier, label: "Villas / Apartments", requiredLots: 5, requiredActivations: 1 },
  { id: 5 as Tier, label: "Single-power owners", requiredLots: 4, requiredActivations: 1 },
  { id: 6 as Tier, label: "Hotels", requiredLots: 3, requiredActivations: 1 },
  { id: 7 as Tier, label: "Whales (corporations)", requiredLots: 2, requiredActivations: 1 },
];

const HIGH_LEVERAGE_TASKS: EspressoTask[] = [
  // Tier 1 Tasks
  { id: "t1-map-1", title: "Generate 3 New Leads (Airport)", description: "Identify new leads, fill in documents, and prep for closing (Avg 3 days)", tier: 1, category: "mapping", leverage: 9, completed: false, createdAt: Date.now() },
  { id: "t1-legal-1", title: "Follow Up & Legal Docs", description: "Follow up on leads and fill in necessary legal documents (Avg 3 days)", tier: 1, category: "legal", leverage: 8, completed: false, createdAt: Date.now() },
  { id: "t1-comp-1", title: "Analyze Leads for Closing", description: "Review lead potential and prepare closing strategy (Avg 3 days)", tier: 1, category: "competition", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t1-ads-1", title: "Launch Ads for New Leads", description: "Create ads to generate new leads for activation (Avg 3 days)", tier: 1, category: "ads", leverage: 8, completed: false, createdAt: Date.now() },
  { id: "t1-appoint-1", title: "Follow Up & Schedule Meetings", description: "Call new leads and schedule meetings to close lots (Avg 3 days)", tier: 1, category: "appointments", leverage: 9, completed: false, createdAt: Date.now() },
  { id: "t1-activate-1", title: "CLOSE LOT: Activate Airport Lot", description: "Finalize documents and activate new lot (Main Job)", tier: 1, category: "activation", leverage: 10, completed: false, createdAt: Date.now() },

  // Tier 2 Tasks
  { id: "t2-map-1", title: "Generate 5 New Leads (City)", description: "Identify new city lot leads and fill initial documents (Avg 3 days)", tier: 2, category: "mapping", leverage: 8, completed: false, createdAt: Date.now() },
  { id: "t2-legal-1", title: "City Zoning Follow Up", description: "Follow up on zoning docs to clear path for closing (Avg 3 days)", tier: 2, category: "legal", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t2-comp-1", title: "City Lead Analysis", description: "Analyze city leads to prioritize closing (Avg 3 days)", tier: 2, category: "competition", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t2-ads-1", title: "Marketing for City Leads", description: "Generate new city lot leads via marketing (Avg 3 days)", tier: 2, category: "ads", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t2-appoint-1", title: "Owner Follow Ups", description: "Follow up with owners to fill docs and close (Avg 3 days)", tier: 2, category: "appointments", leverage: 8, completed: false, createdAt: Date.now() },
  { id: "t2-activate-1", title: "CLOSE LOT: Activate City Lot", description: "Sign contract and activate new city lot (Main Job)", tier: 2, category: "activation", leverage: 9, completed: false, createdAt: Date.now() },

  // Tier 3 Tasks
  { id: "t3-map-1", title: "Generate 7 Leads (Business)", description: "Identify business lots, fill docs, prep for closing (Avg 3 days)", tier: 3, category: "mapping", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t3-legal-1", title: "Business Legal Follow Up", description: "Follow up on compliance docs for business lots (Avg 3 days)", tier: 3, category: "legal", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t3-comp-1", title: "Business Lead Analysis", description: "Evaluate business leads for quick activation (Avg 3 days)", tier: 3, category: "competition", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t3-ads-1", title: "Ads for Business Owners", description: "Target business owners to generate new leads (Avg 3 days)", tier: 3, category: "ads", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t3-appoint-1", title: "Business Owner Follow Ups", description: "Meetings to fill docs and close business lots (Avg 3 days)", tier: 3, category: "appointments", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t3-activate-1", title: "CLOSE LOT: Activate Business Lot", description: "Convert and activate business lot (Main Job)", tier: 3, category: "activation", leverage: 8, completed: false, createdAt: Date.now() },

  // Tier 4 Tasks
  { id: "t4-map-1", title: "Generate 5 Leads (Villas)", description: "Identify villa properties, fill docs, prep closing (Avg 3 days)", tier: 4, category: "mapping", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t4-legal-1", title: "Residential Legal Follow Up", description: "Follow up on residential regulations and docs (Avg 3 days)", tier: 4, category: "legal", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t4-comp-1", title: "Villa Market Analysis", description: "Analyze villa leads for best closing probability (Avg 3 days)", tier: 4, category: "competition", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t4-ads-1", title: "Ads for Villa Owners", description: "Generate new leads among villa owners (Avg 3 days)", tier: 4, category: "ads", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t4-appoint-1", title: "Manager Follow Ups", description: "Follow up with property managers to close (Avg 3 days)", tier: 4, category: "appointments", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t4-activate-1", title: "CLOSE LOT: Activate Villa", description: "Secure contract and activate villa property (Main Job)", tier: 4, category: "activation", leverage: 7, completed: false, createdAt: Date.now() },

  // Tier 5 Tasks
  { id: "t5-map-1", title: "Generate 4 Leads (Multi-Owner)", description: "Identify multi-owner complexes, fill docs (Avg 3 days)", tier: 5, category: "mapping", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t5-legal-1", title: "Multi-Owner Legal Follow Up", description: "Navigate legal docs for multi-owner properties (Avg 3 days)", tier: 5, category: "legal", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t5-comp-1", title: "Power Owner Analysis", description: "Analyze power owner leads for closing (Avg 3 days)", tier: 5, category: "competition", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t5-ads-1", title: "Ads for Power Owners", description: "Target multi-property owners for new leads (Avg 3 days)", tier: 5, category: "ads", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t5-appoint-1", title: "Power Owner Follow Ups", description: "Meetings to close multi-owner contracts (Avg 3 days)", tier: 5, category: "appointments", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t5-activate-1", title: "CLOSE LOT: Activate Multi-Owner", description: "Sign and activate multi-owner property (Main Job)", tier: 5, category: "activation", leverage: 6, completed: false, createdAt: Date.now() },

  // Tier 6 Tasks
  { id: "t6-map-1", title: "Generate 3 Leads (Hotels)", description: "Identify hotel properties, fill docs, prep closing (Avg 3 days)", tier: 6, category: "mapping", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t6-legal-1", title: "Hotel Legal Follow Up", description: "Follow up on hospitality regulations and docs (Avg 3 days)", tier: 6, category: "legal", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t6-comp-1", title: "Hotel Market Analysis", description: "Analyze hotel leads for activation potential (Avg 3 days)", tier: 6, category: "competition", leverage: 2, completed: false, createdAt: Date.now() },
  { id: "t6-ads-1", title: "Ads for Hotel Industry", description: "Generate new hotel leads via targeted ads (Avg 3 days)", tier: 6, category: "ads", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t6-appoint-1", title: "Hotel Mgmt Follow Ups", description: "Follow up with management to close deal (Avg 3 days)", tier: 6, category: "appointments", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t6-activate-1", title: "CLOSE LOT: Activate Hotel", description: "Secure contract and activate hotel lot (Main Job)", tier: 6, category: "activation", leverage: 5, completed: false, createdAt: Date.now() },

  // Tier 7 Tasks
  { id: "t7-map-1", title: "Generate 2 Leads (Corporate)", description: "Identify corporate properties, fill docs (Avg 3 days)", tier: 7, category: "mapping", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t7-legal-1", title: "Corporate Legal Follow Up", description: "Follow up on corporate acquisition docs (Avg 3 days)", tier: 7, category: "legal", leverage: 2, completed: false, createdAt: Date.now() },
  { id: "t7-comp-1", title: "Corporate Lead Analysis", description: "Analyze corporate leads for closing strategy (Avg 3 days)", tier: 7, category: "competition", leverage: 1, completed: false, createdAt: Date.now() },
  { id: "t7-ads-1", title: "Corporate Outreach Ads", description: "Generate high-level corporate leads (Avg 3 days)", tier: 7, category: "ads", leverage: 2, completed: false, createdAt: Date.now() },
  { id: "t7-appoint-1", title: "C-Level Follow Ups", description: "Meetings with decision makers to close (Avg 3 days)", tier: 7, category: "appointments", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t7-activate-1", title: "CLOSE LOT: Activate Corporate", description: "Sign and activate corporate property (Main Job)", tier: 7, category: "activation", leverage: 4, completed: false, createdAt: Date.now() },
];

const PROGRESS_KEY = "pp_espresso_progress";
const TASKS_KEY = "pp_espresso_tasks";
const MAIN_TASKS_KEY = "pp_tasks";

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  
  return {
    currentTier: 1,
    tiersCompleted: {
      1: { lotsMapped: 0, lotsActivated: 0, completed: false },
      2: { lotsMapped: 0, lotsActivated: 0, completed: false },
      3: { lotsMapped: 0, lotsActivated: 0, completed: false },
      4: { lotsMapped: 0, lotsActivated: 0, completed: false },
      5: { lotsMapped: 0, lotsActivated: 0, completed: false },
      6: { lotsMapped: 0, lotsActivated: 0, completed: false },
      7: { lotsMapped: 0, lotsActivated: 0, completed: false },
    },
    ultraMode: false,
    dailyTasksSelected: [],
    lastTaskSelection: 0,
  };
}

function saveProgress(progress: UserProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function loadEspressoTasks(): EspressoTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : HIGH_LEVERAGE_TASKS;
  } catch {
    return HIGH_LEVERAGE_TASKS;
  }
}

function saveEspressoTasks(tasks: EspressoTask[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

// Add or update espresso task in main task system
function syncToMainTaskSystem(task: EspressoTask) {
  try {
    const existingTasks = JSON.parse(localStorage.getItem(MAIN_TASKS_KEY) || "[]");
    const mainTaskId = `espresso-${task.id}`;
    const taskIndex = existingTasks.findIndex((t: MainTask) => t.id === mainTaskId);
    
    let updated = false;

    if (taskIndex >= 0) {
      if (existingTasks[taskIndex].completed !== task.completed) {
        existingTasks[taskIndex].completed = task.completed;
        updated = true;
      }
    } else {
      const newTask: MainTask = {
        id: mainTaskId,
        title: task.title,
        completed: task.completed,
        confirmed: false,
        createdAt: Date.now()
      };
      existingTasks.push(newTask);
      updated = true;
    }

    if (updated) {
      localStorage.setItem(MAIN_TASKS_KEY, JSON.stringify(existingTasks));
      window.dispatchEvent(new StorageEvent("storage", {
        key: MAIN_TASKS_KEY,
        newValue: JSON.stringify(existingTasks)
      }));
    }
  } catch (error) {
    console.error("Failed to sync to main task system:", error);
  }
}

export function useEspressoSystem() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);
  const [espressoTasks, setEspressoTasks] = useState<EspressoTask[]>(loadEspressoTasks);
  const [showDailySelection, setShowDailySelection] = useState(false);

  // Sync current tier tasks to main system on load/change
  useEffect(() => {
    const currentTasks = espressoTasks.filter(task => task.tier === progress.currentTier);
    currentTasks.forEach(task => {
      syncToMainTaskSystem(task);
    });
  }, [progress.currentTier, espressoTasks]);

  useEffect(() => {
    // Check if it's a new day for daily task selection
    const now = new Date();
    const lastSelection = new Date(progress.lastTaskSelection);
    const isNewDay = now.toDateString() !== lastSelection.toDateString();
    
    if (isNewDay && progress.dailyTasksSelected.length === 0) {
      setShowDailySelection(true);
    }
  }, [progress]);

  const getCurrentTierTasks = () => {
    return espressoTasks.filter(task => task.tier === progress.currentTier && !task.completed);
  };

  const getHighLeverageTasks = (count: number = 3) => {
    const currentTasks = getCurrentTierTasks();
    return currentTasks
      .sort((a, b) => b.leverage - a.leverage)
      .slice(0, count);
  };

  const completeTask = (taskId: string) => {
    const updatedTasks = espressoTasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: true, completedAt: Date.now() }
        : task
    );
    
    setEspressoTasks(updatedTasks);
    saveEspressoTasks(updatedTasks);

    // Sync to main task system
    const updatedTask = updatedTasks.find(t => t.id === taskId);
    if (updatedTask) {
      syncToMainTaskSystem(updatedTask);
    }

    // Update progress based on task completion
    const task = espressoTasks.find(t => t.id === taskId);
    if (task) {
      const updatedProgress = { ...progress };
      
      if (task.category === "mapping") {
        updatedProgress.tiersCompleted[task.tier].lotsMapped += 1;
      } else if (task.category === "activation") {
        updatedProgress.tiersCompleted[task.tier].lotsActivated += 1;
      }

      // Check if tier is completed
      const tierData = TIERS.find(t => t.id === task.tier);
      if (tierData) {
        const completed = updatedProgress.tiersCompleted[task.tier];
        if (completed.lotsMapped >= tierData.requiredLots && completed.lotsActivated >= tierData.requiredActivations) {
          updatedProgress.tiersCompleted[task.tier].completed = true;
          
          // Unlock next tier if available
          if (task.tier < 7) {
            updatedProgress.currentTier = (task.tier + 1) as Tier;
          }
        }
      }

      setProgress(updatedProgress);
      saveProgress(updatedProgress);
    }
  };

  const selectDailyTasks = (taskIds: string[]) => {
    const updatedProgress = {
      ...progress,
      dailyTasksSelected: taskIds,
      lastTaskSelection: Date.now()
    };
    
    setProgress(updatedProgress);
    saveProgress(updatedProgress);
    setShowDailySelection(false);

    // Sync selected tasks to main task system
    taskIds.forEach(taskId => {
      const task = espressoTasks.find(t => t.id === taskId);
      if (task) {
        syncToMainTaskSystem(task);
      }
    });
  };

  const toggleUltraMode = () => {
    const updatedProgress = {
      ...progress,
      ultraMode: !progress.ultraMode
    };
    
    setProgress(updatedProgress);
    saveProgress(updatedProgress);
  };

  return {
    progress,
    espressoTasks,
    showDailySelection,
    getCurrentTierTasks,
    getHighLeverageTasks,
    completeTask,
    selectDailyTasks,
    toggleUltraMode
  };
}
