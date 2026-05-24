import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "payparq@outlook.com";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (userData.user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Get all pending ledger entries with lot details
  const { data: ledger, error } = await supabaseAdmin
    .from("owner_ledger")
    .select("id, owner_id, location_id, owner_reserved_cents, payparq_reserved_cents, stripe_fee_cents, service_fee_cents, commission_rate, created_at")
    .eq("status", "reserved")
    .order("owner_id, created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!ledger || ledger.length === 0) {
    return NextResponse.json({ owners: [] });
  }

  // Get unique owner IDs
  const ownerIds = [...new Set((ledger || []).map((r: any) => r.owner_id as string))];

  // Get owner profiles
  const profileMap: Record<string, any> = {};
  if (ownerIds.length > 0) {
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, bank_iban, bank_account_holder")
      .in("id", ownerIds);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = p;
    });
  }

  // Get location names
  const locationIds = [...new Set((ledger || []).map((r: any) => r.location_id).filter((l: any) => l))];
  const locationMap: Record<string, string> = {};
  if (locationIds.length > 0) {
    const { data: locations, error: locError } = await supabaseAdmin
      .from("locations")
      .select("id, display_name")
      .in("id", locationIds);
    if (locError) return NextResponse.json({ error: locError.message }, { status: 500 });
    (locations || []).forEach((l: any) => {
      locationMap[l.id] = l.display_name;
    });
  }

  // Group entries by owner
  const ownerGroups: Record<string, any[]> = {};
  (ledger || []).forEach((entry: any) => {
    const ownerId = entry.owner_id as string;
    if (!ownerGroups[ownerId]) ownerGroups[ownerId] = [];
    ownerGroups[ownerId].push(entry);
  });

  // Build response with owner + their lot entries
  const owners = ownerIds.map((ownerId) => {
    const profile = profileMap[ownerId];
    const entries = ownerGroups[ownerId] || [];
    const totalOwnerReserved = entries.reduce((sum, e) => sum + (e.owner_reserved_cents || 0), 0);
    const totalPayparqReserved = entries.reduce((sum, e) => sum + (e.payparq_reserved_cents || 0), 0);

    return {
      owner_id: ownerId,
      email: profile?.email || ownerId,
      bank_account_holder: profile?.bank_account_holder || "",
      bank_iban: profile?.bank_iban ? profile.bank_iban.slice(0, 4) + "****" + profile.bank_iban.slice(-4) : null,
      bank_configured: !!profile?.bank_iban,
      owner_reserved_cents: totalOwnerReserved,
      payparq_reserved_cents: totalPayparqReserved,
      booking_count: entries.length,
      entries: entries.map((e: any) => ({
        ledger_id: e.id,
        location_id: e.location_id,
        location_name: locationMap[e.location_id] || "Unknown",
        owner_reserved_cents: e.owner_reserved_cents,
        payparq_reserved_cents: e.payparq_reserved_cents,
        total_cents: (e.owner_reserved_cents || 0) + (e.payparq_reserved_cents || 0),
        stripe_fee_cents: e.stripe_fee_cents,
        service_fee_cents: e.service_fee_cents,
        commission_rate: e.commission_rate,
        created_at: e.created_at,
      })),
    };
  });

  return NextResponse.json({ owners });
}
