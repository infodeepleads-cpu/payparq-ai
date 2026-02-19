"use client";

import { useEffect, useState } from "react";
import { useEspressoSystem, EspressoTask } from "../hooks/useEspressoSystem";
import DailyTaskSelection from "./DailyTaskSelection";

export default function EspressoDashboard() {
  const { 
    progress, 
    espressoTasks, 
    showDailySelection, 
    getCurrentTierTasks, 
    completeTask, 
    toggleUltraMode 
  } = useEspressoSystem();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const currentTierTasks = getCurrentTierTasks();
  const dailyTasks = espressoTasks.filter(task => 
    progress.dailyTasksSelected.includes(task.id)
  );

  const categories = ["all", "mapping", "legal", "competition", "ads", "appointments", "activation"];

  const filteredTasks = selectedCategory === "all" 
    ? currentTierTasks 
    : currentTierTasks.filter(task => task.category === selectedCategory);

  const getProgressPercentage = (tier: number) => {
    const tierData = progress.tiersCompleted[tier as keyof typeof progress.tiersCompleted];
    const requiredLots = tier === 1 ? 3 : tier === 2 ? 5 : tier === 3 ? 7 : tier <= 5 ? 5 : tier === 6 ? 3 : 2;
    const requiredActivations = 1;
    
    const lotProgress = Math.min((tierData.lotsMapped / requiredLots) * 50, 50);
    const activationProgress = Math.min((tierData.lotsActivated / requiredActivations) * 50, 50);
    
    return lotProgress + activationProgress;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      mapping: "🗺️",
      legal: "⚖️",
      competition: "🏆",
      ads: "📢",
      appointments: "📅",
      activation: "🎯"
    };
    return icons[category as keyof typeof icons] || "📋";
  };

  if (showDailySelection) {
    return <DailyTaskSelection onClose={() => {}} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">☕ Espresso Dashboard</h1>
            <p className="text-blue-100">Daily high-leverage activities to unlock tier {progress.currentTier + 1}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-blue-100">Current Tier</div>
              <div className="text-2xl font-bold">{progress.currentTier}/7</div>
            </div>
            <button
              onClick={toggleUltraMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                progress.ultraMode 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-white text-blue-600 hover:bg-blue-50"
              }`}
            >
              {progress.ultraMode ? "🔥 Ultra Mode" : "⚡ Normal Mode"}
            </button>
          </div>
        </div>
      </div>

      {/* Daily Tasks Section */}
      {dailyTasks.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
            🌅 Today's High-Leverage Tasks
          </h2>
          <div className="grid gap-3">
            {dailyTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 bg-white rounded-lg border-2 transition-all ${
                  task.completed 
                    ? "border-green-300 bg-green-50" 
                    : "border-yellow-300 hover:border-yellow-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => completeTask(task.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        task.completed 
                          ? "bg-green-500 border-green-500 text-white" 
                          : "border-gray-300 hover:border-green-400"
                      }`}
                    >
                      {task.completed && "✓"}
                    </button>
                    <div>
                      <h3 className={`font-semibold ${
                        task.completed ? "text-green-800 line-through" : "text-gray-900"
                      }`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold">
                      Leverage: {task.leverage}/10
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                      {getCategoryIcon(task.category)} {task.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier Progress */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tier Progress</h2>
        <div className="space-y-4">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((tier) => {
            const tierData = progress.tiersCompleted[tier as keyof typeof progress.tiersCompleted];
            const percentage = getProgressPercentage(tier);
            const isCurrent = tier === progress.currentTier;
            const isCompleted = tierData.completed;
            
            return (
              <div key={tier} className={`p-4 rounded-lg border-2 ${
                isCompleted ? "border-green-300 bg-green-50" :
                isCurrent ? "border-blue-300 bg-blue-50" :
                "border-gray-200 bg-gray-50"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${
                      isCompleted ? "text-green-800" :
                      isCurrent ? "text-blue-800" :
                      "text-gray-600"
                    }`}>
                      Tier {tier}
                    </span>
                    {isCompleted && <span className="text-green-600">✅</span>}
                    {isCurrent && <span className="text-blue-600">🎯</span>}
                  </div>
                  <span className="text-sm text-gray-600">
                    {tierData.lotsMapped}/{(tier === 1 ? 3 : tier === 2 ? 5 : tier === 3 ? 7 : tier <= 5 ? 5 : tier === 6 ? 3 : 2)} lots • {tierData.lotsActivated}/1 activated
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      isCompleted ? "bg-green-500" :
                      isCurrent ? "bg-blue-500" :
                      "bg-gray-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Tasks */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Available Tasks - Tier {progress.currentTier}</h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : `${getCategoryIcon(cat)} ${cat}`}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid gap-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => completeTask(task.id)}
                    className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-green-400 flex items-center justify-center"
                  >
                    {task.completed && "✓"}
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 font-bold">
                    Leverage: {task.leverage}/10
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {getCategoryIcon(task.category)} {task.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tasks available in this category. Complete current tier to unlock more!
          </div>
        )}
      </div>
    </div>
  );
}
