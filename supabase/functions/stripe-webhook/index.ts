// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ?? "";
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

async function resolveLocation(input: string): Promise<{ id: string; display_id?: string } | null> {
  const candidate = String(input ?? "").trim();
  if (!candidate) return null;
  if (isUuid(candidate)) {
    const { data } = await admin.from("locations").select("id, display_id").eq("id", candidate).maybeSingle();
    if (data?.id) return data as { id: string; display_id?: string };
  }
  if (/^\d{5}$/.test(candidate)) {
    const { data } = await admin.from("locations").select("id, display_id").eq("display_id", candidate).maybeSingle();
    if (data?.id) return data as { id: string; display_id?: string };
  }
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

async function insertSessionWithSchemaFallback(insertData: Record<string, unknown>): Promise<{ ok: boolean; message?: string }> {
  let payload: Record<string, unknown> = { ...insertData };
  for (let i = 0; i < 20; i++) {
    const { error } = await admin.from("parking_sessions").insert(payload);
    if (!error || error.code === "23505") return { ok: true };
    const notNullColumn = extractNotNullColumnName(error.message ?? "");
    if (notNullColumn) {
      const fallbackValue = defaultValueForSessionColumn(notNullColumn);
      if (fallbackValue !== undefined) {
        payload = { ...payload, [notNullColumn]: fallbackValue };
        continue;
      }
    }
    const missingColumn = extractMissingColumnName(error.message ?? "");
    if (!missingColumn || !(missingColumn in payload)) return { ok: false, message: error.message };
    const { [missingColumn]: _removed, ...rest } = payload;
    payload = rest;
  }
  return { ok: false, message: "Failed insert after fallbacks" };
}

async function updateSessionWithSchemaFallback(stripeSessionId: string, updateData: Record<string, unknown>): Promise<{ ok: boolean; message?: string }> {
  let payload: Record<string, unknown> = { ...updateData };
  for (let i = 0; i < 20; i++) {
    const { error } = await admin.from("parking_sessions").update(payload).eq("stripe_session_id", stripeSessionId);
    if (!error) return { ok: true };
    const missingColumn = extractMissingColumnName(error.message ?? "");
    if (!missingColumn || !(missingColumn in payload)) return { ok: false, message: error.message };
    const { [missingColumn]: _removed, ...rest } = payload;
    payload = rest;
  }
  return { ok: false, message: "Failed update after fallbacks" };
}

async function persistCheckoutSession(session: Stripe.Checkout.Session): Promise<{ ok: boolean; status?: number; message?: string }> {
  console.log(`[V19] Persisting session: ${session.id}`);
  const metadata = session.metadata || {};
  console.log(`[V19] Metadata: ${JSON.stringify(metadata)}`);

  // Handle Permit Activation if permit_id is present
  if (metadata.permit_id) {
    console.log(`[V19] Activating permit: ${metadata.permit_id}`);
    const { error: permitError } = await admin
      .from("parking_permits")
      .update({
        status: "active",
        payment_status: "paid",
        stripe_session_id: session.id,
        stripe_metadata: JSON.stringify({
          ...metadata,
          stripe_id: session.id,
          customer: session.customer,
          payment_intent: session.payment_intent,
        }),
      })
      .eq("id", metadata.permit_id);

    if (permitError) {
      console.error(`[V19] Permit activation failed: ${permitError.message}`);
      // We still continue to persist the session as a backup record
    } else {
      console.log(`[V19] Permit activated successfully`);
    }
  }

  const candidates = [metadata.location_id, metadata.display_id, session.client_reference_id].map((v) => String(v ?? "").trim()).filter((v) => v.length > 0);

  let resolvedLocation: { id: string; display_id?: string } | null = null;
  for (const candidate of candidates) {
    resolvedLocation = await resolveLocation(candidate);
    if (resolvedLocation?.id) break;
  }
  if (!resolvedLocation?.id) {
    console.error(`[V19] Failed to resolve location from: ${candidates.join(", ")}`);
    return { ok: false, status: 400, message: "Unable to resolve location_id" };
  }
  console.log(`[V19] Resolved location: ${resolvedLocation.id}`);

  const { data: existing, error: existingError } = await admin.from("parking_sessions").select("id").eq("stripe_session_id", session.id).maybeSingle();
  if (existingError) console.error(`[V19] Error checking existing: ${existingError.message}`);

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
  
  let plateNumber = "";
  if (session.custom_fields) {
    const plateField = session.custom_fields.find((f: any) => f.key === "plate_number");
    if (plateField && plateField.text) plateNumber = plateField.text.value || "";
  }
  if (!plateNumber && metadata.plate) {
    plateNumber = metadata.plate;
  }

  const insertData: any = {
    location_id: resolvedLocation.id,
    plate: plateNumber || "PENDING",
    email: email,
    mobile: phone,
    contact_name: name,
    type: type,
    ui_type: "guest",
    status: "active",
    payment_status: "paid",
    price: Number(session.amount_total ?? 0) / 100,
    amount_cents: Number(session.amount_total ?? 0),
    currency: "eur",
    payment_source: "regular",
    is_lpr_scan: false,
    is_whatsapp_linked: false,
    stripe_session_id: session.id,
    created_at: entryTime.toISOString(),
    updated_at: entryTime.toISOString(),
    entry_time: entryTime.toISOString(),
    exit_time: exitTime.toISOString(),
    end_time: exitTime.toISOString(),
    quantity: checkoutQuantity,
    duration_minutes: durationMinutes,
    stripe_metadata: JSON.stringify({
      ...metadata,
      quantity: String(checkoutQuantity),
      duration_unit: durationUnit,
      stripe_id: session.id,
      customer: session.customer,
      payment_intent: session.payment_intent,
    }),
  };

  console.log(`[V19] Upserting data for session ${session.id}: ${JSON.stringify(insertData)}`);

  if (existing?.id) {
    console.log(`[V19] Updating existing session: ${existing.id}`);
    const updated = await updateSessionWithSchemaFallback(session.id, insertData);
    if (updated.ok) return { ok: true };
    console.error(`[V19] Update failed: ${updated.message}`);
    return { ok: false, status: 500, message: updated.message };
  }

  console.log(`[V19] Inserting new session`);
  const inserted = await insertSessionWithSchemaFallback(insertData);
  if (inserted.ok) {
    console.log(`[V19] Insert successful`);
    return { ok: true };
  }
  console.error(`[V19] Insert failed: ${inserted.message}`);
  return { ok: false, status: 500, message: inserted.message };
}

async function cleanupExpiredCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const { error: deletePendingSessionError } = await admin
    .from("parking_sessions")
    .delete()
    .eq("stripe_session_id", session.id)
    .eq("payment_status", "pending");
  if (deletePendingSessionError) {
    console.error(
      `[V20] Failed to delete pending parking session for ${session.id}: ${deletePendingSessionError.message}`,
    );
  } else {
    console.log(`[V20] Deleted pending parking session for ${session.id}`);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing signature" }, 400);
  if (!stripeWebhookSecret) return json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, 500);

  try {
    const bodyText = await req.text();
    const event = await stripe.webhooks.constructEventAsync(bodyText, signature, stripeWebhookSecret);

    console.log(`[V16] Webhook event: ${event.type}`);

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const persisted = await persistCheckoutSession(session);
      if (!persisted.ok) return json({ error: persisted.message ?? "Failed persist" }, persisted.status ?? 500);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await cleanupExpiredCheckoutSession(session);
    }

    return json({ received: true });
  } catch (err: any) {
    console.error(`[V16] Webhook Error: ${err?.message ?? String(err)}`);
    return json({ error: `Webhook Error: ${err?.message ?? String(err)}` }, 400);
  }
});
