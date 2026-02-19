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
  { id: "t1-map-1", title: "Map 3 Airport Land Lots", description: "Identify and map potential airport land opportunities", tier: 1, category: "mapping", leverage: 9, completed: false, createdAt: Date.now() },
  { id: "t1-legal-1", title: "Scout Legal Requirements", description: "Research zoning and legal requirements for airport land", tier: 1, category: "legal", leverage: 8, completed: false, createdAt: Date.now() },
  { id: "t1-comp-1", title: "Competition Analysis", description: "Analyze competitors in airport land sector", tier: 1, category: "competition", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t1-ads-1", title: "Set Targeted Ads", description: "Create ads targeting airport land owners", tier: 1, category: "ads", leverage: 8, completed: false, createdAt: Date.now() },
  { id: "t1-appoint-1", title: "Schedule Appointments", description: "Book meetings with airport land contacts", tier: 1, category: "appointments", leverage: 9, completed: false, createdAt: Date.now() },
  { id: "t1-activate-1", title: "Activate 1 Airport Lot", description: "Get first airport land lot under contract", tier: 1, category: "activation", leverage: 10, completed: false, createdAt: Date.now() },

  // Tier 2 Tasks
  { id: "t2-map-1", title: "Map 5 Empty City Lots", description: "Identify vacant lots in prime city locations", tier: 2, category: "mapping", leverage: 8, completed: false, createdAt: Date.now() },
  { id: "t2-legal-1", title: "City Zoning Research", description: "Research city zoning for empty lots", tier: 2, category: "legal", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t2-comp-1", title: "City Lot Competition", description: "Analyze city lot development competitors", tier: 2, category: "competition", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t2-ads-1", title: "City Lot Marketing", description: "Create marketing for city lot opportunities", tier: 2, category: "ads", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t2-appoint-1", title: "City Owner Meetings", description: "Meet with city lot owners", tier: 2, category: "appointments", leverage: 8, completed: false, createdAt: Date.now() },
  { id: "t2-activate-1", title: "Activate 1 City Lot", description: "Secure first city lot contract", tier: 2, category: "activation", leverage: 9, completed: false, createdAt: Date.now() },

  // Tier 3 Tasks
  { id: "t3-map-1", title: "Map 7 Crowded Business Lots", description: "Identify restaurants, bars, shops for conversion", tier: 3, category: "mapping", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t3-legal-1", title: "Business Conversion Legal", description: "Research business conversion regulations", tier: 3, category: "legal", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t3-comp-1", title: "Business Competition Analysis", description: "Analyze crowded business sector", tier: 3, category: "competition", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t3-ads-1", title: "Business Owner Outreach", description: "Target business owners with ads", tier: 3, category: "ads", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t3-appoint-1", title: "Business Owner Appointments", description: "Meet with business property owners", tier: 3, category: "appointments", leverage: 7, completed: false, createdAt: Date.now() },
  { id: "t3-activate-1", title: "Activate 1 Business Lot", description: "Convert first crowded business lot", tier: 3, category: "activation", leverage: 8, completed: false, createdAt: Date.now() },

  // Tier 4 Tasks
  { id: "t4-map-1", title: "Map 5 Villa Properties", description: "Identify villa and apartment complexes", tier: 4, category: "mapping", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t4-legal-1", title: "Residential Zoning Analysis", description: "Research residential property regulations", tier: 4, category: "legal", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t4-comp-1", title: "Residential Market Analysis", description: "Analyze villa/apartment market competition", tier: 4, category: "competition", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t4-ads-1", title: "Luxury Property Marketing", description: "Create ads for villa and apartment owners", tier: 4, category: "ads", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t4-appoint-1", title: "Property Manager Meetings", description: "Schedule meetings with property managers", tier: 4, category: "appointments", leverage: 6, completed: false, createdAt: Date.now() },
  { id: "t4-activate-1", title: "Activate 1 Villa Property", description: "Secure first villa property contract", tier: 4, category: "activation", leverage: 7, completed: false, createdAt: Date.now() },

  // Tier 5 Tasks
  { id: "t5-map-1", title: "Map 4 Multi-Owner Properties", description: "Identify multi-building owners and garage complexes", tier: 5, category: "mapping", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t5-legal-1", title: "Multi-Owner Legal Research", description: "Research multi-owner property regulations", tier: 5, category: "legal", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t5-comp-1", title: "Power Owner Competition", description: "Analyze single-power owner market", tier: 5, category: "competition", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t5-ads-1", title: "Power Owner Outreach", description: "Target multi-property owners with ads", tier: 5, category: "ads", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t5-appoint-1", title: "Power Owner Meetings", description: "Meet with multi-building owners", tier: 5, category: "appointments", leverage: 5, completed: false, createdAt: Date.now() },
  { id: "t5-activate-1", title: "Activate 1 Multi-Owner Property", description: "Secure first multi-owner property contract", tier: 5, category: "activation", leverage: 6, completed: false, createdAt: Date.now() },

  // Tier 6 Tasks
  { id: "t6-map-1", title: "Map 3 Hotel Properties", description: "Identify hotel and hospitality properties", tier: 6, category: "mapping", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t6-legal-1", title: "Hospitality Legal Research", description: "Research hotel property regulations", tier: 6, category: "legal", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t6-comp-1", title: "Hotel Market Analysis", description: "Analyze hotel and hospitality competition", tier: 6, category: "competition", leverage: 2, completed: false, createdAt: Date.now() },
  { id: "t6-ads-1", title: "Hotel Industry Marketing", description: "Create targeted hotel industry ads", tier: 6, category: "ads", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t6-appoint-1", title: "Hotel Management Meetings", description: "Schedule meetings with hotel management", tier: 6, category: "appointments", leverage: 4, completed: false, createdAt: Date.now() },
  { id: "t6-activate-1", title: "Activate 1 Hotel Property", description: "Secure first hotel property contract", tier: 6, category: "activation", leverage: 5, completed: false, createdAt: Date.now() },

  // Tier 7 Tasks
  { id: "t7-map-1", title: "Map 2 Corporate Properties", description: "Identify large corporate and institutional properties", tier: 7, category: "mapping", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t7-legal-1", title: "Corporate Legal Research", description: "Research corporate property acquisition laws", tier: 7, category: "legal", leverage: 2, completed: false, createdAt: Date.now() },
  { id: "t7-comp-1", title: "Corporate Competition Analysis", description: "Analyze corporate property market competition", tier: 7, category: "competition", leverage: 1, completed: false, createdAt: Date.now() },
  { id: "t7-ads-1", title: "Corporate Outreach Campaign", description: "Create high-level corporate property campaigns", tier: 7, category: "ads", leverage: 2, completed: false, createdAt: Date.now() },
  { id: "t7-appoint-1", title: "C-Level Appointments", description: "Schedule meetings with corporate decision makers", tier: 7, category: "appointments", leverage: 3, completed: false, createdAt: Date.now() },
  { id: "t7-activate-1", title: "Activate 1 Corporate Property", description: "Secure first corporate property contract", tier: 7, category: "activation", leverage: 4, completed: false, createdAt: Date.now() },
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

// Add espresso task to main task system
function addToMainTaskSystem(title: string) {
  try {
    const existingTasks = JSON.parse(localStorage.getItem(MAIN_TASKS_KEY) || "[]");
    const newTask: MainTask = {
      id: `espresso-${Date.now()}`,
      title: title,
      completed: false,
      confirmed: false,
      createdAt: Date.now()
    };
    existingTasks.push(newTask);
    localStorage.setItem(MAIN_TASKS_KEY, JSON.stringify(existingTasks));
    
    // Dispatch storage event for sync
    window.dispatchEvent(new StorageEvent("storage", {
      key: MAIN_TASKS_KEY,
      newValue: JSON.stringify(existingTasks)
    }));
  } catch (error) {
    console.error("Failed to add to main task system:", error);
  }
}

export function useEspressoSystem() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);
  const [espressoTasks, setEspressoTasks] = useState<EspressoTask[]>(loadEspressoTasks);
  const [showDailySelection, setShowDailySelection] = useState(false);

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

    // Add to main task system
    const completedTask = espressoTasks.find(t => t.id === taskId);
    if (completedTask && !completedTask.completed) {
      addToMainTaskSystem(completedTask.title);
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

    // Add selected tasks to main task system
    taskIds.forEach(taskId => {
      const task = espressoTasks.find(t => t.id === taskId);
      if (task) {
        addToMainTaskSystem(task.title);
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
