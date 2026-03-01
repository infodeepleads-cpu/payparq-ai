"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { getSupabase } from "../../lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearchParams, useRouter } from "next/navigation";

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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("0"); // 0. Član, 1. Agent, 2. Partner Parking Vlasnik, 3. Ovlašteni zastupnik, 4. Referal
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [parkingCapacity, setParkingCapacity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean | null>(null);
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const roles = [
    { id: "0", label: "Član" },
    { id: "1", label: "Agent" },
    { id: "2", label: "Partner Parking Vlasnik" },
    { id: "3", label: "Ovlašteni zastupnik" },
    { id: "4", label: "Referal" }
  ];

  const getRoleTerms = (roleId: string) => {
    switch (roleId) {
      case "0": return "Kao Član, prihvaćate opće uvjete korištenja platforme i pravila o privatnosti.";
      case "1": return "Kao Agent, prihvaćate uvjete o posredovanju i povjerljivosti podataka.";
      case "2": return "Kao Partner Parking Vlasnik, potvrđujete vlasništvo i prihvaćate uvjete o zakupu prostora.";
      case "3": return "Kao Ovlašteni zastupnik, potvrđujete pravo na zastupanje i prihvaćate pravnu odgovornost.";
      case "4": return "Kao Referal, prihvaćate uvjete partnerskog programa i pravila o provizijama.";
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
  }, [searchParams]);

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/map?show_chat=true";
      }
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
      
      // 1. Sign up user with password (this creates user in auth.users)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined,
          data: { 
            full_name: name,
            role: role,
            phone: phone,
            address: address,
            parking_capacity: role === "2" ? parkingCapacity : null
          }
        },
      });

      if (error) {
        setError(error.message);
      } else {
        // 2. Send custom branded email via Resend
        try {
          const res = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name,
              role,
            }),
          });
          
          if (!res.ok) {
            console.error("Failed to send custom verification email via Resend");
          }
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
    if (!email.trim() || !password.trim()) {
      setError(t('auth_missing_fields'));
      return;
    }
    
    if (mode === "signup") {
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
    }

    if (mode === "signin") {
      await signIn();
    } else {
      await signUp();
    }
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col items-center ${mode === 'signin' ? 'overflow-hidden' : 'overflow-y-auto'} bg-black text-white overscroll-none selection:bg-[#7C3AED]/30 relative`}>
      <style>{autofillStyles}</style>
      {/* Absolute Full Screen Black Background */}
      <div className="fixed inset-0 bg-black z-0 pointer-events-none" />

      {/* Sticky Header Background Container */}
      <div className="sticky top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-20 bg-black w-full" />
        <div className="h-32 bg-gradient-to-b from-black via-black/95 to-transparent w-full" />
      </div>

      {/* Header Area */}
      <div className="w-full max-w-[430px] px-6 pb-2 -mt-[180px] relative z-[60] flex flex-col">
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
              <div className={mode === tab.id ? "text-white" : "text-white/30 hover:text-white transition-colors"}>
                {tab.label}
              </div>
              {mode === tab.id && (
                <div className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[#7C3AED] rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Image based on mode */}
        <div className="w-full max-w-[360px] flex justify-center mb-8 relative z-10">
          {mode === "signin" ? (
            <div className="relative w-full h-[180px] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <Image 
                src="/images/parking-lot.jfif" 
                alt="Smiling woman with a purple car" 
                fill
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="relative w-full h-[180px] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
              <Image 
                src="/images/app-preview.jfif" 
                alt="Smartphone app preview" 
                fill
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
        </div>

        <div className="w-full max-w-[360px] space-y-8 relative z-10">
          <form onSubmit={submit} className="space-y-6">
          <div className="space-y-6">
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

            {mode === "signin" && (
              <>
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
                    <span className="text-[11px] font-semibold text-[#7C3AED] hover:underline cursor-pointer">
                      Pročitaj i prihvati uvjete
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-6 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center w-1/2 h-11 rounded-full bg-[#7C3AED] px-4 text-[14px] font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4),0_4px_10px_rgba(0,0,0,0.3)] border border-white/20 transition-all hover:bg-[#6D28D9] hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                mode === "signup" ? "Verificiraj" : "Prijavi se"
              )}
            </button>
            
            {/* Footer Text - Moved Up */}
            <p className="text-[11px] text-white/30 tracking-wider">
              Sva prava pridžana © 2026 PayParq Global Inc.
            </p>
          </div>
        </form>

        <div className="min-h-[20px] text-center">
          {message && <p className="text-sm text-green-400 font-medium">{message}</p>}
          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
        </div>
      </div>
      </div>
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
