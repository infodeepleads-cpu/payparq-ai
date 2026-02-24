"use client";

import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

export default function OpsMasteryPage() {
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">{t('ops_mastery')}</span>
        </div>
        
        <div className="space-y-12">
          {/* Non-Negotiables Section */}
          <div className="space-y-8">
            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('non_negotiables_title')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-4">
                <div>
                  <h3 className="font-semibold text-black mb-1">{t('immediate_action')}</h3>
                  <p>{t('immediate_solution')}</p>
                  <p className="text-gray-500 italic">{t('no_delays')}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-black mb-1">{t('uptime_reliability')}</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('standard_100_uptime')}</li>
                    <li>{t('stranded_guest_unacceptable')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-black mb-1">{t('response_time_slas')}</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('max_5_min_ride')}</li>
                    <li>{t('res_issues_15_min')}</li>
                    <li>{t('return_ride_15_min')}</li>
                    <li>{t('same_day_tech')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-black mb-1">{t('guest_first_doctrine')}</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('guest_always_right')}</li>
                    <li>{t('avoid_conflict')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('partners_accountability')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-4">
                <p>{t('top_tier_partners')}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('taxi_head_partner')}</li>
                  <li>{t('trained_agents')}</li>
                  <li>{t('company_vetting')}</li>
                </ul>
                <p className="font-semibold">{t('switch_immediately')}</p>
                
                <div className="pt-2">
                  <p>{t('technician_rule')}</p>
                  <p className="font-semibold">{t('no_show_no_work')}</p>
                  <p className="text-red-600 font-bold">{t('zero_tolerance_unreliability')}</p>
                </div>
              </div>
            </section>

            <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h2 className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-4">{t('hub_launch')}</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-blue-800">{t('reviews')}</p>
                  <p className="text-blue-700">{t('testing_marketing')}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="font-bold text-blue-800">{t('feedback')}</p>
                  <p className="text-blue-700">100% {t('yes')}</p>
                </div>
              </div>
            </section>

            <div className="pt-8 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('core_principle')}</p>
              <p className="text-sm text-gray-600 italic">
                {t('stranded_guest_worst')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
