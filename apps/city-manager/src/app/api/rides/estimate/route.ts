import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin for RPC calls
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Note: Use Service Role for calculations

export async function POST(request: Request) {
  try {
    const { pickup, destination, h3Index, isPayParqLot } = await request.json();

    if (!pickup || !destination || !h3Index) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 1. Fetch Distance & Time from Mapbox (Mocking for now as we don't have the API key in context)
    // In production, you would call: https://api.mapbox.com/directions-matrix/v1/mapbox/driving/...
    
    // MOCK DATA (e.g., 5.2km, 12 minutes)
    const mockDistMeters = 5200;
    const mockTimeSeconds = 720;

    // 2. Call Postgres RPC for Fare Calculation
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: fare, error } = await supabase.rpc('calculate_uber_fare', {
      dist_meters: mockDistMeters,
      time_seconds: mockTimeSeconds,
      h3_zone_id: h3Index,
      is_payparq_lot: isPayParqLot || false
    });

    if (error) throw error;

    // 3. Return Upfront Price Estimate
    return NextResponse.json({
      price: fare,
      currency: 'EUR',
      distance_km: (mockDistMeters / 1000).toFixed(1),
      duration_min: Math.round(mockTimeSeconds / 60),
      breakdown: {
        base_fare: 2.50,
        is_payparq_discounted: isPayParqLot || false,
        surge_multiplier: 1.0 // This would come from the RPC logic
      }
    });

  } catch (error: any) {
    console.error('Fare estimate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
