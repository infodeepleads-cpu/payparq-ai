"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Parking");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
      } catch (e) {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  return (
    <main className="min-h-[100dvh] w-full bg-black text-white selection:bg-[#7C3AED]/30 overflow-x-hidden relative flex flex-col items-center">
      {/* Absolute Full Screen Black Background */}
      <div className="fixed inset-0 bg-black z-0 pointer-events-none" />

      {/* Sticky Header Background Container - Lifted to z-50 to be above everything */}
      <div className="sticky top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-20 bg-black w-full" />
        <div className="h-32 bg-gradient-to-b from-black via-black/95 to-transparent w-full" />
      </div>

      <div className="w-full max-w-[430px] px-6 pb-2 -mt-[180px] relative z-[60] flex flex-col">
        {/* Header Area */}
        <div className="flex items-center justify-between mb-10 h-11 relative">
          <div className="flex items-center gap-4 h-full">
            <div className="flex items-center justify-center w-9 h-9">
              <div className="h-7 w-7 rounded-[6px] bg-[#7C3AED] rotate-45 shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-white/20 flex items-center justify-center" />
            </div>
            <div className="text-[28px] tracking-tight font-bold text-white leading-none flex items-center h-full ml-1.5">parq</div>
          </div>

          {/* Minimalist Auth Widget */}
          <Link 
            href="/auth" 
            className="pointer-events-auto h-9 px-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center no-underline group active:scale-[0.98]"
          >
            <span className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">
              {user ? "Log out" : "Log in"}
            </span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 mb-10 text-[22px] font-semibold relative pointer-events-auto">
          {["Parking", "Vožnje", "Dostava"].map((tab) => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative cursor-pointer transition-colors"
            >
              <div className={activeTab === tab ? "text-white" : "text-white/30 hover:text-white transition-colors"}>
                {tab}
              </div>
              {activeTab === tab && (
                <div className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[#7C3AED] rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* Search Widget Text */}
        <Link href={{ pathname: "/map" }} className="mb-8 relative pointer-events-auto block no-underline">
          <div className="bg-black border-2 border-[#7C3AED] rounded-[24px] px-6 py-4 flex items-center justify-between shadow-[0_0_20px_rgba(124,58,237,0.2)] active:scale-[0.98] transition-transform">
            <span className="text-[24px] font-bold text-white">Kamo?</span>
            <span className="text-[24px] font-medium text-white">Kasnije</span>
          </div>
        </Link>

        {/* Main Grid Area */}
        <div className="grid grid-cols-12 gap-4 pb-2 relative pointer-events-auto -mt-4">
          {/* Chatbot Card - Large Violet */}
          <Link 
            href={{ pathname: "/", query: { show_chat: "true" } }}
            className="col-span-8 h-[160px] rounded-[32px] bg-[#7C3AED] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer no-underline"
          >
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg relative z-10">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.505 3.733 7.238.163.125.263.315.263.52v2.54a.444.444 0 0 0 .69.368l3.036-2.022a.89.89 0 0 1 .494-.148h1.784c5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2z" />
              </svg>
            </div>
            <div className="text-[22px] font-bold text-white leading-[1.2] tracking-tight relative z-10">
              Započni chat<br />s našim<br />chatbotom
            </div>
            {/* Abstract Pattern Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
          </Link>

          {/* Car Card - Right Small */}
          <div className="col-span-4 h-[160px] rounded-[32px] bg-[#1A162D] overflow-hidden relative group active:scale-[0.98] transition-transform cursor-pointer shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop" 
              alt="Car"
              className="w-full h-full object-cover opacity-90 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[18px] font-bold text-white tracking-tight">Sudjeluj</span>
            </div>
          </div>

          {/* People Card - Full Width 1st */}
          <div className="col-span-12 aspect-[12/6] rounded-[32px] bg-[#1A162D] overflow-hidden relative group active:scale-[0.98] transition-transform cursor-pointer shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop" 
              alt="People"
              className="w-full h-full object-cover opacity-90 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-5 left-8 right-8">
              <div className="flex flex-col gap-1">
                <span className="text-[22px] font-bold text-white tracking-tight leading-tight">Postani Partner</span>
                <span className="text-[14px] font-medium text-white/90 tracking-wide">2 klika, Live u 24h</span>
              </div>
            </div>
            <div className="absolute bottom-6 right-8">
              <Link 
                href="/auth?mode=signup"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C3AED] rounded-full text-[14px] font-bold shadow-lg no-underline text-white active:scale-95 transition-transform"
              >
                Saznaj više
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Phone Card - Full Width 2nd */}
          <div className="col-span-12 aspect-[12/6] rounded-[32px] bg-[#1A162D] overflow-hidden relative group active:scale-[0.98] transition-transform cursor-pointer shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=2070&auto=format&fit=crop" 
              alt="App"
              className="w-full h-full object-cover opacity-90 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-8 right-8">
              <div className="flex flex-col gap-1">
                <span className="text-[22px] font-bold text-white tracking-tight leading-tight">Upravljaj svime</span>
                <span className="text-[14px] font-medium text-white/90 tracking-wide">Iz dlana tvoje ruke</span>
              </div>
            </div>
          </div>
        </div>

        {/* Corp Text & Logo Only */}
        <div className="mt-6 mb-2 pt-8 border-t border-white/10 w-full">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-[5px] bg-[#7C3AED] rotate-45 shadow-[0_0_10px_rgba(124,58,237,0.3)] border border-white/20" />
              <div className="text-[20px] tracking-tight font-bold text-white leading-none">parq</div>
            </div>
            
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-white uppercase tracking-[0.16em]">
                Payparq Global Inc.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Dark Footer Background Container - Lifted to z-50 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-20 bg-gradient-to-t from-black via-black/95 to-transparent w-full" />
        <div className="h-6 bg-black w-full" />
      </div>
    </main>
  );
}
