"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { AppLocale, LOCALE_COOKIE_NAME } from "@/lib/locale";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale: AppLocale) => {
        if (nextLocale === locale) return;
        document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = nextLocale;
        setLocaleState(nextLocale);
        window.location.reload();
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
