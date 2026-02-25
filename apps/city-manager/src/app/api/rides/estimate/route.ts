import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin for RPC calls
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Note: Use Service Role for calculations

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Estimate API Request Body:", body);
    
    // Support both old and new field names for backward compatibility
    const dist_meters = body.dist_meters || body.distance_meters;
    const time_seconds = body.time_seconds || body.duration_seconds;
    const h3_zone_id = body.h3_zone_id || body.h3Index;
    const is_payparq_lot = body.is_payparq_lot || body.isPayParqLot || false;

    if (!dist_meters || !time_seconds || !h3_zone_id) {
      return NextResponse.json({ 
        error: "Missing required parameters", 
        received: { dist_meters, time_seconds, h3_zone_id } 
      }, { status: 400 });
    }

    // 2. Call Postgres RPC for Fare Calculation
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: fare, error } = await supabase.rpc('calculate_uber_fare', {
      dist_meters: dist_meters,
      time_seconds: time_seconds,
      h3_zone_id: h3_zone_id,
      is_payparq_lot: is_payparq_lot
    });

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    // 3. Return Upfront Price Estimate
    return NextResponse.json({
      fare: fare, // Ensure we return the key expected by the frontend
      currency: 'EUR',
      distance_km: (dist_meters / 1000).toFixed(1),
      duration_min: Math.round(time_seconds / 60),
      breakdown: {
        base_fare: 2.50,
        is_payparq_discounted: is_payparq_lot,
        surge_multiplier: 1.0
      }
    });

  } catch (error: any) {
    console.error('Fare estimate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
