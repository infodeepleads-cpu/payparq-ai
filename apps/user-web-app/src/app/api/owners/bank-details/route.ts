import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function maskIban(iban: string): string {
  if (iban.length <= 6) return iban;
  return iban.slice(0, 4) + "****" + iban.slice(-4);
}

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("bank_iban, bank_account_holder, bank_country")
    .eq("id", userData.user.id)
    .maybeSingle();

  return NextResponse.json({
    bank_iban: profile?.bank_iban ? maskIban(profile.bank_iban) : null,
    bank_account_holder: profile?.bank_account_holder || null,
    bank_country: profile?.bank_country || "HR",
    configured: !!profile?.bank_iban,
  });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { bank_iban, bank_account_holder, bank_country } = body;

  if (!bank_iban || !bank_account_holder) {
    return NextResponse.json({ error: "iban_and_holder_required" }, { status: 400 });
  }

  const cleanIban = bank_iban.replace(/\s+/g, "").toUpperCase();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      bank_iban: cleanIban,
      bank_account_holder: bank_account_holder.trim(),
      bank_country: bank_country || "HR",
      bank_details_updated_at: new Date().toISOString(),
    })
    .eq("id", userData.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
