import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";
import { normalizeLocationName } from "@/lib/locationPricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SessionRow = {
  id?: string | null;
  email?: string | null;
  contact_email?: string | null;
  mobile?: string | null;
  contact_phone?: string | null;
  plate?: string | null;
  location_id?: string | null;
  created_at?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
  end_time?: string | null;
  quantity?: number | null;
  duration_minutes?: number | null;
  stripe_session_id?: string | null;
  stripe_payment_id?: string | null;
  stripe_payment_url?: string | null;
  price?: number | null;
  currency?: string | null;
  status?: string | null;
  payment_status?: string | null;
  stripe_metadata?: Record<string, unknown> | string | null;
  start_time?: string | null;
  type?: string | null;
};

type IdentityMatchKind =
  | "email"
  | "contact_email"
  | "metadata_email"
  | "customer_id"
  | "plate"
  | "phone"
  | "location_scope";

type MemberIdentity = {
  userId: string;
  role: string;
  locationHints: string[];
  email: string;
  phones: string[];
  plates: string[];
  stripeCustomerIds: string[];
};

const FAST_CONTEXT_TTL_MS = 1000;
const fastContextCache = new Map<string, { expiresAt: number; payload: unknown }>();

function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? "").toString().replace(/[^\d]/g, "");
  return digits;
}

function normalizePlate(value: string | null | undefined) {
  return (value ?? "").toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function readMetadataStringList(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!metadata) return [] as string[];
  const values: string[] = [];
  for (const key of keys) {
    const rawValue = metadata[key];
    if (typeof rawValue === "string" && rawValue.trim()) {
      values.push(rawValue.trim());
    } else if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (typeof item === "string" && item.trim()) {
          values.push(item.trim());
        }
      }
    }
  }
  return values;
}

function readIdentityStringsFromUser(
  userData: { phone?: string | null; user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null } | null,
  keys: string[]
) {
  if (!userData) return [] as string[];
  const fromUserMetadata = readMetadataStringList(userData.user_metadata ?? null, keys);
  const fromAppMetadata = readMetadataStringList(userData.app_metadata ?? null, keys);
  return [...fromUserMetadata, ...fromAppMetadata];
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

function normalizeRole(value: string | null | undefined) {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

async function resolveMemberIdentity(req: NextRequest): Promise<MemberIdentity> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  let resolvedUser:
    | {
        id?: string | null;
        email?: string | null;
        phone?: string | null;
        user_metadata?: Record<string, unknown> | null;
        app_metadata?: Record<string, unknown> | null;
      }
    | null = null;
  if (token) {
    const authClient = supabaseAdmin ?? supabase;
    const { data, error } = authClient ? await authClient.auth.getUser(token) : { data: null, error: true };
    if (!error && data?.user && typeof data.user === "object") {
      resolvedUser = {
        id: data.user.id ?? null,
        email: data.user.email ?? null,
        phone: data.user.phone ?? null,
        user_metadata: (data.user.user_metadata ?? null) as Record<string, unknown> | null,
        app_metadata: (data.user.app_metadata ?? null) as Record<string, unknown> | null,
      };
    }
  }
  const fromTokenEmail = normalizeEmail(resolvedUser?.email);
  const fromHeaderEmail = normalizeEmail(req.headers.get("x-member-email"));
  const email = fromTokenEmail || fromHeaderEmail;
  const userId = (resolvedUser?.id ?? req.headers.get("x-member-id") ?? "").toString().trim();
  const roleFromHeader = normalizeRole(req.headers.get("x-member-role"));
  const role = normalizeRole(
    (resolvedUser?.user_metadata?.role ??
      resolvedUser?.app_metadata?.role ??
      resolvedUser?.user_metadata?.user_role ??
      resolvedUser?.app_metadata?.user_role ??
      roleFromHeader ??
      "") as string
  );
  const locationHints = uniq(
    [
      ...readIdentityStringsFromUser(resolvedUser, [
        "location_id",
        "locationId",
        "selected_location_id",
        "selectedLocationId",
      ]).map((value) => value.trim()),
      (req.headers.get("x-member-location-id") ?? "").trim(),
      (req.headers.get("x-member-display-id") ?? "").trim(),
    ].filter(Boolean) as string[]
  );
  const phoneCandidates = uniq(
    [
      normalizePhone(resolvedUser?.phone),
      ...readIdentityStringsFromUser(resolvedUser, [
        "phone",
        "mobile",
        "contact_phone",
        "contactPhone",
        "whatsapp",
        "whatsapp_number",
      ]).map((value) => normalizePhone(value)),
    ].filter(Boolean) as string[]
  );
  const plateCandidates = uniq(
    readIdentityStringsFromUser(resolvedUser, [
      "default_plate",
      "plate",
      "plate_number",
      "plateNumber",
      "license_plate",
      "member_plate",
      "member_plates",
      "vehicle_plate",
    ])
      .map((value) => normalizePlate(value))
      .filter(Boolean) as string[]
  );
  const stripeCustomerIds = uniq(
    readIdentityStringsFromUser(resolvedUser, [
      "stripe_customer_id",
      "stripeCustomerId",
      "customer_id",
      "customerId",
    ])
      .map((value) => value.trim())
      .filter(Boolean) as string[]
  );
  return {
    userId,
    role,
    locationHints,
    email,
    phones: phoneCandidates,
    plates: plateCandidates,
    stripeCustomerIds,
  };
}

function resolveOwnedByEmailMatch(row: SessionRow, email: string): IdentityMatchKind | null {
  const normalizedTargetEmail = normalizeEmail(email);
  if (!normalizedTargetEmail) return null;
  if (normalizeEmail(row.email) === normalizedTargetEmail) {
    return "email";
  }
  if (normalizeEmail(row.contact_email) === normalizedTargetEmail) {
    return "contact_email";
  }
  const metadata = parseStripeMetadata(row.stripe_metadata);
  const metadataEmails = readMetadataStringList(metadata, [
    "customer_email",
    "email",
    "contact_email",
    "member_email",
    "checkout_email",
    "customerEmail",
    "memberEmail",
    "payerEmail",
    "user_email",
    "userEmail",
    "client_email",
    "customer_details_email",
    "payer_email",
  ]).map((value) => normalizeEmail(value));
  if (metadataEmails.includes(normalizedTargetEmail)) {
    return "metadata_email";
  }
  return null;
}

function resolveTokenScopedClient(req: NextRequest) {
  if (supabaseAdmin || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

function readMetadataUrl(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!metadata) return "";
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function readMetadataStringValue(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!metadata) return "";
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function readAmountFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return null;
  for (const key of ["price", "amount", "total", "total_price"]) {
    const parsed = toNumber(metadata[key]);
    if (parsed != null && parsed > 0) {
      return parsed;
    }
  }
  for (const key of ["amount_total", "total_amount", "amount_cents", "price_cents"]) {
    const parsed = toNumber(metadata[key]);
    if (parsed != null && parsed > 0) {
      return parsed / 100;
    }
  }
  return null;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseUtcMillis(value: string | null | undefined) {
  const parsed = new Date((value ?? "").toString().trim());
  const millis = parsed.getTime();
  return Number.isFinite(millis) ? millis : null;
}

function isSettledPaymentStatus(value: string | null | undefined) {
  const normalized = (value ?? "").toString().trim().toLowerCase();
  return (
    normalized === "paid" ||
    normalized === "succeeded" ||
    normalized === "complete" ||
    normalized === "completed"
  );
}

function isPendingLikeStatus(value: string | null | undefined) {
  const normalized = (value ?? "").toString().trim().toLowerCase();
  return (
    normalized === "pending" ||
    normalized === "open" ||
    normalized === "unpaid" ||
    normalized === "requires_payment_method" ||
    normalized === "requires_action"
  );
}

function isStaleUncompletedSession(row: SessionRow, nowMs: number) {
  if (isSettledPaymentStatus(row.payment_status)) {
    return false;
  }
  if (!isPendingLikeStatus(row.payment_status) && !isPendingLikeStatus(row.status)) {
    return false;
  }
  const createdAtMs = parseUtcMillis(row.created_at);
  if (!createdAtMs) {
    return false;
  }
  return nowMs - createdAtMs > 15 * 60 * 1000;
}

function normalizeIso(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseStripeMetadata(value: SessionRow["stripe_metadata"]) {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    let current: unknown = value;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (current && typeof current === "object") {
        return current as Record<string, unknown>;
      }
      if (typeof current !== "string") {
        break;
      }
      try {
        current = JSON.parse(current);
      } catch {
        break;
      }
    }
  }
  return null;
}

function resolveExitFromQuantity(entryIso: string, quantity: number, pricingTypeRaw: string) {
  const entry = new Date(entryIso);
  if (Number.isNaN(entry.getTime())) return null;
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.ceil(quantity) : 1;
  const pricingType = (pricingTypeRaw ?? "").trim().toLowerCase();
  const exit = new Date(entry.getTime());
  if (pricingType === "daily") {
    exit.setUTCDate(exit.getUTCDate() + safeQuantity);
  } else if (pricingType === "monthly") {
    exit.setUTCDate(exit.getUTCDate() + safeQuantity * 30);
  } else {
    exit.setUTCHours(exit.getUTCHours() + safeQuantity);
  }
  return exit.toISOString();
}

function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function resolveLevel(pointsYear: number) {
  if (pointsYear >= 1200) return "level_3";
  if (pointsYear >= 300) return "level_2";
  return "level_1";
}

function resolveLevelProgress(pointsYear: number, level: string) {
  if (level === "level_3") {
    return { nextLevel: null, nextLevelTarget: null, nextLevelProgressPercent: 100 };
  }
  const target = level === "level_1" ? 300 : 1200;
  const progress = clamp(Math.round((pointsYear / target) * 100), 0, 100);
  return {
    nextLevel: level === "level_1" ? "level_2" : "level_3",
    nextLevelTarget: target,
    nextLevelProgressPercent: progress,
  };
}

function resolveSessionWindow(session: SessionRow) {
  const metadata = parseStripeMetadata(session.stripe_metadata);
  const entryFromRow = normalizeIso(session.entry_time);
  const entryFromCreatedAt = normalizeIso(session.created_at);
  const entryFromMeta = normalizeIso((metadata?.["check_in"] ?? "").toString());
  const flow = (metadata?.["flow"] ?? metadata?.["flow_type"] ?? "").toString().trim().toLowerCase();
  const prefersMetadataWindow = flow === "reserve" && Boolean(entryFromMeta);
  const checkIn = prefersMetadataWindow ? entryFromMeta : (entryFromRow ?? entryFromMeta ?? entryFromCreatedAt);

  const exitFromRow = normalizeIso(session.exit_time);
  const exitFromEndTime = normalizeIso(session.end_time);
  const exitFromMeta = normalizeIso((metadata?.["check_out"] ?? "").toString());
  if (prefersMetadataWindow && exitFromMeta) {
    return { checkIn, checkOut: exitFromMeta };
  }
  if (exitFromRow) {
    return { checkIn, checkOut: exitFromRow };
  }
  if (exitFromEndTime) {
    return { checkIn, checkOut: exitFromEndTime };
  }
  if (exitFromMeta) {
    return { checkIn, checkOut: exitFromMeta };
  }

  const durationMinutes = toNumber(session.duration_minutes);
  if (checkIn && durationMinutes != null && durationMinutes > 0) {
    const checkInDate = new Date(checkIn);
    const exit = new Date(checkInDate.getTime() + Math.round(durationMinutes) * 60 * 1000);
    return { checkIn, checkOut: exit.toISOString() };
  }

  const quantityCandidate =
    toNumber(session.quantity) ??
    toNumber(metadata?.["quantity"]) ??
    toNumber(metadata?.["qty"]) ??
    1;
  const pricingType =
    (metadata?.["pricing_type"] ?? metadata?.["type"] ?? metadata?.["flow_type"] ?? "hourly").toString();
  if (checkIn) {
    const derivedExit = resolveExitFromQuantity(checkIn, quantityCandidate, pricingType);
    if (derivedExit) {
      return { checkIn, checkOut: derivedExit };
    }
  }

  return { checkIn, checkOut: null };
}

function pickBestSession(rows: SessionRow[]) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const isExtensionOnlyRow = (row: SessionRow) => {
    const metadata = parseStripeMetadata(row.stripe_metadata);
    const flow = (metadata?.["flow"] ?? metadata?.["flow_type"] ?? "").toString().trim().toLowerCase();
    const extendTargetSessionId = (metadata?.["extend_target_session_id"] ?? "").toString().trim();
    return flow === "reserve" && extendTargetSessionId.length > 0;
  };
  const now = Date.now();
  const classifyRow = (row: SessionRow) => {
    const paymentStatus = (row.payment_status ?? "").toString().trim().toLowerCase();
    const statusValue = (row.status ?? "").toString().trim().toLowerCase();
    const isPaid =
      paymentStatus === "paid" ||
      paymentStatus === "succeeded" ||
      paymentStatus === "complete" ||
      paymentStatus === "completed";
    const window = resolveSessionWindow(row);
    const checkInMs = window.checkIn ? new Date(window.checkIn).getTime() : Number.NEGATIVE_INFINITY;
    const checkOutMs = window.checkOut ? new Date(window.checkOut).getTime() : Number.NaN;
    return {
      row,
      isExtensionOnly: isExtensionOnlyRow(row),
      isPaid,
      statusValue,
      checkInMs,
      checkOutMs,
    };
  };
  const candidates = rows
    .map(classifyRow)
    .filter((item) => {
      const paymentStatus = (item.row.payment_status ?? "").toString().trim().toLowerCase();
      if (
        paymentStatus === "pending" ||
        paymentStatus === "unpaid" ||
        paymentStatus === "open" ||
        paymentStatus === "requires_payment_method"
      ) {
        return false;
      }
      return Number.isFinite(item.checkOutMs);
    });
  if (candidates.length === 0) {
    return null;
  }
  const activeNow = candidates
    .filter((item) => (item.isPaid || item.statusValue === "active") && item.checkInMs <= now && item.checkOutMs > now)
    .sort((a, b) => {
      if (a.isExtensionOnly !== b.isExtensionOnly) {
        return a.isExtensionOnly ? 1 : -1;
      }
      return b.checkOutMs - a.checkOutMs;
    });
  if (activeNow.length > 0) {
    return activeNow[0].row;
  }
  const upcoming = candidates
    .filter((item) => item.isPaid && item.checkInMs > now)
    .sort((a, b) => a.checkInMs - b.checkInMs);
  if (upcoming.length > 0) {
    return upcoming[0].row;
  }
  for (const item of candidates) {
    const row = item.row;
    const paymentStatus = (row.payment_status ?? "").toString().trim().toLowerCase();
    if (
      paymentStatus === "pending" ||
      paymentStatus === "unpaid" ||
      paymentStatus === "open" ||
      paymentStatus === "requires_payment_method"
    ) {
      continue;
    }
    const window = resolveSessionWindow(row);
    if (!window.checkOut) continue;
    const checkOutDate = new Date(window.checkOut);
    if (Number.isNaN(checkOutDate.getTime())) continue;
    if (checkOutDate.getTime() > now) {
      return row;
    }
  }
  return candidates[0]?.row ?? null;
}

function resolveActivityLifecycle(row: SessionRow) {
  const paymentStatus = (row.payment_status ?? "").toString().trim().toLowerCase();
  const status = (row.status ?? "").toString().trim().toLowerCase();
  const { checkIn, checkOut } = resolveSessionWindow(row);
  const checkInMs = checkIn ? new Date(checkIn).getTime() : Number.NaN;
  const checkOutMs = checkOut ? new Date(checkOut).getTime() : Number.NaN;
  const now = Date.now();
  if (Number.isFinite(checkInMs) && Number.isFinite(checkOutMs)) {
    if (now < checkInMs) {
      return "upcoming" as const;
    }
    if (now >= checkOutMs) {
      return "expired" as const;
    }
    return "active" as const;
  }
  if (
    paymentStatus === "pending" ||
    paymentStatus === "unpaid" ||
    paymentStatus === "open" ||
    status === "pending" ||
    status === "open"
  ) {
    return "pending" as const;
  }
  return "inactive" as const;
}

function isParkTaxiIncluded(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata || typeof metadata !== "object") return false;
  const flowType = (metadata["flow_type"] ?? "").toString().trim().toLowerCase();
  const pricingType = (metadata["pricing_type"] ?? "").toString().trim().toLowerCase();
  const productType = (metadata["product_type"] ?? "").toString().trim().toLowerCase();
  const rideIncluded = (metadata["ride_included"] ?? "").toString().trim().toLowerCase();
  if (flowType === "park_now") return true;
  if (pricingType === "park_taxi") return true;
  if (productType === "park_taxi") return true;
  if (rideIncluded === "true" || rideIncluded === "1" || rideIncluded === "yes") return true;
  return false;
}

function buildUberUrl(
  latitude: number | null,
  longitude: number | null,
  locationName: string | null
) {
  if (latitude == null || longitude == null) {
    return "";
  }
  const params = new URLSearchParams({
    action: "setPickup",
    "dropoff[latitude]": String(latitude),
    "dropoff[longitude]": String(longitude),
  });
  if (locationName) {
    params.set("dropoff[nickname]", locationName);
  }
  return `https://m.uber.com/ul/?${params.toString()}`;
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const includeActivity = requestUrl.searchParams.get("include_activity") !== "0";
  const includePermits = requestUrl.searchParams.get("include_permits") !== "0";
  const includeRewards = requestUrl.searchParams.get("include_rewards") !== "0";
  const includePermitData = includePermits || includeActivity;
  let identity = await resolveMemberIdentity(req);
  const email = identity.email;
  if (!email) {
    return NextResponse.json(
      { error: "unauthorized_member" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
  const tokenScopedClient = resolveTokenScopedClient(req);
  const client = supabaseAdmin ?? tokenScopedClient ?? supabase;
  if (!client) {
    return NextResponse.json(
      { error: "supabase_not_configured" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
  if (identity.email && !identity.userId) {
    const { data: profileByEmail } = await client
      .from("profiles")
      .select("id,role,location_id")
      .ilike("email", identity.email)
      .maybeSingle();
    if (profileByEmail) {
      const profileRole = normalizeRole(String((profileByEmail as { role?: unknown }).role ?? ""));
      const profileId = String((profileByEmail as { id?: unknown }).id ?? "").trim();
      const profileLocationId = String((profileByEmail as { location_id?: unknown }).location_id ?? "").trim();
      identity = {
        ...identity,
        userId: identity.userId || profileId,
        role: identity.role || profileRole,
        locationHints: uniq([...identity.locationHints, profileLocationId].filter((value) => value.length > 0)),
      };
    }
  }
  const fastContextMode = !includeActivity && !includePermits && !includeRewards;
  const fastContextCacheKey = [
    email,
    identity.userId,
    identity.role,
    req.headers.get("x-member-operator-scope") === "1" ? "1" : "0",
    [...identity.locationHints].sort().join(","),
  ].join("|");
  if (fastContextMode) {
    const cached = fastContextCache.get(fastContextCacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.payload, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      });
    }
    if (cached && cached.expiresAt <= Date.now()) {
      fastContextCache.delete(fastContextCacheKey);
    }
  }
  const isOperatorRole = ["super_admin", "superadmin", "admin", "manager", "officer"].includes(identity.role);
  const enableOperatorScope = req.headers.get("x-member-operator-scope") === "1";
  const directSessionLimit = 80;
  const directPermitLimit = 80;
  const fallbackIdentityLimit = enableOperatorScope && isOperatorRole ? 1200 : 0;
  const [
    { data: walletRow },
    { data: loyaltyRow },
    { data: walletLedgerRows },
    { data: loyaltyLedgerRows },
  ] = await Promise.all([
    client
      .from("wallet_accounts")
      .select("balance_cents,currency")
      .ilike("email", email)
      .maybeSingle(),
    client
      .from("loyalty_accounts")
      .select("points_year,points_total,current_level")
      .ilike("email", email)
      .maybeSingle(),
    includeRewards
      ? client
          .from("wallet_ledger")
          .select("id,amount_cents,direction,entry_type,created_at")
          .ilike("email", email)
          .order("created_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
    includeRewards
      ? client
          .from("loyalty_ledger")
          .select("id,points_delta,source,created_at")
          .ilike("email", email)
          .order("created_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
  ]);
  const walletBalanceCents = Math.max(
    0,
    Math.round(
      Number((walletRow as { balance_cents?: unknown } | null)?.balance_cents ?? 0)
    )
  );
  const walletCurrency = (
    (walletRow as { currency?: string | null } | null)?.currency ?? "eur"
  ).toString();
  const pointsYear = Math.max(
    0,
    Math.round(Number((loyaltyRow as { points_year?: unknown } | null)?.points_year ?? 0))
  );
  const pointsTotal = Math.max(
    0,
    Math.round(Number((loyaltyRow as { points_total?: unknown } | null)?.points_total ?? 0))
  );
  const currentLevelRaw = (loyaltyRow as { current_level?: string | null } | null)?.current_level;
  const loyaltyLevel = resolveLevel(pointsYear);
  const levelFromDb = (currentLevelRaw ?? "").toString().trim().toLowerCase();
  const resolvedLoyaltyLevel =
    levelFromDb === "level_1" || levelFromDb === "level_2" || levelFromDb === "level_3"
      ? levelFromDb
      : loyaltyLevel;
  const levelProgress = resolveLevelProgress(pointsYear, resolvedLoyaltyLevel);
  const sessionFieldCandidates = [
    "id,email,mobile,plate,location_id,created_at,entry_time,exit_time,duration_minutes,quantity,stripe_session_id,price,currency,status,payment_status,stripe_metadata,type",
  ];
  const runParkingSessionQuery = async (
    buildQuery: (fields: string) => PromiseLike<{ data: unknown; error: { message?: string } | null }>
  ) => {
    for (const fields of sessionFieldCandidates) {
      const result = await buildQuery(fields);
      if (!result.error) {
        return (result.data ?? []) as SessionRow[];
      }
    }
    return [] as SessionRow[];
  };
  const sessionRowsByEmail = await runParkingSessionQuery((fields) =>
    client
      .from("parking_sessions")
      .select(fields)
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(directSessionLimit)
  );
  const sessionRowsByContactEmail: SessionRow[] = [];
  const directRows = Array.from(
    new Map(
      [...sessionRowsByEmail, ...sessionRowsByContactEmail]
        .filter((row) => String(row.id ?? "").trim().length > 0)
        .map((row) => [String(row.id), row] as const)
    ).values()
  );
  const fallbackRows =
    fallbackIdentityLimit > 0
      ? await runParkingSessionQuery((fields) =>
          client
            .from("parking_sessions")
            .select(fields)
            .order("created_at", { ascending: false })
            .limit(fallbackIdentityLimit)
        )
      : [];
  const sessionMatchById = new Map<string, IdentityMatchKind>();
  const resolveMatchPriority = (kind: IdentityMatchKind) => {
    if (kind === "email") return 1;
    if (kind === "contact_email") return 2;
    if (kind === "metadata_email") return 3;
    if (kind === "customer_id") return 4;
    if (kind === "plate") return 5;
    if (kind === "phone") return 6;
    return 7;
  };
  const setMatchById = (row: SessionRow, kind: IdentityMatchKind | null) => {
    const rowId = String(row.id ?? "").trim();
    if (!rowId || !kind) return;
    const existing = sessionMatchById.get(rowId);
    if (!existing || resolveMatchPriority(kind) < resolveMatchPriority(existing)) {
      sessionMatchById.set(rowId, kind);
    }
  };
  for (const row of directRows) {
    setMatchById(row, resolveOwnedByEmailMatch(row, email));
  }
  const matchedFallbackRows = ((fallbackRows ?? []) as SessionRow[]).filter((row) => {
    const match = resolveOwnedByEmailMatch(row, email);
    if (!match) return false;
    setMatchById(row, match);
    return true;
  });
  const matchedSessionRows = Array.from(
    new Map(
      [...directRows, ...matchedFallbackRows]
        .filter((row) => String(row.id ?? "").trim().length > 0)
        .map((row) => [String(row.id), row] as const)
    ).values()
  );
  const permitFieldCandidates = [
    "id,plate,type,start_time,end_time,status,contact_name,contact_phone,contact_email,notes,created_at,location_id,daily_start_time,daily_end_time,daily_duration_hours,price,stripe_payment_id,stripe_payment_url,duration_hours,ui_type",
  ];
  const runParkingPermitQuery = async (
    buildQuery: (fields: string) => PromiseLike<{ data: unknown; error: { message?: string } | null }>
  ) => {
    for (const fields of permitFieldCandidates) {
      const result = await buildQuery(fields);
      if (!result.error) {
        return (result.data ?? []) as SessionRow[];
      }
    }
    return [] as SessionRow[];
  };
  const permitRowsByEmail: SessionRow[] = [];
  const permitRowsByContactEmail = includePermitData
    ? await runParkingPermitQuery((fields) =>
        client
          .from("parking_permits")
          .select(fields)
          .ilike("contact_email", email)
          .order("created_at", { ascending: false })
          .limit(directPermitLimit)
      )
    : [];
  const normalizedDirectPermitRows = Array.from(
    new Map(
      [...permitRowsByEmail, ...permitRowsByContactEmail]
        .filter((row) => String(row.id ?? "").trim().length > 0)
        .map((row) => {
          const permitId = String(row.id ?? "").trim();
          const metadata = parseStripeMetadata(row.stripe_metadata) ?? {};
          const paymentStatus =
            (
              metadata["payment_status"] ??
              metadata["paymentStatus"] ??
              metadata["checkout_payment_status"] ??
              "paid"
            )
              .toString()
              .trim() || "paid";
          return [
            `permit-${permitId}`,
            {
              ...row,
              id: `permit-${permitId}`,
              entry_time: row.start_time ?? row.entry_time ?? null,
              exit_time: row.end_time ?? row.exit_time ?? null,
              end_time: row.end_time ?? row.exit_time ?? null,
              payment_status: paymentStatus || row.status || "paid",
              currency: row.currency ?? "eur",
              stripe_session_id:
                (
                  metadata["stripe_session_id"] ??
                  metadata["session_id"] ??
                  metadata["checkout_session_id"] ??
                  row.stripe_payment_id ??
                  null
                )?.toString() ?? null,
            } as SessionRow,
          ] as const;
        })
    ).values()
  );
  const fallbackPermitRows =
    includePermitData && fallbackIdentityLimit > 0
      ? await runParkingPermitQuery((fields) =>
          client
            .from("parking_permits")
            .select(fields)
            .order("created_at", { ascending: false })
            .limit(fallbackIdentityLimit)
        )
      : [];
  const permitMatchById = new Map<string, IdentityMatchKind>();
  const setPermitMatchById = (row: SessionRow, kind: IdentityMatchKind | null) => {
    const rowId = String(row.id ?? "").trim();
    if (!rowId || !kind) return;
    const permitRowId = `permit-${rowId}`;
    const existing = permitMatchById.get(permitRowId);
    if (!existing || resolveMatchPriority(kind) < resolveMatchPriority(existing)) {
      permitMatchById.set(permitRowId, kind);
    }
  };
  for (const row of normalizedDirectPermitRows) {
    setPermitMatchById(
      { ...row, id: String(row.id ?? "").replace(/^permit-/, "") },
      resolveOwnedByEmailMatch(row, email)
    );
  }
  const matchedFallbackPermitRows = ((fallbackPermitRows ?? []) as SessionRow[])
    .filter((row) => {
      const match = resolveOwnedByEmailMatch(row, email);
      if (!match) return false;
      setPermitMatchById(row, match);
      return true;
    })
    .map((row) => {
      const permitId = String(row.id ?? "").trim();
      const metadata = parseStripeMetadata(row.stripe_metadata) ?? {};
      const paymentStatus =
        (
          metadata["payment_status"] ??
          metadata["paymentStatus"] ??
          metadata["checkout_payment_status"] ??
          "paid"
        )
          .toString()
          .trim() || "paid";
      return {
        ...row,
        id: `permit-${permitId}`,
        entry_time: row.start_time ?? row.entry_time ?? null,
        exit_time: row.end_time ?? row.exit_time ?? null,
        end_time: row.end_time ?? row.exit_time ?? null,
        payment_status: paymentStatus || row.status || "paid",
        currency: row.currency ?? "eur",
        stripe_session_id:
          (
            metadata["stripe_session_id"] ??
            metadata["session_id"] ??
            metadata["checkout_session_id"] ??
            row.stripe_payment_id ??
            null
          )?.toString() ?? null,
      } as SessionRow;
    });
  const operatorLocationScope = new Set<string>(
    identity.locationHints.map((value) => value.trim()).filter((value) => value.length > 0)
  );
  if (isOperatorRole && identity.userId) {
    if (identity.role === "admin") {
      const { data: ownedLocations } = await client
        .from("locations")
        .select("id,display_id")
        .eq("owner_id", identity.userId)
        .limit(500);
      for (const row of ((ownedLocations ?? []) as Array<{ id?: string | null; display_id?: string | null }>)) {
        const id = String(row.id ?? "").trim();
        const displayId = String(row.display_id ?? "").trim();
        if (id) operatorLocationScope.add(id);
        if (displayId) operatorLocationScope.add(displayId);
      }
    }
    if (identity.role === "manager" || identity.role === "officer") {
      const { data: assigned } = await client
        .from("officer_assignments")
        .select("location_id")
        .eq("officer_id", identity.userId)
        .limit(500);
      const assignmentLocationIds = ((assigned ?? []) as Array<{ location_id?: string | null }>)
        .map((row) => String(row.location_id ?? "").trim())
        .filter((value) => value.length > 0);
      for (const locationId of assignmentLocationIds) {
        operatorLocationScope.add(locationId);
      }
      if (assignmentLocationIds.length > 0) {
        const { data: assignedLocations } = await client
          .from("locations")
          .select("id,display_id")
          .in("id", assignmentLocationIds.slice(0, 500));
        for (const row of ((assignedLocations ?? []) as Array<{ id?: string | null; display_id?: string | null }>)) {
          const id = String(row.id ?? "").trim();
          const displayId = String(row.display_id ?? "").trim();
          if (id) operatorLocationScope.add(id);
          if (displayId) operatorLocationScope.add(displayId);
        }
      }
    }
  }
  const canUseLocationScopeFallback =
    enableOperatorScope &&
    isOperatorRole &&
    (identity.role === "super_admin" || identity.role === "superadmin" || operatorLocationScope.size > 0);
  const isRowInOperatorScope = (row: SessionRow) => {
    const rowLocation = String(row.location_id ?? "").trim();
    if (!rowLocation) return false;
    if (identity.role === "super_admin" || identity.role === "superadmin") return true;
    return operatorLocationScope.has(rowLocation);
  };
  const operatorScopedSessionRows = canUseLocationScopeFallback
    ? ((fallbackRows ?? []) as SessionRow[]).filter((row) => isRowInOperatorScope(row))
    : [];
  for (const row of operatorScopedSessionRows) {
    setMatchById(row, "location_scope");
  }
  const mergedSessionRows = Array.from(
    new Map(
      [...matchedSessionRows, ...operatorScopedSessionRows]
        .filter((row) => String(row.id ?? "").trim().length > 0)
        .map((row) => [String(row.id), row] as const)
    ).values()
  );
  const nowMs = Date.now();
  const staleUncompletedSessionIds = mergedSessionRows
    .filter((row) => isStaleUncompletedSession(row, nowMs))
    .map((row) => String(row.id ?? "").trim())
    .filter((value) => value.length > 0);
  if (staleUncompletedSessionIds.length > 0) {
    const uniqueIds = Array.from(new Set(staleUncompletedSessionIds));
    for (let index = 0; index < uniqueIds.length; index += 100) {
      const chunk = uniqueIds.slice(index, index + 100);
      await client
        .from("parking_sessions")
        .delete()
        .in("id", chunk);
    }
  }
  const staleUncompletedSessionIdSet = new Set(staleUncompletedSessionIds);
  const finalSessionRows = mergedSessionRows.filter(
    (row) => !staleUncompletedSessionIdSet.has(String(row.id ?? "").trim())
  );
  const operatorScopedPermitRows = canUseLocationScopeFallback
    ? ((fallbackPermitRows ?? []) as SessionRow[]).filter((row) => isRowInOperatorScope(row))
    : [];
  const normalizedOperatorPermitRows = operatorScopedPermitRows.map((row) => {
    const permitId = String(row.id ?? "").trim();
    const metadata = parseStripeMetadata(row.stripe_metadata) ?? {};
    const paymentStatus =
      (
        metadata["payment_status"] ??
        metadata["paymentStatus"] ??
        metadata["checkout_payment_status"] ??
        "paid"
      )
        .toString()
        .trim() || "paid";
    permitMatchById.set(`permit-${permitId}`, "location_scope");
    return {
      ...row,
      id: `permit-${permitId}`,
      entry_time: row.start_time ?? row.entry_time ?? null,
      exit_time: row.end_time ?? row.exit_time ?? null,
      end_time: row.end_time ?? row.exit_time ?? null,
      payment_status: paymentStatus || row.status || "paid",
      currency: row.currency ?? "eur",
      stripe_session_id:
        (
          metadata["stripe_session_id"] ??
          metadata["session_id"] ??
          metadata["checkout_session_id"] ??
          row.stripe_payment_id ??
          null
        )?.toString() ?? null,
    } as SessionRow;
  });
  const permitRows = includePermits
    ? Array.from(
        new Map(
          [...normalizedDirectPermitRows, ...matchedFallbackPermitRows, ...normalizedOperatorPermitRows]
            .filter((row) => String(row.id ?? "").trim().length > 0)
            .map((row) => [String(row.id), row] as const)
        ).values()
      )
    : [];
  const activitySourceRows = includeActivity
    ? [
        ...finalSessionRows,
        ...normalizedDirectPermitRows,
        ...matchedFallbackPermitRows,
        ...normalizedOperatorPermitRows,
      ].slice(0, 400)
    : [];
  const activityUniqueRows = includeActivity
    ? Array.from(
        new Map(
          activitySourceRows
            .filter((row) => String(row.id ?? "").trim().length > 0)
            .map((row) => [String(row.id), row] as const)
        ).values()
      )
    : [];
  const activityAndPermitLocationIds = Array.from(
    new Set(
      [...activityUniqueRows, ...permitRows]
        .map((row) => (row.location_id ?? "").toString().trim())
        .filter((value) => value.length > 0 && value.includes("-"))
    )
  );
  let displayIdByLocationId = new Map<string, string>();
  if (activityAndPermitLocationIds.length > 0) {
    const { data: locationRows } = await client
      .from("locations")
      .select("id,display_id")
      .in("id", activityAndPermitLocationIds);
    displayIdByLocationId = new Map(
      ((locationRows ?? []) as Array<{ id?: string | null; display_id?: string | null }>)
        .map((row) => [String(row.id ?? "").trim(), String(row.display_id ?? "").trim()] as const)
        .filter(([id, displayId]) => id.length > 0 && displayId.length > 0)
    );
  }
  const permits = permitRows.map((row) => {
    const rawLocation = (row.location_id ?? "").toString().trim();
    const resolvedDisplayId = rawLocation.includes("-")
      ? displayIdByLocationId.get(rawLocation) ?? null
      : rawLocation || null;
    return {
      id: String(row.id ?? ""),
      email: row.email ?? null,
      contact_email: row.contact_email ?? null,
      plate: row.plate ?? null,
      location_id: row.location_id ?? null,
      location_display_id: resolvedDisplayId,
      created_at: row.created_at ?? null,
      start_time: row.entry_time ?? row.start_time ?? null,
      end_time: row.exit_time ?? row.end_time ?? null,
      price: row.price ?? null,
      currency: row.currency ?? null,
      status: row.status ?? null,
      stripe_metadata: row.stripe_metadata ?? null,
      type: row.type ?? null,
      matched_by: permitMatchById.get(String(row.id ?? "")) ?? null,
    };
  });
  const activity = activityUniqueRows.map((row) => {
    const window = resolveSessionWindow(row);
    const rawLocation = (row.location_id ?? "").toString().trim();
    const resolvedDisplayId = rawLocation.includes("-")
      ? displayIdByLocationId.get(rawLocation) ?? null
      : rawLocation || null;
    return {
      id: String(row.id ?? ""),
      email: row.email ?? null,
      contact_email: row.contact_email ?? null,
      created_at: row.created_at ?? null,
      location_id: row.location_id ?? null,
      location_display_id: resolvedDisplayId,
      plate: row.plate ?? null,
      price: row.price ?? null,
      currency: row.currency ?? null,
      payment_status: row.payment_status ?? null,
      status: row.status ?? null,
      entry_time: row.entry_time ?? null,
      exit_time: row.exit_time ?? null,
      end_time: row.end_time ?? null,
      stripe_metadata: row.stripe_metadata ?? null,
      ui_check_in: window.checkIn,
      ui_check_out: window.checkOut,
      ui_lifecycle: resolveActivityLifecycle(row),
      matched_by:
        sessionMatchById.get(String(row.id ?? "")) ??
        permitMatchById.get(String(row.id ?? "")) ??
        null,
    };
  });
  const session = pickBestSession(finalSessionRows);
  if (!session) {
    const payload = {
      context: null,
      wallet: {
        balanceCents: walletBalanceCents,
        currency: walletCurrency,
        minimumTopupCents: 50,
      },
      loyalty: {
        level: resolvedLoyaltyLevel,
        pointsYear,
        pointsTotal,
        ...levelProgress,
        bonusRangeByLevel: {
          level_1: "0%",
          level_2: "1% - 15%",
          level_3: "5% - 20%",
        },
      },
      rewards: {
        walletLedger: includeRewards
          ? (walletLedgerRows ?? []).map((row) => ({
              id: String((row as { id?: string | number | null }).id ?? ""),
              amountCents: Math.round(Number((row as { amount_cents?: unknown }).amount_cents ?? 0)),
              direction: String((row as { direction?: unknown }).direction ?? ""),
              entryType: String((row as { entry_type?: unknown }).entry_type ?? ""),
              createdAt: String((row as { created_at?: unknown }).created_at ?? ""),
            }))
          : [],
        loyaltyLedger: includeRewards
          ? (loyaltyLedgerRows ?? []).map((row) => ({
              id: String((row as { id?: string | number | null }).id ?? ""),
              pointsDelta: Math.round(Number((row as { points_delta?: unknown }).points_delta ?? 0)),
              source: String((row as { source?: unknown }).source ?? ""),
              createdAt: String((row as { created_at?: unknown }).created_at ?? ""),
            }))
          : [],
      },
      permits,
      activity,
    };
    if (fastContextMode) {
      fastContextCache.set(fastContextCacheKey, {
        expiresAt: Date.now() + FAST_CONTEXT_TTL_MS,
        payload,
      });
    }
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  }
  const locationKey = (session.location_id ?? "").toString().trim();
  let locationName: string | null = null;
  let locationDisplayId: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;
  let metadata: Record<string, unknown> | null = null;
  let valetEnabled = false;
  let shuttleEnabled = false;
  if (locationKey) {
    const byId = await client
      .from("locations")
      .select("id,name,display_id,latitude,longitude,verification_metadata,valet_enabled,shuttle_enabled")
      .eq("id", locationKey)
      .maybeSingle();
    let row = byId.data as
      | {
          display_id?: string | null;
          name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          verification_metadata?: Record<string, unknown> | null;
          valet_enabled?: boolean | null;
          shuttle_enabled?: boolean | null;
        }
      | null;
    if (!row) {
      const byDisplayId = await client
        .from("locations")
        .select("id,name,display_id,latitude,longitude,verification_metadata,valet_enabled,shuttle_enabled")
        .eq("display_id", locationKey)
        .maybeSingle();
      row = byDisplayId.data as
        | {
            display_id?: string | null;
            name?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            verification_metadata?: Record<string, unknown> | null;
            valet_enabled?: boolean | null;
            shuttle_enabled?: boolean | null;
          }
        | null;
    }
    if (row) {
      locationDisplayId = row.display_id ? String(row.display_id) : null;
      locationName = row.name ? normalizeLocationName(String(row.name)) : null;
      latitude = toNumber(row.latitude);
      longitude = toNumber(row.longitude);
      metadata = row.verification_metadata ?? null;
      valetEnabled = row.valet_enabled ?? false;
      shuttleEnabled = row.shuttle_enabled ?? false;
    }
  }
  const window = resolveSessionWindow(session);
  const sessionMetadata = parseStripeMetadata(session.stripe_metadata);
  const resolvedStripeSessionId =
    (session.stripe_session_id ?? "").toString().trim() ||
    readMetadataStringValue(sessionMetadata, [
      "stripe_session_id",
      "session_id",
      "checkout_session_id",
    ]) ||
    (session.stripe_payment_id ?? "").toString().trim() ||
    null;
  const resolvedPlate =
    (session.plate ?? "").toString().trim() ||
    readMetadataStringValue(sessionMetadata, [
      "plate",
      "plate_number",
      "plateNumber",
      "license_plate",
      "vehicle_plate",
      "registration_number",
    ]) ||
    null;
  const resolvedAmount = toNumber(session.price) ?? readAmountFromMetadata(sessionMetadata);
  const resolvedCurrency =
    (typeof session.currency === "string" && session.currency.trim()
      ? session.currency
      : readMetadataStringValue(sessionMetadata, ["currency", "currency_code"])) || null;
  const insuranceUrl =
    readMetadataUrl(metadata, ["insurance_url", "insuranceUrl", "insurance_link"]) ||
    "/insurance/apply";
  const rideUrl =
    readMetadataUrl(metadata, ["uber_url", "ride_url", "uber_link"]) ||
    buildUberUrl(latitude, longitude, locationName) ||
    "https://m.uber.com/";
  const payload = {
    context: {
      sessionId: String(session.id ?? ""),
      locationId: locationDisplayId || locationKey || null,
      locationDisplayId,
      locationName,
      checkIn: window.checkIn,
      checkOut: window.checkOut,
      stripeSessionId: resolvedStripeSessionId,
      plate: resolvedPlate,
      amount: resolvedAmount,
      currency: resolvedCurrency,
      insuranceUrl,
      rideUrl,
      invoiceAvailable: Boolean(resolvedStripeSessionId || session.id),
      parkTaxiIncluded: isParkTaxiIncluded(sessionMetadata),
      valetEnabled,
      shuttleEnabled,
    },
    wallet: {
      balanceCents: walletBalanceCents,
      currency: walletCurrency,
      minimumTopupCents: 50,
    },
    loyalty: {
      level: resolvedLoyaltyLevel,
      pointsYear,
      pointsTotal,
      ...levelProgress,
      bonusRangeByLevel: {
        level_1: "0%",
        level_2: "1% - 15%",
        level_3: "5% - 20%",
      },
    },
    rewards: {
      walletLedger: includeRewards
        ? (walletLedgerRows ?? []).map((row) => ({
            id: String((row as { id?: string | number | null }).id ?? ""),
            amountCents: Math.round(Number((row as { amount_cents?: unknown }).amount_cents ?? 0)),
            direction: String((row as { direction?: unknown }).direction ?? ""),
            entryType: String((row as { entry_type?: unknown }).entry_type ?? ""),
            createdAt: String((row as { created_at?: unknown }).created_at ?? ""),
          }))
        : [],
      loyaltyLedger: includeRewards
        ? (loyaltyLedgerRows ?? []).map((row) => ({
            id: String((row as { id?: string | number | null }).id ?? ""),
            pointsDelta: Math.round(Number((row as { points_delta?: unknown }).points_delta ?? 0)),
            source: String((row as { source?: unknown }).source ?? ""),
            createdAt: String((row as { created_at?: unknown }).created_at ?? ""),
          }))
        : [],
    },
    permits,
    activity,
  };
  if (fastContextMode) {
    fastContextCache.set(fastContextCacheKey, {
      expiresAt: Date.now() + FAST_CONTEXT_TTL_MS,
      payload,
    });
  }
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
