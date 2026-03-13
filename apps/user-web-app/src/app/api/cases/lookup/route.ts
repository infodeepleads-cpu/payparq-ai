 import { NextRequest, NextResponse } from "next/server";
 import { supabaseAdmin } from "@/lib/supabaseAdmin";
 import { supabase } from "@/lib/supabase";
 
function toCaseNumberString(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return value.toString().padStart(9, "0");
}

function toPublicEvidenceUrl(client: NonNullable<typeof supabaseAdmin> | NonNullable<typeof supabase>, path: string | null | undefined) {
  if (!path) return null;
  const { data } = client.storage.from("evidence").getPublicUrl(path);
  return data.publicUrl;
}

 export async function GET(req: NextRequest) {
   const client = supabaseAdmin ?? supabase;
   const url = new URL(req.url);
   const plate = (url.searchParams.get("plate") || "").toUpperCase().trim();
   const location_id = (url.searchParams.get("location_id") || "").trim();
  const case_number = (url.searchParams.get("case_number") || "").trim();
 
  const hasPlateLookup = Boolean(plate && /^\d{5}$/.test(location_id));
  const hasCaseNumberLookup = /^\d{9}$/.test(case_number);

  if (!hasPlateLookup && !hasCaseNumberLookup) {
    return NextResponse.json({
      found: false,
      error: "invalid_params",
      supportEmail: "payparq@outlook.com",
    });
  }

  if (!client) {
    return NextResponse.json({
      found: false,
      error: "supabase_not_configured",
      supportEmail: "payparq@outlook.com",
    });
  }
 
  let violation: Record<string, unknown> | null = null;
  let lookupLocationId = location_id;
  let lookupLocationUuid = "";

  if (hasCaseNumberLookup) {
    const { data, error } = await client
      .from("violations")
      .select("*")
      .eq("case_number", Number(case_number))
      .order("issued_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Case number lookup error:", error);
      return NextResponse.json({ found: false, error: "Case lookup failed" });
    }
    violation = (data as Record<string, unknown> | null) ?? null;
    const violationLocationId = typeof violation?.location_id === "string" ? violation.location_id : "";
    lookupLocationUuid = violationLocationId;
  } else {
    const { data: locationData, error: locError } = await client
      .from("locations")
      .select("id, display_id")
      .eq("display_id", location_id)
      .maybeSingle();

    if (locError) {
      console.error("Location lookup error:", locError);
      return NextResponse.json({ found: false, error: "Location not found" });
    }

    if (!locationData) {
      return NextResponse.json({ found: false, error: "Invalid Location ID" });
    }

    lookupLocationUuid = locationData.id;
    lookupLocationId = locationData.display_id ?? location_id;

    const { data, error: violationError } = await client
      .from("violations")
      .select("*")
      .eq("location_id", lookupLocationUuid)
      .ilike("plate", plate)
      .order("issued_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (violationError) {
      console.error("Violation lookup error:", violationError);
    }
    violation = (data as Record<string, unknown> | null) ?? null;
  }

  if (!violation) {
    return NextResponse.json({ found: false });
  }

  const locationUuidForQuery = typeof violation.location_id === "string" ? violation.location_id : lookupLocationUuid;
  const { data: locationData } = await client
    .from("locations")
    .select("id, name, display_id, canonical_slug, verification_photos, latitude, longitude")
    .eq("id", locationUuidForQuery)
    .maybeSingle();

  const caseNumberValue = typeof violation.case_number === "number" ? violation.case_number : Number(case_number);
  const caseNumberText = toCaseNumberString(caseNumberValue);
  const fallbackNotice = typeof violation.id === "string" ? violation.id.slice(0, 8).toUpperCase() : "";
  const primaryPhotoUrl = toPublicEvidenceUrl(client, typeof violation.evidence_r2_url === "string" ? violation.evidence_r2_url : null);
  const secondaryEvidencePath =
    (typeof violation.evidence_r2_url_secondary === "string" && violation.evidence_r2_url_secondary) ||
    (typeof violation.evidence_r2_url_2 === "string" && violation.evidence_r2_url_2) ||
    (typeof violation.secondary_evidence_r2_url === "string" && violation.secondary_evidence_r2_url) ||
    null;
  const secondaryPhotoUrl = toPublicEvidenceUrl(client, secondaryEvidencePath);
  const locationPhoto =
    Array.isArray(locationData?.verification_photos) && typeof locationData.verification_photos[0] === "string"
      ? locationData.verification_photos[0]
      : null;
  const evidencePhotos = [primaryPhotoUrl, secondaryPhotoUrl || locationPhoto].filter((value): value is string => Boolean(value));

  return NextResponse.json({
    found: true,
    case: {
      id: typeof violation.id === "string" ? violation.id : null,
      case_number: caseNumberText || null,
      notice_number: caseNumberText || fallbackNotice || null,
      plate: typeof violation.plate === "string" ? violation.plate : plate || null,
      location_id: (locationData?.display_id as string | null | undefined) ?? lookupLocationId ?? null,
      violation_time:
        (typeof violation.issued_at === "string" && violation.issued_at) ||
        (typeof violation.created_at === "string" && violation.created_at) ||
        null,
      violation_type: (typeof violation.violation_type === "string" && violation.violation_type) || "Parking Violation",
      amount_due:
        typeof violation.fine_amount === "number"
          ? violation.fine_amount
          : typeof violation.fine_amount === "string"
            ? Number(violation.fine_amount)
            : null,
      status: (typeof violation.status === "string" && violation.status) || "Issued",
      photo_url: evidencePhotos[0] ?? null,
      evidence_photos: evidencePhotos.slice(0, 2),
    },
    location: {
      name: (locationData?.name as string | null | undefined) ?? null,
      slug: (locationData?.canonical_slug as string | null | undefined) ?? null,
      display_id: (locationData?.display_id as string | null | undefined) ?? null,
      photos: (locationData?.verification_photos as string[] | null | undefined) ?? null,
      latitude: (locationData?.latitude as number | null | undefined) ?? null,
      longitude: (locationData?.longitude as number | null | undefined) ?? null,
    },
    supportEmail: "payparq@outlook.com",
  });
}
