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
  });
}
