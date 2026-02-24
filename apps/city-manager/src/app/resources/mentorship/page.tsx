"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Page() {
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-4 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">{t('3_key_solutions')}</span>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('mentorship_solution_1_title')}</h2>
            <div className="text-gray-800 leading-relaxed text-sm">
              <p>{t('mentorship_solution_1_desc')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('mentorship_solution_2_title')}</h2>
            <div className="text-gray-800 leading-relaxed text-sm">
              <p>{t('mentorship_solution_2_desc')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('mentorship_solution_3_title')}</h2>
            <div className="text-gray-800 leading-relaxed text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  {t('mentorship_solution_3_item_1')}
                </li>
                <li>
                  {t('mentorship_solution_3_item_2')}
                </li>
                <li>
                  {t('mentorship_solution_3_item_3')}
                </li>
                <li>
                  {t('mentorship_solution_3_item_4')}
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
