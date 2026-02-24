"use client";

import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

export default function SalesRulesPage() {
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">{t('sales_contact_rules')}</span>
        </div>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('channels')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('channels_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('demo_trial')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('demo_trial_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('closing_phone')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('closing_phone_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('next_step_discipline')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('next_step_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('appointments')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('appointments_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('speed_rule')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('speed_rule_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('lead_entry')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('lead_entry_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('objection_handling_rule')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('objection_handling_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('data_discipline')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('data_discipline_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('conv_minimum')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('conv_minimum_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('operator_support')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('operator_support_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('daily_improvement')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('daily_improvement_desc')}</p>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('urgency_framing')}</h2>
            <div className="text-sm text-gray-800 leading-relaxed space-y-2">
              <p>{t('urgency_framing_desc')}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t('unused_capacity')}</li>
                <li>{t('stop_unauthorized')}</li>
                <li>{t('increase_reviews')}</li>
                <li>{t('eliminate_congestion')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('decision_maker_rule')}</h2>
            <p className="text-sm text-gray-800 leading-relaxed">{t('decision_maker_rule_desc')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
