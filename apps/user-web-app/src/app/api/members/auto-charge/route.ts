import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { resolveScannerTruthPriceEuro } from "@/lib/locationPricing";
import {
  buildStripeSplitMetadata,
  buildStripeSplitPaymentIntentData,
  buildStripeSplitPlan,
  resolveAutomaticSplitDestination,
  resolveLotPayoutMode,
  resolveSplitExpenseRate,
  resolveSplitFixedExpenseCents,
  resolveSplitTaxRate,
} from "@shared/stripeSplit";

type PricingType = "hourly" | "daily" | "monthly";

type AuthMember = {
  email: string;
  userId: string | null;
  userMetadata: Record<string, unknown>;
  internalRequest: boolean;
};

function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function normalizePlate(value: unknown) {
  return (value ?? "").toString().trim().toUpperCase();
}

function toBoolean(value: unknown) {
  const normalized = (value ?? "").toString().trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" ||
    normalized === "on";
}

function resolvePricingType(value: unknown): PricingType {
  const normalized = (value ?? "").toString().trim().toLowerCase();
  if (normalized === "daily") return "daily";
  if (normalized === "monthly") return "monthly";
  return "hourly";
}

function clampInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function resolveDurationMinutes(pricingType: PricingType, quantity: number) {
  if (pricingType === "monthly") return quantity * 43200;
  if (pricingType === "daily") return quantity * 1440;
  return quantity * 60;
}

function toCents(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function asMetadataRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

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
    const secret = (rawValue ?? "").trim().replace(/^['"]+|['"]+$/g, "");
    if (!secret) continue;
    if (!/^sk_(test|live)_/i.test(secret)) continue;
    if (/your_stripe|replace_me|changeme|example/i.test(secret)) continue;
    return secret;
  }
  return null;
}

async function findAuthUserByEmail(email: string) {
  if (!supabaseAdmin || !email) return null;
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) return null;
  return data.users.find((candidate) =>
    normalizeEmail(candidate.email) === email
  ) ?? null;
}

async function resolveMember(
  req: NextRequest,
  payload: Record<string, unknown>,
): Promise<AuthMember> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (token) {
    const authClient = supabaseAdmin ?? supabase;
    if (authClient) {
      const { data, error } = await authClient.auth.getUser(token);
      if (!error && data.user) {
        const email = normalizeEmail(data.user.email);
        if (email) {
          return {
            email,
            userId: data.user.id,
            userMetadata: (data.user.user_metadata ?? {}) as Record<
              string,
              unknown
            >,
            internalRequest: false,
          };
        }
      }
    }
  }

  const lprSecretExpected = (process.env.LPR_AUTOPAY_SECRET ?? "").trim();
  const lprSecretReceived = (req.headers.get("x-lpr-secret") ?? "").trim();
  const isInternalRequest = Boolean(lprSecretExpected) &&
    lprSecretExpected === lprSecretReceived;
  if (isInternalRequest) {
    const email = normalizeEmail(
      (payload.memberEmail ?? payload.email ?? "").toString(),
    );
    if (!email) {
      return {
        email: "",
        userId: null,
        userMetadata: {},
        internalRequest: true,
      };
    }
    const authUser = await findAuthUserByEmail(email);
    return {
      email,
      userId: authUser?.id ?? null,
      userMetadata:
        ((authUser?.user_metadata ?? {}) as Record<string, unknown>) ?? {},
      internalRequest: true,
    };
  }

  const fallbackEmail = normalizeEmail(req.headers.get("x-member-email"));
  if (fallbackEmail) {
    return {
      email: fallbackEmail,
      userId: null,
      userMetadata: {},
      internalRequest: false,
    };
  }
  return { email: "", userId: null, userMetadata: {}, internalRequest: false };
}

function extractMissingColumnName(message: string) {
  const candidates = [
    /column ["`]?([a-zA-Z0-9_]+)["`]? does not exist/i,
    /Could not find the ['"`]([a-zA-Z0-9_]+)['"`] column/i,
  ];
  for (const pattern of candidates) {
    const matched = message.match(pattern);
    if (matched?.[1]) {
      return matched[1];
    }
  }
  return "";
}

async function insertSessionWithSchemaFallback(
  payload: Record<string, unknown>,
) {
  const client = supabaseAdmin ?? supabase;
  if (!client) {
    return { ok: false, message: "supabase_not_configured" };
  }
  let currentPayload = { ...payload };
  for (let index = 0; index < 20; index += 1) {
    const { error } = await client.from("parking_sessions").insert(
      currentPayload,
    );
    if (!error) {
      return { ok: true };
    }
    const missingColumn = extractMissingColumnName(error.message ?? "");
    if (!missingColumn || !(missingColumn in currentPayload)) {
      return { ok: false, message: error.message };
    }
    const nextPayload = { ...currentPayload };
    delete nextPayload[missingColumn];
    currentPayload = nextPayload;
  }
  return { ok: false, message: "insert_failed_after_schema_fallbacks" };
}

function parseRegisteredPlates(metadata: Record<string, unknown>) {
  const list = Array.isArray(metadata.member_plates)
    ? metadata.member_plates
    : [];
  const normalizedList = list.map((value) => normalizePlate(value)).filter((
    value,
  ) => value.length > 0);
  const defaultPlate = normalizePlate(metadata.default_plate);
  const all = [...normalizedList, ...(defaultPlate ? [defaultPlate] : [])];
  return Array.from(new Set(all));
}

function hasAutoChargeConsent(metadata: Record<string, unknown>) {
  return (
    toBoolean(metadata.auto_charge_opt_in) ||
    toBoolean(metadata.lpr_auto_charge_opt_in) ||
    toBoolean(metadata.off_session_charge_consent)
  );
}

async function resolveLocationWithPricing(
  locationInput: string,
  pricingType: PricingType,
) {
  const client = supabaseAdmin ?? supabase;
  if (!client) {
    return { error: "supabase_not_configured", status: 500 } as const;
  }
  const selectedColumns =
    "id,display_id,name,owner_id,verification_metadata,rate_per_hour,base_price_hourly,base_price_daily,base_price_monthly,rate_per_hour_floor,rate_per_hour_ceiling,base_price_daily_floor,base_price_daily_ceiling,base_price_monthly_floor,base_price_monthly_ceiling";
  let data: Record<string, unknown> | null = null;
  const byId = await client
    .from("locations")
    .select(selectedColumns)
    .eq("id", locationInput)
    .maybeSingle();
  if (!byId.error) {
    data = byId.data;
  }
  if (!data) {
    const byDisplayId = await client
      .from("locations")
      .select(selectedColumns)
      .eq("display_id", locationInput)
      .maybeSingle();
    if (!byDisplayId.error) {
      data = byDisplayId.data;
    }
  }
  if (!data) {
    return { error: "location_not_found", status: 404 } as const;
  }
  const verificationMetadata = asMetadataRecord(data.verification_metadata);
  const lotPayoutMode = resolveLotPayoutMode(verificationMetadata);
  const ownerId = String((data.owner_id ?? "") as string).trim();
  let ownerStripeAccountId: string | null = null;
  let ownerStripeReady = false;
  if (ownerId) {
    const { data: ownerProfile } = await client
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
      stripeOnboardingComplete:
        (ownerProfile as { stripe_onboarding_complete?: boolean | null } | null)
          ?.stripe_onboarding_complete === true,
    });
    ownerStripeAccountId = splitDestination.destinationAccountId;
    ownerStripeReady = splitDestination.splitEligible;
  }
  const unitAmountEuro = resolveScannerTruthPriceEuro(data, pricingType);
  const unitAmountCents = Math.round(unitAmountEuro * 100);
  if (!Number.isFinite(unitAmountCents) || unitAmountCents <= 0) {
    return { error: "invalid_location_pricing", status: 400 } as const;
  }
  return {
    status: 200 as const,
    data: {
      id: (data.id ?? "").toString().trim(),
      displayId: (data.display_id ?? "").toString().trim(),
      name: (data.name ?? "").toString().trim(),
      unitAmountCents,
      dailyTicketUnitAmountCents: Math.max(
        0,
        Math.round(resolveScannerTruthPriceEuro(data, "daily") * 100),
      ),
      lotPayoutMode,
      ownerStripeAccountId,
      ownerStripeReady,
      splitExpenseRate: resolveSplitExpenseRate(verificationMetadata),
      splitTaxRate: resolveSplitTaxRate(verificationMetadata),
      splitFixedExpenseCents: resolveSplitFixedExpenseCents(
        verificationMetadata,
      ),
    },
  };
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, {
      status: 400,
    });
  }

  const member = await resolveMember(req, payload);
  if (!member.email) {
    return NextResponse.json({ ok: false, error: "unauthorized_member" }, {
      status: 401,
    });
  }

  const stripeSecret = resolveStripeSecretKey();
  if (!stripeSecret) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, {
      status: 500,
    });
  }
  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2025-03-31.basil" as unknown as Stripe.LatestApiVersion,
  });

  let userMetadata = member.userMetadata;
  if (member.userId && supabaseAdmin) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(member.userId);
    userMetadata = ((data?.user?.user_metadata ?? userMetadata) as Record<
      string,
      unknown
    >) ?? {};
  } else if (!member.userId) {
    const authUser = await findAuthUserByEmail(member.email);
    if (authUser?.id) {
      userMetadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    }
  }

  if (!hasAutoChargeConsent(userMetadata)) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_auto_charge_consent",
        message:
          "Collect and store auto-charge consent before off-session charging.",
      },
      { status: 403 },
    );
  }

  const plateInput = normalizePlate(payload.plateNumber ?? payload.plate ?? "");
  const registeredPlates = parseRegisteredPlates(userMetadata);
  const effectivePlate = plateInput || registeredPlates[0] || "";
  if (!effectivePlate) {
    return NextResponse.json({ ok: false, error: "missing_plate" }, {
      status: 400,
    });
  }
  if (
    registeredPlates.length > 0 && !registeredPlates.includes(effectivePlate)
  ) {
    return NextResponse.json({
      ok: false,
      error: "plate_not_registered_for_member",
    }, { status: 403 });
  }

  const locationInput =
    ((payload.locationId ?? payload.location_id ?? payload.displayId ??
      payload.display_id ?? "") as string)
      .toString()
      .trim();
  if (!locationInput) {
    return NextResponse.json({ ok: false, error: "missing_location_id" }, {
      status: 400,
    });
  }
  const pricingType = resolvePricingType(
    payload.pricingType ?? payload.pricing_type,
  );
  const quantity = clampInteger(payload.quantity, 1, 1, 31);
  const locationResolution = await resolveLocationWithPricing(
    locationInput,
    pricingType,
  );
  if ("error" in locationResolution) {
    return NextResponse.json({ ok: false, error: locationResolution.error }, {
      status: locationResolution.status,
    });
  }
  const location = locationResolution.data;
  const amountCents = location.unitAmountCents * quantity;
  const flowType =
    (payload.flowType ?? payload.flow_type ?? "").toString().trim() ||
    "lpr_auto_charge";
  const splitPlan = null;
  const splitMetadata = buildStripeSplitMetadata({ splitPlan });

  let stripeCustomerId = (userMetadata.stripe_customer_id ?? "").toString()
    .trim();
  let defaultPaymentMethodId = (userMetadata.default_payment_method ?? "")
    .toString().trim();
  if (!stripeCustomerId) {
    const customerList = await stripe.customers.list({
      email: member.email,
      limit: 10,
    });
    const exact = customerList.data.find((candidate) =>
      normalizeEmail(candidate.email) === member.email
    );
    const customer = exact ?? customerList.data[0];
    stripeCustomerId = customer?.id ?? "";
    if (!defaultPaymentMethodId) {
      const invoiceDefault = customer?.invoice_settings?.default_payment_method;
      defaultPaymentMethodId = typeof invoiceDefault === "string"
        ? invoiceDefault
        : invoiceDefault?.id ?? "";
    }
  }
  if (!stripeCustomerId || !defaultPaymentMethodId) {
    return NextResponse.json({
      ok: false,
      error: "missing_saved_payment_method",
    }, { status: 409 });
  }

  const source = (payload.source ?? "lpr_auto_charge").toString().trim() ||
    "lpr_auto_charge";
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      customer: stripeCustomerId,
      payment_method: defaultPaymentMethodId,
      confirm: true,
      off_session: true,
      description: `Payparq ${source} ${effectivePlate} @ ${
        location.displayId || location.id
      }`,
      ...buildStripeSplitPaymentIntentData(splitPlan),
      metadata: {
        flow_type: "lpr_auto_charge",
        source,
        member_email: member.email,
        location_id: location.id,
        display_id: location.displayId,
        plate_number: effectivePlate,
        pricing_type: pricingType,
        quantity: String(quantity),
        ...splitMetadata,
      },
    });
  } catch (error: unknown) {
    const stripeError = error as Stripe.StripeRawError & {
      decline_code?: string;
    };
    const status = stripeError.code === "authentication_required" ? 402 : 400;
    return NextResponse.json(
      {
        ok: false,
        error: stripeError.code ?? "auto_charge_failed",
        message: stripeError.message ?? "Failed to process off-session charge.",
        decline_code: stripeError.decline_code ?? null,
      },
      { status },
    );
  }

  const now = new Date();
  const durationMinutes = resolveDurationMinutes(pricingType, quantity);
  const exitTime = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const insertPayload: Record<string, unknown> = {
    location_id: location.id || locationInput,
    plate: effectivePlate,
    email: member.email,
    contact_email: member.email,
    type: pricingType,
    status: paymentIntent.status === "succeeded" ? "active" : "pending",
    payment_status: paymentIntent.status === "succeeded"
      ? "paid"
      : paymentIntent.status,
    price: amountCents / 100,
    amount_cents: amountCents,
    currency: "eur",
    payment_source: source,
    is_lpr_scan: true,
    stripe_session_id: paymentIntent.id,
    created_at: now.toISOString(),
    entry_time: now.toISOString(),
    exit_time: exitTime.toISOString(),
    end_time: exitTime.toISOString(),
    duration_minutes: durationMinutes,
    quantity,
    stripe_metadata: JSON.stringify({
      flow_type: "lpr_auto_charge",
      source,
      location_id: location.id,
      display_id: location.displayId,
      location_name: location.name,
      plate_number: effectivePlate,
      pricing_type: pricingType,
      quantity: String(quantity),
      payment_intent: paymentIntent.id,
      customer: stripeCustomerId,
      payment_method: defaultPaymentMethodId,
      internal_request: member.internalRequest ? "1" : "0",
      ...splitMetadata,
    }),
  };
  const inserted = await insertSessionWithSchemaFallback(insertPayload);

  if (member.userId && supabaseAdmin) {
    const mergedMetadata = {
      ...userMetadata,
      stripe_customer_id: stripeCustomerId,
      default_payment_method: defaultPaymentMethodId,
      auto_charge_opt_in: true,
      last_auto_charge_at: new Date().toISOString(),
      last_auto_charge_payment_intent: paymentIntent.id,
    };
    await supabaseAdmin.auth.admin.updateUserById(member.userId, {
      user_metadata: mergedMetadata,
    });
  }

  return NextResponse.json({
    ok: true,
    paymentIntentId: paymentIntent.id,
    paymentStatus: paymentIntent.status,
    amountCents,
    currency: "eur",
    locationId: location.id || locationInput,
    locationDisplayId: location.displayId || null,
    plateNumber: effectivePlate,
    sessionPersisted: inserted.ok,
    sessionPersistError: inserted.ok ? null : inserted.message,
  });
}
