"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [isInboxExpanded, setIsInboxExpanded] = useState(false);
  const [isRequestsExpanded, setIsRequestsExpanded] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);
  const [isVehiclesExpanded, setIsVehiclesExpanded] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [isFinanceExpanded, setIsFinanceExpanded] = useState(false);
  const [isStripeConnectExpanded, setIsStripeConnectExpanded] = useState(false);
  const [isTermsExpanded, setIsTermsExpanded] = useState(false);
  const [isApplePayConnected, setIsApplePayConnected] = useState(false);
  const [isGooglePayConnected, setIsGooglePayConnected] = useState(false);
  const [isCardConnected, setIsCardConnected] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [isLocallyVerified, setIsLocallyVerified] = useState<boolean | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [counts, setCounts] = useState({ messages: 0, requests: 0 });
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [isStripeConnectConnected, setIsStripeConnectConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndCounts = async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/auth");
          return;
        }
        setUser(user);

        // Fetch counts (mocked for now, but ready for real data)
        // In a real app, you'd fetch from 'messages' and 'verification_requests' tables
        setCounts({ messages: 2, requests: 1 });

        // API Sync with mobile-scanner project
        // If the user has role 2, 3, 5, or 6, we fetch their Stripe account details
        // from the mobile-scanner database to automatically link them.
        const metadata = user?.user_metadata || {};
        const metadataRoles = Array.isArray(metadata.roles) ? metadata.roles : [metadata.original_role || metadata.role];
        const roles = metadataRoles.filter(Boolean);
        
        if (roles.some((r: string) => ["2", "3", "5", "6"].includes(r))) {
          const { data: stripeData } = await supabase
            .from('stripe_accounts')
            .select('stripe_account_id, is_connected')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (stripeData?.is_connected) {
            setIsStripeConnectConnected(true);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndCounts();
  }, [router]);

  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      router.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNewRole = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      router.push("/auth?mode=signup");
    } catch (error) {
      console.error("New role redirect error:", error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  const metadata = user?.user_metadata || {};
  const roleLabels: Record<string, string> = {
    "0": "Korisnik",
    "1": "Vozač",
    "2": "Partner Parking Vlasnik",
    "3": "Ovlašteni zastupnik",
    "4": "Dostavljač",
    "5": "Referal",
    "6": "Agent",
    "10": "Administrator"
  };

  const isDeepleads = user?.email?.toLowerCase()?.startsWith('info.deepleads');
  const isPayparqSuperadmin = user?.email?.toLowerCase() === 'payparq@outlook.com';
  const isAdmin = isDeepleads || isPayparqSuperadmin || metadata.is_admin === true || (Array.isArray(metadata.roles) && metadata.roles.includes("10"));
  
  const deepleadsName = "Karlo Žamić";
  const deepleadsPhone = "+385915963139";
  const deepleadsAddress = "Obala Kneza Domagoja 52";
  
  const metadataRoles = Array.isArray(metadata.roles) ? metadata.roles : [metadata.original_role || metadata.role];
  const allRoles = (isDeepleads || isPayparqSuperadmin)
    ? ["3", "10", ...metadataRoles.filter((r: string | undefined) => r && r !== "3" && r !== "10")]
    : metadataRoles.filter(Boolean) as string[];
  
  const displayRoles = allRoles.length > 0 
    ? allRoles.map((r: string) => roleLabels[r] || "Korisnik")
    : ["Korisnik"];

  // Deepleads and Payparq Superadmin are always verified
  const isVerified = isLocallyVerified !== null ? isLocallyVerified : (isDeepleads || isPayparqSuperadmin || metadata.is_verified === true);

  const profileFields: { label: string; value: any; uppercase?: boolean }[] = [
    { label: "Email Adresa", value: user?.email },
    { label: "Ime i Prezime", value: metadata.full_name || metadata.name || ((isDeepleads || isPayparqSuperadmin) ? deepleadsName : null) },
    { label: "Broj Mobitela", value: metadata.phone || ((isDeepleads || isPayparqSuperadmin) ? deepleadsPhone : null) },
    { label: "Adresa", value: metadata.address || ((isDeepleads || isPayparqSuperadmin) ? deepleadsAddress : null) },
    ...(allRoles.includes("2") ? [{ label: "Kapacitet Parkinga", value: metadata.parking_capacity ? `${metadata.parking_capacity} mjesta` : null }] : []),
    { label: "Uloge", value: displayRoles }
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white selection:bg-[#7C3AED]/30 relative flex flex-col items-center overflow-x-hidden">
      {/* Absolute Full Screen Black Background */}
      <div className="fixed inset-0 bg-black z-0 pointer-events-none" />

      {/* Sticky Header Background Container - matching home page */}
      <div className="sticky top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-20 bg-black w-full" />
        <div className="h-32 bg-gradient-to-b from-black via-black/95 to-transparent w-full" />
      </div>

      <div className="w-full max-w-[430px] px-6 pb-10 -mt-[180px] relative z-[60] flex flex-col items-center">
        {/* Header Area */}
        <div className="flex items-center justify-between w-full mb-10 h-11 relative">
          <Link href="/" className="flex items-center gap-4 h-full no-underline active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-center w-9 h-9">
              <div className="h-7 w-7 rounded-[6px] bg-[#7C3AED] rotate-45 shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-white/20 flex items-center justify-center" />
            </div>
            <div className="text-[28px] tracking-tight font-bold text-white leading-none flex items-center h-full ml-1.5">parq</div>
          </Link>
          <button 
            onClick={handleLogout}
            className="h-9 px-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-[13px] font-semibold text-white/70 hover:text-white active:scale-[0.98]"
          >
            Odjava
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 mb-10 w-full text-center">
          <div className="h-20 w-20 rounded-3xl bg-[#7C3AED] flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_rgba(124,58,237,0.4)] border border-white/20">
            {(metadata.full_name || metadata.name || ((isDeepleads || isPayparqSuperadmin) ? deepleadsName : user?.email))?.[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {metadata.full_name || metadata.name || ((isDeepleads || isPayparqSuperadmin) ? deepleadsName : "Korisnik")}
            </h1>
            <div className="flex items-center gap-2 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/10">
              <div className={`h-2 w-2 rounded-full ${isVerified ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]'}`} />
              <span className="text-[13px] font-semibold text-white/70">
                {isVerified ? 'Verificiran' : 'Provjera u tijeku'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 w-full">
          {/* Inbox Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 px-6">Inbox</h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div 
                  className="bg-white/[0.03] rounded-[28px] p-6 border border-white/10 flex items-center justify-between group hover:bg-white/[0.06] transition-all active:scale-[0.98] cursor-pointer"
                  onClick={() => setIsInboxExpanded(!isInboxExpanded)}
                >
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-transparent flex items-center justify-center border border-[#7C3AED]/30 group-hover:bg-[#7C3AED]/10 transition-colors">
                      <svg className="w-6 h-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">Poruke</span>
                        {counts.messages > 0 && (
                          <div className="px-2 py-0.5 rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
                            {counts.messages}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-white/40">Pregledajte vaše obavijesti</span>
                    </div>
                  </div>
                  <div className={`h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#7C3AED]/40 transition-all ${isInboxExpanded ? 'rotate-45 bg-[#7C3AED]/20 border-[#7C3AED]/40' : ''}`}>
                    <svg className={`w-4 h-4 ${isInboxExpanded ? 'text-[#7C3AED]' : 'text-white/30 group-hover:text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isInboxExpanded ? 'max-h-[800px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                  <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 flex flex-col gap-2 max-h-[600px] overflow-y-auto scrollbar-hide">
                    {/* New Message Input at the top of Inbox */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-2 mb-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">Nova poruka podršci</span>
                        <span className={`text-[10px] font-bold ${replyText.length > 160 ? 'text-red-500' : 'text-white/20'}`}>
                          {replyText.length}/160
                        </span>
                      </div>
                      <textarea 
                        value={expandedMessageId === null ? replyText : ""}
                        onChange={(e) => expandedMessageId === null && setReplyText(e.target.value.slice(0, 160))}
                        placeholder="Napišite poruku..."
                        className="w-full bg-white/[0.01] border border-white/5 rounded-lg p-3 text-white text-[12px] focus:outline-none focus:border-[#7C3AED]/50 transition-colors resize-none h-20 placeholder:text-white/10"
                      />
                      <button 
                        onClick={() => {
                          if (replyText.trim() && expandedMessageId === null) {
                            setIsSendingMessage(true);
                            setTimeout(() => {
                              alert(`Nova poruka poslana podršci: ${replyText}`);
                              setReplyText("");
                              setIsSendingMessage(false);
                            }, 1000);
                          }
                        }}
                        disabled={!replyText.trim() || expandedMessageId !== null || isSendingMessage}
                        className="h-9 w-full rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center"
                      >
                        {isSendingMessage ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Pošalji poruku'
                        )}
                      </button>
                    </div>

                    <div className="h-[1px] bg-white/5 w-full my-2" />

                    {counts.messages > 0 ? (
                      Array.from({ length: counts.messages }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div 
                            onClick={() => {
                              setExpandedMessageId(expandedMessageId === i ? null : i);
                              setIsReplying(false);
                            }}
                            className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-1">
                                <span className="text-[13px] font-bold text-white/90">Nova obavijest #{i + 1}</span>
                                <span className="text-[11px] text-white/40">Sustavna poruka</span>
                              </div>
                              <svg className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedMessageId === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                            {expandedMessageId === i && (
                              <div className="px-4 py-3 rounded-xl bg-white/[0.01] border border-white/5 text-[12px] text-white/60 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-3">
                                <p>Ovo je detaljan pregled vaše obavijesti. Ovdje će se nalaziti puni tekst poruke poslane od strane administratora ili sustava.</p>
                                
                                {!isReplying ? (
                                  <button 
                                    onClick={() => setIsReplying(true)}
                                    className="h-9 w-full rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold uppercase tracking-wider transition-all mt-1 flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Odgovori
                                  </button>
                                ) : (
                                  <div className="flex flex-col gap-2 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">Slanje odgovora</span>
                                      <span className={`text-[10px] font-bold ${replyText.length > 160 ? 'text-red-500' : 'text-white/20'}`}>
                                        {replyText.length}/160
                                      </span>
                                    </div>
                                    <textarea 
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value.slice(0, 160))}
                                      placeholder="Napišite vaš odgovor ovdje..."
                                      autoFocus
                                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-3 text-white text-[12px] focus:outline-none focus:border-[#7C3AED]/50 transition-colors resize-none h-24 placeholder:text-white/10"
                                    />
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => {
                                          setIsReplying(false);
                                          setReplyText("");
                                        }}
                                        className="h-9 flex-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 text-[11px] font-bold uppercase tracking-wider transition-all"
                                      >
                                        Odustani
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (replyText.trim()) {
                                            setIsSendingMessage(true);
                                            setTimeout(() => {
                                              alert(`Odgovor poslan: ${replyText}`);
                                              setReplyText("");
                                              setExpandedMessageId(null);
                                              setIsReplying(false);
                                              setIsSendingMessage(false);
                                            }, 1000);
                                          }
                                        }}
                                        disabled={!replyText.trim() || isSendingMessage}
                                        className="h-9 flex-[2] rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center"
                                      >
                                        {isSendingMessage ? (
                                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                          'Pošalji'
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <span className="text-center py-4 text-xs text-white/20">Nema novih poruka</span>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-2">
                  <div 
                    className="bg-white/[0.03] rounded-[28px] p-6 border border-white/10 flex items-center justify-between group hover:bg-white/[0.06] transition-all active:scale-[0.98] cursor-pointer"
                    onClick={() => setIsRequestsExpanded(!isRequestsExpanded)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-transparent flex items-center justify-center border border-[#7C3AED]/30 group-hover:bg-[#7C3AED]/10 transition-colors">
                        <svg className="w-6 h-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">Zahtjevi za verifikaciju (ADMIN)</span>
                          {counts.requests > 0 && (
                            <div className="px-2 py-0.5 rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
                              {counts.requests}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-white/40">Svi korisnici koji čekaju potvrdu</span>
                      </div>
                    </div>
                    <div className={`h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#7C3AED]/40 transition-all ${isRequestsExpanded ? 'rotate-45 bg-[#7C3AED]/20 border-[#7C3AED]/40' : ''}`}>
                      <svg className={`w-4 h-4 ${isRequestsExpanded ? 'text-[#7C3AED]' : 'text-white/30 group-hover:text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isRequestsExpanded ? 'max-h-[600px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 flex flex-col gap-2 max-h-[500px] overflow-y-auto scrollbar-hide">
                      {counts.requests > 0 ? (
                        Array.from({ length: counts.requests }).map((_, i) => (
                          <div key={i} className="flex flex-col gap-2">
                            <div 
                              onClick={() => setExpandedRequestId(expandedRequestId === i ? null : i)}
                              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[13px] font-bold text-white/90">Zahtjev #{1002 + i}</span>
                                  <span className="text-[11px] text-white/40">Korisnik: Marko Marić</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                                  <svg className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedRequestId === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            {expandedRequestId === i && (
                              <div className="px-4 py-3 rounded-xl bg-white/[0.01] border border-white/5 text-[12px] text-white/60 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-3">
                                <div>
                                  <span className="font-bold text-white/80 block mb-1">Detalji zahtjeva:</span>
                                  <ul className="space-y-1 list-disc list-inside">
                                    <li>Tip: Vozač</li>
                                    <li>Status: Na čekanju</li>
                                    <li>Vrijeme: Prije 2 sata</li>
                                  </ul>
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={() => alert(`Zahtjev #${1002 + i} odobren.`)}
                                    className="flex-1 h-10 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-500 text-[11px] font-bold uppercase tracking-wider transition-all"
                                  >
                                    Odobri
                                  </button>
                                  <button 
                                    onClick={() => alert(`Zahtjev #${1002 + i} odbijen.`)}
                                    className="flex-1 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-500 text-[11px] font-bold uppercase tracking-wider transition-all"
                                  >
                                    Odbij
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-center py-4 text-xs text-white/20">Nema zahtjeva na čekanju</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 px-6">Vozila</h2>
            <div className="flex flex-col gap-2">
              <div 
                className="bg-white/[0.03] rounded-[28px] p-6 border border-white/10 flex items-center justify-between group hover:bg-white/[0.06] transition-all active:scale-[0.98] cursor-pointer"
                onClick={() => setIsVehiclesExpanded(!isVehiclesExpanded)}
              >
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center border border-[#7C3AED]/20 group-hover:bg-[#7C3AED]/20 transition-colors">
                    <svg className="w-6 h-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-bold text-white">Upravljajte registarskim oznakama</span>
                    <span className="text-sm text-white/40">Dodajte ili promijenite vozila</span>
                  </div>
                </div>
                <div className={`h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#7C3AED]/40 transition-all ${isVehiclesExpanded ? 'rotate-45 bg-[#7C3AED]/20 border-[#7C3AED]/40' : ''}`}>
                  <svg className={`w-4 h-4 ${isVehiclesExpanded ? 'text-[#7C3AED]' : 'text-white/30 group-hover:text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isVehiclesExpanded ? 'max-h-96 opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-1">Registracijska oznaka</label>
                    <input 
                      type="text"
                      placeholder="MA679XX"
                      value={newVehiclePlate}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (val.length <= 7) setNewVehiclePlate(val);
                      }}
                      className="h-12 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#7C3AED]/50 transition-colors placeholder:text-white/10"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (newVehiclePlate.length < 5) {
                        alert('Molimo unesite ispravnu registracijsku oznaku.');
                        return;
                      }
                      alert(`Vozilo s tablicom ${newVehiclePlate} je uspješno dodano!`);
                      setNewVehiclePlate("");
                      setIsVehiclesExpanded(false);
                    }}
                    className="h-12 w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-bold transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                  >
                    Spremi vozilo
                  </button>
                  <div className="pt-2 border-t border-white/5 mt-1">
                    <span className="text-[11px] text-white/30 px-1 uppercase font-bold tracking-wider">Vaša vozila</span>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                        <span className="text-sm font-medium text-white/80 tracking-wide">MA 123 AB</span>
                        <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold">AKTIVNO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 px-6 mt-4">Financije</h2>
            <div className="flex flex-col gap-2">
              <div 
                className="bg-white/[0.03] rounded-[28px] p-6 border border-white/10 flex items-center justify-between group hover:bg-white/[0.06] transition-all active:scale-[0.98] cursor-pointer"
                onClick={() => setIsFinanceExpanded(!isFinanceExpanded)}
              >
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-[#7C3AED]/10 flex items-center justify-center border border-[#7C3AED]/20 group-hover:bg-[#7C3AED]/20 transition-colors">
                    <svg className="w-6 h-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-bold text-white">Načini plaćanja</span>
                    <span className="text-sm text-white/40">Dodaj način plaćanja</span>
                  </div>
                </div>
                <div className={`h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#7C3AED]/40 transition-all ${isFinanceExpanded ? 'rotate-45 bg-[#7C3AED]/20 border-[#7C3AED]/40' : ''}`}>
                  <svg className={`w-4 h-4 ${isFinanceExpanded ? 'text-[#7C3AED]' : 'text-white/30 group-hover:text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFinanceExpanded ? 'max-h-[600px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        setIsApplePayConnected(!isApplePayConnected);
                        if (!isApplePayConnected) alert('Apple Pay povezan!');
                      }}
                      className={`h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group/btn ${isApplePayConnected ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isApplePayConnected ? 'text-[#7C3AED]' : 'text-white/70 group-hover/btn:text-white'}`}>Apple Pay</span>
                      <span className="text-[9px] font-bold uppercase">{isApplePayConnected ? 'POVEZANO' : 'POVEŽI'}</span>
                    </button>

                    <button 
                      onClick={() => {
                        setIsGooglePayConnected(!isGooglePayConnected);
                        if (!isGooglePayConnected) alert('Google Pay povezan!');
                      }}
                      className={`h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group/btn ${isGooglePayConnected ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isGooglePayConnected ? 'text-[#7C3AED]' : 'text-white/70 group-hover/btn:text-white'}`}>Google Pay</span>
                      <span className="text-[9px] font-bold uppercase">{isGooglePayConnected ? 'POVEZANO' : 'POVEŽI'}</span>
                    </button>

                    <button 
                      onClick={() => {
                        if (!isCardConnected) {
                          // Show card input logic handled below
                        } else {
                          setIsCardConnected(false);
                        }
                      }}
                      className={`h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group/btn ${isCardConnected ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isCardConnected ? 'text-[#7C3AED]' : 'text-white/70 group-hover/btn:text-white'}`}>Kartica</span>
                      <span className="text-[9px] font-bold uppercase">{isCardConnected ? 'POVEZANO' : 'POVEŽI'}</span>
                    </button>

                    <button 
                      disabled={!(isApplePayConnected || isGooglePayConnected || isCardConnected)}
                      onClick={() => alert('Gotovina aktivirana!')}
                      className={`h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group/btn ${!(isApplePayConnected || isGooglePayConnected || isCardConnected) ? 'opacity-50 cursor-not-allowed bg-black/40 border-white/5' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Gotovina</span>
                        {!(isApplePayConnected || isGooglePayConnected || isCardConnected) && (
                          <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase">{!(isApplePayConnected || isGooglePayConnected || isCardConnected) ? 'ZAKLJUČANO' : 'AKTIVIRAJ'}</span>
                    </button>
                  </div>

                  {!isCardConnected && (
                     <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                       <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Broj kartice</label>
                         <input 
                           type="text"
                           placeholder="**** **** **** ****"
                           value={cardNumber}
                           onChange={(e) => {
                             const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                             setCardNumber(val.replace(/(\d{4})/g, '$1 ').trim());
                           }}
                           className="h-11 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#7C3AED]/50 transition-colors placeholder:text-white/10"
                         />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                         <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Istek (MM/GG)</label>
                           <input 
                             type="text"
                             placeholder="MM/GG"
                             value={cardExpiry}
                             onChange={(e) => {
                               let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                               if (val.length >= 3) {
                                 val = val.slice(0, 2) + '/' + val.slice(2);
                               }
                               setCardExpiry(val);
                             }}
                             className="h-11 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#7C3AED]/50 transition-colors placeholder:text-white/10"
                           />
                         </div>
                         <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">CVC</label>
                           <input 
                             type="password"
                             placeholder="***"
                             value={cardCvc}
                             onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                             className="h-11 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-[#7C3AED]/50 transition-colors placeholder:text-white/10"
                           />
                         </div>
                       </div>

                       <button 
                         onClick={() => {
                           const cleanCard = cardNumber.replace(/\s/g, '');
                           if (cleanCard.length === 16 && cardExpiry.length === 5 && cardCvc.length === 3) {
                             setIsCardConnected(true);
                             // Keep cardNumber for display but masked logic will handle it
                             alert('Kartica uspješno povezana!');
                           } else {
                             alert('Molimo ispravno unesite sve podatke s kartice.');
                           }
                         }}
                         className="h-11 w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold uppercase transition-all active:scale-[0.95] mt-1 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                       >
                         Dodaj Karticu
                       </button>
                     </div>
                   )}

                   {isCardConnected && (
                     <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between group animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center gap-3">
                         <div className="h-8 w-11 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                           <svg className="w-6 h-6 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                             <rect x="2" y="5" width="20" height="14" rx="2" />
                             <line x1="2" y1="10" x2="22" y2="10" />
                           </svg>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[12px] font-bold text-white/90">
                             **** **** **** {cardNumber.slice(-4)}
                           </span>
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Povezano</span>
                             <span className="text-[10px] text-white/20 font-medium">{cardExpiry}</span>
                           </div>
                         </div>
                       </div>
                       <button 
                         onClick={() => {
                           setIsCardConnected(false);
                           setCardNumber("");
                           setCardExpiry("");
                           setCardCvc("");
                         }}
                         className="h-8 w-8 rounded-full hover:bg-red-500/10 flex items-center justify-center group/del transition-colors"
                       >
                         <svg className="w-4 h-4 text-white/20 group-hover/del:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                       </button>
                     </div>
                   )}

                  <div className="p-3 rounded-xl bg-[#7C3AED]/5 border border-[#7C3AED]/10">
                    <div className="flex items-center gap-2 text-[#7C3AED] mb-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Sigurnost</span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Sva plaćanja se obrađuju putem Stripe platforme. Vaši podaci su kriptirani i sigurni.
                    </p>
                  </div>
                </div>
              </div>

              {(allRoles.includes("2") || allRoles.includes("3") || allRoles.includes("5") || allRoles.includes("6")) && (
                <div className="flex flex-col gap-2">
                  <div 
                    className="bg-white/[0.03] rounded-[28px] p-6 border border-white/10 flex items-center justify-between group hover:bg-white/[0.06] transition-all active:scale-[0.98] cursor-pointer"
                    onClick={() => setIsStripeConnectExpanded(!isStripeConnectExpanded)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-transparent flex items-center justify-center border border-[#7C3AED]/30 group-hover:bg-[#7C3AED]/10 transition-colors">
                        <svg className="w-6 h-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-bold text-white">Račun za uplate</span>
                        <span className="text-sm text-white/40">Upravljajte vašim isplatama</span>
                      </div>
                    </div>
                    <div className={`h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#7C3AED]/40 transition-all ${isStripeConnectExpanded ? 'rotate-45 bg-[#7C3AED]/20 border-[#7C3AED]/40' : ''}`}>
                      <svg className={`w-4 h-4 ${isStripeConnectExpanded ? 'text-[#7C3AED]' : 'text-white/30 group-hover:text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isStripeConnectExpanded ? 'max-h-[600px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
                      <div className="flex flex-col gap-1 px-1">
                        <p className="text-[10px] text-white/20 leading-relaxed">Povežite vaš Stripe Connect račun za primanje uplata od parkinga.</p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            setIsStripeConnectConnected(!isStripeConnectConnected);
                            if (!isStripeConnectConnected) alert('Povezivanje sa Stripe Connect... Preusmjeravanje na Stripe onboarding.');
                          }}
                          className={`h-14 rounded-2xl border transition-all flex items-center justify-between px-5 group/connect ${isStripeConnectConnected ? 'bg-[#7C3AED]/10 border-[#7C3AED]/30' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${isStripeConnectConnected ? 'bg-[#7C3AED]/20' : 'bg-white/5 group-hover/connect:bg-white/10'}`}>
                              <svg className={`w-5 h-5 ${isStripeConnectConnected ? 'text-[#7C3AED]' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-[13px] font-bold text-white">Stripe Connect</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isStripeConnectConnected ? 'text-green-500' : 'text-white/20'}`}>
                                {isStripeConnectConnected ? 'Povezano' : 'Nije povezano'}
                              </span>
                            </div>
                          </div>
                          <div className={`h-8 px-4 rounded-full flex items-center justify-center text-[11px] font-bold uppercase tracking-wider transition-all ${isStripeConnectConnected ? 'bg-white/5 text-white/40' : 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'}`}>
                            {isStripeConnectConnected ? 'Uredi' : 'Poveži'}
                          </div>
                        </button>

                        {!isStripeConnectConnected && (
                          <button 
                            onClick={async () => {
                              const supabase = getSupabase();
                              const { data: { user } } = await supabase.auth.getUser();
                              if (user) {
                                alert('Dohvaćanje računa iz PayParq sustava...');
                                // Actual sync logic
                                const { data: stripeData } = await supabase
                                  .from('stripe_accounts')
                                  .select('stripe_account_id, is_connected')
                                  .eq('user_id', user.id)
                                  .maybeSingle();
                                  
                                if (stripeData?.is_connected) {
                                  setIsStripeConnectConnected(true);
                                  alert('Račun uspješno povezan s PayParq sustavom!');
                                } else {
                                  alert('Nije pronađen povezani račun na PayParq sustavu. Molimo koristite standardni postupak povezivanja.');
                                }
                              }
                            }}
                            className="h-11 w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Poveži isti račun s PayParq-a
                          </button>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 flex gap-3">
                        <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[10px] text-blue-500/60 leading-relaxed">
                          Povezivanjem Stripe Connect računa omogućujete automatsku isplatu vašeg udjela od svake transakcije direktno na vaš bankovni račun.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nova Uloga section with header */}
            <div className="flex flex-col gap-4 mt-4">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 px-6">Doregistracija</h2>
              <button 
                onClick={handleNewRole}
                className="w-full text-left bg-transparent border-none p-0 focus:outline-none group"
              >
                <div className="bg-[#7C3AED]/10 rounded-[28px] p-6 border border-[#7C3AED]/20 flex items-center justify-between group-hover:bg-[#7C3AED]/20 transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
                      <svg className="w-6 h-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-bold text-white">Nova uloga</span>
                      <span className="text-sm text-[#7C3AED]/70 font-medium">Registrirajte se za novu ulogu</span>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[#7C3AED]/10 flex items-center justify-center border border-[#7C3AED]/20 group-hover:border-[#7C3AED] transition-colors">
                    <svg className="w-4 h-4 text-[#7C3AED]/60 group-hover:text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {!isVerified && (
            <div className="bg-amber-500/[0.05] rounded-[28px] p-6 border border-amber-500/20 flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                <span className="text-[13px] font-bold text-amber-500 uppercase tracking-widest">Verifikacija u tijeku</span>
              </div>
              <p className="text-[13px] text-amber-500/70 leading-relaxed font-medium">
                Vaš profil je u procesu odobravanja od strane ovlaštenog zastupnika. Nakon provjere podataka, dobit ćete puni pristup svim funkcionalnostima.
              </p>
              <button 
                onClick={() => {
                  setIsLocallyVerified(true);
                  alert('Vaš profil je uspješno verificiran!');
                }}
                className="mt-2 h-10 w-full rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                Simuliraj verifikaciju (Badge)
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div 
              className="flex items-center justify-between px-6 cursor-pointer group"
              onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">Osobni podaci</h2>
                <svg 
                  className={`w-4 h-4 text-white/20 group-hover:text-white/40 transition-transform duration-300 ${isProfileExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isProfileExpanded ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
              <div className="bg-white/[0.03] rounded-[32px] p-6 border border-white/10 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {profileFields.map((field, idx) => (
                    <div key={idx} className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col gap-1 relative group/field transition-colors hover:border-[#7C3AED]/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{field.label}</span>
                        {field.label !== "Email Adresa" && field.label !== "Uloge" && (
                          <button className="opacity-0 group-hover/field:opacity-100 transition-opacity text-[#7C3AED] hover:text-[#9F67FF] bg-black/40 p-1 rounded-md border border-white/5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {Array.isArray(field.value) ? (
                        <div className="flex flex-col gap-1">
                          {field.value.length > 0 ? (
                            field.value.map((role: string, i: number) => (
                              <span
                                key={i}
                                className="text-sm font-semibold text-[#7C3AED]"
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm font-semibold text-white/20 italic">
                              Nije uneseno
                            </span>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`text-sm font-semibold ${
                            field.value ? "text-white/90" : "text-white/20 italic"
                          } ${field.uppercase ? "uppercase tracking-wider" : ""}`}
                        >
                          {field.value || "Nije uneseno"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <div 
              className="flex items-center justify-between px-6 cursor-pointer group"
              onClick={() => setIsTermsExpanded(!isTermsExpanded)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">Uvjeti korištenja</h2>
                <svg 
                  className={`w-4 h-4 text-white/20 group-hover:text-white/40 transition-transform duration-300 ${isTermsExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isTermsExpanded ? 'max-h-[2000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
              <div className="bg-white/[0.03] rounded-[32px] p-8 border border-white/10 flex flex-col gap-6">
                <div className="flex flex-col gap-6 text-white/60 leading-relaxed text-[13px]">
                  <section className="flex flex-col gap-2">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">1. Opće odredbe</h3>
                    <p>Korištenjem aplikacije PayParq prihvaćate sve navedene uvjete korištenja. Ova platforma omogućuje upravljanje parking uslugama i plaćanjima.</p>
                  </section>
                  
                  <section className="flex flex-col gap-2">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">2. Privatnost i podaci</h3>
                    <p>Vaši osobni podaci se obrađuju u skladu s GDPR regulativom. Prikupljamo samo nužne podatke za pružanje usluge (email, ime, registracijske oznake).</p>
                  </section>
                  
                  <section className="flex flex-col gap-2">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">3. Plaćanja</h3>
                    <p>Sva plaćanja se izvršavaju putem Stripe platforme. PayParq ne pohranjuje pune brojeve vaših kreditnih kartica.</p>
                  </section>
                  
                  <section className="flex flex-col gap-2">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">4. Odgovornost</h3>
                    <p>Korisnik je odgovoran za točnost unesenih podataka, posebno registracijskih oznaka vozila radi ispravne naplate parkinga.</p>
                  </section>

                  <div className="pt-4 border-t border-white/5 mt-2">
                    <p className="text-[11px] italic">Zadnja izmjena: 02. ožujka 2026.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-2 mb-1 pt-4 border-t border-white/10 w-full max-w-[430px] px-6">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-3 group no-underline">
              <div className="h-6 w-6 rounded-[5px] bg-[#7C3AED] rotate-45 shadow-[0_0_10px_rgba(124,58,237,0.3)] border border-white/20 group-hover:scale-110 transition-transform" />
              <div className="text-[20px] tracking-tight font-bold text-white leading-none group-hover:text-white/90 transition-colors">parq</div>
            </Link>
            
            <div className="space-y-1">
              <p className="text-[11px] text-white/30 tracking-wider">
                Sva prava pridržana © 2026 PayParq Global Inc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
