import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  resolveParkTaxiPriceEuro,
  resolveScannerTruthPriceEuro,
} from "@/lib/locationPricing";
import {
  buildStripeSplitMetadata,
  buildStripeSplitPaymentIntentData,
  buildStripeSplitPlan,
  resolveAutomaticSplitDestination,
  resolveCaseOwnerFixedPayoutCents,
  resolveLotPayoutMode,
  resolveSplitExpenseRate,
  resolveSplitFixedExpenseCents,
  resolveSplitTaxRate,
} from "../../../../../../shared/stripeSplit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PricingType = "hourly" | "daily" | "monthly";
const STRIPE_CARD_MIN_AMOUNT_CENTS = 50;
const unifiedStripeSuccessUrl =
  "https://www.payparq.com/success?session_id={CHECKOUT_SESSION_ID}";
const unifiedStripeCancelUrl = "https://www.payparq.com/success";
const stripeApiVersion =
  "2025-03-31.basil" as unknown as Stripe.LatestApiVersion;

function resolveStripeSecretKey(): string | null {
  const candidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_KEY,
    process.env.STRIPE_API_SECRET,
    process.env.STRIPE_PRIVATE_KEY,
    process.env.STRIPE_LIVE_SECRET_KEY,
    process.env.STRIPE_TEST_SECRET_KEY,
    process.env.NEXT_PRIVATE_STRIPE_SECRET_KEY,
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY,
  ];
  for (const rawValue of candidates) {
    const secret = (rawValue ?? "")
      .trim()
      .replace(/^['"]+|['"]+$/g, "");
    if (!secret) continue;
    if (!/^sk_(test|live)_/i.test(secret)) continue;
    if (/your_stripe|replace_me|changeme|example/i.test(secret)) continue;
    return secret;
  }
  return null;
}

function buildSupabaseFunctionCheckoutUrl(params: {
  locationId: string;
  displayId?: string;
  flowType: string;
  pricingType: PricingType;
  checkIn?: string;
  checkOut?: string;
  quantity?: number;
  reservationDescription?: string;
  allowPromotionCodes: boolean;
  customerEmail?: string;
  customerPhone?: string;
  plateNumber?: string;
  allowPlateOverride?: boolean;
  extendTargetSessionId?: string;
  extendMinutes?: number;
}): string | null {
  const supabaseBase =
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "")
      .trim();
  if (!supabaseBase) return null;
  const url = new URL(
    "/functions/v1/create-checkout",
    supabaseBase.replace(/\/+$/, ""),
  );
  url.searchParams.set("location_id", params.locationId);
  if (params.displayId) {
    url.searchParams.set("display_id", params.displayId);
  }
  if (params.flowType) {
    url.searchParams.set("flow", params.flowType);
  }
  if (params.flowType === "park_now") {
    url.searchParams.set("park_taxi", "1");
  }
  url.searchParams.set("type", params.pricingType);
  if (params.checkIn) {
    url.searchParams.set("check_in", params.checkIn);
  }
  if (params.checkOut) {
    url.searchParams.set("check_out", params.checkOut);
  }
  if (
    typeof params.quantity === "number" && Number.isFinite(params.quantity) &&
    params.quantity > 0
  ) {
    url.searchParams.set(
      "quantity",
      String(Math.max(1, Math.ceil(params.quantity))),
    );
  }
  const trimmedDescription = forceCETLabel(
    (params.reservationDescription ?? "").trim(),
  );
  if (trimmedDescription) {
    url.searchParams.set("description", trimmedDescription);
    url.searchParams.set("reservation_description", trimmedDescription);
  }
  if (params.customerEmail) {
    url.searchParams.set("email", params.customerEmail);
  }
  if (params.customerPhone) {
    url.searchParams.set("phone", params.customerPhone);
    url.searchParams.set("mobile", params.customerPhone);
  }
  if (params.plateNumber) {
    url.searchParams.set("plate", params.plateNumber);
  }
  if (params.allowPlateOverride) {
    url.searchParams.set("allow_plate_override", "1");
  }
  if (params.extendTargetSessionId) {
    url.searchParams.set(
      "extend_target_session_id",
      params.extendTargetSessionId,
    );
  }
  if (
    typeof params.extendMinutes === "number" &&
    Number.isFinite(params.extendMinutes) && params.extendMinutes > 0
  ) {
    url.searchParams.set(
      "extend_minutes",
      String(Math.round(params.extendMinutes)),
    );
  }
  url.searchParams.set(
    "allow_promotion_codes",
    params.allowPromotionCodes ? "1" : "0",
  );
  url.searchParams.set("t", Date.now().toString());
  return url.toString();
}

function buildSuccessUrl(params: {
  locationId?: string;
  displayId?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const url = new URL("https://www.payparq.com/success");
  url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  if (params.locationId) {
    url.searchParams.set("location_id", params.locationId);
  }
  if (params.displayId) {
    url.searchParams.set("display_id", params.displayId);
  }
  if (params.checkIn) {
    url.searchParams.set("check_in", params.checkIn);
  }
  if (params.checkOut) {
    url.searchParams.set("check_out", params.checkOut);
  }
  return url
    .toString()
    .replace(
      "session_id=%7BCHECKOUT_SESSION_ID%7D",
      "session_id={CHECKOUT_SESSION_ID}",
    );
}

function normalizeEmailValue(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizePhoneValue(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizePlateValue(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function firstDefinedStringValue(
  metadata: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

async function resolveMemberEmailFromRequest(
  req: NextRequest,
): Promise<string | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (token && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error) {
      return normalizeEmailValue(data.user?.email ?? null);
    }
  }
  return normalizeEmailValue(req.headers.get("x-member-email"));
}

function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function asMetadataRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function requiresLiveSplit(params: {
  ownerStripeReady: boolean;
  ownerStripeAccountId: string | null;
}) {
  return params.ownerStripeReady &&
    typeof params.ownerStripeAccountId === "string" &&
    params.ownerStripeAccountId.trim().length > 0;
}

function hasLiveSplitEvidence(params: {
  splitPlan: ReturnType<typeof buildStripeSplitPlan> | null;
  splitMetadata: Record<string, string>;
  paymentIntentData: Record<string, unknown>;
}) {
  const transferData = params.paymentIntentData["transfer_data"];
  const transferDestination = transferData &&
      typeof transferData === "object" &&
      !Array.isArray(transferData)
    ? String(
      (transferData as Record<string, unknown>)["destination"] ?? "",
    ).trim()
    : "";
  const applicationFeeAmount = Number(
    params.paymentIntentData["application_fee_amount"] ?? Number.NaN,
  );
  return params.splitPlan !== null &&
    params.splitMetadata["split_enabled"] === "1" &&
    String(params.splitMetadata["split_destination_account_id"] ?? "").trim()
      .length > 0 &&
    String(params.splitMetadata["split_rule"] ?? "").trim().length > 0 &&
    transferDestination.length > 0 &&
    Number.isFinite(applicationFeeAmount) &&
    applicationFeeAmount >= 0;
}

function resolveCommissionRateFromMetadata(metadata: unknown): number {
  if (!metadata || typeof metadata !== "object") return 0.15;
  const candidateKeys = [
    "comm_regular_payment",
    "commission_rate",
    "commission",
    "platform_commission",
    "payparq_commission",
  ];
  for (const key of candidateKeys) {
    const rawValue = (metadata as Record<string, unknown>)[key];
    const numeric = Number(rawValue);
    if (Number.isFinite(numeric) && numeric > 0) {
      if (numeric > 1) return Math.min(1, numeric / 100);
      return Math.min(1, numeric);
    }
  }
  return 0.15;
}

async function resolvePlannedWalletDebitCents(
  email: string | null,
  sessionAmountCents: number,
): Promise<number> {
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const safeSessionAmount = toCents(sessionAmountCents);
  if (!normalizedEmail || safeSessionAmount <= 0) return 0;
  const client = supabaseAdmin ?? supabase;
  if (!client) return 0;
  const { data } = await client
    .from("wallet_accounts")
    .select("balance_cents")
    .eq("email", normalizedEmail)
    .maybeSingle();
  const balanceCents = toCents(
    Number(
      (data as { balance_cents?: number | string } | null)?.balance_cents ?? 0,
    ),
  );
  if (balanceCents <= 0) return 0;
  return Math.min(balanceCents, safeSessionAmount);
}

async function resolveMemberCheckoutDefaults(email: string | null): Promise<{
  plateNumber: string | null;
  customerPhone: string | null;
}> {
  const normalizedEmail = normalizeEmailValue(email);
  if (!normalizedEmail) {
    return { plateNumber: null, customerPhone: null };
  }
  const client = supabaseAdmin ?? supabase;
  if (!client) {
    return { plateNumber: null, customerPhone: null };
  }
  const parseMetadata = (
    value: Record<string, unknown> | string | null | undefined,
  ) => {
    if (!value) return null;
    if (typeof value === "object") return value as Record<string, unknown>;
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  };
  const fillFromRows = (
    rows: Array<{
      plate?: string | null;
      mobile?: string | null;
      stripe_metadata?: Record<string, unknown> | string | null;
    }>,
  ) => {
    let plateNumber: string | null = null;
    let customerPhone: string | null = null;
    for (const row of rows) {
      const metadata = parseMetadata(row.stripe_metadata);
      if (!plateNumber) {
        plateNumber = normalizePlateValue(
          row.plate ??
            firstDefinedStringValue(metadata, [
              "plate",
              "plate_number",
              "plateNumber",
              "license_plate",
              "vehicle_plate",
              "registration_number",
            ]) ??
            null,
        );
      }
      if (!customerPhone) {
        customerPhone = normalizePhoneValue(
          row.mobile ??
            firstDefinedStringValue(metadata, [
              "mobile",
              "phone",
              "customer_phone",
              "customerPhone",
              "phone_number",
              "contact_phone",
              "customer_mobile",
            ]) ??
            null,
        );
      }
      if (plateNumber && customerPhone) {
        break;
      }
    }
    return { plateNumber, customerPhone };
  };
  const { data } = await client
    .from("parking_sessions")
    .select("plate,mobile,stripe_metadata")
    .ilike("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(20);
  const directMatch = fillFromRows(
    (data ?? []) as Array<{
      plate?: string | null;
      mobile?: string | null;
      stripe_metadata?: Record<string, unknown> | string | null;
    }>,
  );
  if (directMatch.plateNumber && directMatch.customerPhone) {
    return directMatch;
  }
  const { data: fallbackRows } = await client
    .from("parking_sessions")
    .select("plate,mobile,stripe_metadata")
    .not("stripe_metadata", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const metadataEmailRows = ((fallbackRows ?? []) as Array<{
    plate?: string | null;
    mobile?: string | null;
    stripe_metadata?: Record<string, unknown> | string | null;
  }>).filter((row) => {
    const metadata = parseMetadata(row.stripe_metadata);
    const metadataEmail = normalizeEmailValue(
      (metadata?.email as string | undefined) ??
        (metadata?.customer_email as string | undefined) ??
        null,
    );
    return metadataEmail === normalizedEmail;
  });
  const metadataMatch = fillFromRows(metadataEmailRows);
  return {
    plateNumber: directMatch.plateNumber ?? metadataMatch.plateNumber,
    customerPhone: directMatch.customerPhone ?? metadataMatch.customerPhone,
  };
}

async function resolveStripeCustomerIdByEmail(
  stripe: Stripe,
  email: string | null,
): Promise<string | null> {
  if (!email) return null;
  try {
    const list = await stripe.customers.list({
      email,
      limit: 10,
    });
    const exact = list.data.find(
      (customer) => (customer.email ?? "").trim().toLowerCase() === email,
    );
    return exact?.id ?? list.data[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function resolveStripeCustomerForCheckout(params: {
  stripe: Stripe;
  customerEmail: string | null;
  customerPhone: string | null;
}) {
  const customerId = await resolveStripeCustomerIdByEmail(
    params.stripe,
    params.customerEmail,
  );
  if (customerId) {
    if (params.customerPhone) {
      try {
        await params.stripe.customers.update(customerId, {
          phone: params.customerPhone,
        });
      } catch {
      }
    }
    return { customerId, customerEmail: params.customerEmail };
  }
  if (params.customerEmail || params.customerPhone) {
    try {
      const created = await params.stripe.customers.create({
        email: params.customerEmail ?? undefined,
        phone: params.customerPhone ?? undefined,
      });
      return { customerId: created.id, customerEmail: params.customerEmail };
    } catch {
    }
  }
  return { customerId: null, customerEmail: params.customerEmail };
}

function buildCheckoutCustomerParams(params: {
  customerId: string | null;
  customerEmail: string | null;
}): Pick<
  Stripe.Checkout.SessionCreateParams,
  "customer" | "customer_email" | "customer_creation"
> {
  if (params.customerId) {
    return { customer: params.customerId };
  }
  if (params.customerEmail) {
    return {
      customer_email: params.customerEmail,
      customer_creation: "always",
    };
  }
  return {};
}

function buildCheckoutPlateCustomField(plateNumber: string) {
  const normalizedPlate = plateNumber.trim().toUpperCase();
  return [
    {
      key: "plate_number",
      label: {
        type: "custom",
        custom: "License Plate Number (e.g. MA679XX)",
      },
      type: "text",
      optional: false,
      text: normalizedPlate ? { default_value: normalizedPlate } : undefined,
    },
  ] as unknown as Stripe.Checkout.SessionCreateParams.CustomField[];
}

function parseOptionalBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "1" || normalized === "true" || normalized === "yes" ||
    normalized === "on"
  ) return true;
  if (
    normalized === "0" || normalized === "false" || normalized === "no" ||
    normalized === "off"
  ) return false;
  return undefined;
}

function resolveAllowPromotionCodesDefaultOn(
  bodyValue: unknown,
  queryValue: string | null | undefined,
): boolean {
  const bodyResolved = parseOptionalBooleanValue(bodyValue);
  if (bodyResolved !== undefined) return bodyResolved;
  const queryResolved = parseOptionalBooleanValue(queryValue);
  if (queryResolved !== undefined) return queryResolved;
  return true;
}

function formatBerlinDateTime(value: Date): string {
  try {
    const dateParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(value);
    const get = (type: string) =>
      dateParts.find((p) => p.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${
      get("minute")
    }:${get("second")} CET`;
  } catch {
    return `${value.toISOString().replace("T", " ").split(".")[0]} CET`;
  }
}

function isIsoWithoutTimezone(value: string): boolean {
  const trimmed = value.trim();
  if (/(?:Z|[+\-]\d{2}:\d{2})$/i.test(trimmed)) return false;
  return /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(
    trimmed,
  );
}

function parseNaiveDateParts(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/,
  );
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
  };
}

function resolveTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const zonedAsUtc = Date.UTC(
    get("year"),
    Math.max(0, get("month") - 1),
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((zonedAsUtc - date.getTime()) / 60000);
}

function parseCheckoutDateValue(value: string): Date {
  const trimmed = value.trim();
  if (!isIsoWithoutTimezone(trimmed)) {
    return new Date(trimmed);
  }
  const naive = parseNaiveDateParts(trimmed);
  if (!naive) {
    return new Date(trimmed);
  }
  let utcMillis = Date.UTC(
    naive.year,
    naive.month - 1,
    naive.day,
    naive.hour,
    naive.minute,
    naive.second,
  );
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const offsetMinutes = resolveTimeZoneOffsetMinutes(
      new Date(utcMillis),
      "Europe/Berlin",
    );
    utcMillis = Date.UTC(
      naive.year,
      naive.month - 1,
      naive.day,
      naive.hour,
      naive.minute,
      naive.second,
    ) - offsetMinutes * 60000;
  }
  return new Date(utcMillis);
}

function formatNaiveIsoDateTime(value: string): string {
  const trimmed = value.trim();
  const normalized = trimmed.replace("T", " ").replace(/\.\d{1,3}$/, "");
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00 CET`;
  }
  return normalized.endsWith(" CET") ? normalized : `${normalized} CET`;
}

function forceCETLabel(value: string): string {
  return value.replace(/\bCEST\b/g, "CET");
}

function normalizePricingType(
  rawType: string | null | undefined,
  flowType: string,
): PricingType {
  if (rawType === "daily") return "daily";
  if (rawType === "monthly") return "monthly";
  if (flowType === "park_now") return "daily";
  if (flowType === "monthly") return "monthly";
  return "hourly";
}

function validateParkTaxiReservationWindow(
  flowType: string,
  checkIn: string,
  checkOut: string,
): string | null {
  if (flowType !== "park_now") return null;
  if (!checkIn || !checkOut) {
    return "park_taxi_requires_check_in_and_check_out";
  }
  const start = parseCheckoutDateValue(checkIn);
  const end = parseCheckoutDateValue(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "invalid_check_in_or_check_out";
  }
  if (end.getTime() <= start.getTime()) {
    return "check_out_must_be_after_check_in";
  }
  return null;
}

function exceedsOneDayDuration(checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false;
  const start = parseCheckoutDateValue(checkIn);
  const end = parseCheckoutDateValue(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }
  return end.getTime() - start.getTime() > 24 * 60 * 60 * 1000;
}

function formatCheckoutIso(iso: string): string {
  if (!iso) return "";
  if (isIsoWithoutTimezone(iso)) {
    return formatNaiveIsoDateTime(iso);
  }
  try {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return formatBerlinDateTime(parsed);
    }
    return iso;
  } catch {
    return iso;
  }
}

function buildFallbackCheckoutDetails(params: {
  flowType: string;
  pricingType: PricingType;
  checkIn: string;
  checkOut: string;
  displayId: string;
}) {
  const isParkTaxiFlow = params.flowType === "park_now";
  const isReserveDailyFlow = params.flowType === "reserve" &&
    params.pricingType === "daily";
  let quantity = 1;
  let reservationDescription = "";
  if (params.checkIn && params.checkOut) {
    const start = new Date(params.checkIn);
    const end = new Date(params.checkOut);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      quantity = isParkTaxiFlow || isReserveDailyFlow
        ? Math.ceil(diff / (1000 * 60 * 60 * 24))
        : Math.ceil(diff / (1000 * 60 * 60));
    }
    reservationDescription = `From: ${formatCheckoutIso(params.checkIn)} To: ${
      formatCheckoutIso(params.checkOut)
    }`;
    if (params.displayId) {
      reservationDescription += `\nLocation ID: ${params.displayId}`;
    }
  } else if (isParkTaxiFlow) {
    reservationDescription = `Start Time: ${formatBerlinDateTime(new Date())}`;
    if (params.displayId) {
      reservationDescription += `\nLocation ID: ${params.displayId}`;
    }
  }
  return { quantity: Math.max(1, quantity), reservationDescription };
}

function buildSwitchCheckoutUrl(params: {
  baseUrl: string;
  locationId: string;
  displayId: string;
  flowType: string;
  targetType: PricingType;
  customerEmail?: string;
  allowPromotionCodes: boolean;
  checkIn?: string;
  checkOut?: string;
}) {
  const {
    baseUrl,
    locationId,
    displayId,
    flowType,
    targetType,
    customerEmail,
    allowPromotionCodes,
    checkIn,
    checkOut,
  } = params;
  const switchUrl = new URL("/api/stripe/checkout", baseUrl);
  switchUrl.searchParams.set("location_id", locationId);
  if (displayId) {
    switchUrl.searchParams.set("display_id", displayId);
  }
  if (flowType) {
    switchUrl.searchParams.set("flow", flowType);
  }
  switchUrl.searchParams.set("type", targetType);
  if (customerEmail) {
    switchUrl.searchParams.set("email", customerEmail);
  }
  if (checkIn) {
    switchUrl.searchParams.set("in", checkIn);
  }
  if (checkOut) {
    switchUrl.searchParams.set("out", checkOut);
  }
  switchUrl.searchParams.set(
    "allow_promotion_codes",
    allowPromotionCodes ? "1" : "0",
  );
  return switchUrl.toString();
}

function buildSubmitMessage(params: {
  pricingType: PricingType;
  baseUrl: string;
  locationId: string;
  displayId: string;
  flowType: string;
  customerEmail?: string;
  allowPromotionCodes: boolean;
  checkIn?: string;
  checkOut?: string;
  minimumChargeApplied: boolean;
}) {
  const minimumChargeLine = params.minimumChargeApplied
    ? "Lots under €0.50/h: card min is €0.50, extra stays as wallet credit."
    : "";
  const termsLine =
    "By paying, you agree to our [Terms of Service](https://www.payparq.com/terms) and [Privacy Policy](https://www.payparq.com/privacy).";
  if (params.pricingType === "daily") {
    const hourlyUrl = buildSwitchCheckoutUrl({
      baseUrl: params.baseUrl,
      locationId: params.locationId,
      displayId: params.displayId,
      flowType: params.flowType,
      targetType: "hourly",
      customerEmail: params.customerEmail,
      allowPromotionCodes: params.allowPromotionCodes,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
    });
    return `Need hourly for this location? [Open hourly checkout](${hourlyUrl})\n${
      [minimumChargeLine, termsLine].filter(Boolean).join("\n")
    }`;
  }
  if (params.pricingType === "hourly") {
    const dailyUrl = buildSwitchCheckoutUrl({
      baseUrl: params.baseUrl,
      locationId: params.locationId,
      displayId: params.displayId,
      flowType: params.flowType,
      targetType: "daily",
      customerEmail: params.customerEmail,
      allowPromotionCodes: params.allowPromotionCodes,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
    });
    return `Need daily for this location? [Open daily checkout](${dailyUrl})\n${
      [minimumChargeLine, termsLine].filter(Boolean).join("\n")
    }`;
  }
  return [minimumChargeLine, termsLine].filter(Boolean).join("\n");
}

type LocationPricingResolution = {
  unitAmountCents: number;
  dailyTicketUnitAmountCents: number;
  resolvedLocationId: string;
  resolvedDisplayId: string;
  resolvedLocationName: string;
  lotPayoutMode: "hub" | "regular";
  lotCommissionRate: number;
  ownerStripeAccountId: string | null;
  ownerStripeReady: boolean;
  splitExpenseRate: number;
  splitTaxRate: number;
  splitFixedExpenseCents: number;
  caseOwnerFixedPayoutCents: number;
};

async function resolveLocationPricing(
  locationId: string,
  displayId: string,
  pricingType: PricingType,
  flowType: string,
): Promise<LocationPricingResolution> {
  const locationClient = supabaseAdmin ?? supabase;
  if (!locationClient) {
    throw { status: 500, message: "supabase_not_configured" };
  }

  const selectedColumns =
    "id,display_id,name,owner_id,verification_metadata,rate_per_hour,base_price_hourly,base_price_daily,base_price_monthly,rate_per_hour_floor,rate_per_hour_ceiling,base_price_daily_floor,base_price_daily_ceiling,base_price_monthly_floor,base_price_monthly_ceiling";

  const fallbackDisplayId = displayId || locationId;
  let data: Record<string, unknown> | null = null;
  if (fallbackDisplayId) {
    const byDisplayId = await locationClient
      .from("locations")
      .select(selectedColumns)
      .eq("display_id", fallbackDisplayId)
      .maybeSingle();
    if (byDisplayId.error) {
      throw { status: 500, message: byDisplayId.error.message };
    }
    data = byDisplayId.data;
  }

  if (!data && locationId) {
    const byId = await locationClient
      .from("locations")
      .select(selectedColumns)
      .eq("id", locationId)
      .maybeSingle();
    if (byId.error) {
      throw { status: 500, message: byId.error.message };
    }
    data = byId.data;
  }

  if (!data) {
    throw { status: 404, message: "location_not_found" };
  }

  const isParkTaxiFlow = flowType === "park_now";
  const parkTaxiEuro = isParkTaxiFlow ? resolveParkTaxiPriceEuro(data) : 0;
  const dailyTicketEuro = resolveScannerTruthPriceEuro(data, "daily");
  const resolvedEuro = parkTaxiEuro > 0
    ? parkTaxiEuro
    : resolveScannerTruthPriceEuro(data, pricingType);
  const dailyTicketCents = Math.round(dailyTicketEuro * 100);
  const resolvedCents = Math.round(resolvedEuro * 100);
  if (
    !Number.isFinite(resolvedCents) || resolvedCents < 0 ||
    !Number.isFinite(dailyTicketCents) || dailyTicketCents < 0
  ) {
    throw { status: 500, message: "invalid_resolved_amount" };
  }
  const verificationMetadata = asMetadataRecord(
    (data as { verification_metadata?: Record<string, unknown> | null })
      .verification_metadata ?? null,
  );
  const lotPayoutMode = resolveLotPayoutMode(verificationMetadata);
  const isLocationsSectionRequest = displayId.trim().length > 0;
  if (isLocationsSectionRequest && lotPayoutMode !== "hub") {
    throw { status: 404, message: "location_not_found" };
  }
  const ownerId = String((data as { owner_id?: string | null }).owner_id ?? "")
    .trim();
  let ownerStripeAccountId: string | null = null;
  let ownerStripeReady = false;
  if (ownerId) {
    if (locationClient) {
      const { data: ownerProfile } = await locationClient
        .from("profiles")
        .select("role,stripe_account_id,stripe_onboarding_complete")
        .eq("id", ownerId)
        .maybeSingle();
      const splitDestination = resolveAutomaticSplitDestination({
        profileRole: (ownerProfile as { role?: string | null } | null)?.role ??
          "",
        stripeAccountId:
          (ownerProfile as { stripe_account_id?: string | null } | null)
            ?.stripe_account_id ?? "",
        stripeOnboardingComplete: (ownerProfile as
          | { stripe_onboarding_complete?: boolean | null }
          | null)?.stripe_onboarding_complete === true,
      });
      ownerStripeAccountId = splitDestination.destinationAccountId;
      ownerStripeReady = splitDestination.splitEligible;
    }
  }
  return {
    unitAmountCents: resolvedCents,
    dailyTicketUnitAmountCents: dailyTicketCents,
    resolvedLocationId: String(data.id ?? locationId),
    resolvedDisplayId: String(data.display_id ?? displayId ?? ""),
    resolvedLocationName: String(data.name ?? "").trim(),
    lotPayoutMode,
    lotCommissionRate: resolveCommissionRateFromMetadata(verificationMetadata),
    ownerStripeAccountId,
    ownerStripeReady,
    splitExpenseRate: resolveSplitExpenseRate(verificationMetadata),
    splitTaxRate: resolveSplitTaxRate(verificationMetadata),
    splitFixedExpenseCents: resolveSplitFixedExpenseCents(verificationMetadata),
    caseOwnerFixedPayoutCents: resolveCaseOwnerFixedPayoutCents(
      verificationMetadata,
    ),
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as { [key: string]: unknown }));
  console.log("[Stripe Checkout] Request body:", body);
  const url = new URL(req.url);
  const location_id =
    (typeof body.location_id === "string" && body.location_id) ||
    url.searchParams.get("loc") ||
    url.searchParams.get("location_id") ||
    "";
  const display_id = (typeof body.display_id === "string" && body.display_id) ||
    url.searchParams.get("display_id") || "";
  const requestedPlateNumber =
    (typeof body.plate_number === "string" && body.plate_number) || "";
  const flow_type = (typeof body.flow_type === "string" && body.flow_type) ||
    url.searchParams.get("flow") || "park_now";
  const check_in = (typeof body.check_in === "string" && body.check_in) ||
    (typeof (body as { checkIn?: unknown }).checkIn === "string" &&
      (body as { checkIn?: string }).checkIn) ||
    url.searchParams.get("check_in") ||
    url.searchParams.get("checkIn") ||
    url.searchParams.get("in") ||
    "";
  const check_out = (typeof body.check_out === "string" && body.check_out) ||
    (typeof (body as { checkOut?: unknown }).checkOut === "string" &&
      (body as { checkOut?: string }).checkOut) ||
    url.searchParams.get("check_out") ||
    url.searchParams.get("checkOut") ||
    url.searchParams.get("out") ||
    "";
  const rawPricingType = (typeof body.type === "string" && body.type) ||
    url.searchParams.get("type") || null;
  const normalizedPricingType = normalizePricingType(rawPricingType, flow_type);
  const pricing_type: PricingType =
    flow_type === "reserve" && exceedsOneDayDuration(check_in, check_out)
      ? "daily"
      : normalizedPricingType;
  const shouldAutoFillParkTaxiWindow = flow_type === "park_now" &&
    (!check_in || !check_out);
  const defaultParkTaxiCheckIn = new Date().toISOString();
  const defaultParkTaxiCheckOut = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString();
  const shouldAutoFillHourlyWindow = !shouldAutoFillParkTaxiWindow &&
    pricing_type === "hourly" &&
    flow_type === "reserve" &&
    !check_in &&
    !check_out;
  const effectiveCheckIn = shouldAutoFillParkTaxiWindow
    ? defaultParkTaxiCheckIn
    : shouldAutoFillHourlyWindow
    ? new Date().toISOString()
    : check_in;
  const effectiveCheckOut = shouldAutoFillParkTaxiWindow
    ? defaultParkTaxiCheckOut
    : shouldAutoFillHourlyWindow
    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
    : check_out;
  const allowPromotionCodes = resolveAllowPromotionCodesDefaultOn(
    (body as { allow_promotion_codes?: unknown }).allow_promotion_codes,
    url.searchParams.get("allow_promotion_codes"),
  );
  const hasTamperedAmountParams = (typeof body === "object" &&
    body !== null &&
    ("price" in body || "amount" in body || "amount_cents" in body)) ||
    url.searchParams.has("price") ||
    url.searchParams.has("amount") ||
    url.searchParams.has("amount_cents");
  let customer_email: string | undefined = undefined;
  if (typeof body === "object" && body && "customer_email" in body) {
    const v = (body as { customer_email?: unknown }).customer_email;
    if (typeof v === "string") customer_email = v;
  }
  let customer_phone: string | undefined = undefined;
  if (typeof body === "object" && body && "customer_phone" in body) {
    const v = (body as { customer_phone?: unknown }).customer_phone;
    if (typeof v === "string") customer_phone = v;
  }
  const autoChargeOptIn = resolveAllowPromotionCodesDefaultOn(
    (body as { auto_charge_opt_in?: unknown }).auto_charge_opt_in,
    url.searchParams.get("auto_charge_opt_in"),
  );
  const extendTargetSessionId =
    ((body as { extend_target_session_id?: unknown })
      .extend_target_session_id ??
      url.searchParams.get("extend_target_session_id") ??
      "")
      .toString()
      .trim();
  const extendMinutes = toCents(
    Number(
      (body as { extend_minutes?: unknown }).extend_minutes ??
        url.searchParams.get("extend_minutes") ?? 0,
    ),
  );
  const secret = resolveStripeSecretKey();
  if (!secret) {
    return NextResponse.json({ error: "missing_or_invalid_stripe_secret" }, {
      status: 500,
    });
  }
  const stripe = new Stripe(secret, { apiVersion: stripeApiVersion });
  const memberEmailFromRequest = await resolveMemberEmailFromRequest(req);
  const normalizedCustomerEmail = normalizeEmailValue(
    customer_email ?? url.searchParams.get("email") ?? memberEmailFromRequest,
  );
  const requestedCustomerPhone = normalizePhoneValue(
    customer_phone ?? url.searchParams.get("phone"),
  );
  const checkoutDefaults = await resolveMemberCheckoutDefaults(
    normalizedCustomerEmail,
  );
  const normalizedCustomerPhone = requestedCustomerPhone ??
    checkoutDefaults.customerPhone;
  const plate_number = normalizePlateValue(requestedPlateNumber) ??
    checkoutDefaults.plateNumber ?? "";
  const existingCustomer = await resolveStripeCustomerForCheckout({
    stripe,
    customerEmail: normalizedCustomerEmail,
    customerPhone: normalizedCustomerPhone,
  });
  const checkoutCustomerParams = buildCheckoutCustomerParams({
    customerId: existingCustomer.customerId,
    customerEmail: existingCustomer.customerEmail,
  });
  if (flow_type === "setup") {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "setup",
        success_url: unifiedStripeSuccessUrl,
        cancel_url: unifiedStripeCancelUrl,
        ...checkoutCustomerParams,
        payment_method_types: ["card"],
        setup_intent_data: {
          metadata: {
            location_id,
            plate_number,
            flow_type,
            customer_email: normalizedCustomerEmail ?? "",
            customer_phone: normalizedCustomerPhone ?? "",
            stripe_customer_id: existingCustomer.customerId ?? "",
            auto_charge_opt_in: autoChargeOptIn ? "1" : "0",
          },
        },
      });
      return NextResponse.json({ url: session.url });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "stripe_setup_failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (hasTamperedAmountParams) {
    console.warn("[Stripe Checkout] Ignoring client-provided amount params", {
      location_id,
      pricing_type,
    });
  }

  if (!location_id) {
    return NextResponse.json({ error: "missing_location_id" }, { status: 400 });
  }

  /*
   * Bypass Supabase Function redirect to handle reservation logic locally
   * and include custom text/metadata as requested.
   */
  // if (location_id) {
  //   const baseUrl = supabaseUrl || 'https://iafjygownkhedereaoxw.supabase.co';
  //   let type = 'hourly';
  //   if (flow_type === 'monthly') type = 'monthly';
  //   else if (flow_type === 'reserve') type = 'reserve';
  //   const params = new URLSearchParams();
  //   params.set('location_id', location_id);
  //   params.set('type', type);
  //   params.set('t', Date.now().toString());
  //   const redirectUrl = `${baseUrl.replace(/\/+$/, '')}/functions/v1/create-checkout?${params.toString()}`;
  //   return NextResponse.json({ url: redirectUrl });
  // }

  const parkTaxiWindowError = validateParkTaxiReservationWindow(
    flow_type,
    effectiveCheckIn,
    effectiveCheckOut,
  );
  if (parkTaxiWindowError) {
    return NextResponse.json({ error: parkTaxiWindowError }, { status: 400 });
  }

  const isParkTaxiFlow = flow_type === "park_now";
  const isReserveDailyFlow = flow_type === "reserve" &&
    pricing_type === "daily";
  let quantity = 1;
  let reservationDescription = "";
  const formatIso = (iso: string) => {
    if (!iso) return "";
    if (isIsoWithoutTimezone(iso)) {
      return formatNaiveIsoDateTime(iso);
    }
    try {
      const parsed = new Date(iso);
      if (!Number.isNaN(parsed.getTime())) {
        return formatBerlinDateTime(parsed);
      }
      return iso;
    } catch {
      return iso;
    }
  };
  const formatIsoNoSeconds = (iso: string) =>
    forceCETLabel(formatIso(iso)).replace(/:\d{2}(?:\sCET)?$/, " CET");
  const formatTimeShort = (iso: string) => {
    try {
      const parsed = new Date(iso);
      if (Number.isNaN(parsed.getTime())) return "";
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(parsed);
    } catch {
      return "";
    }
  };
  if (check_in && check_out) {
    const start = new Date(check_in);
    const end = new Date(check_out);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      quantity = isParkTaxiFlow || isReserveDailyFlow
        ? Math.ceil(diff / (1000 * 60 * 60 * 24))
        : Math.ceil(diff / (1000 * 60 * 60));
    }
  } else if (isParkTaxiFlow) {
    quantity = 1;
    const nowFormatted = formatBerlinDateTime(new Date());
    reservationDescription = `Start Time: ${nowFormatted}`;
    if (display_id) {
      reservationDescription += `\nLocation ID: ${display_id}`;
    }
    reservationDescription += `\n(End time depends on selected days)`;
  }

  let unitAmount = 0;
  let dailyTicketUnitAmountCents = 0;
  let resolvedLocationId = location_id;
  let resolvedDisplayId = display_id;
  let resolvedLocationName = "";
  let lotCommissionRate = 0.15;
  let lotPayoutMode: "hub" | "regular" = "regular";
  let ownerStripeAccountId: string | null = null;
  let ownerStripeReady = false;
  let splitExpenseRate = 0.079;
  let splitTaxRate = 0;
  let splitFixedExpenseCents = 30;
  let caseOwnerFixedPayoutCents = 0;
  try {
    const pricingResolution = await resolveLocationPricing(
      location_id,
      display_id,
      pricing_type,
      flow_type,
    );
    unitAmount = pricingResolution.unitAmountCents;
    dailyTicketUnitAmountCents = pricingResolution.dailyTicketUnitAmountCents;
    resolvedLocationId = pricingResolution.resolvedLocationId;
    resolvedDisplayId = pricingResolution.resolvedDisplayId;
    resolvedLocationName = pricingResolution.resolvedLocationName;
    lotPayoutMode = pricingResolution.lotPayoutMode;
    lotCommissionRate = pricingResolution.lotCommissionRate;
    ownerStripeAccountId = pricingResolution.ownerStripeAccountId;
    ownerStripeReady = pricingResolution.ownerStripeReady;
    splitExpenseRate = pricingResolution.splitExpenseRate;
    splitTaxRate = pricingResolution.splitTaxRate;
    splitFixedExpenseCents = pricingResolution.splitFixedExpenseCents;
    caseOwnerFixedPayoutCents = pricingResolution.caseOwnerFixedPayoutCents;
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number(error.status)
      : 500;
    const message = typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "pricing_resolution_failed";
    return NextResponse.json({ error: message }, { status });
  }
  const finalCheckOut = effectiveCheckOut;
  if (effectiveCheckIn && effectiveCheckOut) {
    if (isParkTaxiFlow) {
      const locationTitle = resolvedLocationName ||
        "Safe Parking by PayParq Split Airport/Trogir";
      const locationIdLabel = resolvedDisplayId || display_id ||
        resolvedLocationId || location_id || "—";
      const parkTaxiCents = unitAmount;
      const extraDays = Math.max(0, quantity - 1);
      const totalCents = parkTaxiCents + (extraDays * dailyTicketUnitAmountCents);
      const totalAmountEuro = (totalCents / 100).toFixed(2);
      const firstRideTime = formatTimeShort(effectiveCheckIn) || "--:--";
      const secondRideTime = formatTimeShort(finalCheckOut) || "--:--";
      reservationDescription = `Park & Taxi Package (1 Day)\n${locationTitle} • ID ${locationIdLabel} • Od ${
        formatIsoNoSeconds(effectiveCheckIn)
      } • Do ${
        formatIsoNoSeconds(finalCheckOut)
      } • Ukupno €${totalAmountEuro} • Uključen parking • Prva vožnja ${firstRideTime} • Druga vožnja ${secondRideTime}`;
    } else {
      reservationDescription = `From: ${formatIso(effectiveCheckIn)} To: ${
        formatIso(finalCheckOut)
      }`;
      if (resolvedDisplayId || display_id) {
        reservationDescription += `\nLocation ID: ${
          resolvedDisplayId || display_id
        }`;
      }
    }
  }
  const parkTaxiCents = unitAmount;
  const extraDaysForCalc = Math.max(0, quantity - 1);
  const sessionAmountCents = isParkTaxiFlow
    ? toCents(parkTaxiCents + (extraDaysForCalc * dailyTicketUnitAmountCents))
    : toCents(unitAmount * quantity);
  const walletDebitPlannedCents = await resolvePlannedWalletDebitCents(
    normalizedCustomerEmail,
    sessionAmountCents,
  );
  const stripeShortfallCents = toCents(
    sessionAmountCents - walletDebitPlannedCents,
  );
  const chargedAmountCents = Math.max(
    stripeShortfallCents,
    STRIPE_CARD_MIN_AMOUNT_CENTS,
  );
  const minimumChargeApplied = chargedAmountCents > stripeShortfallCents;
  if (minimumChargeApplied) {
    const topupDelta = ((chargedAmountCents - stripeShortfallCents) / 100)
      .toFixed(2);
    reservationDescription += `\nStripe minimum applied (€${
      (STRIPE_CARD_MIN_AMOUNT_CENTS / 100).toFixed(2)
    }). €${topupDelta} will be credited to wallet.`;
  }
  reservationDescription = forceCETLabel(reservationDescription);
  const submitMessageBase = forceCETLabel(buildSubmitMessage({
    pricingType: pricing_type,
    baseUrl: url.origin,
    locationId: resolvedLocationId,
    displayId: resolvedDisplayId,
    flowType: flow_type,
    customerEmail: customer_email,
    allowPromotionCodes,
    checkIn: effectiveCheckIn || undefined,
    checkOut: finalCheckOut || undefined,
    minimumChargeApplied,
  }));
  const submitMessage = submitMessageBase;
  try {
    // Attempt to create session with SEPA and Card
    const fallbackSuccessUrl = buildSuccessUrl({
      locationId: resolvedLocationId,
      displayId: resolvedDisplayId,
      checkIn: effectiveCheckIn || undefined,
      checkOut: finalCheckOut || undefined,
    });
    const session = await createSessionWithComputedValues({
      sessionQuantity: quantity,
      reservationDescription,
      checkOut: finalCheckOut,
      checkoutSuccessUrl: fallbackSuccessUrl,
      chargedAmountCents,
      sessionAmountCents,
      walletDebitPlannedCents,
      lotCommissionRate,
      paymentMethodTypes: ["card", "sepa_debit"],
    });
    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "";
    // If SEPA is not enabled, retry with just Card
    if (
      message.includes("sepa_debit") || message.includes("payment method type")
    ) {
      console.warn("SEPA not enabled, falling back to Card only");
      try {
        const fallbackSuccessUrl = buildSuccessUrl({
          locationId: resolvedLocationId,
          displayId: resolvedDisplayId,
          checkIn: effectiveCheckIn || undefined,
          checkOut: finalCheckOut || undefined,
        });
        const session = await createSessionWithComputedValues({
          sessionQuantity: quantity,
          reservationDescription,
          checkOut: finalCheckOut,
          checkoutSuccessUrl: fallbackSuccessUrl,
          chargedAmountCents,
          sessionAmountCents,
          walletDebitPlannedCents,
          lotCommissionRate,
          paymentMethodTypes: ["card"],
        });
        return NextResponse.json({ url: session.url });
      } catch (retryErr: unknown) {
        const retryMessage = retryErr instanceof Error
          ? retryErr.message
          : "stripe_retry_failed";
        return NextResponse.json({ error: retryMessage }, { status: 400 });
      }
    }
    return NextResponse.json({ error: message || "stripe_payment_failed" }, {
      status: 400,
    });
  }

  async function createSessionWithComputedValues(params: {
    sessionQuantity: number;
    reservationDescription: string;
    checkOut: string;
    checkoutSuccessUrl: string;
    chargedAmountCents: number;
    sessionAmountCents: number;
    walletDebitPlannedCents: number;
    lotCommissionRate: number;
    paymentMethodTypes?:
      Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
  }) {
    const payment_method_types = params.paymentMethodTypes ??
      ["card", "sepa_debit"];
    const splitPlan = ownerStripeReady && ownerStripeAccountId
      ? buildStripeSplitPlan({
        chargedAmountCents: params.chargedAmountCents,
        sessionAmountCents: params.sessionAmountCents,
        parkTaxiDailyTicketTotalCents: toCents(
          dailyTicketUnitAmountCents * params.sessionQuantity,
        ),
        sessionQuantity: params.sessionQuantity,
        pricingType: pricing_type,
        flowType: flow_type,
        destinationAccountId: ownerStripeAccountId,
        expenseRate: splitExpenseRate,
        taxRate: splitTaxRate,
        fixedExpenseCents: splitFixedExpenseCents,
        caseOwnerFixedPayoutCents,
        payoutMode: lotPayoutMode,
      })
      : null;
    const splitMetadata = buildStripeSplitMetadata({
      splitPlan,
      caseOwnerFixedPayoutCents,
    });
    const checkoutMetadata = {
      location_id: resolvedLocationId,
      display_id: resolvedDisplayId,
      plate_number,
      customer_phone: normalizedCustomerPhone ?? "",
      customer_email: normalizedCustomerEmail ?? "",
      flow_type,
      pricing_type,
      check_in: effectiveCheckIn,
      check_out: params.checkOut,
      extend_target_session_id: extendTargetSessionId,
      extend_minutes: String(extendMinutes),
      session_amount_cents: String(params.sessionAmountCents),
      charged_amount_cents: String(params.chargedAmountCents),
      wallet_debit_planned_cents: String(params.walletDebitPlannedCents),
      lot_commission_rate: params.lotCommissionRate.toFixed(4),
      session_quantity: String(params.sessionQuantity),
      session_unit_amount_cents: String(unitAmount),
      minimum_charge_topup_cents: String(
        Math.max(0, params.chargedAmountCents - stripeShortfallCents),
      ),
      ...splitMetadata,
    };
    const paymentIntentData = {
      setup_future_usage: "off_session" as const,
      ...buildStripeSplitPaymentIntentData(splitPlan),
      metadata: checkoutMetadata,
    };
    if (
      requiresLiveSplit({ ownerStripeReady, ownerStripeAccountId }) &&
      !hasLiveSplitEvidence({ splitPlan, splitMetadata, paymentIntentData })
    ) {
      throw new Error("split_configuration_missing");
    }
    return await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: params.checkoutSuccessUrl,
      cancel_url: unifiedStripeCancelUrl,
      payment_method_types,
      allow_promotion_codes: allowPromotionCodes,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: isParkTaxiFlow
                ? params.sessionQuantity > 1
                  ? `Park & Taxi Package (${params.sessionQuantity} Days)`
                  : "Park & Taxi Package (1 Day)"
                : pricing_type === "daily"
                ? params.sessionQuantity > 1
                  ? `Parking Session (${params.sessionQuantity} Days)`
                  : "Parking Session (1 Day)"
                : pricing_type === "monthly"
                ? "Parking Session (Monthly)"
                : params.sessionQuantity > 1
                ? `Parking Session (${params.sessionQuantity} Hours)`
                : "Parking Session (1 Hour)",
              description: params.reservationDescription || undefined,
            },
            unit_amount: params.chargedAmountCents,
          },
          quantity: 1,
          adjustable_quantity: {
            enabled: false,
          },
        },
      ],
      custom_text: {
        submit: {
          message: submitMessage,
        },
      },
      custom_fields: buildCheckoutPlateCustomField(plate_number),
      phone_number_collection: {
        enabled: true,
      },
      ...checkoutCustomerParams,
      metadata: checkoutMetadata,
      payment_intent_data: paymentIntentData,
    });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const location_id = url.searchParams.get("loc") ||
    url.searchParams.get("location_id") || "";
  const display_id = url.searchParams.get("display_id") || "";
  const isDailyFooterHint = url.searchParams.get("daily_footer") === "1";
  const acceptLang = req.headers.get("accept-language") ?? "";
  const isCroatian = /^hr\b/i.test(acceptLang.split(",")[0].trim());
  const dailyFooterLine = isDailyFooterHint
    ? (isCroatian
        ? "\nZa dnevnu naplatu kliknite na link u podnožju."
        : "\nFor daily checkout click on the link in the footer.")
    : "";
  const requestedPlateNumber = url.searchParams.get("plate") || "";
  const flow_type = url.searchParams.get("flow") || "park_now";
  const check_in = url.searchParams.get("check_in") ||
    url.searchParams.get("checkIn") ||
    url.searchParams.get("in") ||
    "";
  const check_out = url.searchParams.get("check_out") ||
    url.searchParams.get("checkOut") ||
    url.searchParams.get("out") ||
    "";
  const normalizedPricingType = normalizePricingType(
    url.searchParams.get("type"),
    flow_type,
  );
  const pricing_type: PricingType =
    flow_type === "reserve" && exceedsOneDayDuration(check_in, check_out)
      ? "daily"
      : normalizedPricingType;
  const shouldAutoFillParkTaxiWindow = flow_type === "park_now" &&
    (!check_in || !check_out);
  const defaultParkTaxiCheckIn = new Date().toISOString();
  const defaultParkTaxiCheckOut = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString();
  const shouldAutoFillHourlyWindow = !shouldAutoFillParkTaxiWindow &&
    pricing_type === "hourly" &&
    flow_type === "reserve" &&
    !check_in &&
    !check_out;
  const effectiveCheckIn = shouldAutoFillParkTaxiWindow
    ? defaultParkTaxiCheckIn
    : shouldAutoFillHourlyWindow
    ? new Date().toISOString()
    : check_in;
  const effectiveCheckOut = shouldAutoFillParkTaxiWindow
    ? defaultParkTaxiCheckOut
    : shouldAutoFillHourlyWindow
    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
    : check_out;
  const parkTaxiWindowError = validateParkTaxiReservationWindow(
    flow_type,
    effectiveCheckIn,
    effectiveCheckOut,
  );
  if (parkTaxiWindowError) {
    return NextResponse.json({ error: parkTaxiWindowError }, { status: 400 });
  }
  const allowPromotionCodes = resolveAllowPromotionCodesDefaultOn(
    undefined,
    url.searchParams.get("allow_promotion_codes"),
  );
  const allowPlateOverride = resolveAllowPromotionCodesDefaultOn(
    undefined,
    url.searchParams.get("allow_plate_override"),
  );
  const autoChargeOptIn = resolveAllowPromotionCodesDefaultOn(
    undefined,
    url.searchParams.get("auto_charge_opt_in"),
  );
  const extendTargetSessionId =
    (url.searchParams.get("extend_target_session_id") ?? "").toString().trim();
  const extendMinutes = toCents(
    Number(url.searchParams.get("extend_minutes") ?? 0),
  );
  const customer_email = url.searchParams.get("email") || undefined;
  const customer_phone = url.searchParams.get("phone") || undefined;
  const secret = resolveStripeSecretKey();
  if (!secret) {
    const fallbackCheckoutDetails = buildFallbackCheckoutDetails({
      flowType: flow_type,
      pricingType: pricing_type,
      checkIn: effectiveCheckIn,
      checkOut: effectiveCheckOut,
      displayId: display_id,
    });
    const fallbackUrl = location_id
      ? buildSupabaseFunctionCheckoutUrl({
        locationId: location_id,
        displayId: display_id || undefined,
        flowType: flow_type,
        pricingType: pricing_type,
        checkIn: effectiveCheckIn || undefined,
        checkOut: effectiveCheckOut || undefined,
        quantity: fallbackCheckoutDetails.quantity,
        reservationDescription: fallbackCheckoutDetails.reservationDescription,
        allowPromotionCodes,
        customerEmail: customer_email,
        customerPhone: customer_phone,
        plateNumber: requestedPlateNumber,
        allowPlateOverride,
        extendTargetSessionId,
        extendMinutes,
      })
      : null;
    if (fallbackUrl) {
      return NextResponse.redirect(fallbackUrl, { status: 303 });
    }
    return NextResponse.json({ error: "missing_or_invalid_stripe_secret" }, {
      status: 500,
    });
  }
  const stripe = new Stripe(secret, { apiVersion: stripeApiVersion });
  const memberEmailFromRequest = await resolveMemberEmailFromRequest(req);
  const normalizedCustomerEmail = normalizeEmailValue(
    customer_email ?? memberEmailFromRequest,
  );
  const requestedCustomerPhone = normalizePhoneValue(customer_phone);
  const checkoutDefaults = await resolveMemberCheckoutDefaults(
    normalizedCustomerEmail,
  );
  const normalizedCustomerPhone = requestedCustomerPhone ??
    checkoutDefaults.customerPhone;
  const plate_number = normalizePlateValue(requestedPlateNumber) ??
    checkoutDefaults.plateNumber ?? "";
  const existingCustomer = await resolveStripeCustomerForCheckout({
    stripe,
    customerEmail: normalizedCustomerEmail,
    customerPhone: normalizedCustomerPhone,
  });
  const checkoutCustomerParams = buildCheckoutCustomerParams({
    customerId: existingCustomer.customerId,
    customerEmail: existingCustomer.customerEmail,
  });
  const hasTamperedAmountParams = url.searchParams.has("price") ||
    url.searchParams.has("amount") ||
    url.searchParams.has("amount_cents");

  if (flow_type === "setup") {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "setup",
        success_url: unifiedStripeSuccessUrl,
        cancel_url: unifiedStripeCancelUrl,
        ...checkoutCustomerParams,
        payment_method_types: ["card"],
        setup_intent_data: {
          metadata: {
            location_id,
            plate_number,
            flow_type,
            customer_email: normalizedCustomerEmail ?? "",
            customer_phone: normalizedCustomerPhone ?? "",
            stripe_customer_id: existingCustomer.customerId ?? "",
            auto_charge_opt_in: autoChargeOptIn ? "1" : "0",
          },
        },
      });
      return NextResponse.redirect(session.url!, { status: 303 });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "stripe_setup_failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (hasTamperedAmountParams) {
    console.warn(
      "[Stripe Checkout GET] Ignoring client-provided amount params",
      {
        location_id,
        pricing_type,
      },
    );
  }

  if (!location_id) {
    return NextResponse.json({ error: "missing_location_id" }, { status: 400 });
  }

  const isParkTaxiFlow = flow_type === "park_now";
  const isReserveDailyFlow = flow_type === "reserve" &&
    pricing_type === "daily";
  let quantity = 1;
  let reservationDescription = "";
  const formatIso = (iso: string) => {
    if (!iso) return "";
    if (isIsoWithoutTimezone(iso)) {
      return formatNaiveIsoDateTime(iso);
    }
    try {
      const parsed = new Date(iso);
      if (!Number.isNaN(parsed.getTime())) {
        return formatBerlinDateTime(parsed);
      }
      return iso;
    } catch {
      return iso;
    }
  };
  const formatIsoNoSeconds = (iso: string) =>
    forceCETLabel(formatIso(iso)).replace(/:\d{2}(?:\sCET)?$/, " CET");
  const formatTimeShort = (iso: string) => {
    try {
      const parsed = new Date(iso);
      if (Number.isNaN(parsed.getTime())) return "";
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(parsed);
    } catch {
      return "";
    }
  };
  if (effectiveCheckIn && effectiveCheckOut) {
    const start = parseCheckoutDateValue(effectiveCheckIn);
    const end = parseCheckoutDateValue(effectiveCheckOut);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      quantity = isParkTaxiFlow || isReserveDailyFlow
        ? Math.ceil(diff / (1000 * 60 * 60 * 24))
        : Math.ceil(diff / (1000 * 60 * 60));
    }
  } else if (isParkTaxiFlow) {
    quantity = 1;
    const nowFormatted = formatBerlinDateTime(new Date());
    reservationDescription = `Start Time: ${nowFormatted}`;
    if (display_id) {
      reservationDescription += `\nLocation ID: ${display_id}`;
    }
    reservationDescription += `\n(End time depends on selected days)`;
  }
  let unitAmount = 0;
  let dailyTicketUnitAmountCents = 0;
  let resolvedLocationId = location_id;
  let resolvedDisplayId = display_id;
  let resolvedLocationName = "";
  let lotCommissionRate = 0.15;
  let lotPayoutMode: "hub" | "regular" = "regular";
  let ownerStripeAccountId: string | null = null;
  let ownerStripeReady = false;
  let splitExpenseRate = 0.079;
  let splitTaxRate = 0;
  let splitFixedExpenseCents = 30;
  let caseOwnerFixedPayoutCents = 0;
  try {
    const pricingResolution = await resolveLocationPricing(
      location_id,
      display_id,
      pricing_type,
      flow_type,
    );
    unitAmount = pricingResolution.unitAmountCents;
    dailyTicketUnitAmountCents = pricingResolution.dailyTicketUnitAmountCents;
    resolvedLocationId = pricingResolution.resolvedLocationId;
    resolvedDisplayId = pricingResolution.resolvedDisplayId;
    resolvedLocationName = pricingResolution.resolvedLocationName;
    lotPayoutMode = pricingResolution.lotPayoutMode;
    lotCommissionRate = pricingResolution.lotCommissionRate;
    ownerStripeAccountId = pricingResolution.ownerStripeAccountId;
    ownerStripeReady = pricingResolution.ownerStripeReady;
    splitExpenseRate = pricingResolution.splitExpenseRate;
    splitTaxRate = pricingResolution.splitTaxRate;
    splitFixedExpenseCents = pricingResolution.splitFixedExpenseCents;
    caseOwnerFixedPayoutCents = pricingResolution.caseOwnerFixedPayoutCents;
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number(error.status)
      : 500;
    const message = typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "pricing_resolution_failed";
    return NextResponse.json({ error: message }, { status });
  }
  const finalCheckOut = effectiveCheckOut;
  const isAdjustableHourly = pricing_type === "hourly" && flow_type === "reserve";
  if (effectiveCheckIn && effectiveCheckOut) {
    if (isParkTaxiFlow) {
      const locationTitle = resolvedLocationName ||
        "Safe Parking by PayParq Split Airport/Trogir";
      const locationIdLabel = resolvedDisplayId || display_id ||
        resolvedLocationId || location_id || "—";
      const parkTaxiCents = unitAmount;
      const extraDays = Math.max(0, quantity - 1);
      const totalCents = parkTaxiCents + (extraDays * dailyTicketUnitAmountCents);
      const totalAmountEuro = (totalCents / 100).toFixed(2);
      const firstRideTime = formatTimeShort(effectiveCheckIn) || "--:--";
      const secondRideTime = formatTimeShort(finalCheckOut) || "--:--";
      reservationDescription = `Park & Taxi Package (1 Day)\n${locationTitle} • ID ${locationIdLabel} • Od ${
        formatIsoNoSeconds(effectiveCheckIn)
      } • Do ${
        formatIsoNoSeconds(finalCheckOut)
      } • Ukupno €${totalAmountEuro} • Uključen parking • Prva vožnja ${firstRideTime} • Druga vožnja ${secondRideTime}`;
    } else {
      reservationDescription = `From: ${formatIso(effectiveCheckIn)} To: ${
        formatIso(finalCheckOut)
      }`;
      if (resolvedDisplayId || display_id) {
        reservationDescription += `\nLocation ID: ${
          resolvedDisplayId || display_id
        }`;
      }
      if (dailyFooterLine) {
        reservationDescription += dailyFooterLine;
      }
    }
  } else if (isAdjustableHourly && effectiveCheckIn) {
    const idLabel = resolvedDisplayId || display_id || resolvedLocationId || location_id;
    const startLine = isCroatian
      ? `Vrijeme početka: ${formatIso(effectiveCheckIn)}`
      : `Start Time: ${formatIso(effectiveCheckIn)}`;
    const idLine = idLabel
      ? (isCroatian ? `ID lokacije: ${idLabel}` : `Location ID: ${idLabel}`)
      : "";
    const endHint = isCroatian
      ? "(Vrijeme završetka ovisi o odabranom broju sati)"
      : "(End time depends on selected hours)";
    reservationDescription = [startLine, idLine, endHint].filter(Boolean).join("\n");
    if (dailyFooterLine) {
      reservationDescription += dailyFooterLine;
    }
  }
  const parkTaxiCents2 = unitAmount;
  const extraDaysForCalc2 = Math.max(0, quantity - 1);
  const sessionAmountCents = isParkTaxiFlow
    ? toCents(parkTaxiCents2 + (extraDaysForCalc2 * dailyTicketUnitAmountCents))
    : toCents(unitAmount * quantity);
  const walletDebitPlannedCents = isAdjustableHourly
    ? 0
    : await resolvePlannedWalletDebitCents(normalizedCustomerEmail, sessionAmountCents);
  const stripeShortfallCents = toCents(
    sessionAmountCents - walletDebitPlannedCents,
  );
  const chargedAmountCents = Math.max(
    stripeShortfallCents,
    STRIPE_CARD_MIN_AMOUNT_CENTS,
  );
  const minimumChargeApplied = chargedAmountCents > stripeShortfallCents;
  if (minimumChargeApplied) {
    const topupDelta = ((chargedAmountCents - stripeShortfallCents) / 100)
      .toFixed(2);
    reservationDescription += `\nStripe minimum applied (€${
      (STRIPE_CARD_MIN_AMOUNT_CENTS / 100).toFixed(2)
    }). €${topupDelta} will be credited to wallet.`;
  }
  reservationDescription = forceCETLabel(reservationDescription);
  const checkoutSuccessUrl = buildSuccessUrl({
    locationId: resolvedLocationId,
    displayId: resolvedDisplayId,
    checkIn: effectiveCheckIn || undefined,
    checkOut: finalCheckOut || undefined,
  });
  const submitMessageBase = forceCETLabel(buildSubmitMessage({
    pricingType: pricing_type,
    baseUrl: url.origin,
    locationId: resolvedLocationId,
    displayId: resolvedDisplayId,
    flowType: flow_type,
    customerEmail: customer_email,
    allowPromotionCodes,
    checkIn: effectiveCheckIn || undefined,
    checkOut: finalCheckOut || undefined,
    minimumChargeApplied,
  }));
  const submitMessage = submitMessageBase;
  const shouldUseSupabaseCheckout = lotPayoutMode !== "hub";
  if (shouldUseSupabaseCheckout) {
    const fallbackUrl = buildSupabaseFunctionCheckoutUrl({
      locationId: resolvedLocationId,
      displayId: resolvedDisplayId || undefined,
      flowType: flow_type,
      pricingType: pricing_type,
      checkIn: effectiveCheckIn || undefined,
      checkOut: finalCheckOut || undefined,
      quantity,
      reservationDescription,
      allowPromotionCodes,
      customerEmail: normalizedCustomerEmail ?? undefined,
      customerPhone: normalizedCustomerPhone ?? undefined,
      plateNumber: plate_number || undefined,
      extendTargetSessionId,
      extendMinutes,
    });
    if (!fallbackUrl) {
      return NextResponse.json({ error: "supabase_checkout_unavailable" }, {
        status: 500,
      });
    }
    return NextResponse.redirect(fallbackUrl, 303);
  }
  try {
    const splitPlan = ownerStripeReady && ownerStripeAccountId
      ? buildStripeSplitPlan({
        chargedAmountCents,
        sessionAmountCents,
        parkTaxiDailyTicketTotalCents: toCents(
          dailyTicketUnitAmountCents * quantity,
        ),
        sessionQuantity: quantity,
        pricingType: pricing_type,
        flowType: flow_type,
        destinationAccountId: ownerStripeAccountId,
        expenseRate: splitExpenseRate,
        taxRate: splitTaxRate,
        fixedExpenseCents: splitFixedExpenseCents,
        caseOwnerFixedPayoutCents,
        payoutMode: lotPayoutMode,
      })
      : null;
    const splitMetadata = buildStripeSplitMetadata({
      splitPlan,
      caseOwnerFixedPayoutCents,
    });
    const checkoutMetadata = {
      location_id: resolvedLocationId,
      display_id: resolvedDisplayId,
      plate_number,
      customer_phone: normalizedCustomerPhone ?? "",
      customer_email: normalizedCustomerEmail ?? "",
      flow_type,
      pricing_type,
      check_in: effectiveCheckIn,
      check_out: finalCheckOut,
      extend_target_session_id: extendTargetSessionId,
      extend_minutes: String(extendMinutes),
      session_amount_cents: String(sessionAmountCents),
      charged_amount_cents: String(chargedAmountCents),
      wallet_debit_planned_cents: String(walletDebitPlannedCents),
      lot_commission_rate: lotCommissionRate.toFixed(4),
      session_quantity: String(quantity),
      session_unit_amount_cents: String(unitAmount),
      minimum_charge_topup_cents: String(
        Math.max(0, chargedAmountCents - stripeShortfallCents),
      ),
      ...splitMetadata,
    };
    const paymentIntentData = {
      setup_future_usage: "off_session" as const,
      ...buildStripeSplitPaymentIntentData(splitPlan),
      metadata: checkoutMetadata,
    };
    if (
      requiresLiveSplit({ ownerStripeReady, ownerStripeAccountId }) &&
      !hasLiveSplitEvidence({ splitPlan, splitMetadata, paymentIntentData })
    ) {
      return NextResponse.json({ error: "split_configuration_missing" }, {
        status: 409,
      });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: checkoutSuccessUrl,
      cancel_url: unifiedStripeCancelUrl,
      payment_method_types: ["card"],
      allow_promotion_codes: allowPromotionCodes,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: isAdjustableHourly
                ? (isCroatian ? "Parking sesija (Prilagodite broj sati)" : "Parking Session (Adjust Hours)")
                : isParkTaxiFlow
                ? quantity > 1
                  ? `Park & Taxi Package (${quantity} Days)`
                  : "Park & Taxi Package (1 Day)"
                : pricing_type === "daily"
                ? quantity > 1
                  ? `Parking Session (${quantity} Days)`
                  : "Parking Session (1 Day)"
                : pricing_type === "monthly"
                ? "Parking Session (Monthly)"
                : quantity > 1
                ? `Parking Session (${quantity} Hours)`
                : "Parking Session (1 Hour)",
              description: reservationDescription || undefined,
            },
            unit_amount: isAdjustableHourly ? unitAmount : chargedAmountCents,
          },
          quantity: 1,
          adjustable_quantity: {
            enabled: isAdjustableHourly,
            minimum: isAdjustableHourly ? 1 : undefined,
            maximum: isAdjustableHourly ? 24 : undefined,
          },
        },
      ],
      custom_text: {
        submit: {
          message: submitMessage,
        },
      },
      custom_fields: buildCheckoutPlateCustomField(plate_number),
      phone_number_collection: {
        enabled: true,
      },
      ...checkoutCustomerParams,
      metadata: checkoutMetadata,
      payment_intent_data: paymentIntentData,
    });
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "stripe_payment_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
