"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CouponPage() {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [discount, setDiscount] = useState<number | null>(null);

  const handleApply = () => {
    if (!couponCode.trim()) return;

    if (couponCode.toUpperCase() === "PROMO20") {
      setStatus("success");
      setDiscount(20);
      setTimeout(() => {
        router.push("/payment" as any);
      }, 1500);
    } else {
      setStatus("error");
      setDiscount(null);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden fixed inset-0">
      <div className="w-full max-w-sm mx-auto flex flex-col h-full py-4">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-4 px-2">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push("/payment" as any)}
              className="p-1 -ml-1 bg-transparent border-0 shadow-none outline-none cursor-pointer active:scale-90 transition-all"
            >
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-[20px] font-normal tracking-tight">Dodaj kupon</div>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-6 px-4">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-black/40 px-1 font-medium">Kod kupona</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Unesi kod"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setStatus("idle");
                }}
                className={`w-full bg-black/[0.03] border-0 rounded-2xl px-5 py-5 text-[16px] outline-none placeholder:text-black/20 shadow-none transition-all font-medium ${
                  status === 'success' ? 'bg-green-50 text-green-700' : 
                  status === 'error' ? 'bg-red-50 text-red-700' : ''
                }`}
                autoFocus
              />
              {status === 'success' && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="h-6 px-1">
              {status === "success" && (
                <p className="text-[12px] text-green-600 font-medium italic animate-in fade-in slide-in-from-top-1">
                  Primijenjen je popust {discount}%!
                </p>
              )}
              {status === "error" && (
                <p className="text-[12px] text-red-600 font-medium italic animate-in fade-in slide-in-from-top-1">
                  Kupon nije pronađen.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto pb-8 px-4">
          <button
            onClick={handleApply}
            disabled={!couponCode.trim() || status === "success"}
            className="w-full bg-black text-white py-4 rounded-2xl text-[15px] font-medium active:scale-95 transition-all disabled:opacity-20 disabled:active:scale-100 shadow-none border-0 outline-none"
          >
            {status === "success" ? "Kupon primijenjen" : "Primijeni kupon"}
          </button>
        </div>
      </div>
    </div>
  );
}
