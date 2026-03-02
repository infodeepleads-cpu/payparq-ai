"use client";
import { useState } from "react";
import { default as TurnstileWidget } from "react-turnstile";
import { env } from "@/lib/env";

interface TurnstileProps {
  onVerify: (token: string) => void;
  className?: string;
}

export default function Turnstile({ onVerify, className }: TurnstileProps) {
  const [error, setError] = useState<string | null>(null);
  const isDev = process.env.NODE_ENV === "development";
  
  // Use user-provided site key, or the test key in development
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (isDev ? "1x00000000000000000000AA" : "");

  if (!siteKey) {
    return (
      <div className="p-3 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-[300px]">
        Cloudflare Turnstile site key missing. Please add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your environment variables.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-2 max-w-[300px]">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="font-bold uppercase tracking-wider">Turnstile Greška</span>
        </div>
        <p className="opacity-70 leading-relaxed">
           Vaša domena nije odobrena u Cloudflare postavkama, site key je neispravan ili vaš preglednik blokira skriptu (AdBlock).
         </p>
        <button 
          onClick={() => setError(null)}
          className="text-white/40 hover:text-white transition-colors underline underline-offset-4 self-start"
        >
          Pokušaj ponovno
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <TurnstileWidget
        sitekey={siteKey}
        onVerify={onVerify}
        theme="dark"
        onError={() => setError("110200")}
      />
    </div>
  );
}
