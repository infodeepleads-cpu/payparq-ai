import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ownerId = userData.user.id;

  // Get all ledger entries
  const { data: ledger, error: ledgerError } = await supabaseAdmin
    .from("owner_ledger")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (ledgerError) return NextResponse.json({ error: ledgerError.message }, { status: 500 });

  // Get payout history
  const { data: payouts } = await supabaseAdmin
    .from("owner_payouts")
    .select("id, owner_amount_cents, status, paid_at, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get referral earnings
  const { data: referralData } = await supabaseAdmin
    .from("booking_referral_codes")
    .select("referral_code, referrer_earning_cents, booking_status, brc: referral_codes_listing(location_id, location: locations(name))")
    .eq("referrer_id", ownerId);

  const referralByCode: Record<string, { earnings_cents: number; bookings: number; location_name: string; code: string }> = {};
  let referralEarningsCents = 0;
  let referralPendingCents = 0;

  (referralData || []).forEach((item: any) => {
    const earnings = item.referrer_earning_cents || 0;
    referralEarningsCents += earnings;
    if (item.booking_status !== "completed") {
      referralPendingCents += earnings;
    }
    if (!referralByCode[item.referral_code]) {
      referralByCode[item.referral_code] = {
        code: item.referral_code,
        earnings_cents: 0,
        bookings: 0,
        location_name: "Unknown",
      };
    }
    referralByCode[item.referral_code].earnings_cents += earnings;
    referralByCode[item.referral_code].bookings += 1;
    if (item.brc?.location?.name) {
      referralByCode[item.referral_code].location_name = item.brc.location.name;
    }
  });

  const reserved = (ledger || [])
    .filter((e: any) => e.status === "reserved")
    .reduce((sum: number, e: any) => sum + (e.owner_reserved_cents || 0), 0);

  const totalEarned = (ledger || [])
    .reduce((sum: number, e: any) => sum + (e.owner_reserved_cents || 0), 0);

  return NextResponse.json({
    pending_cents: reserved,
    total_earned_cents: totalEarned,
    ledger: ledger || [],
    payouts: payouts || [],
    referral_earnings_cents: referralEarningsCents,
    referral_pending_cents: referralPendingCents,
    referral_by_location: Object.values(referralByCode).sort((a, b) => b.earnings_cents - a.earnings_cents),
  });
}
