import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

function normalizeRole(value: string | null | undefined) {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
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

type ManualPayoutBody = {
  recipientId?: unknown;
  role?: unknown;
  amountCents?: unknown;
  weekLabel?: unknown;
  note?: unknown;
};

export async function POST(req: NextRequest) {
  const authClient = supabaseAdmin ?? supabase;
  if (!authClient) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_auth_token" }, { status: 401 });
  }

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const requesterId = authData?.user?.id ?? "";
  if (authError || !requesterId) {
    return NextResponse.json({ ok: false, error: "invalid_auth_token" }, { status: 401 });
  }

  const adminDb = supabaseAdmin ?? supabase;
  if (!adminDb) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const { data: requesterProfile, error: requesterProfileError } = await adminDb
    .from("profiles")
    .select("id,role")
    .eq("id", requesterId)
    .maybeSingle();
  if (requesterProfileError) {
    return NextResponse.json({ ok: false, error: requesterProfileError.message }, { status: 500 });
  }

  const requesterRole = normalizeRole((requesterProfile as { role?: string } | null)?.role ?? "");
  if (requesterRole !== "super_admin") {
    return NextResponse.json({ ok: false, error: "super_admin_required" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as ManualPayoutBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const recipientId = String(body.recipientId ?? "").trim();
  const expectedRole = normalizeRole(String(body.role ?? ""));
  const amountCents = Number(body.amountCents ?? 0);
  const weekLabel = String(body.weekLabel ?? "").trim();
  const note = String(body.note ?? "").trim();

  if (!recipientId) {
    return NextResponse.json({ ok: false, error: "missing_recipient_id" }, { status: 400 });
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_amount_cents" }, { status: 400 });
  }
  if (!["officer", "admin"].includes(expectedRole)) {
    return NextResponse.json({ ok: false, error: "invalid_role" }, { status: 400 });
  }

  const { data: recipientProfile, error: recipientProfileError } = await adminDb
    .from("profiles")
    .select("id,role,stripe_account_id,stripe_onboarding_complete")
    .eq("id", recipientId)
    .maybeSingle();
  if (recipientProfileError) {
    return NextResponse.json({ ok: false, error: recipientProfileError.message }, { status: 500 });
  }
  if (!recipientProfile) {
    return NextResponse.json({ ok: false, error: "recipient_not_found" }, { status: 404 });
  }

  const recipientRole = normalizeRole((recipientProfile as { role?: string } | null)?.role ?? "");
  if (!["officer", "admin"].includes(recipientRole)) {
    return NextResponse.json({ ok: false, error: "recipient_role_not_eligible" }, { status: 400 });
  }
  if (recipientRole !== expectedRole) {
    return NextResponse.json({ ok: false, error: "recipient_role_mismatch" }, { status: 400 });
  }

  const stripeAccountId = String(
    (recipientProfile as { stripe_account_id?: string | null } | null)?.stripe_account_id ?? ""
  ).trim();
  const stripeOnboardingComplete =
    (recipientProfile as { stripe_onboarding_complete?: boolean | null } | null)?.stripe_onboarding_complete === true;
  if (!stripeAccountId || !stripeOnboardingComplete) {
    return NextResponse.json({ ok: false, error: "recipient_not_connected_to_stripe" }, { status: 400 });
  }

  const stripeSecret = resolveStripeSecretKey();
  if (!stripeSecret) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 500 });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-03-31.basil" as unknown as Stripe.LatestApiVersion });

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amountCents),
      currency: "eur",
      destination: stripeAccountId,
      metadata: {
        payout_role: recipientRole,
        recipient_profile_id: recipientId,
        requested_by: requesterId,
        week_label: weekLabel,
        note,
      },
      description: weekLabel
        ? `Weekly payout ${weekLabel} (${recipientRole})`
        : `Manual payout (${recipientRole})`,
    });
    return NextResponse.json({
      ok: true,
      transferId: transfer.id,
      destination: stripeAccountId,
      role: recipientRole,
      amountCents: Math.round(amountCents),
      currency: "eur",
    });
  } catch (error: unknown) {
    const stripeError = error as Stripe.StripeRawError;
    return NextResponse.json(
      {
        ok: false,
        error: stripeError.code ?? "stripe_transfer_failed",
        message: stripeError.message ?? "Unable to create payout transfer.",
      },
      { status: 400 }
    );
  }
}
