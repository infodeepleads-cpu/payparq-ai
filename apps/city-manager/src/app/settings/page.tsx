"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";

export default function SettingsPage() {
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
    <div className="flex flex-col h-full text-black p-4 md:p-8">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Settings</h3>
      
      <div className="space-y-6 max-w-2xl">
        {/* Credentials Section */}
        <section className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Credentials</h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">{userName || 'User'}</div>
              <div className="text-sm text-gray-500">{userEmail || 'No email'}</div>
            </div>
          </div>
        </section>

        {/* General Settings placeholder */}
        <section className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
           <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">General</h4>
           <p className="text-sm text-gray-500">Application settings will appear here.</p>
        </section>

        {/* Mobile App Section */}
        <section className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
           <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Mobile App</h4>
           <div className="flex flex-col gap-4">
             <p className="text-sm text-gray-600">
               Download the Android application to get push notifications and calendar integration.
             </p>
             <a 
               href="/city-manager.apk" 
               download
               className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-fit"
             >
               <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               Download Android APK
             </a>
           </div>
        </section>
      </div>
    </div>
  );
}
