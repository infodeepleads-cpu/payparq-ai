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

const HIGH_LEVERAGE_TASKS: EspressoTask[] = [];

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
