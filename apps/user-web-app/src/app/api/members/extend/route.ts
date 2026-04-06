import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined) {
  return (value ?? "").toString().replace(/[^\d]/g, "");
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

function uniq(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

type MemberIdentity = {
  email: string;
  phones: string[];
  plates: string[];
  stripeCustomerIds: string[];
};

async function resolveMemberEmail(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (token && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error) {
      const fromToken = normalizeEmail(data.user?.email);
      if (fromToken) {
        return fromToken;
      }
    }
  }
  const fallback = normalizeEmail(req.headers.get("x-member-email"));
  if (fallback) {
    return fallback;
  }
  return "";
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

async function resolveMemberIdentity(req: NextRequest): Promise<MemberIdentity> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const authClient = supabaseAdmin ?? supabase;
  let resolvedUser:
    | {
        email?: string | null;
        phone?: string | null;
        user_metadata?: Record<string, unknown> | null;
        app_metadata?: Record<string, unknown> | null;
      }
    | null = null;
  if (token && authClient) {
    const { data, error } = await authClient.auth.getUser(token);
    if (!error && data.user) {
      resolvedUser = {
        email: data.user.email ?? null,
        phone: data.user.phone ?? null,
        user_metadata: (data.user.user_metadata ?? null) as Record<string, unknown> | null,
        app_metadata: (data.user.app_metadata ?? null) as Record<string, unknown> | null,
      };
    }
  }
  const emailFromToken = normalizeEmail(resolvedUser?.email);
  const emailFromHeader = normalizeEmail(req.headers.get("x-member-email"));
  const email = emailFromToken || emailFromHeader;
  const userMetadata = resolvedUser?.user_metadata ?? null;
  const appMetadata = resolvedUser?.app_metadata ?? null;
  const phones = uniq(
    [
      normalizePhone(resolvedUser?.phone),
      ...readMetadataStringList(userMetadata, ["mobile", "phone", "contact_phone", "customer_phone"]).map(
        normalizePhone
      ),
      ...readMetadataStringList(appMetadata, ["mobile", "phone", "contact_phone", "customer_phone"]).map(
        normalizePhone
      ),
    ].filter((value) => value.length > 0)
  );
  const plates = uniq(
    [
      ...readMetadataStringList(userMetadata, ["member_plates", "plate", "license_plate", "vehicle_plate"]).map(
        normalizePlate
      ),
      ...readMetadataStringList(appMetadata, ["member_plates", "plate", "license_plate", "vehicle_plate"]).map(
        normalizePlate
      ),
    ].filter((value) => value.length > 0)
  );
  const stripeCustomerIds = uniq(
    [
      ...readMetadataStringList(userMetadata, ["stripe_customer_id", "stripeCustomerId", "customer_id"]),
      ...readMetadataStringList(appMetadata, ["stripe_customer_id", "stripeCustomerId", "customer_id"]),
    ].map((value) => value.trim()).filter((value) => value.length > 0)
  );
  return { email, phones, plates, stripeCustomerIds };
}

function toValidDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

type SessionRow = {
  id?: string | null;
  email?: string | null;
  contact_email?: string | null;
  location_id?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | string | null;
  quantity?: number | string | null;
  plate?: string | null;
  mobile?: string | null;
  status?: string | null;
  payment_status?: string | null;
  stripe_payment_id?: string | null;
  price?: number | string | null;
  currency?: string | null;
  stripe_metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

function normalizeIso(value: string | null | undefined) {
  const parsed = toValidDate(value);
  if (!parsed) return null;
  return parsed.toISOString();
}

function parseStripeMetadata(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
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

function resolveOwnedByIdentityMatch(row: SessionRow, identity: MemberIdentity) {
  if (identity.email) {
    if (normalizeEmail((row as { email?: unknown }).email?.toString()) === identity.email) {
      return "email";
    }
    if (normalizeEmail((row as { contact_email?: unknown }).contact_email?.toString()) === identity.email) {
      return "contact_email";
    }
  }
  const metadata = parseStripeMetadata(row.stripe_metadata);
  const metadataEmail = normalizeEmail(
    (
      metadata?.["customer_email"] ??
      metadata?.["email"] ??
      metadata?.["contact_email"] ??
      metadata?.["member_email"] ??
      metadata?.["checkout_email"] ??
      ""
    ).toString()
  );
  if (identity.email && metadataEmail === identity.email) {
    return "metadata_email";
  }
  const metadataCustomerId = (
    metadata?.["stripe_customer_id"] ??
    metadata?.["stripeCustomerId"] ??
    metadata?.["customer_id"] ??
    ""
  )
    .toString()
    .trim();
  if (metadataCustomerId && identity.stripeCustomerIds.includes(metadataCustomerId)) {
    return "customer_id";
  }
  const plate = resolvePlateFromRow(row);
  if (plate && identity.plates.includes(normalizePlate(plate))) {
    return "plate";
  }
  const phone = resolvePhoneFromRow(row);
  if (phone && identity.phones.includes(normalizePhone(phone))) {
    return "phone";
  }
  return null;
}

function firstDefinedStringValue(
  metadata: Record<string, unknown> | null,
  keys: string[]
) {
  if (!metadata) return "";
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function resolvePlateFromRow(row: SessionRow) {
  const metadata = parseStripeMetadata(row.stripe_metadata);
  return (
    row.plate?.toString().trim() ||
    firstDefinedStringValue(metadata, [
      "plate",
      "plate_number",
      "plateNumber",
      "license_plate",
      "vehicle_plate",
      "registration_number",
    ])
  );
}

function resolvePhoneFromRow(row: SessionRow) {
  const metadata = parseStripeMetadata(row.stripe_metadata);
  return (
    row.mobile?.toString().trim() ||
    firstDefinedStringValue(metadata, [
      "mobile",
      "phone",
      "customer_phone",
      "customerPhone",
      "phone_number",
      "contact_phone",
      "customer_mobile",
    ])
  );
}

function resolveSessionWindow(row: SessionRow) {
  const metadata = parseStripeMetadata(row.stripe_metadata);
  const entryFromRow = normalizeIso(row.entry_time);
  const entryFromMeta = normalizeIso((metadata?.["check_in"] ?? "").toString());
  const checkIn = entryFromRow ?? entryFromMeta;
  const exitFromRow = normalizeIso(row.exit_time);
  if (exitFromRow) {
    return { checkIn, checkOut: exitFromRow };
  }
  const exitFromMeta = normalizeIso((metadata?.["check_out"] ?? "").toString());
  if (exitFromMeta) {
    return { checkIn, checkOut: exitFromMeta };
  }
  const durationMinutesFromRow = Number(row.duration_minutes ?? Number.NaN);
  const durationMinutesFromMeta = Number(
    metadata?.["duration_minutes"] ?? metadata?.["durationMinutes"] ?? Number.NaN
  );
  const durationMinutes = Number.isFinite(durationMinutesFromRow)
    ? durationMinutesFromRow
    : Number.isFinite(durationMinutesFromMeta)
      ? durationMinutesFromMeta
      : Number.NaN;
  const quantityFromRow = Number(row.quantity ?? Number.NaN);
  const quantityFromMeta = Number(metadata?.["quantity"] ?? Number.NaN);
  const quantity = Number.isFinite(quantityFromRow)
    ? quantityFromRow
    : Number.isFinite(quantityFromMeta)
      ? quantityFromMeta
      : 1;
  const resolvedCheckIn = toValidDate(checkIn);
  if (resolvedCheckIn && Number.isFinite(durationMinutes) && durationMinutes > 0) {
    const multiplier = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    const derivedExit = new Date(
      resolvedCheckIn.getTime() + Math.round(durationMinutes * multiplier) * 60 * 1000
    ).toISOString();
    return { checkIn, checkOut: derivedExit };
  }
  return { checkIn, checkOut: null };
}

function pickSessionForExtension(rows: SessionRow[]) {
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
  const preferredRows = rows.filter((row) => !isExtensionOnlyRow(row));
  const candidates = preferredRows.length > 0 ? preferredRows : rows;
  for (const row of candidates) {
    const paymentStatus = (row.payment_status ?? "").toString().trim().toLowerCase();
    const status = (row.status ?? "").toString().trim().toLowerCase();
    const isPaid =
      paymentStatus === "paid" ||
      paymentStatus === "succeeded" ||
      paymentStatus === "complete" ||
      paymentStatus === "completed";
    const isBlockedPaymentStatus =
      paymentStatus === "pending" ||
      paymentStatus === "unpaid" ||
      paymentStatus === "open" ||
      paymentStatus === "requires_payment_method";
    const isActive = status === "active";
    if (!isPaid && !isActive) {
      continue;
    }
    const window = resolveSessionWindow(row);
    const checkIn = toValidDate(window.checkIn);
    const exit = toValidDate(window.checkOut);
    if (checkIn && now < checkIn.getTime()) {
      continue;
    }
    if (isBlockedPaymentStatus && !(checkIn && exit && now >= checkIn.getTime() && now < exit.getTime())) {
      continue;
    }
    if (exit && exit.getTime() > now) {
      return row;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const identity = await resolveMemberIdentity(req);
  const email = identity.email || (await resolveMemberEmail(req));
  if (!email && identity.phones.length === 0 && identity.plates.length === 0 && identity.stripeCustomerIds.length === 0) {
    return NextResponse.json({ ok: false, error: "unauthorized_member" }, { status: 401 });
  }
  const payload = (await req.json().catch(() => null)) as {
    minutes?: number;
    session_id?: string;
    fallback_location_id?: string;
    fallback_check_in?: string;
    fallback_check_out?: string;
    fallback_plate?: string;
  } | null;
  const requestedMinutes = Number(payload?.minutes ?? 120);
  const requestedSessionId = String(payload?.session_id ?? "").trim();
  const fallbackLocationId = String(payload?.fallback_location_id ?? "").trim();
  const fallbackCheckIn = String(payload?.fallback_check_in ?? "").trim();
  const fallbackCheckOut = String(payload?.fallback_check_out ?? "").trim();
  const fallbackPlate = String(payload?.fallback_plate ?? "").trim();
  const safeMinutes = Number.isFinite(requestedMinutes)
    ? Math.max(60, Math.min(2880, Math.round(requestedMinutes)))
    : 120;
  const tokenScopedClient = resolveTokenScopedClient(req);
  const client = supabaseAdmin ?? tokenScopedClient ?? supabase;
  if (!client) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }
  const sessionFields = "id,location_id,entry_time,exit_time,end_time,duration_minutes,quantity,plate,mobile,status,payment_status,stripe_metadata,created_at";
  const permitFields =
    "id,contact_email,location_id,start_time,end_time,entry_time,exit_time,plate,mobile,status,stripe_metadata,created_at,stripe_payment_id,price,currency";
  const { data: sessionRowsByEmail } = email
    ? await client
        .from("parking_sessions")
        .select(sessionFields)
        .ilike("email", email)
        .order("exit_time", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as SessionRow[] };
  const { data: sessionRowsByContactEmail } = email
    ? await client
        .from("parking_sessions")
        .select(sessionFields)
        .ilike("contact_email", email)
        .order("exit_time", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as SessionRow[] };
  const sessionRows = Array.from(
    new Map(
      [...((sessionRowsByEmail ?? []) as SessionRow[]), ...((sessionRowsByContactEmail ?? []) as SessionRow[])]
        .filter((row) => String(row.id ?? "").trim().length > 0)
        .map((row) => [String(row.id), row] as const)
    ).values()
  );
  const { data: permitRowsByContactEmail } = email
    ? await client
        .from("parking_permits")
        .select(permitFields)
        .ilike("contact_email", email)
        .order("end_time", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as SessionRow[] };
  const normalizedPermitRows = ((permitRowsByContactEmail ?? []) as SessionRow[]).map((row) => {
    const metadata = parseStripeMetadata(row.stripe_metadata) ?? {};
    const permitId = String(row.id ?? "").trim();
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
      id: permitId ? `permit-${permitId}` : "",
      email: null,
      entry_time: row.start_time ?? row.entry_time ?? null,
      exit_time: row.end_time ?? row.exit_time ?? null,
      payment_status: paymentStatus || row.status || "paid",
      stripe_payment_id: String(row.stripe_payment_id ?? "").trim() || null,
    } as SessionRow;
  });
  const directRows = [...sessionRows, ...normalizedPermitRows];
  const matchedDirectRows = directRows.filter(
    (row) => resolveOwnedByIdentityMatch(row, { ...identity, email }) !== null
  );
  let candidateRows = matchedDirectRows;
  let preferredRequestedRow: SessionRow | null = null;
  if (requestedSessionId) {
    let requestedRow: SessionRow | null = null;
    if (requestedSessionId.startsWith("permit-")) {
      const permitId = requestedSessionId.replace(/^permit-/, "").trim();
      if (permitId) {
        const { data: requestedPermit } = await client
          .from("parking_permits")
          .select(permitFields)
          .eq("id", permitId)
          .maybeSingle();
        if (requestedPermit) {
          const metadata = parseStripeMetadata((requestedPermit as SessionRow).stripe_metadata) ?? {};
          const paymentStatus =
            (
              metadata["payment_status"] ??
              metadata["paymentStatus"] ??
              metadata["checkout_payment_status"] ??
              "paid"
            )
              .toString()
              .trim() || "paid";
          requestedRow = {
            ...(requestedPermit as SessionRow),
            id: `permit-${permitId}`,
            email: null,
            entry_time: (requestedPermit as SessionRow).start_time ?? (requestedPermit as SessionRow).entry_time ?? null,
            exit_time: (requestedPermit as SessionRow).end_time ?? (requestedPermit as SessionRow).exit_time ?? null,
            payment_status: paymentStatus || (requestedPermit as SessionRow).status || "paid",
            stripe_payment_id: String((requestedPermit as SessionRow).stripe_payment_id ?? "").trim() || null,
          };
        }
      }
    } else {
      const { data: requestedSession } = await client
        .from("parking_sessions")
        .select(sessionFields)
        .eq("id", requestedSessionId)
        .maybeSingle();
      if (requestedSession) {
        requestedRow = requestedSession as SessionRow;
      } else {
        const { data: requestedPermitByPlainId } = await client
          .from("parking_permits")
          .select(permitFields)
          .eq("id", requestedSessionId)
          .maybeSingle();
        if (requestedPermitByPlainId) {
          const metadata = parseStripeMetadata((requestedPermitByPlainId as SessionRow).stripe_metadata) ?? {};
          const paymentStatus =
            (
              metadata["payment_status"] ??
              metadata["paymentStatus"] ??
              metadata["checkout_payment_status"] ??
              "paid"
            )
              .toString()
              .trim() || "paid";
          requestedRow = {
            ...(requestedPermitByPlainId as SessionRow),
            id: `permit-${requestedSessionId}`,
            email: null,
            entry_time:
              (requestedPermitByPlainId as SessionRow).start_time ??
              (requestedPermitByPlainId as SessionRow).entry_time ??
              null,
            exit_time:
              (requestedPermitByPlainId as SessionRow).end_time ??
              (requestedPermitByPlainId as SessionRow).exit_time ??
              null,
            payment_status: paymentStatus || (requestedPermitByPlainId as SessionRow).status || "paid",
            stripe_payment_id: String((requestedPermitByPlainId as SessionRow).stripe_payment_id ?? "").trim() || null,
          };
        }
      }
    }
    if (requestedRow) {
      preferredRequestedRow = requestedRow;
      candidateRows = [requestedRow, ...candidateRows];
    }
  }
  if (candidateRows.length === 0) {
    const { data: fallbackRows } = await client
      .from("parking_sessions")
      .select(sessionFields)
      .order("exit_time", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1500);
    const { data: fallbackPermitRows } = await client
      .from("parking_permits")
      .select(permitFields)
      .order("end_time", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1500);
    const normalizedFallbackPermits = ((fallbackPermitRows ?? []) as SessionRow[]).map((row) => {
      const metadata = parseStripeMetadata(row.stripe_metadata) ?? {};
      const permitId = String(row.id ?? "").trim();
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
        id: permitId ? `permit-${permitId}` : "",
        email: null,
        entry_time: row.start_time ?? row.entry_time ?? null,
        exit_time: row.end_time ?? row.exit_time ?? null,
        payment_status: paymentStatus || row.status || "paid",
        stripe_payment_id: String(row.stripe_payment_id ?? "").trim() || null,
      } as SessionRow;
    });
    candidateRows = [...((fallbackRows ?? []) as SessionRow[]), ...normalizedFallbackPermits].filter(
      (row) => resolveOwnedByIdentityMatch(row, { ...identity, email }) !== null
    );
  }
  let chosenSession = pickSessionForExtension(candidateRows);
  if (!chosenSession && preferredRequestedRow) {
    const preferredWindow = resolveSessionWindow(preferredRequestedRow);
    const preferredCheckOut = toValidDate(preferredWindow.checkOut);
    const nowMs = Date.now();
    if (preferredCheckOut && preferredCheckOut.getTime() > nowMs) {
      chosenSession = preferredRequestedRow;
    }
  }
  if (!chosenSession && requestedSessionId) {
    const fallbackExit = toValidDate(fallbackCheckOut);
    if (fallbackExit && fallbackExit.getTime() > Date.now() && fallbackLocationId) {
      chosenSession = {
        id: requestedSessionId,
        location_id: fallbackLocationId,
        entry_time: fallbackCheckIn || null,
        exit_time: fallbackCheckOut,
        plate: fallbackPlate || null,
        status: "active",
        payment_status: "paid",
      } as SessionRow;
    }
  }
  if (!chosenSession) {
    return NextResponse.json({ ok: false, error: "no_active_session" }, { status: 404 });
  }
  const row = chosenSession as SessionRow;
  const allRows = candidateRows;
  const targetSessionId = (row.id ?? "").toString().trim();
  if (!targetSessionId) {
    return NextResponse.json({ ok: false, error: "missing_target_session_id" }, { status: 400 });
  }
  const locationId = (row.location_id ?? "").toString().trim();
  if (!locationId) {
    return NextResponse.json({ ok: false, error: "missing_location_id" }, { status: 400 });
  }
  const now = new Date();
  const resolvedWindow = resolveSessionWindow(row);
  const currentSessionExit = toValidDate(resolvedWindow.checkOut ?? row.exit_time ?? null);
  const extensionStart = currentSessionExit && currentSessionExit.getTime() > now.getTime() ? currentSessionExit : now;
  const extendedOut = new Date(extensionStart.getTime() + safeMinutes * 60 * 1000);
  const checkoutParams = new URLSearchParams({
    loc: locationId,
    flow: "reserve",
    in: extensionStart.toISOString(),
    out: extendedOut.toISOString(),
    email,
    extend_target_session_id: targetSessionId,
    extend_minutes: String(safeMinutes),
    allow_plate_override: "1",
  });
  const plate = [row, ...allRows].map(resolvePlateFromRow).find((value) => value.length > 0) ?? "";
  if (plate) {
    checkoutParams.set("plate", plate);
  }
  const phone = [row, ...allRows].map(resolvePhoneFromRow).find((value) => value.length > 0) ?? "";
  if (phone) {
    checkoutParams.set("phone", phone);
  }
  return NextResponse.json({
    ok: true,
    message: `Extension prepared (+${safeMinutes} min). Complete payment in the new tab.`,
    actionUrl: `/api/stripe/checkout?${checkoutParams.toString()}`,
  });
}
