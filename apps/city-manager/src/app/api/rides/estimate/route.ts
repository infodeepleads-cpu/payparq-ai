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

    // 2. Calculate Fare using Uber 2026 Logic (Directly in TS as fallback for missing RPC)
    const base_fare = 2.50;
    const per_km_rate = 1.20;
    const per_min_rate = 0.25;
    
    const distance_km = dist_meters / 1000;
    const duration_min = time_seconds / 60;
    
    let calculated_fare = base_fare + (distance_km * per_km_rate) + (duration_min * per_min_rate);
    
    // Apply PayParq Discount if applicable
    if (is_payparq_lot) {
      calculated_fare = calculated_fare * 0.9; // 10% discount
    }

    // Attempt to call RPC, but fallback to TS calculation if it fails
    let final_fare = calculated_fare;
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { data: rpcFare, error: rpcError } = await supabase.rpc('calculate_uber_fare', {
        dist_meters: dist_meters,
        time_seconds: time_seconds,
        h3_zone_id: h3_zone_id,
        is_payparq_lot: is_pay_parq_lot
      });
      
      if (!rpcError && rpcFare) {
        final_fare = rpcFare;
      } else {
        console.warn("RPC failed or not found, using TypeScript fallback calculation.");
      }
    } catch (e) {
      console.warn("Supabase RPC call failed, using fallback:", e);
    }

    // 3. Return Upfront Price Estimate
    return NextResponse.json({
      fare: final_fare,
      currency: 'EUR',
      distance_km: distance_km.toFixed(1),
      duration_min: Math.round(duration_min),
      breakdown: {
        base_fare: base_fare,
        is_payparq_discounted: is_pay_parq_lot,
        surge_multiplier: 1.0
      }
    });

  } catch (error: any) {
    console.error('Fare estimate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
