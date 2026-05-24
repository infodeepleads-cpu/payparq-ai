import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { owner_id, owner_amount_cents, payparq_amount_cents, notes } = body;

  if (!owner_id || typeof owner_amount_cents !== "number" || typeof payparq_amount_cents !== "number") {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  if (owner_amount_cents < 0 || payparq_amount_cents < 0) {
    return NextResponse.json({ error: "amounts_must_be_positive" }, { status: 400 });
  }

  // Get owner profile with bank details
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from("profiles")
    .select("id, bank_iban, bank_account_holder, bank_country")
    .eq("id", owner_id)
    .maybeSingle();

  if (ownerError || !owner) {
    return NextResponse.json({ error: "owner_not_found" }, { status: 404 });
  }

  if (!owner.bank_iban) {
    return NextResponse.json({ error: "owner_bank_details_missing" }, { status: 400 });
  }

  // Initialize Stripe
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-03-31.basil" as any });

  // Create payout record
  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("owner_payouts")
    .insert({
      owner_id,
      owner_amount_cents,
      payparq_amount_cents,
      bank_iban: owner.bank_iban,
      status: "processing",
      notes: notes || null,
    })
    .select()
    .single();

  if (payoutError || !payout) {
    return NextResponse.json({ error: "payout_creation_failed" }, { status: 500 });
  }

  try {
    // Send owner payout via Stripe Payouts API (if amount > 0)
    let stripePayoutId: string | null = null;
    if (owner_amount_cents > 0) {
      const stripePayout = await stripe.payouts.create({
        amount: owner_amount_cents,
        currency: "eur",
        description: `Owner payout - ${owner.bank_account_holder || owner_id}`,
        metadata: {
          owner_id,
          payout_id: payout.id,
          bank_iban: owner.bank_iban,
        },
      });
      stripePayoutId = stripePayout.id;
    }

    // Mark all reserved ledger entries for this owner as allocated
    await supabaseAdmin
      .from("owner_ledger")
      .update({ status: "allocated", payout_id: payout.id })
      .eq("owner_id", owner_id)
      .eq("status", "reserved");

    // Update payout record
    await supabaseAdmin
      .from("owner_payouts")
      .update({
        stripe_payout_id: stripePayoutId,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", payout.id);

    return NextResponse.json({
      ok: true,
      payout_id: payout.id,
      stripe_payout_id: stripePayoutId,
      owner_amount_cents,
      payparq_amount_cents,
    });
  } catch (err: any) {
    // Mark payout as failed
    await supabaseAdmin
      .from("owner_payouts")
      .update({ status: "failed", notes: err?.message || "stripe_error" })
      .eq("id", payout.id);

    return NextResponse.json(
      { error: err?.message || "payout_failed" },
      { status: 400 }
    );
  }
}
