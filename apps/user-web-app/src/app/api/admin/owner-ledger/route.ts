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

  // Get all owners with pending reserved amounts
  const { data: ledger, error } = await supabaseAdmin
    .from("owner_ledger")
    .select("owner_id, owner_reserved_cents, payparq_reserved_cents, created_at")
    .eq("status", "reserved");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by owner
  const ownerMap: Record<string, { owner_reserved: number; payparq_reserved: number; booking_count: number }> = {};
  for (const row of (ledger || [])) {
    const id = row.owner_id as string;
    if (!ownerMap[id]) ownerMap[id] = { owner_reserved: 0, payparq_reserved: 0, booking_count: 0 };
    ownerMap[id].owner_reserved += row.owner_reserved_cents || 0;
    ownerMap[id].payparq_reserved += row.payparq_reserved_cents || 0;
    ownerMap[id].booking_count += 1;
  }

  if (Object.keys(ownerMap).length === 0) {
    return NextResponse.json({ owners: [] });
  }

  // Get owner profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, bank_iban, bank_account_holder")
    .in("id", Object.keys(ownerMap));

  const owners = (profiles || []).map((p: any) => ({
    owner_id: p.id,
    email: p.email,
    bank_account_holder: p.bank_account_holder,
    bank_iban: p.bank_iban ? p.bank_iban.slice(0, 4) + "****" + p.bank_iban.slice(-4) : null,
    bank_configured: !!p.bank_iban,
    owner_reserved_cents: ownerMap[p.id]?.owner_reserved ?? 0,
    payparq_reserved_cents: ownerMap[p.id]?.payparq_reserved ?? 0,
    booking_count: ownerMap[p.id]?.booking_count ?? 0,
  }));

  return NextResponse.json({ owners });
}
