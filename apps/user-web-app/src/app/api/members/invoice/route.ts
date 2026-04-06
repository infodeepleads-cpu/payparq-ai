import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
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
      if (typeof current !== "string") break;
      try {
        current = JSON.parse(current);
      } catch {
        break;
      }
    }
  }
  return null;
}

async function resolveMemberEmail(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const authClient = supabaseAdmin ?? supabase;
  if (token && authClient) {
    const { data, error } = await authClient.auth.getUser(token);
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

type MemberIdentity = {
  email: string;
  phones: string[];
  plates: string[];
  stripeCustomerIds: string[];
};

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

function resolveStripeSecret() {
  const candidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_API_KEY,
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && value.startsWith("sk_")) {
      return value;
    }
  }
  return "";
}

type InvoiceSessionRow = {
  id?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_id?: string | null;
  email?: string | null;
  contact_email?: string | null;
  stripe_metadata?: unknown;
  created_at?: string | null;
  plate?: string | null;
  location_id?: string | null;
  price?: number | string | null;
  currency?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
};

function dedupeInvoiceRows(rows: InvoiceSessionRow[]) {
  return Array.from(
    new Map(
      rows
        .filter((row) => String(row.id ?? "").trim().length > 0)
        .map((row) => [String(row.id ?? "").trim(), row] as const)
    ).values()
  );
}

function belongsToMemberEmail(row: InvoiceSessionRow, email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;
  if (normalizeEmail(row.email) === normalizedEmail) return true;
  if (normalizeEmail(row.contact_email) === normalizedEmail) return true;
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
  return metadataEmail === normalizedEmail;
}

function belongsToIdentity(row: InvoiceSessionRow, identity: MemberIdentity) {
  if (identity.email && belongsToMemberEmail(row, identity.email)) return true;
  const metadata = parseStripeMetadata(row.stripe_metadata);
  const customerId = (
    metadata?.["stripe_customer_id"] ??
    metadata?.["stripeCustomerId"] ??
    metadata?.["customer_id"] ??
    ""
  )
    .toString()
    .trim();
  if (customerId && identity.stripeCustomerIds.includes(customerId)) return true;
  const phone = normalizePhone(
    (
      (row as { mobile?: unknown }).mobile ??
      metadata?.["mobile"] ??
      metadata?.["phone"] ??
      metadata?.["customer_phone"] ??
      ""
    ).toString()
  );
  if (phone && identity.phones.includes(phone)) return true;
  const plate = normalizePlate(
    (
      row.plate ??
      metadata?.["plate"] ??
      metadata?.["plate_number"] ??
      metadata?.["license_plate"] ??
      metadata?.["vehicle_plate"] ??
      ""
    ).toString()
  );
  if (plate && identity.plates.includes(plate)) return true;
  return false;
}

function parseFallbackAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

function readMetadataStringValue(metadata: Record<string, unknown> | null, keys: string[]) {
  if (!metadata) return "";
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function resolveInvoiceAmount(row: InvoiceSessionRow | null, metadata: Record<string, unknown> | null, fallbackAmount: number) {
  const directAmount = Number((row as { price?: unknown } | null)?.price ?? Number.NaN);
  if (Number.isFinite(directAmount) && directAmount > 0) {
    return directAmount;
  }
  for (const key of ["price", "amount", "total", "total_price"]) {
    const parsed = Number(metadata?.[key] ?? Number.NaN);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  for (const key of ["amount_total", "total_amount", "amount_cents", "price_cents"]) {
    const parsed = Number(metadata?.[key] ?? Number.NaN);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed / 100;
    }
  }
  return fallbackAmount;
}

export async function GET(req: NextRequest) {
  const identity = await resolveMemberIdentity(req);
  const email = identity.email || (await resolveMemberEmail(req));
  const resolvedIdentity: MemberIdentity = { ...identity, email };
  if (!resolvedIdentity.email && resolvedIdentity.phones.length === 0 && resolvedIdentity.plates.length === 0 && resolvedIdentity.stripeCustomerIds.length === 0) {
    return NextResponse.json({ ok: false, error: "unauthorized_member" }, { status: 401 });
  }
  const requestedStripeSessionId = (req.nextUrl.searchParams.get("stripe_session_id") ?? "").trim();
  const requestedSessionId = (req.nextUrl.searchParams.get("session_id") ?? "").trim();
  const fallbackLocationName = (req.nextUrl.searchParams.get("fallback_location_name") ?? "").trim();
  const fallbackLocationId = (req.nextUrl.searchParams.get("fallback_location_id") ?? "").trim();
  const fallbackCheckIn = (req.nextUrl.searchParams.get("fallback_check_in") ?? "").trim();
  const fallbackCheckOut = (req.nextUrl.searchParams.get("fallback_check_out") ?? "").trim();
  const fallbackPlate = (req.nextUrl.searchParams.get("fallback_plate") ?? "").trim();
  const fallbackStripeSessionId = (req.nextUrl.searchParams.get("fallback_stripe_session_id") ?? "").trim();
  const fallbackAmount = parseFallbackAmount((req.nextUrl.searchParams.get("fallback_amount") ?? "").trim());
  const fallbackCurrency = (req.nextUrl.searchParams.get("fallback_currency") ?? "EUR").trim().toUpperCase();
  const mode = (req.nextUrl.searchParams.get("mode") ?? "").trim().toLowerCase();
  const tokenScopedClient = resolveTokenScopedClient(req);
  const client = supabaseAdmin ?? tokenScopedClient ?? supabase;
  if (!client) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }
  const sessionFields = "stripe_session_id,stripe_payment_id,email,contact_email,stripe_metadata,created_at,id,plate,location_id,price,currency,entry_time,exit_time";
  const { data: rowsByEmail } = email
    ? await client
        .from("parking_sessions")
        .select(sessionFields)
        .ilike("email", email)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as InvoiceSessionRow[] };
  const { data: rowsByContactEmail } = email
    ? await client
        .from("parking_sessions")
        .select(sessionFields)
        .ilike("contact_email", email)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as InvoiceSessionRow[] };
  let mergedRows = dedupeInvoiceRows([...(rowsByEmail ?? []), ...(rowsByContactEmail ?? [])] as InvoiceSessionRow[]);
  let matchedRows = mergedRows.filter((row) => belongsToIdentity(row, resolvedIdentity));
  const permitSessionId = requestedSessionId.startsWith("permit-")
    ? requestedSessionId.slice("permit-".length).trim()
    : "";
  if (permitSessionId) {
    const { data: permitRow } = await client
      .from("parking_permits")
      .select(
        "id,contact_email,stripe_metadata,created_at,plate,location_id,price,currency,start_time,end_time,stripe_payment_id"
      )
      .eq("id", permitSessionId)
      .maybeSingle();
    if (permitRow) {
      const row = permitRow as Record<string, unknown>;
      const metadata = parseStripeMetadata(row.stripe_metadata);
      const normalizedPermitRow: InvoiceSessionRow = {
        id: `permit-${String(row.id ?? "").trim()}`,
        stripe_session_id: (
          metadata?.["stripe_session_id"] ??
          metadata?.["session_id"] ??
          metadata?.["checkout_session_id"] ??
          row.stripe_payment_id ??
          ""
        )
          .toString()
          .trim(),
        email: null,
        contact_email: String(row.contact_email ?? "").trim(),
        stripe_metadata: row.stripe_metadata,
        created_at: String(row.created_at ?? "").trim(),
        plate: String(row.plate ?? "").trim(),
        location_id: String(row.location_id ?? "").trim(),
        price: (row.price as number | string | null | undefined) ?? null,
        currency: String(row.currency ?? "").trim() || null,
        entry_time: String(row.start_time ?? "").trim() || null,
        exit_time: String(row.end_time ?? "").trim() || null,
      };
      if (belongsToIdentity(normalizedPermitRow, resolvedIdentity)) {
        mergedRows = dedupeInvoiceRows([...mergedRows, normalizedPermitRow]);
        matchedRows = mergedRows.filter((candidate) => belongsToIdentity(candidate, resolvedIdentity));
      }
    }
  }
  if (matchedRows.length === 0 || (requestedStripeSessionId && !matchedRows.some((row) => String(row.stripe_session_id ?? "").trim() === requestedStripeSessionId))) {
    const { data: fallbackRows } = await client
      .from("parking_sessions")
      .select(sessionFields)
      .order("created_at", { ascending: false })
      .limit(1500);
    const mergedWithFallback = dedupeInvoiceRows([...(mergedRows ?? []), ...((fallbackRows ?? []) as InvoiceSessionRow[])]);
    mergedRows = mergedWithFallback;
    matchedRows = mergedRows.filter((row) => belongsToIdentity(row, resolvedIdentity));
  }
  const latestSession = matchedRows
    .sort((a, b) => {
      const aTime = new Date((a.created_at ?? "").toString()).getTime();
      const bTime = new Date((b.created_at ?? "").toString()).getTime();
      return Number.isFinite(bTime) && Number.isFinite(aTime) ? bTime - aTime : 0;
    })[0];
  const selectedBySessionId = requestedSessionId
    ? matchedRows.find((row) => String(row.id ?? "").trim() === requestedSessionId) ?? null
    : null;
  let selectedSession = selectedBySessionId;
  if (!selectedSession && requestedStripeSessionId) {
    selectedSession =
      matchedRows.find(
        (row) => String(row.stripe_session_id ?? "").trim() === requestedStripeSessionId
      ) ?? null;
  }
  if (!selectedSession) {
    selectedSession = latestSession ?? null;
  }
  if (!selectedSession && requestedSessionId) {
    if (requestedSessionId.startsWith("permit-")) {
      const permitSessionId = requestedSessionId.slice("permit-".length).trim();
      if (permitSessionId) {
        const { data: permitRowById } = await client
          .from("parking_permits")
          .select(
            "id,contact_email,stripe_metadata,created_at,plate,location_id,price,currency,start_time,end_time,stripe_payment_id"
          )
          .eq("id", permitSessionId)
          .maybeSingle();
        if (permitRowById) {
          const row = permitRowById as Record<string, unknown>;
          const metadata = parseStripeMetadata(row.stripe_metadata);
          const normalizedPermitRow: InvoiceSessionRow = {
            id: `permit-${String(row.id ?? "").trim()}`,
            stripe_session_id: (
              metadata?.["stripe_session_id"] ??
              metadata?.["session_id"] ??
              metadata?.["checkout_session_id"] ??
              row.stripe_payment_id ??
              ""
            )
              .toString()
              .trim(),
            email: null,
            contact_email: String(row.contact_email ?? "").trim(),
            stripe_metadata: row.stripe_metadata,
            created_at: String(row.created_at ?? "").trim(),
            plate: String(row.plate ?? "").trim(),
            location_id: String(row.location_id ?? "").trim(),
            price: (row.price as number | string | null | undefined) ?? null,
            currency: String(row.currency ?? "").trim() || null,
            entry_time: String(row.start_time ?? "").trim() || null,
            exit_time: String(row.end_time ?? "").trim() || null,
          };
          selectedSession = normalizedPermitRow;
        }
      }
    } else {
      const { data: rowById } = await client
        .from("parking_sessions")
        .select(sessionFields)
        .eq("id", requestedSessionId)
        .maybeSingle();
      if (rowById) {
        const normalizedRow = rowById as InvoiceSessionRow;
        selectedSession = normalizedRow;
      }
    }
  }
  const stripeSessionId = ((selectedSession?.stripe_session_id ?? "") as string)
    .toString()
    .trim();
  const fallbackSessionId = String(selectedSession?.id ?? "").trim();
  if (mode === "document") {
    if (!selectedSession) {
      const fallbackIssued =
        fallbackCheckOut ||
        fallbackCheckIn ||
        new Date().toISOString();
      const fallbackLocation = fallbackLocationName || fallbackLocationId || "-";
      const fallbackSession = requestedSessionId || "-";
      const fallbackStripeSession = requestedStripeSessionId || fallbackStripeSessionId || "-";
      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Payparq Receipt</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 8px}p{margin:4px 0}table{margin-top:16px;border-collapse:collapse;width:100%}td{border:1px solid #ddd;padding:8px;font-size:13px}</style></head><body><h1>Payparq Receipt</h1><p>Customer: ${email}</p><p>Stripe Session: ${fallbackStripeSession}</p><p>Session ID: ${fallbackSession}</p><p>Issued: ${fallbackIssued}</p><table><tr><td>Plate</td><td>${fallbackPlate || "-"}</td></tr><tr><td>Location</td><td>${fallbackLocation}</td></tr><tr><td>Amount</td><td>${fallbackAmount.toFixed(2)} ${fallbackCurrency || "EUR"}</td></tr></table></body></html>`;
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
    const metadata = parseStripeMetadata(selectedSession?.stripe_metadata);
    const resolvedStripeSession = stripeSessionId ||
      readMetadataStringValue(metadata, ["stripe_session_id", "session_id", "checkout_session_id"]) ||
      String((selectedSession as { stripe_payment_id?: unknown } | null)?.stripe_payment_id ?? "").trim() ||
      fallbackStripeSessionId ||
      requestedStripeSessionId ||
      "-";
    const plate = String((selectedSession as { plate?: unknown } | null)?.plate ?? "").trim() ||
      readMetadataStringValue(metadata, [
        "plate",
        "plate_number",
        "plateNumber",
        "license_plate",
        "vehicle_plate",
        "registration_number",
      ]) ||
      fallbackPlate ||
      "-";
    const location = String((selectedSession as { location_id?: unknown } | null)?.location_id ?? metadata?.["location_id"] ?? fallbackLocationName ?? fallbackLocationId ?? "-").trim() || "-";
    const amount = resolveInvoiceAmount(selectedSession, metadata, fallbackAmount);
    const currency = String((selectedSession as { currency?: unknown } | null)?.currency ?? metadata?.["currency"] ?? fallbackCurrency ?? "EUR").toUpperCase();
    const createdAt = String((selectedSession as { created_at?: unknown } | null)?.created_at ?? "").trim();
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Payparq Receipt</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 8px}p{margin:4px 0}table{margin-top:16px;border-collapse:collapse;width:100%}td{border:1px solid #ddd;padding:8px;font-size:13px}</style></head><body><h1>Payparq Receipt</h1><p>Customer: ${email}</p><p>Stripe Session: ${resolvedStripeSession}</p><p>Session ID: ${fallbackSessionId || requestedSessionId || "-"}</p><p>Issued: ${createdAt || fallbackCheckOut || fallbackCheckIn || new Date().toISOString()}</p><table><tr><td>Plate</td><td>${plate}</td></tr><tr><td>Location</td><td>${location}</td></tr><tr><td>Amount</td><td>${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"} ${currency}</td></tr></table></body></html>`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  if (!stripeSessionId) {
    const fallbackQuery = new URLSearchParams();
    if (fallbackLocationName) fallbackQuery.set("fallback_location_name", fallbackLocationName);
    if (fallbackLocationId) fallbackQuery.set("fallback_location_id", fallbackLocationId);
    if (fallbackCheckIn) fallbackQuery.set("fallback_check_in", fallbackCheckIn);
    if (fallbackCheckOut) fallbackQuery.set("fallback_check_out", fallbackCheckOut);
    if (fallbackPlate) fallbackQuery.set("fallback_plate", fallbackPlate);
    if (fallbackStripeSessionId) fallbackQuery.set("fallback_stripe_session_id", fallbackStripeSessionId);
    if (fallbackAmount > 0) fallbackQuery.set("fallback_amount", fallbackAmount.toFixed(2));
    if (fallbackCurrency) fallbackQuery.set("fallback_currency", fallbackCurrency);
    return NextResponse.json({
      ok: true,
      message: "Receipt document is ready.",
      actionUrl: `/api/members/invoice?mode=document${fallbackSessionId ? `&session_id=${encodeURIComponent(fallbackSessionId)}` : requestedSessionId ? `&session_id=${encodeURIComponent(requestedSessionId)}` : ""}${fallbackQuery.toString() ? `&${fallbackQuery.toString()}` : ""}`,
    });
  }
  const stripeSecret = resolveStripeSecret();
  if (!stripeSecret) {
    const fallbackQuery = new URLSearchParams();
    if (fallbackLocationName) fallbackQuery.set("fallback_location_name", fallbackLocationName);
    if (fallbackLocationId) fallbackQuery.set("fallback_location_id", fallbackLocationId);
    if (fallbackCheckIn) fallbackQuery.set("fallback_check_in", fallbackCheckIn);
    if (fallbackCheckOut) fallbackQuery.set("fallback_check_out", fallbackCheckOut);
    if (fallbackPlate) fallbackQuery.set("fallback_plate", fallbackPlate);
    if (fallbackStripeSessionId) fallbackQuery.set("fallback_stripe_session_id", fallbackStripeSessionId);
    if (fallbackAmount > 0) fallbackQuery.set("fallback_amount", fallbackAmount.toFixed(2));
    if (fallbackCurrency) fallbackQuery.set("fallback_currency", fallbackCurrency);
    return NextResponse.json({
      ok: true,
      message: "Receipt document is ready.",
      actionUrl: `/api/members/invoice?mode=document&stripe_session_id=${encodeURIComponent(stripeSessionId)}${fallbackSessionId ? `&session_id=${encodeURIComponent(fallbackSessionId)}` : requestedSessionId ? `&session_id=${encodeURIComponent(requestedSessionId)}` : ""}${fallbackQuery.toString() ? `&${fallbackQuery.toString()}` : ""}`,
    });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
  let actionUrl = "";
  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id;
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const latestCharge = paymentIntent.latest_charge as Stripe.Charge | null;
      const invoiceId =
        typeof latestCharge?.invoice === "string"
          ? latestCharge.invoice
          : latestCharge?.invoice?.id;
      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        actionUrl = invoice.invoice_pdf ?? "";
      }
      if (!actionUrl) {
        actionUrl = latestCharge?.receipt_url ?? "";
      }
    }
  } catch {
    actionUrl = "";
  }
  if (!actionUrl) {
    const fallbackQuery = new URLSearchParams();
    if (fallbackLocationName) fallbackQuery.set("fallback_location_name", fallbackLocationName);
    if (fallbackLocationId) fallbackQuery.set("fallback_location_id", fallbackLocationId);
    if (fallbackCheckIn) fallbackQuery.set("fallback_check_in", fallbackCheckIn);
    if (fallbackCheckOut) fallbackQuery.set("fallback_check_out", fallbackCheckOut);
    if (fallbackPlate) fallbackQuery.set("fallback_plate", fallbackPlate);
    if (fallbackStripeSessionId) fallbackQuery.set("fallback_stripe_session_id", fallbackStripeSessionId);
    if (fallbackAmount > 0) fallbackQuery.set("fallback_amount", fallbackAmount.toFixed(2));
    if (fallbackCurrency) fallbackQuery.set("fallback_currency", fallbackCurrency);
    actionUrl = `/api/members/invoice?mode=document&stripe_session_id=${encodeURIComponent(stripeSessionId)}${fallbackSessionId ? `&session_id=${encodeURIComponent(fallbackSessionId)}` : requestedSessionId ? `&session_id=${encodeURIComponent(requestedSessionId)}` : ""}${fallbackQuery.toString() ? `&${fallbackQuery.toString()}` : ""}`;
  }
  return NextResponse.json({
    ok: true,
    message: "Račun spreman za preuzimanje.",
    actionUrl,
  });
}
