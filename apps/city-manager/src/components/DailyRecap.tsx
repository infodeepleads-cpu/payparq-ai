"use client";

import { useState, useEffect, useMemo } from "react";
import { getSupabase } from "../lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DailyRecap() {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [crmUpdates, setCrmUpdates] = useState<any[]>([]);
  const [quote, setQuote] = useState("");
  const { t } = useLanguage();

  const MOTIVATIONAL_QUOTES = useMemo(() => [
    t('quote_1'),
    t('quote_2'),
    t('quote_3'),
    t('quote_4'),
    t('quote_5'),
    t('quote_6'),
    t('quote_7'),
    t('quote_8'),
    t('quote_9'),
    t('quote_10')
  ], [t]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toDateString();
      const lastShown = localStorage.getItem("daily_recap_last_shown");

      if (hour >= 22 && lastShown !== today) {
        showRecap();
        // Mark as shown immediately so we don't spam if user closes and re-opens app
        localStorage.setItem("daily_recap_last_shown", today);
      }
    };

    const timer = setInterval(checkTime, 60000); // Check every minute
    checkTime(); // Check on mount

    return () => clearInterval(timer);
  }, []);

  const showRecap = async () => {
    // Fetch Tasks
    try {
      const rawTasks = localStorage.getItem("pp_tasks");
      const allTasks = rawTasks ? JSON.parse(rawTasks) : [];
      const today = new Date().toDateString();
      
      const completedToday = allTasks.filter((t: any) => 
        t.completed && (
          (t.completedAt && new Date(t.completedAt).toDateString() === today) ||
          (!t.completedAt && new Date(t.createdAt).toDateString() === today) // Fallback
        )
      );
      setTasks(completedToday);
    } catch (e) {
      console.error("Failed to load tasks for recap", e);
      setTasks([]);
    }

    // Fetch CRM Updates
    try {
      const supabase = getSupabase();
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      
      const { data: contacts } = await supabase
        .from("crm_contacts")
        .select("*")
        .gte("created_at", startOfDay.toISOString())
        .order("created_at", { ascending: false });
        
      setCrmUpdates(contacts || []);
    } catch (e) {
      console.error("Failed to load CRM updates for recap", e);
      setCrmUpdates([]);
    }

    // Pick Quote
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    setIsOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="bg-black text-white p-6 shrink-0">
          <h2 className="text-xl font-bold">{t('daily_recap')}</h2>
          <p className="text-gray-400 text-sm">{new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Tasks */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('completed_tasks')}</h3>
            {tasks.length > 0 ? (
              <ul className="space-y-2">
                {tasks.map((t_item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    <span className="line-through text-gray-500 break-words">{t_item.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">{t('no_tasks_today')}</p>
            )}
          </div>

          {/* CRM Updates */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('crm_activity')}</h3>
            {crmUpdates.length > 0 ? (
              <ul className="space-y-2">
                {crmUpdates.map((c, i) => (
                  <li key={i} className="text-sm bg-gray-50 p-3 rounded border border-gray-100">
                    <div className="font-semibold text-gray-900">{c.decision_maker || t('contact')}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {c.location ? `${c.location} • ` : ""}{c.status || t('no_status')}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">{t('no_crm_today')}</p>
            )}
          </div>

          {/* Motivation */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">{t('advice_tomorrow')}</h3>
            <p className="text-blue-900 font-medium italic text-sm">"{quote}"</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
          <button 
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('close_rest')}
          </button>
        </div>
      </div>
    </div>
  );
}
