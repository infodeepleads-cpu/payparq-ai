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

export type TieredDailyConfig = {
  rates: number[];   // rates[0] = day 1, rates[1] = day 2, etc.
  increment: number; // added per day beyond the defined rates
};

export function getTieredDailyConfig(source: PricingSource): TieredDailyConfig | null {
  const meta = source.verification_metadata;
  if (!meta || typeof meta !== 'object') return null;
  if (!meta['tiered_daily_enabled']) return null;
  const raw = meta['tiered_daily_rates'];
  const rates = Array.isArray(raw)
    ? (raw as unknown[]).map((v) => toPositiveNumber(v, 0)).filter((v) => v > 0)
    : [];
  if (rates.length === 0) return null;
  const increment = toPositiveNumber(meta['tiered_daily_increment'], 0);
  return { rates, increment };
}

export function calculateTieredDailyPrice(config: TieredDailyConfig, days: number): number {
  if (days <= 0) return 0;
  if (days <= config.rates.length) return config.rates[days - 1];
  const lastRate = config.rates[config.rates.length - 1];
  return lastRate + (days - config.rates.length) * config.increment;
}

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
    // For monthly: use explicit monthly price if set, otherwise calculate from daily (daily × 25 days)
    const explicitMonthly = toPositiveNumber(source.base_price_monthly);
    if (explicitMonthly > 0) {
      euro = explicitMonthly;
    } else {
      const dailyPrice = toPositiveNumber(source.base_price_daily, 20);
      euro = dailyPrice * 25; // 25 days gives ~17% discount for monthly commitment
    }
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

export function getViablePrice(
  source: PricingSource,
  durationHours: number,
  reservationType: string
): number {
  if (reservationType === 'Mjesečna') {
    return resolveScannerTruthPriceEuro(source, 'monthly');
  }

  if (durationHours < 8) {
    return resolveScannerTruthPriceEuro(source, 'hourly');
  }

  const days = Math.ceil(durationHours / 24);
  const tiered = getTieredDailyConfig(source);
  if (tiered) {
    return calculateTieredDailyPrice(tiered, days);
  }

  const hourlyTotal = resolveScannerTruthPriceEuro(source, 'hourly') * durationHours;
  const dailyTotal = resolveScannerTruthPriceEuro(source, 'daily');
  return Math.min(hourlyTotal, dailyTotal);
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
