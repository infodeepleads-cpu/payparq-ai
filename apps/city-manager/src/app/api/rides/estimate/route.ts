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

    // 2. Define Uber-style Vehicle Classes with Multipliers
    const vehicleClasses = [
      {
        id: 'economy',
        name: 'Economy',
        base_fare: 2.50,
        per_km: 1.20,
        per_min: 0.25,
        multiplier: 1.0,
        image: '/cars/economy.png',
        description: 'Affordable, everyday rides',
        capacity: 4
      },
      {
        id: 'comfort',
        name: 'Comfort',
        base_fare: 3.50,
        per_km: 1.50,
        per_min: 0.35,
        multiplier: 1.3,
        image: '/cars/comfort.png',
        description: 'Newer cars with extra legroom',
        capacity: 4
      },
      {
        id: 'lux',
        name: 'Lux',
        base_fare: 5.00,
        per_km: 2.50,
        per_min: 0.50,
        multiplier: 2.0,
        image: '/cars/lux.png',
        description: 'Premium rides in high-end cars',
        capacity: 4
      }
    ];

    const distance_km = dist_meters / 1000;
    const duration_min = time_seconds / 60;

    const estimates = vehicleClasses.map(vClass => {
      let fare = (vClass.base_fare + (distance_km * vClass.per_km) + (duration_min * vClass.per_min)) * vClass.multiplier;
      
      if (is_payparq_lot) {
        fare = fare * 0.9; // 10% PayParq Discount
      }

      return {
        ...vClass,
        fare: parseFloat(fare.toFixed(2)),
        currency: 'EUR',
        arrival_estimate: Math.floor(Math.random() * 5) + 2 // Mock 2-7 min arrival
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
