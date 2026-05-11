export type AppLocale = "en" | "hr";

export const LOCALE_COOKIE_NAME = "pp_locale";
export const DEFAULT_LOCALE: AppLocale = "en";
export const CROATIAN_COUNTRIES = new Set(["RS", "BA", "ME"]);

export function normalizeLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "en" || normalized === "hr") return normalized;
  return null;
}

export function detectLocaleFromAcceptLanguage(headerValue: string | null | undefined): AppLocale | null {
  if (!headerValue) return null;
  const items = headerValue
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter((part): part is string => Boolean(part));
  for (const item of items) {
    if (item.startsWith("hr") || item.startsWith("bs") || item.startsWith("sr")) return "hr";
    if (item.startsWith("en")) return "en";
  }
  return null;
}

export function detectLocaleFromCountry(countryCode: string | null | undefined): AppLocale | null {
  if (!countryCode) return null;
  return CROATIAN_COUNTRIES.has(countryCode.toUpperCase()) ? "hr" : null;
}
