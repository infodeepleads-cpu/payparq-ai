"use client";

// Deployment trigger: 2026-03-03 (Standard)
import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type VerificationRequest = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  roleLabel: string;
  createdAt: string;
  canApprove: boolean;
};

const roleTerms: Record<string, { summary: string; details: string[] }> = {
  "0": {
    summary: "Kao Korisnik, prihvaćate opće uvjete korištenja platforme i pravila o privatnosti.",
    details: []
  },
  "1": {
    summary: "Kao Vozač, prihvaćate uvjete o posredovanju i povjerljivosti podataka.",
    details: []
  },
  "2": {
    summary: "Kao Partner Parking Vlasnik, potvrđujete vlasništvo i prihvaćate uvjete o zakupu prostora.",
    details: []
  },
  "3": {
    summary: "Kao Ovlašteni zastupnik, potvrđujete pravo na zastupanje i prihvaćate pravnu odgovornost.",
    details: []
  },
  "4": {
    summary: "Kao Dostavljač, prihvaćate uvjete partnerskog programa i pravila o provizijama.",
    details: []
  },
  "5": {
    summary: "Kao Referal, prihvaćate uvjete programa preporuka i pravila o bonusima.",
    details: []
  },
  "6": {
    summary: "Kao Agent, prihvaćate uvjete suradnje, NDA i pravila o terenskom radu.",
    details: []
  },
  "10": {
    summary: "Kao Administrator, prihvaćate interne sigurnosne i operativne protokole platforme.",
    details: []
  }
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
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
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApplePayConnected, setIsApplePayConnected] = useState(false);
  const [isGooglePayConnected, setIsGooglePayConnected] = useState(false);
  const [isCardConnected, setIsCardConnected] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [isLocallyVerified, setIsLocallyVerified] = useState<boolean | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [vehiclePlates, setVehiclePlates] = useState<string[]>([]);
  const [inboxMessages, setInboxMessages] = useState<{
    id: string;
    subject: string;
    body: string;
    from: string;
    createdAt: string;
  }[]>([]);
  const [counts, setCounts] = useState({ messages: 0, requests: 0 });
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [isStripeConnectConnected, setIsStripeConnectConnected] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<"applepay" | "googlepay" | null>(null);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [editingField, setEditingField] = useState<"full_name" | "phone" | "address" | "parking_capacity" | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isSavingProfileField, setIsSavingProfileField] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("email_verified") !== "1") return;
    setShowVerificationSuccess(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("email_verified");
    const nextQuery = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${nextQuery ? `?${nextQuery}` : ""}${url.hash}`);
  }, [searchParams]);

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
        const metadata = user?.user_metadata || {};
        const isInfoDeepLeads = user?.email?.toLowerCase()?.startsWith("info.deepleads");

        // Fetch profile data from public.profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileData) {
          setProfile(profileData);
        } else {
          setProfile({
            id: user.id,
            full_name: metadata.full_name || metadata.name || (isInfoDeepLeads ? "Karlo Žamić" : null),
            role: metadata.role || (isInfoDeepLeads ? "3" : null),
            phone: metadata.phone || (isInfoDeepLeads ? "+385915963139" : null),
            address: metadata.address || (isInfoDeepLeads ? "Obala Kneza Domagoja 52" : null),
            parking_capacity: metadata.parking_capacity || null
          });
        }

        if (isInfoDeepLeads) {
          const needsMetadataPatch = !metadata.full_name || !metadata.phone || !metadata.address || !metadata.role;
          if (needsMetadataPatch) {
            await supabase.auth.updateUser({
              data: {
                ...metadata,
                full_name: metadata.full_name || metadata.name || "Karlo Žamić",
                role: metadata.role || "3",
                original_role: metadata.original_role || metadata.role || "3",
                phone: metadata.phone || "+385915963139",
                address: metadata.address || "Obala Kneza Domagoja 52"
              }
            });
          }
        }

        const savedPlatesRaw = localStorage.getItem(`pp_vehicle_plates_${user.id}`);
        if (savedPlatesRaw) {
          const parsedPlates = JSON.parse(savedPlatesRaw);
          if (Array.isArray(parsedPlates)) {
            setVehiclePlates(parsedPlates.filter((plate) => typeof plate === "string"));
          }
        }

        const { data: emailsData } = await supabase
          .from("emails")
          .select("id,subject,html_body,text_body,from_address,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const mappedEmails = (emailsData || []).map((email: any) => ({
          id: String(email.id),
          subject: email.subject || "Dobrodošli u PayParq",
          body: email.text_body || email.html_body || "",
          from: email.from_address || "PayParq",
          createdAt: email.created_at || new Date().toISOString()
        }));

        setInboxMessages(mappedEmails);

        // API Sync with mobile-scanner project
        // If the user has role 2, 3, 5, or 6, we fetch their Stripe account details
        // from the mobile-scanner database to automatically link them.
        const metadataRoles = Array.isArray(metadata.roles) ? metadata.roles : [metadata.original_role || metadata.role];
        const roles = metadataRoles.filter(Boolean);
        const isPayparqSuperadmin = user?.email?.toLowerCase() === "payparq@outlook.com";
        const canApproveVerifications = isPayparqSuperadmin || roles.includes("3");
        let requestCount = 0;

        if (canApproveVerifications) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const verificationRes = await fetch("/api/verification", {
              headers: {
                "Authorization": `Bearer ${session.access_token}`
              }
            });
            if (verificationRes.ok) {
              const verificationData = await verificationRes.json();
              const requests = Array.isArray(verificationData?.requests) ? verificationData.requests : [];
              setVerificationRequests(requests);
              requestCount = requests.length;
            } else {
              setVerificationRequests([]);
            }
          }
        } else {
          setVerificationRequests([]);
        }

        setCounts({ messages: mappedEmails.length, requests: requestCount });
        
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

  const handleConnectWallet = async (wallet: "applepay" | "googlepay") => {
    try {
      setConnectingWallet(wallet);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          flow_type: "setup",
          customer_email: user?.email || undefined,
          wallet_preference: wallet
        })
      });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        alert(data?.error || "Neuspjelo pokretanje povezivanja novčanika.");
        return;
      }
      if (wallet === "applepay") {
        setIsApplePayConnected(true);
      } else {
        setIsGooglePayConnected(true);
      }
      window.location.assign(data.url);
    } catch (error) {
      console.error("Wallet connect error:", error);
      alert("Došlo je do pogreške pri povezivanju. Pokušajte ponovno.");
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "obriši") {
      return;
    }

    try {
      setIsDeleting(true);
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace("/auth");
        return;
      }

      const response = await fetch("/api/auth/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        await supabase.auth.signOut();
        router.replace("/auth?deleted=1");
      } else {
        alert(`Greška pri brisanju: ${data.error || "Nepoznata greška"}`);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Delete account error:", error);
      alert("Došlo je do pogreške prilikom brisanja računa.");
      setIsDeleting(false);
    }
  };

  const handleApproveVerification = async (request: VerificationRequest) => {
    try {
      setApprovingRequestId(request.id);
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Sesija je istekla. Prijavite se ponovno.");
        return;
      }

      const response = await fetch("/api/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ targetUserId: request.userId })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || "Greška pri odobravanju verifikacije.");
        return;
      }

      setVerificationRequests((prev) => prev.filter((r) => r.id !== request.id));
      setCounts((prev) => ({ ...prev, requests: Math.max(0, prev.requests - 1) }));

      if (request.userId === user?.id) {
        setIsLocallyVerified(true);
      }
    } catch (error) {
      console.error("Approval error:", error);
      alert("Došlo je do pogreške pri odobravanju.");
    } finally {
      setApprovingRequestId(null);
      setExpandedRequestId(null);
    }
  };

  const handleAddVehiclePlate = () => {
    if (newVehiclePlate.length < 5) {
      alert('Molimo unesite ispravnu registracijsku oznaku.');
      return;
    }
    const normalized = newVehiclePlate.toUpperCase();
    if (vehiclePlates.includes(normalized)) {
      alert("Ova tablica je već dodana.");
      return;
    }
    const next = [...vehiclePlates, normalized];
    setVehiclePlates(next);
    localStorage.setItem(`pp_vehicle_plates_${user.id}`, JSON.stringify(next));
    setNewVehiclePlate("");
  };

  const handleDeleteVehiclePlate = (plate: string) => {
    const next = vehiclePlates.filter((p) => p !== plate);
    setVehiclePlates(next);
    localStorage.setItem(`pp_vehicle_plates_${user.id}`, JSON.stringify(next));
  };

  const handleStartEditing = (fieldId: "full_name" | "phone" | "address" | "parking_capacity") => {
    const metadata = user?.user_metadata || {};
    const currentValue = fieldId === "full_name"
      ? (profile?.full_name || metadata.full_name || metadata.name || "")
      : fieldId === "phone"
        ? (profile?.phone || metadata.phone || "")
        : fieldId === "address"
          ? (profile?.address || metadata.address || "")
          : (profile?.parking_capacity || metadata.parking_capacity || "");
    setEditingField(fieldId);
    setEditingValue(String(currentValue));
  };

  const handleCancelEditing = () => {
    setEditingField(null);
    setEditingValue("");
  };

  const handleSaveProfileField = async () => {
    if (!editingField || !user?.id) return;
    const supabase = getSupabase();
    const normalizedValue = editingField === "parking_capacity"
      ? editingValue.replace(/\D/g, "").slice(0, 4)
      : editingValue.trim();
    const nextValue = normalizedValue || null;

    try {
      setIsSavingProfileField(true);
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            [editingField]: nextValue
          },
          { onConflict: "id" }
        );

      if (error) {
        alert("Spremanje nije uspjelo. Pokušajte ponovno.");
        return;
      }

      setProfile((prev: any) => ({
        ...(prev || {}),
        id: user.id,
        [editingField]: nextValue
      }));
      handleCancelEditing();
    } catch (error) {
      console.error("Save profile field error:", error);
      alert("Došlo je do greške prilikom spremanja.");
    } finally {
      setIsSavingProfileField(false);
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

  const isPayparqSuperadmin = user?.email?.toLowerCase() === 'payparq@outlook.com';
  const isRepresentativeByEmail = user?.email?.toLowerCase()?.startsWith("info.deepleads");
  const displayName = profile?.full_name || metadata.full_name || metadata.name || "Korisnik";

  const metadataRoles = Array.isArray(metadata.roles) ? metadata.roles : [metadata.original_role || metadata.role];
  const filteredRoles = metadataRoles.filter(Boolean).filter((r: string) => isPayparqSuperadmin || r !== "10") as string[];
  const allRoles = [
    ...(isRepresentativeByEmail ? ["3"] : []),
    ...filteredRoles.filter((r: string) => !(isRepresentativeByEmail && r === "3"))
  ];
  
  const displayRoles = allRoles.length > 0 
    ? allRoles.map((r: string) => roleLabels[r] || "Korisnik")
    : ["Korisnik"];
  const registrationRoleId = String(metadata.original_role || metadata.role || allRoles[0] || "0");
  const registrationRoleLabel = roleLabels[registrationRoleId] || "Korisnik";
  const selectedTerms = roleTerms[registrationRoleId] || roleTerms["0"];
  
  const isVerified = isLocallyVerified !== null ? isLocallyVerified : (isPayparqSuperadmin || metadata.is_verified === true);
  const canApproveVerifications = isPayparqSuperadmin || allRoles.includes("3");
  const isRepresentative = allRoles.includes("3");
  const supportWidget = isRepresentative
    ? { name: "PayParq Super Admin", phone: "+385915963139", rating: "5.0", reviews: "198 recenzija" }
    : { name: "Ovlašteni zastupnik", phone: "+385915963139", rating: "4.9", reviews: "268 recenzija" };

  const profileFields: { id: string; label: string; value: any; uppercase?: boolean; editable?: boolean }[] = [
    { id: "email", label: "Email Adresa", value: user?.email },
    { id: "full_name", label: "Ime i Prezime", value: profile?.full_name || metadata.full_name || metadata.name || null, editable: true },
    { id: "phone", label: "Broj Mobitela", value: profile?.phone || metadata.phone || null, editable: true },
    { id: "address", label: "Adresa", value: profile?.address || metadata.address || null, editable: true },
    ...(allRoles.includes("2") ? [{ id: "parking_capacity", label: "Kapacitet Parkinga", value: profile?.parking_capacity || metadata.parking_capacity || null, editable: true }] : []),
    { id: "roles", label: "Uloge", value: displayRoles }
  ];

  return (
    <div className="min-h-full w-full bg-black text-white selection:bg-[#7C3AED]/30 relative flex flex-col items-center overflow-x-hidden">
      {/* Sticky Header Background Container */}
      <div className="sticky top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-20 bg-black w-full" />
        <div className="h-32 bg-gradient-to-b from-black via-black/95 to-transparent w-full" />
      </div>

      <div className="w-full max-w-[430px] px-6 pb-10 -mt-[180px] relative z-[60] flex flex-col">
        {/* Header Area */}
        <div className="w-full flex items-center justify-between mb-10 h-11 relative">
          <div className="flex items-center gap-4 h-full">
            <div className="flex items-center justify-center w-9 h-9">
              <div className="h-7 w-7 rounded-[6px] bg-[#7C3AED] rotate-45 shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-white/20 flex items-center justify-center" />
            </div>
            <Link href="/" className="text-[28px] tracking-tight font-bold text-white leading-none flex items-center h-full ml-1.5 no-underline">parq</Link>
          </div>

          <button 
            onClick={handleLogout}
            className="pointer-events-auto h-9 px-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center group active:scale-[0.98]"
          >
            <span className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">
              Odjava
            </span>
          </button>
        </div>

        {showVerificationSuccess && (
          <div className="mb-5 p-4 rounded-2xl border border-green-500/30 bg-green-500/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
              <p className="text-[12px] font-semibold text-green-200">Email je uspješno potvrđen.</p>
            </div>
            <button
              onClick={() => setShowVerificationSuccess(false)}
              className="h-7 px-3 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase tracking-wider text-white/80 transition-colors"
            >
              U redu
            </button>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 mb-10 w-full text-center">
          <div className="h-20 w-20 rounded-3xl bg-[#7C3AED] flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_rgba(124,58,237,0.4)] border border-white/20">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <p className="text-base font-bold text-white">{displayName}</p>
              <p className="text-[12px] text-white/60">{user?.email || "-"}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/10">
              <div className={`h-2 w-2 rounded-full ${isVerified ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]'}`} />
              <span className="text-[13px] font-semibold text-white/70">
                {isVerified ? 'Verifici' : 'Čeka verifikaciju'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 w-full">
          {/* Inbox Section */}
          <div className="flex flex-col gap-4">
            <div 
              className="flex items-center justify-between px-6 cursor-pointer group"
              onClick={() => setIsInboxExpanded(!isInboxExpanded)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">Inbox</h2>
                <svg 
                  className={`w-4 h-4 text-white/20 group-hover:text-white/40 transition-transform duration-300 ${isInboxExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

                    {inboxMessages.length > 0 ? (
                      inboxMessages.map((message, i) => (
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
                                <span className="text-[13px] font-bold text-white/90">{message.subject || "Dobrodošli u PayParq"}</span>
                                <span className="text-[11px] text-white/40">{message.from}</span>
                              </div>
                              <svg className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedMessageId === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                            {expandedMessageId === i && (
                              <div className="px-4 py-3 rounded-xl bg-white/[0.01] border border-white/5 text-[12px] text-white/60 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-3">
                                <p>{message.body || "Dobrodošli u PayParq."}</p>
                                
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
              {canApproveVerifications && (
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
                          <span className="text-base font-bold text-white">
                            {isPayparqSuperadmin ? "Zahtjevi za verifikaciju (ADMIN)" : "Zahtjevi za verifikaciju (OVLAŠTENI ZASTUPNIK)"}
                          </span>
                          {counts.requests > 0 && (
                            <div className="px-2 py-0.5 rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
                              {counts.requests}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-white/40">Odobrenje u 24h: kontakt telefonski ili uživo i onboarding</span>
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
                      {verificationRequests.length > 0 ? (
                        verificationRequests.map((request, i) => {
                          const canApproveRequest = request.canApprove;
                          return (
                          <div key={i} className="flex flex-col gap-2">
                            <div 
                              onClick={() => setExpandedRequestId(expandedRequestId === i ? null : i)}
                              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[13px] font-bold text-white/90">Zahtjev #{request.id}</span>
                                  <span className="text-[11px] text-white/40">Korisnik: {request.fullName || request.email}</span>
                                  <span className="text-[11px] text-white/40">Kontakt: {request.email || "Email nije dostupan"}{request.phone ? ` • ${request.phone}` : ""}</span>
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
                                    <li>Tip: {request.roleLabel || "Korisnik"}</li>
                                    <li>Status: Na čekanju</li>
                                    <li>Email: {request.email || "Nije dostupan"}</li>
                                    <li>Mobitel: {request.phone || "Nije dostupan"}</li>
                                  </ul>
                                </div>
                                <div className="flex gap-2">
                                  <a
                                    href={request.email ? `mailto:${request.email}` : "#"}
                                    className={`flex-1 h-9 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center ${request.email ? "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300" : "bg-white/5 border-white/10 text-white/30 pointer-events-none"}`}
                                  >
                                    Email
                                  </a>
                                  <a
                                    href={request.phone ? `tel:${request.phone}` : "#"}
                                    className={`flex-1 h-9 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center ${request.phone ? "bg-violet-500/20 hover:bg-violet-500/30 border-violet-500/30 text-violet-300" : "bg-white/5 border-white/10 text-white/30 pointer-events-none"}`}
                                  >
                                    Nazovi
                                  </a>
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={() => handleApproveVerification(request)}
                                    disabled={!canApproveRequest || approvingRequestId === request.id}
                                    className="flex-1 h-10 rounded-lg bg-green-500/20 hover:bg-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-green-500/30 text-green-500 text-[11px] font-bold uppercase tracking-wider transition-all"
                                  >
                                    {approvingRequestId === request.id ? "Odobravanje..." : (canApproveRequest ? "Odobri" : "Samo payparq@outlook.com")}
                                  </button>
                                  <button 
                                    onClick={() => alert(`Zahtjev #${request.id} odbijen.`)}
                                    className="flex-1 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-500 text-[11px] font-bold uppercase tracking-wider transition-all"
                                  >
                                    Odbij
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                      ) : (
                        <span className="text-center py-4 text-xs text-white/20">Nema zahtjeva na čekanju</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

          <div className="flex flex-col gap-4">
            <div 
              className="flex items-center justify-between px-6 cursor-pointer group"
              onClick={() => setIsVehiclesExpanded(!isVehiclesExpanded)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">Vozila</h2>
                <svg 
                  className={`w-4 h-4 text-white/20 group-hover:text-white/40 transition-transform duration-300 ${isVehiclesExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              

              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isVehiclesExpanded ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white/[0.03] rounded-[32px] p-6 border border-white/10 flex flex-col gap-6">
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
                    onClick={handleAddVehiclePlate}
                    className="h-12 w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-bold transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                  >
                    Spremi vozilo
                  </button>
                  <div className="pt-2 border-t border-white/5 mt-1">
                    <span className="text-[11px] text-white/30 px-1 uppercase font-bold tracking-wider">Vaša vozila</span>
                    <div className="flex flex-col gap-2 mt-2">
                      {vehiclePlates.length > 0 ? vehiclePlates.map((plate) => (
                        <div key={plate} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-white/80 tracking-wide">{plate}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold">AKTIVNO</span>
                            <button
                              onClick={() => handleDeleteVehiclePlate(plate)}
                              className="h-7 px-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider transition-all"
                            >
                              Obriši
                            </button>
                          </div>
                        </div>
                      )) : (
                        <span className="text-xs text-white/30 px-1 py-2">Nema dodanih vozila</span>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
            {isVerified && (
              <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-[398px]">
                <div className="rounded-2xl border border-white/15 bg-black/80 backdrop-blur-md px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.45)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#7C3AED]/25 border border-[#7C3AED]/40 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#A78BFA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9.958 9.958 0 0112 15c2.249 0 4.325.742 5.999 1.994M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white">{supportWidget.name}</span>
                      <span className="text-[11px] text-white/50">{supportWidget.rating} ★ · {supportWidget.reviews}</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${supportWidget.phone}`}
                    className="h-9 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center"
                  >
                    Nazovi
                  </a>
                </div>
              </div>
            )}

            <div 
              className="flex items-center justify-between px-6 cursor-pointer group mt-4"
              onClick={() => setIsFinanceExpanded(!isFinanceExpanded)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">Financije</h2>
                <svg 
                  className={`w-4 h-4 text-white/20 group-hover:text-white/40 transition-transform duration-300 ${isFinanceExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-2">

              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFinanceExpanded ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white/[0.03] rounded-[32px] p-6 border border-white/10 flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        if (isApplePayConnected) {
                          setIsApplePayConnected(false);
                          return;
                        }
                        void handleConnectWallet("applepay");
                      }}
                      disabled={!!connectingWallet}
                      className={`h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group/btn ${isApplePayConnected ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isApplePayConnected ? 'text-[#7C3AED]' : 'text-white/70 group-hover/btn:text-white'}`}>Apple Pay</span>
                      <span className="text-[9px] font-bold uppercase">
                        {connectingWallet === "applepay" ? 'POVEZIVANJE' : (isApplePayConnected ? 'POVEZANO' : 'POVEŽI')}
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        if (isGooglePayConnected) {
                          setIsGooglePayConnected(false);
                          return;
                        }
                        void handleConnectWallet("googlepay");
                      }}
                      disabled={!!connectingWallet}
                      className={`h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group/btn ${isGooglePayConnected ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isGooglePayConnected ? 'text-[#7C3AED]' : 'text-white/70 group-hover/btn:text-white'}`}>Google Pay</span>
                      <span className="text-[9px] font-bold uppercase">
                        {connectingWallet === "googlepay" ? 'POVEZIVANJE' : (isGooglePayConnected ? 'POVEZANO' : 'POVEŽI')}
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        if (!isCardConnected) {
                          // Show card input logic handled below
                        } else {
                          setIsCardConnected(false);
                          setCardLast4("");
                          setCardNumber("");
                          setCardExpiry("");
                          setCardCvc("");
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
                             setCardLast4(cleanCard.slice(-4));
                             setCardNumber("");
                             setCardCvc("");
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
                            **** **** **** {cardLast4 || "0000"}
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
                          setCardLast4("");
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
                  {profileFields.map((field) => (
                    <div key={field.id} className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col gap-1 relative group/field transition-colors hover:border-[#7C3AED]/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{field.label}</span>
                        {field.editable && (
                          <button
                            onClick={() => handleStartEditing(field.id as "full_name" | "phone" | "address" | "parking_capacity")}
                            className="opacity-100 transition-opacity text-[#7C3AED] hover:text-[#9F67FF] bg-black/40 p-1 rounded-md border border-white/5"
                          >
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
                        <>
                          {editingField === field.id ? (
                            <div className="flex flex-col gap-2 mt-1">
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => {
                                  if (field.id === "parking_capacity") {
                                    setEditingValue(e.target.value.replace(/\D/g, "").slice(0, 4));
                                    return;
                                  }
                                  setEditingValue(e.target.value);
                                }}
                                placeholder={field.id === "parking_capacity" ? "Npr. 120" : "Unesite vrijednost"}
                                className="h-10 w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 text-white text-sm focus:outline-none focus:border-[#7C3AED]/50 transition-colors placeholder:text-white/20"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleSaveProfileField}
                                  disabled={isSavingProfileField}
                                  className="h-8 px-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                                >
                                  {isSavingProfileField ? "Spremanje..." : "Spremi"}
                                </button>
                                <button
                                  onClick={handleCancelEditing}
                                  disabled={isSavingProfileField}
                                  className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-wider transition-all"
                                >
                                  Odustani
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span
                              className={`text-sm font-semibold ${
                                field.value ? "text-white/90" : "text-white/20 italic"
                              } ${field.uppercase ? "uppercase tracking-wider" : ""}`}
                            >
                              {field.id === "parking_capacity" && field.value ? `${field.value} mjesta` : (field.value || "Nije uneseno")}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
            <div className="pt-1">
              <button 
                onClick={handleNewRole}
                className="h-10 w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                Nova uloga
              </button>
            </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-3 mt-4">
                  <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                    Brisanjem računa trajno gubite pristup svim podacima i uslugama unutar PayParq platforme.
                  </p>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="h-10 w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                  >
                    Obriši moj račun
                  </button>
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
            
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isTermsExpanded ? 'max-h-[4200px] opacity-100 mb-14' : 'max-h-0 opacity-0'}`}>
              <div className="bg-white/[0.03] rounded-[32px] p-8 border border-white/10 flex flex-col gap-6">
                <div className="flex flex-col gap-6 text-white/60 leading-relaxed text-[13px]">
                  <section className="flex flex-col gap-2">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">1. Uloga pri registraciji</h3>
                    <p className="text-white/90 font-semibold">{registrationRoleLabel}</p>
                    <p>{selectedTerms.summary}</p>
                  </section>

                  <section className="flex flex-col gap-2">
                    <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">1. Uvjeti suradnje (Terms)</h3>
                    <p>Ovim putem potvrđujem da prihvaćam sljedeće uvjete suradnje s Leadvex Group LLC i partnerima u RH.</p>
                    <p className="font-bold text-white">1. Nagrada</p>
                    <p>Suradnik ostvaruje proviziju u iznosu 50% neto prihoda koji generira njegov teren, pri čemu se neto prihod definira kao prihod nakon odbitka svih financijskih naknada i poreza.</p>
                    <p className="font-bold text-white">2. Obveze i troškovi Suradnika</p>
                    <p>Suradnik snosi organizaciju i trošak sljedećeg:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Označavanje terena (sprej, naljepnice, manji znakovi i njihovo pričvršćivanje)</li>
                      <li>Obilazak terena i odlasci na sastanke (uključujući trošak prijevoza)</li>
                      <li>Verifikacija partnera</li>
                      <li>Korisnička podrška za prioritetne partnere i uspostava terenske podrške</li>
                      <li>Svakodnevno logiranje u Parq chatbot, izvršavanje dnevnih zadataka, pravovremeni unos povratnih informacija te aktivno sudjelovanje u usavršavanju sustava, uključujući:</li>
                    </ul>
                    <ul className="list-none pl-4 mt-1 space-y-0.5 text-white/70">
                      <li>• Slikanje terena</li>
                      <li>• Videozapise</li>
                      <li>• Feedback</li>
                      <li>• Sastanke</li>
                      <li>• Ispunjavanje dokumenata</li>
                      <li>• Redoviti obilazak terena</li>
                    </ul>
                    <p className="font-bold text-white pt-2 italic">Potvrđujem da razumijem i u cijelosti prihvaćam navedene uvjete.</p>
                  </section>

                  <section className="flex flex-col gap-2">
                    <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">2. NDA</h3>
                    <p className="italic">Izjava o prihvaćanju uvjeta suradnje</p>
                    <p>Ovim putem potvrđujem da prihvaćam sljedeće uvjete suradnje s Leadvex Group LLC i partnerskim entitetima u RH.:</p>
                    <p className="font-bold text-white">1. Povjerljivost</p>
                    <p>Obvezujem se čuvati kao strogo povjerljive sve informacije vezane uz poslovni model, podjelu prihoda (50% net prihoda nakon financijskih naknada i poreza), partnere i lokacije, cijene, financije, operativne procese, Parq chatbot, interne sustave, strategiju i razvoj.</p>
                    <p>Informacije neću koristiti niti otkrivati izvan svrhe suradnje.</p>
                    <p className="font-bold text-white">2. Zabrana konkurencije</p>
                    <p>Obvezujem se da tijekom trajanja suradnje i 24 mjeseca nakon njenog prestanka neću samostalno niti putem trećih osoba sudjelovati u konkurentskom projektu u području digitalnog upravljanja i monetizacije parking terena na teritoriju Republike Hrvatske.</p>
                    <p className="font-bold text-white">3. Trajanje</p>
                    <p>Obveza povjerljivosti vrijedi tijekom suradnje i 5 godina nakon prestanka suradnje.</p>
                    <p className="font-bold text-white pt-2 italic">Potvrđujem da sam upoznat s uvjetima i da ih u cijelosti prihvaćam.</p>
                  </section>

                  <section className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <h3 className="text-white font-bold text-base tracking-tight italic">Brain</h3>
                    <p>Sukladno Viziji i Misije postavlja najefikasnije dnevne zadatke City Manageru, Scrapea sve Leadove.</p>
                    <p>Na Manageru ostaje održavanje sastanaka pregled poruka i mailova i send, telefonski pozivi i sastanci, te obilazak terena i terenska/ prioritetna podrška.</p>
                  </section>

                  <section className="flex flex-col gap-2">
                    <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">3. Klauzula o jednostranom raskidu i ograničenju odgovornosti</h3>
                    <p>Leadvex Group LLC i njegovi partneri u Republici Hrvatskoj zadržavaju pravo jednostrano raskinuti suradnju u bilo kojem trenutku, bez obrazloženja i bez otkaznog roka.</p>
                    <p>Suradnik nema pravo na naknadu štete, izgubljenu dobit, buduće provizije niti bilo kakvu drugu kompenzaciju temeljem raskida ili izmjene uvjeta suradnje.</p>
                    <p>Suradnik se odriče svih sadašnjih i budućih potraživanja, tužbi i zahtjeva prema Leadvex Group LLC, njegovim vlasnicima, povezanim društvima i partnerima, osim za nesporne i dospjele iznose koji su već obračunati do dana raskida.</p>
                    <p>Ukupna eventualna odgovornost Leadvex Group LLC i partnera, ako bi postojala, ograničena je maksimalno na iznos zadnje isplaćene provizije Suradniku.</p>
                  </section>

                  <section className="flex flex-col gap-2">
                    <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">4. Završne odredbe</h3>
                    <p>Završne odredbe čine sastavni dio Uvjeta suradnje, NDA-a i svih povezanih odredbi između Suradnika i Leadvex Group LLC te njegovih partnera u Republici Hrvatskoj.</p>
                    <p>U slučaju bilo kakve nejasnoće, tumačenje odredbi ide u korist Društva.</p>
                    <p>Ako se bilo koja odredba pokaže ništavnom ili neprovedivom, ostale odredbe ostaju u punoj pravnoj snazi.</p>
                    <p>Ovaj dokument predstavlja cjelokupni sporazum između strana i zamjenjuje sve prethodne usmene ili pisane dogovore.</p>
                    <p className="font-bold text-white pt-2 italic underline decoration-[#7C3AED] underline-offset-4">Suradnik potvrđuje da Uvjete prihvaća svjesno, dobrovoljno i bez prisile.</p>
                    <p className="text-white/60 text-[12px]">Leadvex Group LLC zadržava pravo izmjene operativnih procesa, poslovnog modela, sustava obračuna i strukture suradnje u bilo kojem trenutku.</p>
                  </section>

                  <div className="pt-4 border-t border-white/5 mt-2">
                    <p className="text-[11px] italic">Zadnja izmjena: 02. ožujka 2026.</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => !isDeleting && setShowDeleteModal(false)}
            />
            <div className="relative w-full max-w-[400px] bg-black border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">Potvrda brisanja</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Jeste li sigurni da želite obrisati svoj račun? Ova radnja je <span className="text-red-500 font-bold">nepovratna</span>.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-bold text-white/30 uppercase tracking-[0.1em]">
                    Upišite "OBRIŠI" za potvrdu
                  </label>
                  <input 
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="OBRIŠI"
                    className="h-14 w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-white text-base font-bold focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-white/10"
                    disabled={isDeleting}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[13px] transition-all active:scale-[0.98]"
                    disabled={isDeleting}
                  >
                    Odustani
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    className="flex-[2] h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-[13px] transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center"
                    disabled={isDeleting || deleteConfirmText.toLowerCase() !== "obriši"}
                  >
                    {isDeleting ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Potvrdi brisanje'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
