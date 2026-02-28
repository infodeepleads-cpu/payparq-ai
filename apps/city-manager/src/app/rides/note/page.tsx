"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const templates = [
  "Kod za ulazna vrata je",
  "Nosim",
  "Nalazim se na uglu",
  "Stojim ispred broja",
  "Preuzimanje je kod"
];

export default function DriverNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dn = localStorage.getItem("pp_driverNote");
      if (dn) setText(dn);
    }
  }, []);

  const save = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pp_driverNote", text || "");
    }
    const params = new URLSearchParams(searchParams.toString());
    router.push(`/rides?${params.toString()}` as any);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-[720px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("step", "pickup");
                router.push(`/rides?${params.toString()}` as any);
              }}
              className="p-1 -ml-1 bg-transparent border-0 shadow-none outline-none cursor-pointer active:scale-90 transition-all"
            >
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[20px] font-black">Napomena vozaču</h1>
          </div>
          <button onClick={save} className="px-4 h-[40px] bg-black text-white rounded-full text-[14px] font-medium">
            Pošalji
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t}
              onClick={() => setText(t)}
              className="text-left px-2.5 py-2 rounded-lg border border-black/10 hover:border-black/20 active:scale-[0.99] transition-all"
            >
              <div className="text-[12px] text-black/60">Predložak</div>
              <div className="text-[13px] text-black">{t}</div>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-[12px] text-black/60">Uredite poruku</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Npr. Nalazim se na uglu Ilice i Frankopanske"
            className="w-full min-h-[120px] border border-black/10 rounded-xl p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div className="flex items-center justify-end">
          <button onClick={save} className="px-4 h-[40px] bg-[#7C3AED] text-white rounded-full text-[14px] font-bold">
            Pošalji
          </button>
        </div>
      </div>
    </div>
  );
}
