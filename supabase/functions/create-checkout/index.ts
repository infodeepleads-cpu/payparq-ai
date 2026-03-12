// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ?? "";
const successUrl = Deno.env.get("STRIPE_SUCCESS_URL") ??
  "https://mobile-scanner-flax-static.vercel.app/#/dashboard";
const cancelUrl = Deno.env.get("STRIPE_CANCEL_URL") ??
  "https://mobile-scanner-flax-static.vercel.app/#/dashboard";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeType(v: string | null): "hourly" | "daily" | "monthly" {
  const t = (v ?? "").trim().toLowerCase();
  if (t === "daily" || t === "monthly") return t;
  return "hourly";
}

function checkoutCustomFields(): any[] {
  return [
    {
      key: "plate_number",
      type: "text",
      label: { type: "custom", custom: "Vehicle Plate Number (e.g. MA679XX)" },
      optional: false,
    },
  ];
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function parseCents(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function parseEuroToCents(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

async function resolveLocation(input: string): Promise<{ id: string; display_id?: string } | null> {
  const candidate = String(input ?? "").trim();
  if (!candidate) return null;
  if (isUuid(candidate)) {
    const { data } = await admin
      .from("locations")
      .select("id, display_id")
      .eq("id", candidate)
      .maybeSingle();
    if (data?.id) return data as { id: string; display_id?: string };
  }
  if (/^\d{5}$/.test(candidate)) {
    const { data } = await admin
      .from("locations")
      .select("id, display_id")
      .eq("display_id", candidate)
      .maybeSingle();
    if (data?.id) return data as { id: string; display_id?: string };
  }
  const { data: bySlug } = await admin
    .from("locations")
    .select("id, display_id")
    .eq("canonical_slug", candidate)
    .maybeSingle();
  if (bySlug?.id) return bySlug as { id: string; display_id?: string };

  const { data: byName } = await admin
    .from("locations")
    .select("id, display_id")
    .eq("name", candidate)
    .maybeSingle();
  if (byName?.id) return byName as { id: string; display_id?: string };

  const { data: byNameInsensitive } = await admin
    .from("locations")
    .select("id, display_id")
    .ilike("name", candidate)
    .maybeSingle();
  if (byNameInsensitive?.id) return byNameInsensitive as { id: string; display_id?: string };

  const { data: byAny } = await admin
    .from("locations")
    .select("id, display_id")
    .or(`display_id.eq.${candidate},canonical_slug.eq.${candidate},name.ilike.%${candidate}%`)
    .limit(1)
    .maybeSingle();
  if (byAny?.id) return byAny as { id: string; display_id?: string };

  return null;
}

function extractMissingColumnName(message: string): string | null {
  const quoted = message.match(/column "([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const singleQuoted = message.match(/column '([^']+)'/i);
  if (singleQuoted?.[1]) return singleQuoted[1];
  const postgrestPattern = message.match(/the '([^']+)' column/i);
  if (postgrestPattern?.[1]) return postgrestPattern[1];
  const plain = message.match(/column ([a-zA-Z0-9_.]+) does not exist/i);
  const found = plain?.[1] ?? null;
  if (found && found.includes(".")) {
    return found.split(".").pop() ?? found;
  }
  return found;
}

function extractNotNullColumnName(message: string): string | null {
  const quoted = message.match(/null value in column "([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const singleQuoted = message.match(/null value in column '([^']+)'/i);
  return singleQuoted?.[1] ?? null;
}

function defaultValueForSessionColumn(column: string): unknown {
  if (column === "entry_time" || column === "created_at" || column === "updated_at") return new Date().toISOString();
  if (column === "plate") return "PENDING";
  if (column === "email" || column === "mobile" || column === "contact_name" || column === "name") return "";
  if (column === "type") return "hourly";
  if (column === "currency") return "eur";
  if (column === "payment_source") return "regular";
  if (column === "ui_type") return "guest";
  if (column === "is_lpr_scan" || column === "is_whatsapp_linked") return false;
  if (column === "status" || column === "payment_status") return "pending";
  if (column === "price" || column === "amount_cents" || column === "duration_minutes" || column === "quantity") return 0;
  if (column.endsWith("_at") || column.endsWith("_time")) return new Date().toISOString();
  if (column.startsWith("is_")) return false;
  return undefined;
}

async function insertSessionWithSchemaFallback(
  insertData: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string }> {
  let payload: Record<string, unknown> = { ...insertData };
  console.log(`[V18.1] Initial insert attempt with payload: ${JSON.stringify(payload)}`);
  for (let i = 0; i < 20; i++) {
    const { error } = await admin
      .from("parking_sessions")
      .insert(payload);
    if (!error || error.code === "23505") {
      if (error?.code === "23505") console.log(`[V18.1] Duplicate session (23505), treating as success`);
      return { ok: true };
    }
    console.warn(`[V18.1] Insert error (attempt ${i+1}): code=${error.code}, message=${error.message}`);
    const notNullColumn = extractNotNullColumnName(error.message ?? "");
    if (notNullColumn) {
      const fallbackValue = defaultValueForSessionColumn(notNullColumn);
      if (fallbackValue !== undefined) {
        payload = { ...payload, [notNullColumn]: fallbackValue };
        continue;
      }
    }
    // Handle invalid UUID error (22P02)
    if (error.code === "22P02" && error.message?.includes("location_id")) {
      console.warn("[V15] Invalid UUID for location_id, skipping this field");
      const { location_id: _removed, ...rest } = payload;
      payload = rest;
      continue;
    }
    const missingColumn = extractMissingColumnName(error.message ?? "");
    if (!missingColumn || !(missingColumn in payload)) {
      return { ok: false, message: error.message };
    }
    const { [missingColumn]: _removed, ...rest } = payload;
    payload = rest;
  }
  return { ok: false, message: "Failed to insert parking session after schema fallbacks" };
}

async function updateSessionWithSchemaFallback(
  stripeSessionId: string,
  updateData: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string }> {
  let payload: Record<string, unknown> = { ...updateData };
  for (let i = 0; i < 20; i++) {
    const { error } = await admin
      .from("parking_sessions")
      .update(payload)
      .eq("stripe_session_id", stripeSessionId);
    if (!error) {
      return { ok: true };
    }
    const missingColumn = extractMissingColumnName(error.message ?? "");
    if (!missingColumn || !(missingColumn in payload)) {
      return { ok: false, message: error.message };
    }
    const { [missingColumn]: _removed, ...rest } = payload;
    payload = rest;
  }
  return { ok: false, message: "Failed to update parking session after schema fallbacks" };
}

async function persistCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<{ ok: boolean; status?: number; message?: string }> {
  const metadata = session.metadata || {};
  const candidates = [
    metadata.location_id,
    metadata.display_id,
    session.client_reference_id,
  ]
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0);

  let resolvedLocation: { id: string; display_id?: string } | null = null;
  for (const candidate of candidates) {
    resolvedLocation = await resolveLocation(candidate);
    if (resolvedLocation?.id) break;
  }
  if (!resolvedLocation?.id) {
    return { ok: false, status: 400, message: "Unable to resolve location_id" };
  }

  const { data: existing, error: existingError } = await admin
    .from("parking_sessions")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existingError) {
    console.error(`[V17] Error checking for existing session ${session.id}: ${existingError.message}`);
  }

  const email = session.customer_details?.email || metadata.email || "";
  const phone = session.customer_details?.phone || metadata.mobile || "";
  const name = session.customer_details?.name || "";
  const type = (metadata.type || "hourly").toString();
  let checkoutQuantity = Number.parseInt((metadata.quantity ?? "1").toString(), 10);
  if (!Number.isFinite(checkoutQuantity) || checkoutQuantity < 1) {
    checkoutQuantity = 1;
  }
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
    });
    const lineItemQuantity = lineItems.data.reduce((sum, item) => {
      const qty = Number(item?.quantity ?? 0);
      return Number.isFinite(qty) && qty > 0 ? sum + qty : sum;
    }, 0);
    if (lineItemQuantity > 0) {
      checkoutQuantity = lineItemQuantity;
    }
  } catch (lineItemError) {
    console.warn(`[V19] Could not read line-item quantity for ${session.id}:`, lineItemError);
  }
  if (checkoutQuantity <= 1) {
    const subtotalCents = Number(session.amount_subtotal ?? 0);
    const unitCents = Number(metadata.amount_cents ?? 0);
    if (
      Number.isFinite(subtotalCents) &&
      Number.isFinite(unitCents) &&
      subtotalCents > 0 &&
      unitCents > 0
    ) {
      const derivedQuantity = Math.round(subtotalCents / unitCents);
      if (Number.isFinite(derivedQuantity) && derivedQuantity > 0) {
        checkoutQuantity = derivedQuantity;
      }
    }
  }
  const durationUnit =
    type === "monthly" ? "month" : type === "daily" ? "day" : "hour";
  const entryTime = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000);
  const durationMinutes =
    durationUnit === "month"
      ? checkoutQuantity * 30 * 24 * 60
      : durationUnit === "day"
      ? checkoutQuantity * 24 * 60
      : checkoutQuantity * 60;
  const exitTime = new Date(entryTime.getTime() + durationMinutes * 60 * 1000);
  let couponCode = "";
  let discountAmount = 0;
  if (session.total_details?.breakdown?.discounts) {
    const discount = session.total_details.breakdown.discounts[0];
    if (discount && discount.discount) {
      const d = discount.discount as any;
      if (d.coupon) {
        couponCode = d.coupon.name || d.coupon.id;
        discountAmount = (discount.amount / 100);
      } else if (d.promotion_code) {
        couponCode = d.promotion_code.code;
        discountAmount = (discount.amount / 100);
      }
    }
  }

  let plateNumber = "";
  if (session.custom_fields) {
    const plateField = session.custom_fields.find((f) => f.key === "plate_number");
    if (plateField && plateField.text) {
      plateNumber = plateField.text.value || "";
    }
  }
  if (!plateNumber && metadata.plate) {
    plateNumber = metadata.plate;
  }

  const insertData: any = {
    location_id: resolvedLocation.id,
    plate: plateNumber || "PENDING",
    email: email,
    mobile: phone,
    contact_name: name, // V14: Save Stripe customer name
    type: type,
    status: "active",
    payment_status: "paid",
    price: Number(session.amount_total ?? 0) / 100,
    amount_cents: Number(session.amount_total ?? 0),
    stripe_session_id: session.id,
    created_at: entryTime.toISOString(),
    entry_time: entryTime.toISOString(),
    exit_time: exitTime.toISOString(),
    end_time: exitTime.toISOString(),
    quantity: checkoutQuantity,
    duration_minutes: durationMinutes,
    coupon_code: couponCode || null,
    discount_amount: discountAmount || 0,
    stripe_metadata: JSON.stringify({
      ...metadata,
      quantity: String(checkoutQuantity),
      duration_unit: durationUnit,
      stripe_id: session.id,
      customer: session.customer,
      payment_intent: session.payment_intent,
    }), // V17: Save full context
  };

  if (existing?.id) {
    console.log(`[V17] Updating existing session ${existing.id} for stripe_id ${session.id}`);
    const updated = await updateSessionWithSchemaFallback(session.id, insertData);
    if (updated.ok) return { ok: true };
    return { ok: false, status: 500, message: updated.message };
  }

  console.log(`[V17] Inserting new session for stripe_id ${session.id}`);
  const inserted = await insertSessionWithSchemaFallback(insertData);
  if (inserted.ok) return { ok: true };
  return { ok: false, status: 500, message: inserted.message };
}

async function locationPriceCents(
  locationId: string,
  type: "hourly" | "daily" | "monthly",
): Promise<number> {
  const idColumn = isUuid(locationId) ? "id" : "display_id";
  const { data, error } = await admin
    .from("locations")
    .select("rate_per_hour,base_price_hourly,base_price_daily,base_price_monthly")
    .eq(idColumn, locationId)
    .maybeSingle();
  if (error || !data) return 500;
  let euro = 5;
  if (type === "hourly") {
    euro = Number(data["rate_per_hour"] ?? data["base_price_hourly"] ?? 5);
  } else if (type === "daily") {
    euro = Number(data["base_price_daily"] ?? 20);
  } else {
    euro = Number(data["base_price_monthly"] ?? 150);
  }
  if (!Number.isFinite(euro) || euro < 0) euro = 0;
  return Math.round(euro * 100);
}

async function cleanupExpiredCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const { error: deletePendingSessionError } = await admin
    .from("parking_sessions")
    .delete()
    .eq("stripe_session_id", session.id)
    .eq("payment_status", "pending");
  if (deletePendingSessionError) {
    console.error(
      `[V21] Failed to delete pending parking session for ${session.id}: ${deletePendingSessionError.message}`,
    );
  } else {
    console.log(`[V21] Deleted pending parking session for ${session.id}`);
  }
}

async function cleanupStalePendingGuestSessions(): Promise<void> {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  // We use permit_id is null to identify guest sessions, as permits should not be auto-deleted so quickly
  const { error } = await admin
    .from("parking_sessions")
    .delete()
    .eq("payment_status", "pending")
    .is("permit_id", null)
    .lt("created_at", cutoff);
  if (error) {
    console.error(`[V23] Failed to cleanup stale pending guest sessions: ${error.message}`);
  } else {
    console.log(`[V23] Cleaned stale pending guest sessions older than ${cutoff}`);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const signature = req.headers.get("stripe-signature");

  if (signature) {
    if (!stripeWebhookSecret) {
      return json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, 500);
    }
    try {
      const bodyText = await req.text();
      const event = await stripe.webhooks.constructEventAsync(
        bodyText,
        signature,
        stripeWebhookSecret,
      );

      console.log(`[V7] Received webhook event: ${event.type}`);

      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        const session = event.data.object as Stripe.Checkout.Session;
        const persisted = await persistCheckoutSession(session);
        if (!persisted.ok) {
          return json({ error: persisted.message ?? "Failed to persist parking session" }, persisted.status ?? 500);
        }
      } else if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;
        await cleanupExpiredCheckoutSession(session);
      }

      return json({ received: true });
    } catch (err: any) {
      console.error(`[V7] Webhook Error: ${err?.message ?? String(err)}`);
      return json({ error: `Webhook Error: ${err?.message ?? String(err)}` }, 400);
    }
  }

  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[CRITICAL] Missing configuration environment variables");
      return json({ error: "Missing server configuration" }, 500);
    }

    const url = new URL(req.url);
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch (_) {
        body = {};
      }
    }

    const locationId = String(
      body["location_id"] ?? url.searchParams.get("location_id") ?? "",
    ).trim();
    const urlDisplayId = String(
      body["display_id"] ?? url.searchParams.get("display_id") ?? "",
    ).trim();
    if (!locationId) return json({ error: "location_id is required" }, 400);

    // V10: Super robust location resolution
    let locData = null;
    
    // 1. Try UUID
    if (isUuid(locationId)) {
      const { data } = await admin
        .from("locations")
        .select("id, display_id, name")
        .eq("id", locationId)
        .maybeSingle();
      locData = data;
    }
    
    // 2. Try Display ID (5 digits) from locationId parameter
    if (!locData && /^\d{5}$/.test(locationId)) {
      const { data } = await admin
        .from("locations")
        .select("id, display_id, name")
        .eq("display_id", locationId)
        .maybeSingle();
      locData = data;
    }

    // 2.5 Try Display ID from explicit parameter
    if (!locData && /^\d{5}$/.test(urlDisplayId)) {
      const { data } = await admin
        .from("locations")
        .select("id, display_id, name")
        .eq("display_id", urlDisplayId)
        .maybeSingle();
      locData = data;
    }
    
    // 3. Try Canonical Slug
    if (!locData) {
      const { data } = await admin
        .from("locations")
        .select("id, display_id, name")
        .eq("canonical_slug", locationId)
        .maybeSingle();
      locData = data;
    }
    
    // 4. Try exact Name
    if (!locData) {
      const { data } = await admin
        .from("locations")
        .select("id, display_id, name")
        .eq("name", locationId)
        .maybeSingle();
      locData = data;
    }
    
    // 5. Try case-insensitive Name
    if (!locData) {
      const { data } = await admin
        .from("locations")
        .select("id, display_id, name")
        .ilike("name", locationId)
        .maybeSingle();
      locData = data;
    }
    
    // 6. Try partial Name match
    if (!locData) {
      const { data } = await admin
        .from("locations")
        .select("id, display_id, name")
        .ilike("name", `%${locationId}%`)
        .maybeSingle();
      locData = data;
    }

    const displayId = locData?.display_id || (urlDisplayId && /^\d{5}$/.test(urlDisplayId) ? urlDisplayId : locationId);
    let locationUuid = locData?.id;

    // V15: If we couldn't resolve locData, but locationId is a UUID, use it as fallback
    if (!locationUuid && isUuid(locationId)) {
      locationUuid = locationId;
    }

    // V13: Robust display ID logging for debugging
    console.log(`[V13] Resolution: input=${locationId}, urlDisplayId=${urlDisplayId}, resolvedUuid=${locationUuid}, resolvedDisplayId=${displayId}`);

    if (!locationUuid) {
      console.error(`[V15] CRITICAL: Could not resolve a valid UUID for locationId: ${locationId}`);
      // If we can't find a UUID, we can't insert into parking_sessions.
      // We'll proceed with the Stripe checkout but skip the seeding.
    }

    const type = normalizeType(
      String(body["type"] ?? url.searchParams.get("type") ?? "hourly"),
    );
    const email = String(
      body["email"] ?? url.searchParams.get("email") ?? "",
    ).trim();

    const explicitCents = parseCents(body["amount_cents"]) ??
      parseCents(url.searchParams.get("amount_cents")) ??
      parseEuroToCents(body["amount"]) ??
      parseEuroToCents(url.searchParams.get("amount")) ??
      parseEuroToCents(body["price"]) ??
      parseEuroToCents(url.searchParams.get("price"));

    // V6: Dynamic promotion code support and mobile phone field
    const allowPromotionCodes = (
      body["allow_promotion_codes"] === "1" ||
      body["allow_promotion_codes"] === true ||
      url.searchParams.get("allow_promotion_codes") === "1"
    );

    const promotionCodeLabel = String(
      body["promotion_code_label"] ?? url.searchParams.get("promotion_code_label") ?? "",
    ).trim();

    const plate = String(
      body["plate"] ?? url.searchParams.get("plate") ?? "",
    ).trim();

    const mobile = String(
      body["mobile"] ?? url.searchParams.get("mobile") ?? "",
    ).trim();

    const permitId = String(
      body["permit_id"] ?? url.searchParams.get("permit_id") ?? "",
    ).trim();
    const flow = String(
      body["flow"] ?? url.searchParams.get("flow") ?? "payment",
    ).trim().toLowerCase();
    const checkIn = String(
      body["check_in"] ?? url.searchParams.get("check_in") ?? "",
    ).trim();
    const checkOut = String(
      body["check_out"] ?? url.searchParams.get("check_out") ?? "",
    ).trim();

    console.log(`[V17] Params: locationId=${locationId}, type=${type}, plate=${plate}, mobile=${mobile}, email=${email}, permitId=${permitId}`);

    // V13: Exact description format requested by user
    const now = new Date();
    let purchaseTimeDisplay = "";
    try {
      const formatter = new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      // Keep the comma for "07.03.2026, 12:09:28" format
      purchaseTimeDisplay = formatter.format(now);
    } catch (e) {
      purchaseTimeDisplay = now.toISOString().replace("T", " ").split(".")[0];
    }

    let quantity = 1;
    const hasReservationWindow = checkIn.length > 0 && checkOut.length > 0;
    if (hasReservationWindow) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diff = end.getTime() - start.getTime();
      if (Number.isFinite(diff) && diff > 0) {
        quantity = Math.ceil(diff / (1000 * 60 * 60));
      }
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      quantity = 1;
    }

    const formatIso = (iso: string): string => {
      if (!iso) return "";
      try {
        const [datePart, timePart] = iso.split("T");
        const [y, m, d] = datePart.split("-");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = Number.parseInt(m, 10);
        if (month > 0 && month <= monthNames.length) {
          return `${d} ${monthNames[month - 1]} ${y}, ${timePart}`;
        }
        return iso;
      } catch {
        return iso;
      }
    };

    let reservationDescription = "";
    if (hasReservationWindow) {
      reservationDescription = `From: ${formatIso(checkIn)} To: ${formatIso(checkOut)}`;
      if (displayId) {
        reservationDescription += `\nLocation ID: ${displayId}`;
      }
    }

    let amountCents = explicitCents;
    if (amountCents == null) {
      // Use the fetched locData for price if available
      amountCents = await locationPriceCents(locationUuid, type);
    }
    if (amountCents < 50) amountCents = 50;

    console.log(`[V13] Finalizing Checkout: ID=${displayId}, Name=${locData?.name || "Unknown"}, Time=${purchaseTimeDisplay}`);

    await cleanupStalePendingGuestSessions();

    const sessionOptions: any = {
      mode: "payment",
      payment_method_types: ["card"],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: locationUuid, // Use UUID if possible
      customer_email: email || undefined,
      phone_number_collection: {
        enabled: true,
      },
      consent_collection: {
        terms_of_service: "required",
      },
      custom_text: {
        terms_of_service_acceptance: {
          message: "By paying, you agree to our [Terms of Service](https://payparq.ai/terms) and [Privacy Policy](https://payparq.ai/privacy).",
        },
      },
      custom_fields: checkoutCustomFields(),
      line_items: [{
        quantity,
        adjustable_quantity: hasReservationWindow
          ? {
            enabled: false,
          }
          : {
            enabled: true,
            minimum: 1,
            maximum: 99,
          },
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: hasReservationWindow
              ? quantity > 1
                ? `Parking Session (${quantity} Hours)`
                : "Parking Session (1 Hour)"
              : `Location ID: ${displayId} - Parking ${type.toUpperCase()}`,
            description: hasReservationWindow
              ? reservationDescription
              : `Parking access at ID${displayId} ${purchaseTimeDisplay} (Europe/Berlin)`,
          },
        },
      }],
      metadata: {
        location_id: locationUuid, // Use UUID
        display_id: displayId,
        type,
        flow: flow || "payment",
        quantity: String(quantity),
        amount_cents: String(amountCents),
        purchase_time_berlin: purchaseTimeDisplay,
        plate: plate,
        mobile: mobile,
        email: email,
        permit_id: permitId || undefined,
        check_in: checkIn || undefined,
        check_out: checkOut || undefined,
      },
    };

    // V6.4: Dynamic Promo Code Management (Manual Entry)
    // We ensure the code typed in the app exists in Stripe, but we do NOT auto-apply it.
    // The user must manually type it on the checkout page.
    if (promotionCodeLabel) {
      try {
        const upperLabel = promotionCodeLabel.toUpperCase().trim();
        console.log(`[V6.4] Ensuring manual promo code exists: ${upperLabel}`);
        
        // 1. Check if this specific code already exists as a Promotion Code
        const existingPromoCodes = await stripe.promotionCodes.list({
          active: true,
          limit: 100,
        });
        
        let matchedPromo = existingPromoCodes.data.find(
          (pc: any) => pc.code.toUpperCase().trim() === upperLabel
        );

        if (!matchedPromo) {
          console.log(`[V6.4] Code ${upperLabel} not found. Creating...`);
          
          // 2. Ensure a 100% coupon exists
          let couponId = "FREE100_COUPON";
          try {
            await stripe.coupons.retrieve(couponId);
          } catch (e) {
            const newCoupon = await stripe.coupons.create({
              id: couponId,
              percent_off: 100,
              duration: "forever",
              name: "100% Discount",
            });
            couponId = newCoupon.id;
          }

          // 3. Create the new Promotion Code
          await stripe.promotionCodes.create({
            coupon: couponId,
            code: upperLabel,
          });
          console.log(`[V6.4] Created promotion code ${upperLabel}. User can now type it.`);

          // 4. Deactivate the "former" codes if they are different from the new one
          // This ensures only the current app-defined code works.
          for (const pc of existingPromoCodes.data) {
            if (pc.code.toUpperCase().trim() !== upperLabel) {
              try {
                await stripe.promotionCodes.update(pc.id, { active: false });
                console.log(`[V6.4] Deactivated former code: ${pc.code}`);
              } catch (e) {
                console.warn(`[V6.4] Failed to deactivate former code ${pc.code}:`, e);
              }
            }
          }
        }
      } catch (e) {
        console.error(`[V6.4] Error in manual promo management:`, e);
      }
    }

    // V6.4: ALWAYS enable the manual entry field if the toggle is on in the app.
    // We do NOT use 'discounts' because we want the user to type it themselves.
    sessionOptions.allow_promotion_codes = allowPromotionCodes;

    const expiresAtBufferSeconds = 10 * 60; // Increased to 10 mins for safer buffer
    const minimumCheckoutLifetimeSeconds = (30 * 60) + expiresAtBufferSeconds;
    const checkoutLifetimeSeconds = permitId ? 60 * 60 : minimumCheckoutLifetimeSeconds;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + checkoutLifetimeSeconds;
    sessionOptions.expires_at = expiryTimestamp;

    console.log(`[V13] Stripe Session Expiry: ${new Date(expiryTimestamp * 1000).toISOString()} (${checkoutLifetimeSeconds}s from now)`);

    const paymentSession = await stripe.checkout.sessions.create(sessionOptions);
    if (!paymentSession.url) {
      return json({ error: "Failed to create checkout session" }, 500);
    }

    let pendingSeeded = false;
    let pendingSeedError = "";
    // V20: Seeding pending session into database so it appears in the dashboard immediately
    if (locationUuid) {
      const pendingInsertData: any = {
        location_id: locationUuid,
        plate: plate || "PENDING",
        email: email,
        mobile: mobile,
        contact_name: "",
        type: type,
        status: "pending",
        payment_status: "pending",
        ui_type: "guest", // Added for dashboard filtering
        price: amountCents / 100,
        amount_cents: amountCents,
        quantity,
        currency: "eur",
        payment_source: "regular",
        is_lpr_scan: false,
        is_whatsapp_linked: false,
        stripe_session_id: paymentSession.id,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        entry_time: now.toISOString(),
        // For pending, we don't know the final duration yet if it's adjustable, but we set a default
        duration_minutes: type === "monthly" ? (quantity * 43200) : type === "daily" ? (quantity * 1440) : (quantity * 60),
        stripe_metadata: JSON.stringify({
          ...sessionOptions.metadata,
          stripe_id: paymentSession.id,
        }),
      };
      
      const exitTime = new Date(now.getTime() + pendingInsertData.duration_minutes * 60 * 1000);
      pendingInsertData.exit_time = exitTime.toISOString();
      pendingInsertData.end_time = exitTime.toISOString();

      console.log(`[V20] Seeding pending session for stripe_id ${paymentSession.id}`);
      const pendingInserted = await insertSessionWithSchemaFallback(pendingInsertData);
      if (!pendingInserted.ok) {
        pendingSeedError = pendingInserted.message ?? "unknown";
        console.error(`[V20] Failed to seed pending session: ${pendingInserted.message}`);
      } else {
        pendingSeeded = true;
      }
    } else {
      pendingSeedError = "location_uuid_not_resolved";
    }

    if (req.method === "GET") {
      return new Response(null, {
        status: 303,
        headers: { ...corsHeaders, Location: paymentSession.url },
      });
    }
    return json({
      url: paymentSession.url,
      id: paymentSession.id,
      mode: "payment",
      amount_cents: amountCents,
      pending_seeded: pendingSeeded,
      pending_seed_error: pendingSeedError,
    });
  } catch (error) {
    console.error("[ERROR] Uncaught exception:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
