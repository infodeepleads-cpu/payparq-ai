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

    // 2. Define Uber-style Vehicle Classes with Multipliers (Zagreb Real-world rates)
    const vehicleClasses = [
      {
        id: 'parq_go',
        name: 'Parq Go',
        base_fare: 0.80,
        per_km: 0.47,
        per_min: 0.08,
        multiplier: 1.0,
        description: 'Like UberX, quick and affordable',
        capacity: 4
      },
      {
        id: 'parq_taxi',
        name: 'Parq & Taxi',
        base_fare: 1.20,
        per_km: 0.60,
        per_min: 0.12,
        multiplier: 1.0,
        description: 'Free parking spot + 2 rides included',
        capacity: 4
      },
      {
        id: 'comfort',
        name: 'Comfort',
        base_fare: 1.00,
        per_km: 0.55,
        per_min: 0.10,
        multiplier: 1.2,
        description: 'Newer cars with extra legroom',
        capacity: 4
      },
      {
        id: 'van',
        name: 'Van',
        base_fare: 2.00,
        per_km: 0.80,
        per_min: 0.15,
        multiplier: 1.5,
        description: 'Large cars for groups up to 6',
        capacity: 6
      },
      {
        id: 'smart_arrival',
        name: 'Smart Arrival',
        base_fare: 1.50,
        per_km: 0.50,
        per_min: 0.10,
        multiplier: 1.6,
        description: 'Guaranteed return ride for your trip',
        capacity: 4
      }
    ];

    // Calculate Surge Multiplier based on time and day
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const month = now.getMonth(); // 0 = January, 7 = August
    let surgeMultiplier = 1.0;

    // Regional Pricing Adjustment (Summer Season in Coastal Areas)
    // Checking if the zone is coastal (Split, Dubrovnik, Zadar, Istria)
    const coastalZones = ['split', 'dubrovnik', 'zadar', 'rijeka', 'istria'];
    const isCoastal = coastalZones.includes(h3_zone_id.toLowerCase());
    const isSummerSeason = month >= 5 && month <= 8; // June to September

    if (isCoastal && isSummerSeason) {
      surgeMultiplier *= 1.4; // Summer tourist surge for coastal areas
    }

    // Morning rush hour (7-9)
    if (hour >= 7 && hour <= 9) surgeMultiplier *= 1.4;
    // Evening rush hour (16-18)
    if (hour >= 16 && hour <= 18) surgeMultiplier *= 1.5;
    // Night surge (22-04)
    if (hour >= 22 || hour <= 4) surgeMultiplier *= 1.3;
    // Weekend boost
    if (day === 0 || day === 6) surgeMultiplier *= 1.1;

    // Random demand fluctuation (±10%)
    surgeMultiplier *= (0.9 + Math.random() * 0.2);

    const distance_km = dist_meters / 1000;
    const duration_min = time_seconds / 60;

    const estimates = vehicleClasses.map(vClass => {
      let fare = (vClass.base_fare + (distance_km * vClass.per_km) + (duration_min * vClass.per_min)) * vClass.multiplier * surgeMultiplier;
      
      if (is_payparq_lot) {
        fare = fare * 0.9; // 10% PayParq Discount
      }

      // Minimum fare check (Uber style)
      const minFare = 1.70 * vClass.multiplier;
      if (fare < minFare) fare = minFare;

      return {
        ...vClass,
        fare: parseFloat(fare.toFixed(2)),
        currency: 'EUR',
        surge_multiplier: parseFloat(surgeMultiplier.toFixed(2)),
        arrival_estimate: Math.floor(Math.random() * 5) + 2
      };
    });

    // 3. Return multi-class estimates
    return NextResponse.json({
      estimates,
      distance_km: distance_km.toFixed(1),
      duration_min: Math.round(duration_min),
      is_payparq_discounted: is_payparq_lot
    });

  } catch (error: any) {
    console.error('Fare estimate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
