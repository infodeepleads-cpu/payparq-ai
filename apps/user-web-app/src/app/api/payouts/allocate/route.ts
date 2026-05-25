import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { owner_id, owner_amount_cents } = body;

  if (!owner_id || typeof owner_amount_cents !== "number") {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  if (owner_amount_cents < 0) {
    return NextResponse.json({ error: "amount_must_be_positive" }, { status: 400 });
  }

  // Get owner profile to verify bank details are set
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from("profiles")
    .select("id, bank_iban, bank_account_holder")
    .eq("id", owner_id)
    .maybeSingle();

  if (ownerError || !owner) {
    return NextResponse.json({ error: "owner_not_found" }, { status: 404 });
  }

  if (!owner.bank_iban) {
    return NextResponse.json({ error: "owner_bank_details_missing" }, { status: 400 });
  }

  try {
    // Mark all reserved ledger entries for this owner as paid
    const { error: ledgerError } = await supabaseAdmin
      .from("owner_ledger")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("owner_id", owner_id)
      .eq("status", "reserved");

    if (ledgerError) {
      return NextResponse.json({ error: ledgerError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      owner_id,
      owner_amount_cents,
      message: "Marked as paid. Manually transfer to owner IBAN.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "update_failed" },
      { status: 400 }
    );
  }
}
