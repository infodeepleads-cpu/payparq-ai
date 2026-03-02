"use client";
import { default as TurnstileWidget } from "react-turnstile";
import { env } from "@/lib/env";

interface TurnstileProps {
  onVerify: (token: string) => void;
  className?: string;
}

export default function Turnstile({ onVerify, className }: TurnstileProps) {
  const isDev = process.env.NODE_ENV === "development";
  
  // Use user-provided site key, or the test key in development
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (isDev ? "1x00000000000000000000AA" : "");

  if (!siteKey) return null;

  return (
    <div className={`${className} hidden`}>
      <TurnstileWidget
        sitekey={siteKey}
        onVerify={onVerify}
        theme="dark"
        appearance="always"
      />
    </div>
  );
}
