"use client";

import { useEffect, useState } from "react";
import { getSupabase, getCurrentUser } from "../lib/supabase";

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
    // New field for document submission tracking
    documentStatus?: "pending" | "submitted" | "approved" | "rejected";
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
      1: { lotsMapped: 0, lotsActivated: 0, completed: false, documentStatus: "pending" },
      2: { lotsMapped: 0, lotsActivated: 0, completed: false, documentStatus: "pending" },
      3: { lotsMapped: 0, lotsActivated: 0, completed: false, documentStatus: "pending" },
      4: { lotsMapped: 0, lotsActivated: 0, completed: false, documentStatus: "pending" },
      5: { lotsMapped: 0, lotsActivated: 0, completed: false, documentStatus: "pending" },
      6: { lotsMapped: 0, lotsActivated: 0, completed: false, documentStatus: "pending" },
      7: { lotsMapped: 0, lotsActivated: 0, completed: false, documentStatus: "pending" },
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
  
  // Real-time progress updates for Admin approvals
  useEffect(() => {
    const supabase = getSupabase();
    
    // Subscribe to progress changes
    const progressSub = supabase
      .channel('public:user_progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_progress' }, async (payload) => {
        const user = await getCurrentUser();
        if (user && payload.new && (payload.new as any).user_id === user.id) {
          const newData = payload.new as any;
          setProgress(prev => ({
             ...prev,
             currentTier: newData.current_tier as Tier,
             tiersCompleted: newData.tiers_completed,
             ultraMode: newData.ultra_mode
          }));
        }
      })
      .subscribe();

    // Subscribe to document submission changes (approvals)
    const docSub = supabase
      .channel('public:document_submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_submissions' }, async (payload) => {
         const user = await getCurrentUser();
         if (user && payload.new && (payload.new as any).user_id === user.id) {
            const doc = payload.new as any;
            setProgress(prev => {
               const next = { ...prev };
               if (next.tiersCompleted[doc.tier as Tier]) {
                  next.tiersCompleted[doc.tier as Tier].documentStatus = doc.status;
                  if (doc.status === "approved") {
                    next.tiersCompleted[doc.tier as Tier].completed = true;
                  }
               }
               return next;
            });
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(progressSub);
      supabase.removeChannel(docSub);
    };
  }, []);

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

  // Sync with Supabase for progress (document status)
  useEffect(() => {
    const syncProgress = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const supabase = getSupabase();
      
      // Load progress from DB if exists
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (progressData) {
        // Merge DB progress with local state
        // prioritizing DB for critical fields like tier and completion
        setProgress(prev => ({
          ...prev,
          currentTier: progressData.current_tier as Tier,
          tiersCompleted: progressData.tiers_completed,
          ultraMode: progressData.ultra_mode
        }));
      }

      // Check document submissions
      const { data: submissions } = await supabase
        .from("document_submissions")
        .select("*")
        .eq("user_id", user.id);
        
      if (submissions) {
        setProgress(prev => {
          const next = { ...prev };
          submissions.forEach((sub: any) => {
            if (next.tiersCompleted[sub.tier as Tier]) {
               next.tiersCompleted[sub.tier as Tier].documentStatus = sub.status;
               // If approved, ensure tier is completed
               if (sub.status === "approved") {
                 next.tiersCompleted[sub.tier as Tier].completed = true;
               }
            }
          });
          return next;
        });
      }
    };
    
    syncProgress();
  }, []);

  // Save progress to Supabase whenever it changes
  useEffect(() => {
    const saveToSupabase = async () => {
       const user = await getCurrentUser();
       if (!user) return;
       const supabase = getSupabase();
       
       await supabase.from("user_progress").upsert({
         user_id: user.id,
         current_tier: progress.currentTier,
         tiers_completed: progress.tiersCompleted,
         ultra_mode: progress.ultraMode,
         updated_at: new Date().toISOString()
       });
    };
    // Debounce or just save
    const timeout = setTimeout(saveToSupabase, 1000);
    return () => clearTimeout(timeout);
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

      // Check if tier requirements are met (but not necessarily completed via document approval)
      const tierData = TIERS.find(t => t.id === task.tier);
      if (tierData) {
        const completed = updatedProgress.tiersCompleted[task.tier];
        // Only mark requirements met, completion depends on document approval for Tiers 1, 6, 7
        
        const reqMet = completed.lotsMapped >= tierData.requiredLots && completed.lotsActivated >= tierData.requiredActivations;
        
        if (reqMet) {
          // If no document required (Tiers 2-5), mark completed
          if (![1, 6, 7].includes(task.tier)) {
             updatedProgress.tiersCompleted[task.tier].completed = true;
             // Auto-advance if simple tier
             if (updatedProgress.currentTier === task.tier) {
                updatedProgress.currentTier = (task.tier + 1) as Tier;
             }
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
