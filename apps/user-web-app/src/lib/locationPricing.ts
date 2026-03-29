type PricingType = "hourly" | "daily" | "monthly";

type PricingSource = {
  rate_per_hour?: number | null;
  base_price_hourly?: number | null;
  base_price_daily?: number | null;
  base_price_monthly?: number | null;
  rate_per_hour_floor?: number | null;
  rate_per_hour_ceiling?: number | null;
  base_price_daily_floor?: number | null;
  base_price_daily_ceiling?: number | null;
  base_price_monthly_floor?: number | null;
  base_price_monthly_ceiling?: number | null;
  enforcement_pricing_mode?: string | null;
  enforcmetn_pricing_mode?: string | null;
  verification_metadata?: Record<string, unknown> | null;
};

function toFiniteMetadataNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  if (parsed > 9999) return 9999;
  return parsed;
}

function toPositiveNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function resolvePricingModeFromSource(source: PricingSource): PricingType {
  const metadata =
    source.verification_metadata &&
    typeof source.verification_metadata === "object"
      ? source.verification_metadata
      : null;
  const modeRaw =
    source.enforcement_pricing_mode ??
    source.enforcmetn_pricing_mode ??
    (metadata?.["enforcement_pricing_mode"] as string | undefined) ??
    (metadata?.["enforcmetn_pricing_mode"] as string | undefined) ??
    "hourly";
  const normalized = String(modeRaw).trim().toLowerCase();
  if (normalized === "daily") return "daily";
  if (normalized === "monthly") return "monthly";
  return "hourly";
}

export function resolveScannerTruthPriceEuro(
  source: PricingSource,
  type: PricingType
): number {
  let euro = 5;
  let floor = 0;
  let ceiling = 0;
  if (type === "hourly") {
    euro = toPositiveNumber(source.rate_per_hour ?? source.base_price_hourly, 5);
    floor = toPositiveNumber(source.rate_per_hour_floor);
    ceiling = toPositiveNumber(source.rate_per_hour_ceiling);
  } else if (type === "daily") {
    euro = toPositiveNumber(source.base_price_daily, 20);
    floor = toPositiveNumber(source.base_price_daily_floor);
    ceiling = toPositiveNumber(source.base_price_daily_ceiling);
  } else {
    euro = toPositiveNumber(source.base_price_monthly, 150);
    floor = toPositiveNumber(source.base_price_monthly_floor);
    ceiling = toPositiveNumber(source.base_price_monthly_ceiling);
  }
  if (floor > 0 && euro < floor) euro = floor;
  if (ceiling > 0 && euro > ceiling) euro = ceiling;
  if (!Number.isFinite(euro) || euro < 0) euro = 0;
  return euro;
}

export function resolveParkTaxiPriceEuro(source: PricingSource): number {
  const metadata =
    source.verification_metadata &&
    typeof source.verification_metadata === "object"
      ? source.verification_metadata
      : null;
  const raw = metadata?.["park_taxi_price"];
  return toFiniteMetadataNumber(raw);
}

export function formatEuroLabel(amountEuro: number): string {
  return `€${amountEuro.toFixed(2)}`;
}

export function normalizeLocationName(name: string | null | undefined): string {
  const raw = String(name ?? "").trim();
  if (!raw) return "";
  const normalized = raw.replace(/\s+/g, " ");
  const brandPrefixRegex =
    /^(?:safe\s+parking\s+by\s+payparq|sigurno\s+parkiranje(?:\s+(?:uz|by|s))?\s+payparq)\b/i;
  if (brandPrefixRegex.test(normalized)) {
    const remainder = normalized.replace(brandPrefixRegex, "").trim();
    return remainder
      ? `Safe Parking by PayParq ${remainder}`
      : "Safe Parking by PayParq";
  }
  return normalized;
}
