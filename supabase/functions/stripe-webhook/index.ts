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
  const droppedColumns: string[] = [];
  for (let i = 0; i < 20; i++) {
    const { error } = await admin.from("parking_sessions").insert(payload);
    if (!error || error.code === "23505") {
      if (droppedColumns.length > 0) {
        console.warn(`[SCHEMA_FALLBACK] insert succeeded after dropping columns: ${droppedColumns.join(", ")}`);
      }
      return { ok: true };
    }
    const notNullColumn = extractNotNullColumnName(error.message ?? "");
    if (notNullColumn) {
      const fallbackValue = defaultValueForSessionColumn(notNullColumn);
      if (fallbackValue !== undefined) {
        console.warn(`[SCHEMA_FALLBACK] filling missing NOT NULL column: ${notNullColumn}=${JSON.stringify(fallbackValue)}`);
        payload = { ...payload, [notNullColumn]: fallbackValue };
        continue;
      }
    }
    const missingColumn = extractMissingColumnName(error.message ?? "");
    if (!missingColumn || !(missingColumn in payload)) {
      console.error(`[SCHEMA_FALLBACK] unrecoverable insert error: ${error.message}`);
      return { ok: false, message: error.message };
    }
    console.warn(`[SCHEMA_FALLBACK] dropping unknown column from insert: ${missingColumn}`);
    droppedColumns.push(missingColumn);
    const { [missingColumn]: _removed, ...rest } = payload;
    payload = rest;
  }
  const msg = `[SCHEMA_FALLBACK] CRITICAL: insert failed after 20 fallback attempts. Dropped: ${droppedColumns.join(", ")}`;
  console.error(msg);
  return { ok: false, message: msg };
}

async function updateSessionWithSchemaFallback(stripeSessionId: string, updateData: Record<string, unknown>): Promise<{ ok: boolean; message?: string }> {
  let payload: Record<string, unknown> = { ...updateData };
  const droppedColumns: string[] = [];
  for (let i = 0; i < 20; i++) {
    const { error } = await admin.from("parking_sessions").update(payload).eq("stripe_session_id", stripeSessionId);
    if (!error) {
      if (droppedColumns.length > 0) {
        console.warn(`[SCHEMA_FALLBACK] update succeeded after dropping columns: ${droppedColumns.join(", ")}`);
      }
      return { ok: true };
    }
    const missingColumn = extractMissingColumnName(error.message ?? "");
    if (!missingColumn || !(missingColumn in payload)) {
      console.error(`[SCHEMA_FALLBACK] unrecoverable update error: ${error.message}`);
      return { ok: false, message: error.message };
    }
    console.warn(`[SCHEMA_FALLBACK] dropping unknown column from update: ${missingColumn}`);
    droppedColumns.push(missingColumn);
    const { [missingColumn]: _removed, ...rest } = payload;
    payload = rest;
  }
  const msg = `[SCHEMA_FALLBACK] CRITICAL: update failed after 20 fallback attempts. Dropped: ${droppedColumns.join(", ")}`;
  console.error(msg);
  return { ok: false, message: msg };
}

function deriveReservationCode(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 41 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  return `RZ-${1000 + (Math.abs(hash) % 9000)}`;
}

function deriveValetCode(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  return `VLT-${1000 + (Math.abs(hash) % 9000)}`;
}

function deriveShuttleCode(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 37 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  return `SH-${1000 + (Math.abs(hash) % 9000)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zagreb" });
}

function fmtEur(cents: number): string {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(cents / 100);
}

function buildCustomerEmail(params: {
  sessionId: string;
  customerEmail: string;
  locationName: string;
  locationDisplayId: string;
  entryTime: string;
  exitTime: string;
  amountCents: number;
  valetEnabled: boolean;
  shuttleEnabled: boolean;
}): string {
  const { sessionId, customerEmail, locationName, locationDisplayId, entryTime, exitTime, amountCents, valetEnabled, shuttleEnabled } = params;
  const BASE = "https://www.payparq.com";
  const reservationCode = deriveReservationCode(sessionId);
  const successUrl = `${BASE}/success?session_id=${encodeURIComponent(sessionId)}`;
  const insuranceUrl = `${BASE}/insurance/apply?email=${encodeURIComponent(customerEmail)}`;
  const invoiceUrl = `${BASE}/api/members/invoice?mode=document&stripe_session_id=${encodeURIComponent(sessionId)}&fallback_stripe_session_id=${encodeURIComponent(sessionId)}`;
  const membersUrl = `${BASE}/members?email=${encodeURIComponent(customerEmail)}`;

  const valetTicket = valetEnabled ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #d0c4ff;margin-top:12px;">
      <tr><td style="background:#5F3DFC;padding:10px 14px;">
        <span style="color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Valet potvrda</span>
        <span style="float:right;color:rgba(255,255,255,0.75);font-size:11px;font-family:monospace;">${deriveValetCode(sessionId)}</span>
      </td></tr>
      <tr><td style="background:#F5F2FF;padding:12px 14px;font-size:12px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;padding-bottom:6px;">Lokacija</td><td style="font-weight:700;text-align:right;padding-bottom:6px;">${locationName}</td></tr>
          <tr><td style="color:#888;padding-bottom:6px;">Check-in</td><td style="font-weight:700;text-align:right;padding-bottom:6px;">${fmtDate(entryTime)}</td></tr>
          <tr><td style="color:#888;">Check-out</td><td style="font-weight:700;text-align:right;">${fmtDate(exitTime)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="background:rgba(95,61,252,0.08);padding:8px 14px;text-align:center;font-size:10px;color:rgba(95,61,252,0.6);">Pokažite kod valet agentu pri predaji ključeva</td></tr>
    </table>` : "";

  const shuttleTicket = shuttleEnabled ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #a7d8c9;margin-top:12px;">
      <tr><td style="background:#0F6E56;padding:10px 14px;">
        <span style="color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Shuttle potvrda</span>
        <span style="float:right;color:rgba(255,255,255,0.75);font-size:11px;font-family:monospace;">${deriveShuttleCode(sessionId)}</span>
      </td></tr>
      <tr><td style="background:#E1F5EE;padding:12px 14px;font-size:12px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;padding-bottom:6px;">Lokacija</td><td style="font-weight:700;text-align:right;padding-bottom:6px;">${locationName}</td></tr>
          <tr><td style="color:#888;padding-bottom:6px;">Check-in</td><td style="font-weight:700;text-align:right;padding-bottom:6px;">${fmtDate(entryTime)}</td></tr>
          <tr><td style="color:#888;">Check-out</td><td style="font-weight:700;text-align:right;">${fmtDate(exitTime)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="background:rgba(15,110,86,0.08);padding:8px 14px;text-align:center;font-size:10px;color:rgba(15,110,86,0.6);">Pokažite kod vozaču shuttlea pri ukrcaju · ETA 3–8 min</td></tr>
    </table>` : "";

  const summonSection = (valetEnabled || shuttleEnabled) ? `
    <tr><td style="background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,0.08);padding:16px;margin-top:12px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#999;margin-bottom:10px;">Pozovi vozilo</div>
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        ${valetEnabled ? `<td width="${shuttleEnabled ? "50%" : "100%"}" style="padding:0 3px;">
          <a href="${successUrl}" style="display:block;text-align:center;padding:12px 0;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:#f9f9f9;font-size:12px;font-weight:600;color:#111;text-decoration:none;">🚗 Pozovi auto<br><span style="font-size:10px;font-weight:400;color:#999;">Valet dovozi · ~6 min</span></a>
        </td>` : ""}
        ${shuttleEnabled ? `<td width="${valetEnabled ? "50%" : "100%"}" style="padding:0 3px;">
          <a href="${successUrl}" style="display:block;text-align:center;padding:12px 0;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:#f9f9f9;font-size:12px;font-weight:600;color:#111;text-decoration:none;">🚌 Pozovi shuttle<br><span style="font-size:10px;font-weight:400;color:#999;">1 smjer · ~4 min</span></a>
        </td>` : ""}
      </tr></table>
    </td></tr>` : "";

  return `<!DOCTYPE html><html lang="hr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;">

  <tr><td style="padding-bottom:20px;text-align:center;"><span style="font-size:20px;font-weight:700;color:#111;">Payparq</span></td></tr>

  <!-- 1. Rezervacija potvrđena -->
  <tr><td style="background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,0.08);padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td width="40" valign="top" style="padding-top:2px;"><table cellpadding="0" cellspacing="0"><tr><td style="width:36px;height:36px;border-radius:50%;background:#E1F5EE;text-align:center;vertical-align:middle;font-size:16px;font-weight:700;color:#0F6E56;">✓</td></tr></table></td>
        <td style="padding-left:12px;">
          <div style="font-size:11px;color:#999;">Rezervacija potvrđena &nbsp;<span style="font-family:monospace;color:#333;font-weight:700;">${reservationCode}</span></div>
          <div style="font-size:15px;font-weight:700;color:#111;margin-top:3px;">${locationName}</div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;">
      <tr>
        <td width="50%" style="padding-bottom:10px;"><div style="color:#999;margin-bottom:2px;">Lokacija ID</div><div style="font-weight:700;font-family:monospace;">${locationDisplayId}</div></td>
        <td width="50%" style="padding-bottom:10px;"><div style="color:#999;margin-bottom:2px;">Cijena</div><div style="font-weight:700;">${fmtEur(amountCents)}</div></td>
      </tr>
      <tr>
        <td><div style="color:#999;margin-bottom:2px;">Od</div><div style="font-weight:700;">${fmtDate(entryTime)}</div></td>
        <td><div style="color:#999;margin-bottom:2px;">Kraj</div><div style="font-weight:700;">${fmtDate(exitTime)}</div></td>
      </tr>
    </table>
    ${valetTicket}${shuttleTicket}
  </td></tr>

  <!-- 2. Produži boravak -->
  <tr><td style="background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,0.08);padding:16px;margin-top:12px;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#999;margin-bottom:10px;">Produži boravak</div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      ${["+1h","+2h","+1d","+2d"].map(l => `<td width="25%" style="padding:0 3px;"><a href="${successUrl}" style="display:block;text-align:center;padding:9px 0;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:#f9f9f9;font-size:13px;font-weight:600;color:#111;text-decoration:none;">${l}</a></td>`).join("")}
    </tr></table>
  </td></tr>

  <!-- 3. Pozovi vozilo -->
  ${summonSection}

  <!-- 4. Brze akcije -->
  <tr><td style="background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,0.08);padding:16px;margin-top:12px;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#999;margin-bottom:10px;">Brze akcije</div>
    <a href="https://m.uber.com/" style="display:block;text-align:center;padding:12px;border-radius:12px;border:1px solid rgba(0,0,0,0.1);background:#fff;font-size:13px;font-weight:500;color:#111;text-decoration:none;margin-bottom:8px;">Naruči Uber</a>
    <a href="${insuranceUrl}" style="display:block;text-align:center;padding:12px;border-radius:12px;border:1px solid rgba(0,0,0,0.1);background:#fff;font-size:13px;font-weight:500;color:#111;text-decoration:none;margin-bottom:8px;">Osiguranje vozila</a>
    <a href="${invoiceUrl}" style="display:block;text-align:center;padding:12px;border-radius:12px;border:1px solid rgba(0,0,0,0.1);background:#fff;font-size:13px;font-weight:500;color:#111;text-decoration:none;">Preuzmi potvrdu</a>
  </td></tr>

  <!-- 5. Members CTA -->
  <tr><td style="padding-top:16px;text-align:center;">
    <a href="${membersUrl}" style="display:inline-block;padding:13px 32px;border-radius:999px;background:#5F3DFC;color:#fff;text-decoration:none;font-weight:700;font-size:14px;">Otvori Members zonu</a>
  </td></tr>

  <tr><td style="padding-top:24px;text-align:center;font-size:11px;color:#bbb;line-height:1.6;">
    Payparq &middot; <a href="https://www.payparq.com" style="color:#bbb;">payparq.com</a><br>
    Ova poruka šalje se automatski. Molimo ne odgovarajte na nju.
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

async function sendPaymentNotification(session: Stripe.Checkout.Session, locationDisplay: string): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!resendApiKey) return;
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "team@info.payparq.com";
  const amountEur = (Number(session.amount_total ?? 0) / 100).toFixed(2);
  const customerEmail = session.customer_details?.email ?? "—";
  const customerName = session.customer_details?.name ?? "—";
  const metadata = session.metadata ?? {};
  const plate = metadata.plate || "—";
  const type = metadata.type || "hourly";
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const body = `
New payment received on PayParq.

Amount:    €${amountEur}
Location:  ${locationDisplay}
Plate:     ${plate}
Type:      ${type}
Customer:  ${customerName} (${customerEmail})
Session:   ${session.id}
Time:      ${ts}
`.trim();

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: ["payparq@outlook.com"],
        subject: `💳 €${amountEur} payment — ${locationDisplay}`,
        text: body,
      }),
    });
  } catch (e) {
    console.warn(`[NOTIFY] Failed to send payment email: ${e}`);
  }
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
  const flow = String(metadata.flow ?? metadata.flow_type ?? "").trim().toLowerCase();
  const extendTargetSessionId = String(metadata.extend_target_session_id ?? "").trim();
  const metadataCheckIn = String(metadata.check_in ?? "").trim();
  const metadataCheckOut = String(metadata.check_out ?? "").trim();
  const metadataCheckInDate = metadataCheckIn ? new Date(metadataCheckIn) : null;
  const metadataCheckOutDate = metadataCheckOut ? new Date(metadataCheckOut) : null;
  const hasValidMetadataCheckIn = Boolean(
    metadataCheckInDate && !Number.isNaN(metadataCheckInDate.getTime()),
  );
  const hasValidMetadataCheckOut = Boolean(
    metadataCheckOutDate && !Number.isNaN(metadataCheckOutDate.getTime()),
  );
  const isReserveFlow = flow === "reserve";
  const isTargetedExtensionFlow = isReserveFlow && extendTargetSessionId.length > 0;
  if (isTargetedExtensionFlow && (!hasValidMetadataCheckIn || !hasValidMetadataCheckOut)) {
    return { ok: false, status: 400, message: "extend_flow_requires_check_in_and_check_out" };
  }
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
  let entryTime = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000);
  if (isReserveFlow && hasValidMetadataCheckIn && metadataCheckInDate) {
    entryTime = metadataCheckInDate;
  }
  const durationMinutes =
    durationUnit === "month"
      ? checkoutQuantity * 30 * 24 * 60
      : durationUnit === "day"
      ? checkoutQuantity * 24 * 60
      : checkoutQuantity * 60;
  let exitTime = new Date(entryTime.getTime() + durationMinutes * 60 * 1000);
  if (isReserveFlow && hasValidMetadataCheckOut && metadataCheckOutDate) {
    exitTime = metadataCheckOutDate;
  }
  const statusValue = isReserveFlow && entryTime.getTime() > Date.now() ? "scheduled" : "active";
  
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
    status: statusValue,
    payment_status: "paid",
    price: Number(session.amount_total ?? 0) / 100,
    amount_cents: Number(session.amount_total ?? 0),
    currency: "eur",
    payment_source: "regular",
    is_lpr_scan: false,
    is_whatsapp_linked: false,
    stripe_session_id: session.id,
    activation_at: metadata.activation_at || null,
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
      flow_type: flow || null,
      extend_target_session_id: extendTargetSessionId || null,
      stripe_id: session.id,
      customer: session.customer,
      payment_intent: session.payment_intent,
    }),
  };

  console.log(`[V19] Upserting data for session ${session.id}: ${JSON.stringify(insertData)}`);

  const locationDisplay = resolvedLocation.display_id ?? resolvedLocation.id;

  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "team@info.payparq.com";

  const sendCustomerConfirmation = async () => {
    if (!resendApiKey || !email) return;
    try {
      // Fetch valet/shuttle flags for the location
      let valetEnabled = false;
      let shuttleEnabled = false;
      try {
        const { data: locFlags } = await admin
          .from("locations")
          .select("valet_enabled,shuttle_enabled")
          .eq("id", resolvedLocation!.id)
          .maybeSingle();
        valetEnabled = Boolean(locFlags?.valet_enabled);
        shuttleEnabled = Boolean(locFlags?.shuttle_enabled);
      } catch (_) { /* best effort */ }

      const reservationCode = deriveReservationCode(session.id);
      const html = buildCustomerEmail({
        sessionId: session.id,
        customerEmail: email,
        locationName: locationDisplay,
        locationDisplayId: resolvedLocation!.display_id ?? resolvedLocation!.id,
        entryTime: entryTime.toISOString(),
        exitTime: exitTime.toISOString(),
        amountCents: Number(session.amount_total ?? 0),
        valetEnabled,
        shuttleEnabled,
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `Rezervacija potvrđena · ${reservationCode}`,
          html,
        }),
      });
      console.log(`[EMAIL] Confirmation sent to ${email} (${reservationCode})`);
    } catch (e) {
      console.warn(`[EMAIL] Failed to send customer confirmation: ${e}`);
    }
  };

  if (existing?.id) {
    console.log(`[V19] Updating existing session: ${existing.id}`);
    const updated = await updateSessionWithSchemaFallback(session.id, insertData);
    if (updated.ok) {
      await sendPaymentNotification(session, locationDisplay);
      return { ok: true };
    }
    console.error(`[V19] Update failed: ${updated.message}`);
    return { ok: false, status: 500, message: updated.message };
  }

  console.log(`[V19] Inserting new session`);
  const inserted = await insertSessionWithSchemaFallback(insertData);
  if (inserted.ok) {
    console.log(`[V19] Insert successful`);
    await sendPaymentNotification(session, locationDisplay);
    await sendCustomerConfirmation();
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

async function syncStripeOnboardingState(account: Stripe.Account): Promise<void> {
  const accountId = String(account.id ?? "").trim();
  if (!accountId) return;
  const metadata = account.metadata ?? {};
  const profileId = String(metadata.profile_id ?? "").trim();
  const onboardingComplete = Boolean(account.details_submitted);

  let query = admin
    .from("profiles")
    .update({
      stripe_onboarding_complete: onboardingComplete,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", accountId);

  if (isUuid(profileId)) {
    query = query.eq("id", profileId);
  }

  const { error } = await query;
  if (error) {
    console.error(
      `[V21] Failed onboarding sync for ${accountId}: ${error.message}`,
    );
  } else {
    console.log(
      `[V21] Synced onboarding for ${accountId}: ${onboardingComplete}`,
    );
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
      const normalizedPaymentStatus = String(session.payment_status ?? "").trim().toLowerCase();
      const shouldPersist =
        event.type === "checkout.session.async_payment_succeeded" ||
        normalizedPaymentStatus === "paid";
      if (!shouldPersist) {
        return json({ received: true });
      }
      const persisted = await persistCheckoutSession(session);
      if (!persisted.ok) return json({ error: persisted.message ?? "Failed persist" }, persisted.status ?? 500);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await cleanupExpiredCheckoutSession(session);
    } else if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      await syncStripeOnboardingState(account);
    } else if (event.type === "account.application.deauthorized") {
      const accountId = String((event.data.object as Stripe.Application)?.account ?? "").trim();
      if (accountId) {
        const { error } = await admin
          .from("profiles")
          .update({
            stripe_onboarding_complete: false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", accountId);
        if (error) {
          console.error(
            `[V21] Failed deauthorization sync for ${accountId}: ${error.message}`,
          );
        }
      }
    }

    return json({ received: true });
  } catch (err: any) {
    console.error(`[V16] Webhook Error: ${err?.message ?? String(err)}`);
    return json({ error: `Webhook Error: ${err?.message ?? String(err)}` }, 400);
  }
});
