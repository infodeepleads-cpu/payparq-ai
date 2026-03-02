"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { getSupabase } from "../../lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearchParams, useRouter } from "next/navigation";
import Turnstile from "@/components/Turnstile";
import { env } from "@/lib/env";

import Link from "next/link";

const autofillStyles = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus, 
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #000000 inset !important;
    -webkit-text-fill-color: white !important;
    transition: background-color 5000s ease-in-out 0s;
    border-radius: 12px !important;
  }
`;

export const dynamic = "force-dynamic";

function AuthContent() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "update">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("0"); // 0. Član, 1. Agent, 2. Partner Parking Vlasnik, 3. Ovlašteni zastupnik, 4. Referal
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [parkingCapacity, setParkingCapacity] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean | null>(null);
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const roles = [
    { id: "0", label: "Korisnik" },
    { id: "1", label: "Vozač" },
    { id: "2", label: "Partner Parking Vlasnik" },
    { id: "3", label: "Ovlašteni zastupnik" },
    { id: "4", label: "Dostavljač" },
    { id: "5", label: "Referal" },
    { id: "6", label: "Agent" }
  ];

  const getRoleTerms = (roleId: string) => {
    switch (roleId) {
      case "0": return "Kao Korisnik, prihvaćate opće uvjete korištenja platforme i pravila o privatnosti.";
      case "1": return "Kao Vozač, prihvaćate uvjete o posredovanju i povjerljivosti podataka.";
      case "2": return "Kao Partner Parking Vlasnik, potvrđujete vlasništvo i prihvaćate uvjete o zakupu prostora.";
      case "3": return "Kao Ovlašteni zastupnik, potvrđujete pravo na zastupanje i prihvaćate pravnu odgovornost.";
      case "4": return "Kao Dostavljač, prihvaćate uvjete partnerskog programa i pravila o provizijama.";
      case "5": return "Kao Referal, prihvaćate uvjete programa preporuka i pravila o bonusima.";
      case "6": return "Kao Agent, prihvaćate uvjete suradnje, NDA i pravila o terenskom radu.";
      default: return t('auth_terms_agreement');
    }
  };

  const validatePhone = (value: string) => {
    // Basic regex for mobile numbers (e.g. +38591234567 or 091234567)
    const phoneRegex = /^(\+385|0)9[0-9]{7,8}$/;
    setIsPhoneValid(phoneRegex.test(value.replace(/\s/g, "")));
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(value));
  };

  useEffect(() => {
    if (phone) {
      validatePhone(phone);
    } else {
      setIsPhoneValid(null);
    }
  }, [phone]);

  useEffect(() => {
    if (email) {
      validateEmail(email);
    } else {
      setIsEmailValid(null);
    }
  }, [email]);

  useEffect(() => {
    setMounted(true);
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup") setMode("signup");
    else if (modeParam === "signin") setMode("signin");
    else if (modeParam === "forgot") setMode("forgot");
    else if (modeParam === "update") setMode("update");

    // Check if user is already logged in
    const checkUser = async () => {
      const emailParam = searchParams.get("email");
      if (emailParam) setEmail(emailParam);

      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      // If in update mode and email is missing, try to get it from session
      if (modeParam === "update" && !emailParam && session?.user?.email) {
        setEmail(session.user.email);
      }

      // Only redirect if NOT in update mode
      if (session?.user && modeParam !== "update") {
        router.push("/profile");
      }
    };
    checkUser();
  }, [searchParams, router]);

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          captchaToken: captchaToken || undefined
        }
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push("/profile");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || t('auth_error_generic'));
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      try {
        const response = await fetch("/api/auth/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, captchaToken }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Greška pri slanju emaila.");
        } else {
          setMessage("Link za ponovno postavljanje lozinke je poslan na vaš email.");
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setError("Zahtjev je trajao predugo. Molimo provjerite internetsku vezu i pokušajte ponovno.");
        } else {
          throw err;
        }
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || t('auth_error_generic'));
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Lozinka je uspješno promijenjena. Preusmjeravamo vas na prijavu...");
        setTimeout(() => setMode("signin"), 3000);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || t('auth_error_generic'));
      setLoading(false);
    }
  };

  const signUp = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const supabase = getSupabase();
      
      // Special handling for roles and defaults for info.deepleads
      let finalRole = role;
      let finalName = name;
      let finalPhone = phone;
      let finalAddress = address;
      
      if (email.toLowerCase().startsWith('info.deepleads')) {
        finalRole = "3";
        if (!name) finalName = "Karlo Žamić";
        if (!phone) finalPhone = "+385915963139";
        if (!address) finalAddress = "Obala Kneza Domagoja 52";
      } else if (role === "1" || role === "4") {
        finalRole = "1"; // Vozač and Dostavljač are stored as Agent (1)
      }
      
      // 1. Sign up user with password (this creates user in auth.users)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/confirm?email=${encodeURIComponent(email)}` : undefined,
          captchaToken: captchaToken || undefined,
          data: { 
            full_name: finalName,
            role: finalRole,
            original_role: role, // Keep original role for UI if needed
            phone: finalPhone,
            address: finalAddress,
            parking_capacity: finalRole === "2" ? parkingCapacity : null
          }
        },
      });

      if (error) {
        setError(error.message);
      } else {
        // 2. Send custom branded email via Resend
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s for email

          await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name: finalName,
              role: finalRole,
              captchaToken, // Pass token for server-side verification
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (emailErr) {
          console.error("Error calling Resend API:", emailErr);
        }

        // Show success message and wait for confirmation
        setMessage("Poslali smo vam email s linkom za potvrdu. Molimo provjerite vaš pretinac.");
        // We don't redirect here, we want them to see the message
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || t('auth_error_generic'));
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit triggered for mode:", mode, { email, password, confirmPassword });
    
    if (mode === "forgot") {
      if (!email.trim()) {
        setError(t('auth_missing_fields'));
        return;
      }
      await resetPassword();
      return;
    }

    if (mode === "update") {
      if (!password.trim() || !confirmPassword.trim()) {
        setError("Molimo unesite novu lozinku u oba polja.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Lozinke se ne podudaraju.");
        return;
      }
      await updatePassword();
      return;
    }

    if (mode === "signin") {
      if (!email.trim() || !password.trim()) {
        setError(t('auth_missing_fields'));
        return;
      }
      await signIn();
      return;
    }
    
    if (mode === "signup") {
      if (!email.trim() || !password.trim()) {
        setError(t('auth_missing_fields'));
        return;
      }
      if (password !== confirmPassword) {
        setError("Lozinke se ne podudaraju.");
        return;
      }
      if (!acceptedTerms) {
        setError("Molimo prihvatite uvjete korištenja.");
        return;
      }
      if (!phone.trim()) {
        setError("Broj mobitela je obavezan.");
        return;
      }
      if (role === "2" && !parkingCapacity.trim()) {
        setError("Kapacitet parkinga je obavezan za partnere.");
        return;
      }
      if (!isEmailValid) {
        setError("Molimo unesite ispravnu email adresu.");
        return;
      }
      if (!isPhoneValid) {
        setError("Molimo unesite ispravan broj mobitela.");
        return;
      }
      await signUp();
      return;
    }
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col items-center bg-black text-white selection:bg-[#7C3AED]/30 relative`}>
      <style>{autofillStyles}</style>
      {/* Absolute Full Screen Black Background */}
      <div className="fixed inset-0 bg-black z-0 pointer-events-none" />

      {/* Header Area */}
      <div className="w-full max-w-[430px] px-6 pt-10 pb-10 relative z-[60] flex flex-col">
        <div className="flex items-center justify-between mb-10 h-11 relative">
          <Link href="/" className="flex items-center gap-4 h-full no-underline active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-center w-9 h-9">
              <div className="h-7 w-7 rounded-[6px] bg-[#7C3AED] rotate-45 shadow-[0_0_15px_rgba(124,58,237,0.4)] border border-white/20 flex items-center justify-center" />
            </div>
            <div className="text-[28px] tracking-tight font-bold text-white leading-none flex items-center h-full ml-1.5">parq</div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 mb-6 text-[22px] font-semibold relative pointer-events-auto">
          {[
            { id: "signin", label: "Prijava" },
            { id: "signup", label: "Registracija" }
          ].map((tab) => (
            <div
              key={tab.id}
              onClick={() => {
                setMode(tab.id as "signin" | "signup");
                setError(null);
                setMessage(null);
              }}
              className="relative cursor-pointer transition-colors"
            >
              <div className={(mode === tab.id || (mode === "forgot" && tab.id === "signin") || (mode === "update" && tab.id === "signin")) ? "text-white" : "text-white/30 hover:text-white transition-colors"}>
                {tab.label}
              </div>
              {(mode === tab.id || (mode === "forgot" && tab.id === "signin") || (mode === "update" && tab.id === "signin")) && (
                <div className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[#7C3AED] rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Image based on mode */}
        <div className="w-full max-w-[360px] flex justify-center mb-8 relative z-10">
          {mode === "signin" || mode === "forgot" || mode === "update" ? (
            <div className="relative w-full h-[180px] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <Image 
                src="/images/parking-lot.jfif" 
                alt="Smiling woman with a purple car" 
                fill
                priority
                unoptimized
                className="object-cover opacity-100 brightness-[1.1] contrast-[0.95]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          ) : (
            <div className="relative w-full h-[180px] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <Image 
                src="/images/app-preview.jfif" 
                alt="Smartphone app preview" 
                fill
                priority
                unoptimized
                className="object-cover opacity-100 brightness-[1.1] contrast-[0.95]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          )}
        </div>

        <div className="w-full max-w-[360px] space-y-8 relative z-10">
          <form onSubmit={submit} className="space-y-6">
          <div className="space-y-6">
            {(mode === "signin" || mode === "forgot") && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-[#7C3AED] px-1 uppercase tracking-[0.1em]">
                  {mode === "signin" ? "Prijava u sustav" : "Zaboravljena lozinka"}
                </p>
                <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email adresa"
                    className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                    required
                  />
                </div>
                {mode === "signin" && (
                  <>
                    <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Lozinka"
                        className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 z-10 text-white/20 hover:text-white transition-colors select-none bg-transparent border-none p-0 outline-none focus:outline-none focus:ring-0"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex justify-end px-1 bg-transparent">
                      <button 
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-[11px] text-[#7C3AED] hover:text-[#7C3AED]/80 hover:underline font-medium transition-colors bg-transparent border-none p-0"
                      >
                        Zaboravili ste lozinku?
                      </button>
                    </div>
                  </>
                )}
                {mode === "forgot" && (
                  <div className="flex justify-start px-1 bg-transparent">
                    <button 
                      type="button"
                      onClick={() => setMode("signin")}
                      className="text-[11px] text-white/40 hover:text-white transition-colors font-medium bg-transparent border-none p-0 outline-none focus:outline-none focus:ring-0"
                    >
                      Odustani i vrati se na prijavu
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === "update" && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-[#7C3AED] px-1 uppercase tracking-[0.1em]">
                  Promjena lozinke za {email || "vaš račun"}
                </p>
                <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/20 rounded-[12px] opacity-80 cursor-not-allowed shadow-inner">
                  <input
                    type="email"
                    value={email}
                    disabled
                    placeholder="Email adresa"
                    className="flex-1 bg-transparent border-0 px-4 text-sm text-white/50 placeholder:text-white/20 focus:ring-0 focus:outline-none cursor-not-allowed font-medium"
                  />
                  <div className="absolute right-4 text-white/20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                </div>
                <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nova lozinka"
                    className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                    onTouchEnd={(e) => { e.preventDefault(); setShowPassword(false); }}
                    className="absolute right-4 z-10 text-white/20 hover:text-white transition-colors select-none bg-transparent rounded-full p-1 focus:outline-none focus:ring-0 border-none outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ponovite novu lozinku"
                    className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                    onTouchEnd={(e) => { e.preventDefault(); setShowPassword(false); }}
                    className="absolute right-4 z-10 text-white/20 hover:text-white transition-colors select-none bg-transparent rounded-full p-1 focus:outline-none focus:ring-0 border-none outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex justify-start px-1 bg-transparent">
                  <button 
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-[11px] text-white/40 hover:text-white transition-colors font-medium bg-transparent border-none p-0 outline-none focus:outline-none focus:ring-0"
                  >
                    Odustani i vrati se na prijavu
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <>
                {/* Role Selector */}
                <div className="space-y-3">
                  <p className="text-[12px] font-bold text-white/40 px-1 uppercase tracking-wider">Tko želite postati?</p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-300 border ${
                          role === r.id 
                            ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]" 
                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sekcija 1: Osobni podaci */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-[#7C3AED] px-1 uppercase tracking-[0.1em]">1. Osobni podaci</p>
                  <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ime i prezime"
                      className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                    />
                  </div>
                  <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Adresa stanovanja"
                      className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                    />
                  </div>

                  {role === "2" && (
                    <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={parkingCapacity}
                        onChange={(e) => setParkingCapacity(e.target.value.replace(/\D/g, ""))}
                        placeholder="Kapacitet parkinga (broj mjesta)"
                        className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Sekcija 2: Login podaci */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-[#7C3AED] px-1 uppercase tracking-[0.1em]">2. Login podaci</p>
                  <div className={`relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border rounded-[12px] transition-all ${isEmailValid === true ? 'border-green-500/50' : isEmailValid === false ? 'border-red-500/50' : 'border-white/10 focus-within:border-[#7C3AED]/50'}`}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email adresa"
                      className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Lozinka"
                      className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowPassword(true)}
                      onMouseUp={() => setShowPassword(false)}
                      onMouseLeave={() => setShowPassword(false)}
                      onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                      onTouchEnd={(e) => { e.preventDefault(); setShowPassword(false); }}
                      className="absolute right-4 z-10 text-white/20 hover:text-white transition-colors select-none bg-transparent rounded-full p-1 focus:outline-none focus:ring-0 border-none outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border border-white/10 rounded-[12px] focus-within:border-[#7C3AED]/50 transition-all">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ponovite lozinku"
                      className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onMouseDown={() => setShowPassword(true)}
                      onMouseUp={() => setShowPassword(false)}
                      onMouseLeave={() => setShowPassword(false)}
                      onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                      onTouchEnd={(e) => { e.preventDefault(); setShowPassword(false); }}
                      className="absolute right-4 z-10 text-white/20 hover:text-white transition-colors select-none bg-transparent rounded-full p-1 focus:outline-none focus:ring-0 border-none outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sekcija 3: Kontakt */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-[#7C3AED] px-1 uppercase tracking-[0.1em]">3. Kontakt</p>
                  <div className={`relative flex items-center w-full max-w-[360px] h-12 bg-white/5 border rounded-[12px] transition-all ${
                    isPhoneValid === true ? 'border-green-500/50' : 
                    isPhoneValid === false ? 'border-red-500/50' : 'border-white/10 focus-within:border-[#7C3AED]/50'
                  }`}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Broj mobitela (npr. +385...)"
                      className="flex-1 bg-transparent border-0 px-4 text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                    />
                    <div className={`absolute right-3 px-2 py-1 rounded-md border transition-colors ${
                      isPhoneValid === true ? 'bg-green-500/10 border-green-500/20' : 
                      isPhoneValid === false ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'
                    }`}>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        isPhoneValid === true ? 'text-green-500' : 
                        isPhoneValid === false ? 'text-red-500' : 'text-white/40'
                      }`}>
                        {isPhoneValid === true ? 'Broj ispravan' : 
                         isPhoneValid === false ? 'Neispravan broj' : 'Provjera broja'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {mode === "signup" && (
              <div className="pt-2 px-1">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-1">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="peer h-5 w-5 rounded border-white/10 bg-white/5 text-[#7C3AED] focus:ring-offset-0 focus:ring-0 transition-all cursor-pointer"
                    />
                    <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] text-white/50 group-hover:text-white/70 transition-colors leading-tight">
                      {getRoleTerms(role)}
                    </span>
                    <span 
                      onClick={() => setShowTermsModal(true)}
                      className="text-[11px] font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                    >
                      Pročitaj i prihvati uvjete
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Submit Button */}
            <div className="flex flex-col items-center gap-6 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center w-1/2 h-11 rounded-full bg-[#7C3AED] px-4 text-[14px] font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4),0_4px_10px_rgba(0,0,0,0.3)] border border-white/20 transition-all hover:bg-[#6D28D9] hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  mode === "signup" ? "Verificiraj" : 
                  mode === "forgot" ? "Pošalji link" :
                  mode === "update" ? "Promijeni lozinku" : "Prijavi se"
                )}
              </button>

              <div className="min-h-[20px] text-center">
                {message && <p className="text-sm text-green-400 font-medium">{message}</p>}
                {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 mt-8 mb-4 border-t border-white/10 pt-8 w-full">
            <Link href="/" className="flex items-center gap-3 group no-underline self-start">
              <div className="h-6 w-6 rounded-[5px] bg-[#7C3AED] rotate-45 shadow-[0_0_10px_rgba(124,58,237,0.3)] border border-white/20 group-hover:scale-110 transition-transform" />
              <div className="text-[20px] tracking-tight font-bold text-white leading-none group-hover:text-white/90 transition-colors">parq</div>
            </Link>
            
            <div className="space-y-1 self-start">
              <p className="text-[11px] text-white/30 tracking-wider">
                Sva prava pridržana © 2026 PayParq Global Inc.
              </p>
            </div>
          </div>
        </form>
      </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1A1A1A] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#242424] rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Uvjeti suradnje i NDA</h2>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-white/80 space-y-8 text-sm leading-relaxed">
              {/* Section 1: Terms Sažetak */}
              <section className="space-y-3">
                <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">Terms Sažetak:</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-bold text-white">1. Nagrada:</p>
                    <p>Provizija 50% Net Prihoda njegov teren (Nakon odbitka financijskih naknada i poreza)</p>
                  </div>
                  <div>
                    <p className="font-bold text-white">2. Obveze i Trošak</p>
                    <ul className="list-decimal pl-5 space-y-1">
                      <li>Označavanje terena (sprej, naljepnice, manji znakovi i pričvrščivanje)</li>
                      <li>Obilazak terena i odlazak na sastanke (trošak prijevoza)</li>
                      <li>Verifikacija Partnera</li>
                      <li>Korisnička podrška za prioritetne partnere / uspostava terenske podrške</li>
                      <li>Svakodnevno logiranje u parq chatbot i izvršavanje svih dnevnih zadataka i promptni unos povratnih informacija te pomoć pri usavršavanju chatbota</li>
                    </ul>
                    <p className="mt-2 text-white/60 italic">(Slikanje terena, Videozapis, Feedback, Sastanci, Ispunjavanje dokumenata, Obilazak terena)</p>
                  </div>
                </div>
              </section>

              {/* Section 2: Uvjeti suradnje (Terms) */}
              <section className="space-y-3">
                <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">1. Uvjeti suradnje (Terms)</h3>
                <p>Ovim putem potvrđujem da prihvaćam sljedeće uvjete suradnje s Leadvex Group LLC i partnerima u RH.</p>
                
                <div className="space-y-3">
                  <p className="font-bold text-white">1. Nagrada</p>
                  <p>Suradnik ostvaruje proviziju u iznosu 50% neto prihoda koji generira njegov teren, pri čemu se neto prihod definira kao prihod nakon odbitka svih financijskih naknada i poreza.</p>
                  
                  <p className="font-bold text-white">2. Obveze i troškovi Suradnika</p>
                  <p>Suradnik snosi organizaciju i trošak sljedećeg:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Označavanje terena (sprej, naljepnice, manji znakovi i njihovo pričvršćivanje)</li>
                    <li>Obilazak terena i odlasci na sastanke (uključujući trošak prijevoza)</li>
                    <li>Verifikacija partnera</li>
                    <li>Korisnička podrška za prioritetne partnere i uspostava terenske podrške</li>
                    <li>Svakodnevno logiranje u Parq chatbot, izvršavanje dnevnih zadataka, pravovremeni unos povratnih informacija te aktivno sudjelovanje u usavršavanju sustava, uključujući:
                      <ul className="list-none pl-4 mt-1 space-y-0.5 text-white/70">
                        <li>• Slikanje terena</li>
                        <li>• Videozapise</li>
                        <li>• Feedback</li>
                        <li>• Sastanke</li>
                        <li>• Ispunjavanje dokumenata</li>
                        <li>• Redoviti obilazak terena</li>
                      </ul>
                    </li>
                  </ul>
                  <p className="font-bold text-white pt-2 italic">Potvrđujem da razumijem i u cijelosti prihvaćam navedene uvjete.</p>
                </div>
              </section>

              {/* Section 3: NDA */}
              <section className="space-y-3">
                <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">2. NDA</h3>
                <p className="italic">Izjava o prihvaćanju uvjeta suradnje</p>
                <p>Ovim putem potvrđujem da prihvaćam sljedeće uvjete suradnje s Leadvex Group LLC i partnerskim entitetima u RH.:</p>
                
                <div className="space-y-3">
                  <p className="font-bold text-white">1. Povjerljivost</p>
                  <p>Obvezujem se čuvati kao strogo povjerljive sve informacije vezane uz poslovni model, podjelu prihoda (50% net prihoda nakon financijskih naknada i poreza), partnere i lokacije, cijene, financije, operativne procese, Parq chatbot, interne sustave, strategiju i razvoj.</p>
                  <p>Informacije neću koristiti niti otkrivati izvan svrhe suradnje.</p>
                  
                  <p className="font-bold text-white">2. Zabrana konkurencije</p>
                  <p>Obvezujem se da tijekom trajanja suradnje i 24 mjeseca nakon njenog prestanka neću samostalno niti putem trećih osoba sudjelovati u konkurentskom projektu u području digitalnog upravljanja i monetizacije parking terena na teritoriju Republike Hrvatske.</p>
                  
                  <p className="font-bold text-white">3. Trajanje</p>
                  <p>Obveza povjerljivosti vrijedi tijekom suradnje i 5 godina nakon prestanka suradnje.</p>
                  <p className="font-bold text-white pt-2 italic">Potvrđujem da sam upoznat s uvjetima i da ih u cijelosti prihvaćam.</p>
                </div>
              </section>

              {/* Section 4: Brain */}
              <section className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-white font-bold text-base tracking-tight italic">Brain</h3>
                <p>Sukladno Viziji i Misije postavlja najefikasnije dnevne zadatke City Manageru, Scrapea sve Leadove.</p>
                <p>Na Manageru ostaje održavanje sastanaka pregled poruka i mailova i send, telefonski pozivi i sastanci, te obilazak terena i terenska/ prioritetna podrška.</p>
              </section>

              {/* Section 5: Klauzula o raskidu */}
              <section className="space-y-3">
                <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">3. Klauzula o jednostranom raskidu i ograničenju odgovornosti</h3>
                <div className="space-y-3">
                  <p>Leadvex Group LLC i njegovi partneri u Republici Hrvatskoj zadržavaju pravo jednostrano raskinuti suradnju u bilo kojem trenutku, bez obrazloženja i bez otkaznog roka.</p>
                  <p>Suradnik nema pravo na naknadu štete, izgubljenu dobit, buduće provizije niti bilo kakvu drugu kompenzaciju temeljem raskida ili izmjene uvjeta suradnje.</p>
                  <p>Suradnik se odriče svih sadašnjih i budućih potraživanja, tužbi i zahtjeva prema Leadvex Group LLC, njegovim vlasnicima, povezanim društvima i partnerima, osim za nesporne i dospjele iznose koji su već obračunati do dana raskida.</p>
                  <p>Ukupna eventualna odgovornost Leadvex Group LLC i partnera, ako bi postojala, ograničena je maksimalno na iznos zadnje isplaćene provizije Suradniku.</p>
                </div>
              </section>

              {/* Section 6: Završne odredbe */}
              <section className="space-y-3 pb-4">
                <h3 className="text-[#7C3AED] font-bold text-base uppercase tracking-wider border-l-4 border-[#7C3AED] pl-3">4. Završne odredbe</h3>
                <div className="space-y-3">
                  <p>Završne odredbe čine sastavni dio Uvjeta suradnje, NDA-a i svih povezanih odredbi između Suradnika i Leadvex Group LLC te njegovih partnera u Republici Hrvatskoj.</p>
                  <p>U slučaju bilo kakve nejasnoće, tumačenje odredbi ide u korist Društva.</p>
                  <p>Ako se bilo koja odredba pokaže ništavnom ili neprovedivom, ostale odredbe ostaju u punoj pravnoj snazi.</p>
                  <p>Ovaj dokument predstavlja cjelokupni sporazum između strana i zamjenjuje sve prethodne usmene ili pisane dogovore.</p>
                  <p className="font-bold text-white pt-2 italic underline decoration-[#7C3AED] underline-offset-4">
                    Suradnik potvrđuje da Uvjete prihvaća svjesno, dobrovoljno i bez prisile.
                  </p>
                  <p className="text-white/60 text-[12px]">
                    Leadvex Group LLC zadržava pravo izmjene operativnih procesa, poslovnog modela, sustava obračuna i strukture suradnje u bilo kojem trenutku.
                  </p>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-white/10 bg-[#242424] rounded-b-2xl">
              <button 
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                className="w-full py-3 bg-[#7C3AED] text-white font-bold rounded-xl hover:bg-[#6D28D9] transition-all shadow-lg"
              >
                Prihvaćam i zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Auth() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}
