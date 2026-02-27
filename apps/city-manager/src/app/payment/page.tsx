"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<"osobno" | "posao">("osobno");
  const [payparqBalance, setPayparqBalance] = useState<number>(0);
  const [showPayparqInfo, setShowPayparqInfo] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"payparq" | "cash" | "gpay" | "applepay" | "card">("cash");

  useEffect(() => {
    const acct =
      (searchParams.get("acct") as "osobno" | "posao") ||
      (typeof window !== "undefined"
        ? (localStorage.getItem("pp_accountType") as "osobno" | "posao" | null)
        : null) ||
      "osobno";
    setAccountType(acct);
    if (typeof window !== "undefined") {
      const bal = Number(localStorage.getItem("pp_payparqBalance") || "0");
      setPayparqBalance(isNaN(bal) ? 0 : bal);
      
      const savedMethod = localStorage.getItem("pp_paymentMethod") as any;
      if (savedMethod) setSelectedPayment(savedMethod);
    }
  }, [searchParams]);

  const choose = (method: "payparq" | "cash" | "gpay" | "applepay" | "card") => {
    setSelectedPayment(method);
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_paymentMethod", method);
      localStorage.setItem("pp_accountType", accountType);
    }
    // router.push("/rides" as any); // Maknuto automatsko prebacivanje da korisnik vidi kvačicu
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden fixed inset-0">
      <div className="w-full max-w-sm mx-auto flex flex-col h-full py-4">
        
        {/* Header sa Toggle-om */}
        <div className="flex flex-col space-y-4 mb-4 px-2">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push("/rides" as any)}
              className="p-1 -ml-1 bg-transparent border-0 shadow-none outline-none cursor-pointer active:scale-90 transition-all"
            >
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-[20px] font-normal tracking-tight">Plaćanje</div>
          </div>
          <div className="flex items-center bg-black/[0.03] rounded-full p-1 border-0 shadow-none w-full">
            <button
              onClick={() => setAccountType("osobno")}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all border-0 shadow-none ${
                accountType === "osobno" ? "bg-white text-black" : "text-black/40"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Osobno</span>
            </button>
            <button
              onClick={() => setAccountType("posao")}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all border-0 shadow-none ${
                accountType === "posao" ? "bg-white text-black" : "text-black/40"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>Posao</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Gornja sekcija: Payparq / Info */}
          <div className="relative">
            <div 
              onClick={() => choose("payparq")} 
              className={`px-4 py-2 bg-transparent relative cursor-pointer active:scale-95 transition-all rounded-xl border-0 shadow-none ${selectedPayment === 'payparq' ? 'bg-black/[0.02]' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center border-[1px] border-white">
                    <span className="text-[10px] font-black text-white leading-none">P</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-normal">Payparq račun</span>
                    <span className="text-[11px] text-black/40">Saldo: €{payparqBalance.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPayparqInfo(!showPayparqInfo);
                    }}
                    className="text-[11px] text-black/40 underline underline-offset-2 bg-transparent border-0 shadow-none p-0"
                  >
                    Što je ovo?
                  </button>
                </div>
              </div>
            </div>

            {/* Dropdown za info - Apsolutno pozicioniran da ne miče layout */}
            {showPayparqInfo && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 px-4 py-3 bg-white border border-black/[0.05] rounded-xl shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-[12px] leading-relaxed text-black/70">
                  Payparq račun je vaš digitalni novčanik unutar aplikacije. Omogućuje brže plaćanje bez čekanja na autorizaciju kartice.
                </p>
              </div>
            )}
          </div>

          {/* Donja sekcija: Ostali načini plaćanja */}
          <div className="space-y-5 pt-4">
            <div className="px-4 text-[10px] uppercase tracking-[0.2em] font-normal text-black/40">Načini plaćanja</div>
            
            <div className="space-y-1 px-2">
              <button
                onClick={() => choose("cash")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border-0 shadow-none bg-transparent active:scale-95 ${selectedPayment === 'cash' ? 'bg-black/[0.02]' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <span className="text-[14px] font-normal">Gotovina</span>
                </div>
                {selectedPayment === 'cash' && (
                  <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => choose("gpay")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border-0 shadow-none bg-transparent active:scale-95 ${selectedPayment === 'gpay' ? 'bg-black/[0.02]' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-[12px] font-bold">GPay</span>
                  </div>
                  <span className="text-[14px] font-normal">Google Pay</span>
                </div>
                {selectedPayment === 'gpay' && (
                  <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => choose("applepay")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border-0 shadow-none bg-transparent active:scale-95 ${selectedPayment === 'applepay' ? 'bg-black/[0.02]' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-[12px] font-bold">iPay</span>
                  </div>
                  <span className="text-[14px] font-normal">iPay</span>
                </div>
                {selectedPayment === 'applepay' && (
                  <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => router.push("/payment/card" as any)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border-0 shadow-none bg-transparent active:scale-95"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <span className="text-[14px] font-normal">Dodaj karticu</span>
                </div>
                <svg className="w-4 h-4 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sekcija: Kuponi - NA DNU STRANICE */}
          <div className="space-y-4 pt-2">
            <div className="px-4 text-[10px] uppercase tracking-[0.2em] font-normal text-black/40">Kuponi</div>
            <div className="px-4 py-1 bg-transparent border-y border-black/[0.03] py-4">
              <button
                onClick={() => router.push("/payment/coupon" as any)}
                className="w-full flex items-center justify-between bg-transparent border-0 shadow-none p-0 active:scale-95 transition-all outline-none cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 5l-1.761 1.761a2 2 0 0 0 0 2.828L15 11.35M9 5l1.761 1.761a2 2 0 0 1 0 2.828L9 11.35" />
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                    </svg>
                  </div>
                  <span className="text-[14px] font-normal">Dodaj kupon</span>
                </div>
                <svg className="w-4 h-4 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
