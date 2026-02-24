"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Auth check
    try {
      const supabase = getSupabase();
      supabase.auth.getUser().then(({ data }) => {
        const u = data?.user;
        const name = (u?.user_metadata as any)?.name || u?.email || null;
        setUserName(name);
        setUserEmail(u?.email || null);
      });
    } catch {}
  }, []);

  return (
    <div className="flex flex-col min-h-full text-black px-4 md:px-0 py-4 md:py-8 pb-32">
      <h3 className="text-lg font-medium text-gray-900 mb-6">{t('settings')}</h3>
      
      <div className="space-y-6 max-w-3xl">
        {/* Credentials Section */}
        <section className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{t('credentials')}</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">{userName || t('user_label')}</div>
              <div className="text-sm text-gray-500">{userEmail || t('no_email_label')}</div>
            </div>
          </div>
        </section>

        {/* General Settings */}
        <section className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
           <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{t('general')}</h4>
           
           <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
               <div>
                 <div className="text-sm font-medium text-gray-900">{t('language')}</div>
                 <div className="text-xs text-gray-500">{t('language_toggle_desc')}</div>
               </div>
               
               <div className="flex items-center bg-gray-100 p-1 rounded-md">
                 <button 
                   onClick={() => setLanguage('en')}
                   className={`px-3 py-1 text-xs font-bold rounded transition-colors ${language === 'en' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
                 >
                   ENG
                 </button>
                 <button 
                   onClick={() => setLanguage('hr')}
                   className={`px-3 py-1 text-xs font-bold rounded transition-colors ${language === 'hr' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
                 >
                   CRO
                 </button>
               </div>
             </div>
           </div>
        </section>

        {/* Mobile App Section */}
        <section className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
           <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">{t('mobile_app')}</h4>
           <div className="flex flex-col gap-4">
             <p className="text-sm text-gray-600">
               {t('download_android')}
             </p>
             <a 
              href="/city-manager.apk" 
              download
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-fit"
            >
              <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('download_apk')}
            </a>
           </div>
        </section>
      </div>
    </div>
  );
}
