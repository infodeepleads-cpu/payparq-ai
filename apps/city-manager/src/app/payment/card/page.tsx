"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CardPage() {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const handleSave = () => {
    if (cardNumber && expiry && cvc) {
      router.push("/payment" as any);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden fixed inset-0">
      <div className="w-full max-w-sm mx-auto flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-10 px-4">
          <button 
            onClick={() => router.push("/payment" as any)}
            className="p-1 -ml-1 bg-transparent border-0 shadow-none outline-none cursor-pointer active:scale-90 transition-all"
          >
            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-[20px] font-normal tracking-tight">Dodaj karticu</div>
        </div>

        {/* Form Area */}
        <div className="space-y-6 px-4">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-black/40 px-1 font-medium">Broj kartice</label>
            <input
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full bg-black/[0.03] border-0 rounded-2xl px-5 py-5 text-[16px] outline-none placeholder:text-black/20 shadow-none font-medium"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40 px-1 font-medium">Datum isteka</label>
              <input
                type="text"
                placeholder="MM/GG"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-black/[0.03] border-0 rounded-2xl px-5 py-5 text-[16px] outline-none placeholder:text-black/20 shadow-none font-medium"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-black/40 px-1 font-medium">CVC</label>
              <input
                type="text"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="w-full bg-black/[0.03] border-0 rounded-2xl px-5 py-5 text-[16px] outline-none placeholder:text-black/20 shadow-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto pb-8 px-4">
          <button
            onClick={handleSave}
            disabled={!cardNumber || !expiry || !cvc}
            className="w-full bg-black text-white py-4 rounded-2xl text-[15px] font-medium active:scale-95 transition-all disabled:opacity-20 disabled:active:scale-100 shadow-none border-0 outline-none"
          >
            Spremi karticu
          </button>
        </div>
      </div>
    </div>
  );
}
