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

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildUberUrl(latitude: number | null, longitude: number | null, locationName: string) {
  if (latitude == null || longitude == null) {
    return "";
  }
  const params = new URLSearchParams({
    action: "setPickup",
    "dropoff[latitude]": String(latitude),
    "dropoff[longitude]": String(longitude),
  });
  if (locationName.trim()) {
    params.set("dropoff[nickname]", locationName.trim());
  }
  return `https://m.uber.com/ul/?${params.toString()}`;
}

function readMetadataUrl(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return "";
  const keys = ["uber_url", "ride_url", "uber_link"];
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}
function isParkTaxiIncluded(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata || typeof metadata !== "object") return false;
  const flowType = (metadata["flow_type"] ?? "").toString().trim().toLowerCase();
  const pricingType = (metadata["pricing_type"] ?? "").toString().trim().toLowerCase();
  const productType = (metadata["product_type"] ?? "").toString().trim().toLowerCase();
  const rideIncluded = (metadata["ride_included"] ?? "").toString().trim().toLowerCase();
  if (flowType === "park_now") return true;
  if (pricingType === "park_taxi") return true;
  if (productType === "park_taxi") return true;
  if (rideIncluded === "true" || rideIncluded === "1" || rideIncluded === "yes") return true;
  return false;
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
    .select("location_id,stripe_metadata")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const session = latestSession as
    | { location_id?: string | null; stripe_metadata?: Record<string, unknown> | null }
    | null;
  if (!isParkTaxiIncluded(session?.stripe_metadata ?? null)) {
    return NextResponse.json(
      { ok: false, error: "tracking_available_only_for_park_taxi" },
      { status: 403 }
    );
  }
  const locationKey = ((session?.location_id ?? "")
    .toString()
    .trim());
  let locationName = "";
  let latitude: number | null = null;
  let longitude: number | null = null;
  let actionUrl = "";
  if (locationKey) {
    const byId = await client
      .from("locations")
      .select("name,latitude,longitude,verification_metadata")
      .eq("id", locationKey)
      .maybeSingle();
    let row = byId.data as
      | {
          name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          verification_metadata?: Record<string, unknown> | null;
        }
      | null;
    if (!row) {
      const byDisplayId = await client
        .from("locations")
        .select("name,latitude,longitude,verification_metadata")
        .eq("display_id", locationKey)
        .maybeSingle();
      row = byDisplayId.data as
        | {
            name?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            verification_metadata?: Record<string, unknown> | null;
          }
        | null;
    }
    if (row) {
      locationName = (row.name ?? "").toString();
      latitude = toNumber(row.latitude);
      longitude = toNumber(row.longitude);
      actionUrl = readMetadataUrl(row.verification_metadata);
    }
  }
  if (!actionUrl) {
    actionUrl = buildUberUrl(latitude, longitude, locationName);
  }
  if (!actionUrl) {
    actionUrl = `/support?topic=ride&email=${encodeURIComponent(email)}`;
  }
  return NextResponse.json({
    ok: true,
    message: "Ride ordering is ready in a new tab.",
    actionUrl,
  });
}
