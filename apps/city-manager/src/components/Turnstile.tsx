"use client";
import { default as TurnstileWidget } from "react-turnstile";
import { env } from "@/lib/env";

interface TurnstileProps {
  onVerify: (token: string) => void;
  className?: string;
}

export default function Turnstile({ onVerify, className }: TurnstileProps) {
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="p-3 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        Cloudflare Turnstile site key missing. Please add NEXT_PUBLIC_TURNSTILE_SITE_KEY to .env.local.
      </div>
    );
  }

  return (
    <div className={className}>
      <TurnstileWidget
        sitekey={siteKey}
        onVerify={onVerify}
        theme="dark"
      />
    </div>
  );
}
