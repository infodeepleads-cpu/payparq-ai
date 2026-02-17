 import { NextRequest, NextResponse } from "next/server";
 import { supabaseAdmin } from "@/lib/supabaseAdmin";
 import { supabase } from "@/lib/supabase";
 
 export async function GET(req: NextRequest) {
   const client = supabaseAdmin ?? supabase;
   const url = new URL(req.url);
   const plate = (url.searchParams.get("plate") || "").toUpperCase().trim();
   const location_id = (url.searchParams.get("location_id") || "").trim();
 
   if (!plate || !/^\d{5}$/.test(location_id)) {
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
 
   // 1. Resolve Location (using 5-digit ID)
  // The mobile scanner uses "display_id" or a UUID.
  // If the user enters a 5-digit ID, we assume it's `display_id`.
  const { data: locationData, error: locError } = await client
    .from("locations")
    .select("id, name, display_id, canonical_slug, verification_photos")
    .eq("display_id", location_id)
    .maybeSingle();

  if (locError) {
    console.error("Location lookup error:", locError);
    // Fallback: continue, maybe plate search works globally (though risky for privacy)
    // Actually, we require location ID for security.
    return NextResponse.json({ found: false, error: "Location not found" });
  }

  if (!locationData) {
    return NextResponse.json({ found: false, error: "Invalid Location ID" });
  }

  const locationUuid = locationData.id;

  // 2. Query 'violations' table (primary source for enforcement cases)
  // This table is used by the mobile scanner app.
  const { data: violation, error: violationError } = await client
    .from("violations")
    .select("*")
    .eq("location_id", locationUuid)
    .ilike("plate", plate) // Case-insensitive plate match
    .maybeSingle();

  if (violationError) {
    console.error("Violation lookup error:", violationError);
  }

  if (violation) {
    // Construct public URL for evidence if available
    let photoUrl = null;
    if (violation.evidence_r2_url) {
      const { data: publicUrlData } = client.storage
        .from("evidence")
        .getPublicUrl(violation.evidence_r2_url);
      photoUrl = publicUrlData.publicUrl;
    }

    return NextResponse.json({
      found: true,
      case: {
        id: violation.id,
        notice_number: violation.id.slice(0, 8).toUpperCase(), // Use UUID prefix as notice number if not present
        plate: violation.plate,
        location_id: location_id,
        violation_time: violation.issued_at || violation.created_at,
        violation_type: violation.violation_type || "Parking Violation",
        amount_due: violation.fine_amount,
        status: violation.status,
        photo_url: photoUrl,
      },
      location: {
        name: locationData.name,
        slug: locationData.canonical_slug,
        photos: locationData.verification_photos,
      },
    });
  }

  // 3. Fallback: Check 'parking_sessions' for unpaid sessions (optional, maybe not "Cases")
  // If a user has an unpaid session, maybe we show it?
  // For now, let's stick to 'violations' as the source of truth for "Cases".

  return NextResponse.json({ found: false });
 }
