"use client";

import { useState } from "react";
import { useEspressoSystem, EspressoTask } from "../hooks/useEspressoSystem";

export default function EspressoDashboard() {
  const { 
    progress, 
    getCurrentTierTasks, 
    completeTask,
    toggleUltraMode 
  } = useEspressoSystem();

  const currentTierTasks = getCurrentTierTasks();
  
  // Refactored to list items instead of pills
  const TaskItem = ({ task }: { task: EspressoTask }) => {
    const getCategoryCode = (category: string) => {
      const codes: Record<string, string> = {
        mapping: "MAP",
        legal: "LGL",
        competition: "CMP",
        ads: "ADS",
        appointments: "APT",
        activation: "ACT"
      };
      return codes[category] || "TSK";
    };

    return (
      <div 
        className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors px-2"
        onClick={() => completeTask(task.id)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 border flex items-center justify-center transition-colors shrink-0 ${
            task.completed ? "bg-black border-black" : "border-black bg-white group-hover:bg-gray-100"
          }`}>
            {task.completed && (
              <div className="w-1.5 h-1.5 bg-white" />
            )}
          </div>
          
          <div className="flex-1 flex items-center justify-between">
            <span className={`text-xs font-medium ${task.completed ? "text-gray-400 line-through" : "text-black"}`}>
              {task.title}
            </span>
            <span className="text-[10px] font-mono text-black uppercase tracking-wider border border-black px-1 rounded-sm">
              {getCategoryCode(task.category)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const InfoItem = ({ label, value, active = false, onClick }: { label: string; value: string | number; active?: boolean; onClick?: () => void }) => (
    <div 
      className={`flex items-center justify-between py-2 px-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${active ? "bg-gray-50" : ""}`}
      onClick={onClick}
    >
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold ${active ? "text-black" : "text-gray-900"}`}>{value}</span>
    </div>
  );

  return (
    <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-6">
      <div className="flex items-center justify-between mb-6 border-b border-black pb-2">
        <h1 className="text-xl font-bold tracking-tight text-black">ESPRESSO</h1>
        <div className="flex items-center gap-4">
           <span className="text-xs text-gray-500 font-medium">TIER {progress.currentTier}/7</span>
           <button 
             onClick={toggleUltraMode}
             className={`text-xs font-bold uppercase tracking-wider hover:underline ${progress.ultraMode ? "text-black" : "text-gray-400"}`}
           >
             {progress.ultraMode ? "ULTRA MODE ON" : "NORMAL MODE"}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Today's List */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-bold text-black uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">Daily List (Today)</h2>
            <div className="space-y-1">
              {currentTierTasks.length > 0 ? (
                currentTierTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs italic">
                  All daily tasks completed. Great job.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
