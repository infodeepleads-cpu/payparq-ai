"use client";

import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

export default function ScriptsPage() {
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">{t('scripts')}</span>
        </div>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('personalized_outreach_framework')}</h2>
            <div className="text-sm text-gray-800 leading-relaxed space-y-4">
              <p>{t('outreach_desc')}</p>
              <p className="italic text-gray-600">{t('outreach_manual_work')}</p>
              
              <div className="space-y-6 pt-4">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <h3 className="font-bold text-black mb-1">{t('reference_personalized')}</h3>
                  <p className="mb-2">{t('acknowledge_context')}</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <h3 className="font-bold text-black mb-1">{t('present_solution')}</h3>
                  <p className="mb-2">{t('state_fix')}</p>
                  <p className="text-xs font-semibold text-gray-500 italic">{t('attitude_fix')}</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <h3 className="font-bold text-black mb-1">{t('ask_time_date')}</h3>
                  <p className="mb-2">{t('schedule_follow_up')}</p>
                  <p className="text-xs font-semibold text-gray-500 italic">{t('attitude_professional')}</p>
                </div>
              </div>

              <div className="pt-8">
                <h3 className="font-bold text-black mb-1">{t('follow_up_same_day')}</h3>
                <p>{t('send_personalized_note')}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
