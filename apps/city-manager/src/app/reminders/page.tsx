"use client";
import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Reminder = {
  id: number;
  title: string;
  time: string;
  fired: boolean;
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [permission, setPermission] = useState("default");
  const { t, language } = useLanguage();

  useEffect(() => {
    // Check permission
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    loadReminders();

    // Listen for storage changes (in case chat adds a reminder)
    const handler = () => loadReminders();
    window.addEventListener("storage", handler);
    // Custom event if we dispatch it manually
    window.addEventListener("pp_reminders_update", handler);

    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("pp_reminders_update", handler);
    };
  }, []);

  const loadReminders = () => {
    try {
      const raw = localStorage.getItem("pp_reminders");
      if (raw) {
        const data = JSON.parse(raw);
        // Sort by time (newest/future first)
        data.sort((a: Reminder, b: Reminder) => new Date(a.time).getTime() - new Date(b.time).getTime());
        setReminders(data);
      }
    } catch {}
  };

  const requestPermission = async () => {
    if ("Notification" in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
    }
  };

  const deleteReminder = (id: number) => {
    if (!confirm(t('delete_reminder_confirm'))) return;
    const next = reminders.filter((r) => r.id !== id);
    setReminders(next);
    localStorage.setItem("pp_reminders", JSON.stringify(next));
    window.dispatchEvent(new Event("pp_reminders_update"));
  };

  const clearCompleted = () => {
    if (!confirm(t('clear_completed_confirm'))) return;
    const next = reminders.filter((r) => !r.fired);
    setReminders(next);
    localStorage.setItem("pp_reminders", JSON.stringify(next));
    window.dispatchEvent(new Event("pp_reminders_update"));
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-8 overflow-x-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reminders')}</h1>
        </div>
        <div className="flex gap-2">
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors"
            >
              {t('enable_notifications')}
            </button>
          )}
          {reminders.some(r => r.fired) && (
            <button
              onClick={clearCompleted}
              className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              {t('clear_completed')}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {reminders.length === 0 ? (
            <li className="px-6 py-12 text-center text-gray-500">
              {t('no_reminders')}
            </li>
          ) : (
            reminders.map((reminder) => {
              const date = new Date(reminder.time);
              const isPast = date.getTime() < Date.now();
              
              return (
                <li key={reminder.id} className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 ${reminder.fired ? 'opacity-50 bg-gray-50' : ''}`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full mr-4 ${reminder.fired ? 'bg-gray-400' : isPast ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className={`text-sm font-medium ${reminder.fired ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {reminder.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {date.toLocaleString(language === 'hr' ? 'hr-HR' : 'en-GB', { timeZone: "Europe/Zagreb", hour12: false })} CET
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors bg-transparent border-0 p-0 focus:outline-none ring-0 shadow-none"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
