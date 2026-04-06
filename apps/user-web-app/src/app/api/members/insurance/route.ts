import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

async function resolveMemberEmail(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (token && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error) {
      const fromToken = normalizeEmail(data.user?.email);
      if (fromToken) {
        return fromToken;
      }
    }
  }
  const fallback = normalizeEmail(req.headers.get("x-member-email"));
  if (fallback) {
    return fallback;
  }
  return "";
}

function readMetadataUrl(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return "";
  const keys = ["insurance_url", "insuranceUrl", "insurance_link"];
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  const email = await resolveMemberEmail(req);
  if (!email) {
    return NextResponse.json({ ok: false, error: "unauthorized_member" }, { status: 401 });
  }
  const client = supabaseAdmin ?? supabase;
  if (!client) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }
  const { data: latestSession } = await client
    .from("parking_sessions")
    .select("location_id")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const locationKey = ((latestSession as { location_id?: string | null } | null)?.location_id ?? "")
    .toString()
    .trim();
  let insuranceUrl = "";
  if (locationKey) {
    const byId = await client
      .from("locations")
      .select("verification_metadata")
      .eq("id", locationKey)
      .maybeSingle();
    let metadata = (byId.data as { verification_metadata?: Record<string, unknown> | null } | null)
      ?.verification_metadata;
    if (!metadata) {
      const byDisplayId = await client
        .from("locations")
        .select("verification_metadata")
        .eq("display_id", locationKey)
        .maybeSingle();
      metadata = (byDisplayId.data as { verification_metadata?: Record<string, unknown> | null } | null)
        ?.verification_metadata;
    }
    insuranceUrl = readMetadataUrl(metadata);
  }
  const actionUrl =
    insuranceUrl || `/support?topic=insurance&email=${encodeURIComponent(email)}`;
  return NextResponse.json({
    ok: true,
    message: "Insurance flow opened in a new tab.",
    actionUrl,
  });
}
