"use client";

import { useLocale } from "@/components/LocaleProvider";

export function FooterLocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 text-[10px] md:text-xs text-white/55">
      <button
        type="button"
        className={locale === "en" ? "text-white/90" : "text-white/55 hover:text-white/80 transition-colors"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <span className="text-white/35">|</span>
      <button
        type="button"
        className={locale === "hr" ? "text-white/90" : "text-white/55 hover:text-white/80 transition-colors"}
        onClick={() => setLocale("hr")}
      >
        HR
      </button>
    </div>
  );
}
