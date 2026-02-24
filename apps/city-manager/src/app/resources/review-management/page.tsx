"use client";

import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

export default function ReviewManagementPage() {
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">{t('review_management')}</span>
        </div>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">{t('reviews_trust_manual')}</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <span className="text-xs font-bold text-gray-300">01</span>
                <p className="text-sm text-gray-800 leading-relaxed">{t('check_reviews_daily')}</p>
              </div>

              <div className="flex gap-4">
                <span className="text-xs font-bold text-gray-300">02</span>
                <p className="text-sm text-gray-800 leading-relaxed">{t('remove_suspicious')}</p>
              </div>

              <div className="flex gap-4">
                <span className="text-xs font-bold text-gray-300">03</span>
                <p className="text-sm text-gray-800 leading-relaxed">{t('respond_clean_calm')}</p>
              </div>

              <div className="flex gap-4">
                <span className="text-xs font-bold text-gray-300">04</span>
                <p className="text-sm text-gray-800 leading-relaxed">{t('surprise_moment')}</p>
              </div>

              <div className="flex gap-4">
                <span className="text-xs font-bold text-gray-300">05</span>
                <p className="text-sm text-gray-800 leading-relaxed">{t('cleanliness_matters')}</p>
              </div>

              <div className="flex gap-4">
                <span className="text-xs font-bold text-gray-300">06</span>
                <p className="text-sm text-gray-800 leading-relaxed">{t('smile_matters')}</p>
              </div>
            </div>
          </section>

          <div className="pt-8 border-t border-gray-100">
            <p className="text-xs font-bold text-black italic">
              {t('speed_clarity_trust')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
