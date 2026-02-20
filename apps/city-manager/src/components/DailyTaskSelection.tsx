"use client";

import { useState } from "react";
import { EspressoTask, useEspressoSystem } from "../hooks/useEspressoSystem";

interface DailyTaskSelectionProps {
  onClose: () => void;
}

export default function DailyTaskSelection({ onClose }: DailyTaskSelectionProps) {
  const { getHighLeverageTasks, selectDailyTasks, progress } = useEspressoSystem();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [ultraMode, setUltraMode] = useState(progress.ultraMode);

  const highLeverageTasks = getHighLeverageTasks(5); // Show top 5 tasks
  const kpiMultiplier = ultraMode ? 1.2 : 1; // 20% harsher in ultra mode

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleConfirmSelection = () => {
    if (selectedTasks.length > 0) {
      selectDailyTasks(selectedTasks);
      onClose();
    }
  };

  const getTaskKPI = (task: EspressoTask) => {
    const baseKPI = task.leverage * 10;
    const ultraKPI = Math.round(baseKPI * kpiMultiplier);
    return ultraMode ? ultraKPI : baseKPI;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🌅 Good Morning!</h2>
            <p className="text-gray-600">Choose your high-leverage tasks for today</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUltraMode(!ultraMode)}
              className={`
                relative overflow-hidden px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300
                ${ultraMode 
                  ? "bg-red-600 text-white" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }
              `}
            >
              <span className="flex items-center gap-2">
                {ultraMode ? (
                  <>🔥 Ultra Mode Active</>
                ) : (
                  <>⚡ Activate Ultra Mode</>
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tier {progress.currentTier} Progress:</strong> Complete tasks to unlock the next tier.
            {ultraMode && " 🔥 Ultra Mode: 20% harsher KPIs, more rewards!"}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {highLeverageTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedTasks.includes(task.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => toggleTaskSelection(task.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => {}}
                      className="mt-1"
                    />
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                      {task.category}
                    </span>
                    <span className="text-orange-600 font-medium">
                      Leverage: {task.leverage}/10
                    </span>
                    <span className="text-green-600 font-bold">
                      KPI Target: {getTaskKPI(task)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Selected: {selectedTasks.length} tasks
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={selectedTasks.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Start Day ({selectedTasks.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
