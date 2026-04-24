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

function resolveOwnerCaseProcessFeeCents() {
  const raw = process.env.CASE_OWNER_PROCESS_FEE_CENTS ?? process.env.NEXT_PUBLIC_CASE_OWNER_PROCESS_FEE_CENTS ?? "0";
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
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

  let allViolations: Record<string, unknown>[] = [];

  if (hasCaseNumberLookup) {
    const { data, error } = await client
      .from("violations")
      .select("*")
      .eq("case_number", Number(case_number))
      .order("issued_at", { ascending: false, nullsFirst: false })
      .limit(20);

    if (error) {
      console.error("Case number lookup error:", error);
      return NextResponse.json({ found: false, error: "Case lookup failed" });
    }
    allViolations = (data as Record<string, unknown>[] | null) ?? [];
    violation = allViolations[0] ?? null;
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
      .limit(20);

    if (violationError) {
      console.error("Violation lookup error:", violationError);
    }
    allViolations = (data as Record<string, unknown>[] | null) ?? [];
    violation = allViolations[0] ?? null;
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

  const ownerCaseProcessFeeCents = resolveOwnerCaseProcessFeeCents();

  function mapViolation(v: Record<string, unknown>) {
    const caseNum = typeof v.case_number === "number" ? v.case_number : NaN;
    const caseNumText = toCaseNumberString(Number.isNaN(caseNum) ? Number(case_number) : caseNum);
    const fallbackNotice = typeof v.id === "string" ? v.id.slice(0, 8).toUpperCase() : "";
    const primaryPhotoUrl = toPublicEvidenceUrl(client!, typeof v.evidence_r2_url === "string" ? v.evidence_r2_url : null);
    const secondaryEvidencePath =
      (typeof v.evidence_r2_url_secondary === "string" && v.evidence_r2_url_secondary) ||
      (typeof v.evidence_r2_url_2 === "string" && v.evidence_r2_url_2) ||
      (typeof v.secondary_evidence_r2_url === "string" && v.secondary_evidence_r2_url) ||
      null;
    const secondaryPhotoUrl = toPublicEvidenceUrl(client!, secondaryEvidencePath);
    const evidencePhotos = [primaryPhotoUrl, secondaryPhotoUrl].filter((value): value is string => Boolean(value));
    const violationTypeRaw = (typeof v.violation_type === "string" && v.violation_type) || "Parking Violation";
    const isWarning = violationTypeRaw.toLowerCase().includes("warning");
    return {
      id: typeof v.id === "string" ? v.id : null,
      case_number: caseNumText || null,
      notice_number: caseNumText || fallbackNotice || null,
      plate: typeof v.plate === "string" ? v.plate : plate || null,
      location_id: (locationData?.display_id as string | null | undefined) ?? lookupLocationId ?? null,
      violation_time:
        (typeof v.issued_at === "string" && v.issued_at) ||
        (typeof v.created_at === "string" && v.created_at) ||
        null,
      violation_type: violationTypeRaw,
      is_warning: isWarning,
      amount_due:
        typeof v.fine_amount === "number"
          ? v.fine_amount
          : typeof v.fine_amount === "string"
            ? Number(v.fine_amount)
            : null,
      status: (typeof v.status === "string" && v.status) || "Issued",
      photo_url: evidencePhotos[0] ?? null,
      evidence_photos: evidencePhotos.slice(0, 2),
    };
  }

  const primaryCase = mapViolation(violation);
  const cases = allViolations.map(mapViolation);

  return NextResponse.json({
    found: true,
    case: primaryCase,
    cases,
    location: {
      name: (locationData?.name as string | null | undefined) ?? null,
      slug: (locationData?.canonical_slug as string | null | undefined) ?? null,
      display_id: (locationData?.display_id as string | null | undefined) ?? null,
      photos: (locationData?.verification_photos as string[] | null | undefined) ?? null,
      latitude: (locationData?.latitude as number | null | undefined) ?? null,
      longitude: (locationData?.longitude as number | null | undefined) ?? null,
    },
    finance: {
      model: "platform_case_fixed_owner_fee",
      owner_case_process_fee_cents: ownerCaseProcessFeeCents,
    },
    supportEmail: "payparq@outlook.com",
  });
}
