import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { lot_id, customer_email } = await req.json();

    if (!lot_id) {
      return NextResponse.json(
        { error: 'Missing required field: lot_id' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 500 }
      );
    }

    // Get lot details
    const { data: lot } = await supabaseAdmin
      .from('locations')
      .select('id, name')
      .eq('id', lot_id)
      .single();

    if (!lot) {
      return NextResponse.json(
        { error: 'Lot not found' },
        { status: 404 }
      );
    }

    // Create ride request
    const { data: rideRequest, error: createError } = await supabaseAdmin
      .from('ride_requests')
      .insert({
        lot_id,
        status: 'pending',
        customer_email: customer_email || null,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Trigger notification broadcast to available drivers
    const notificationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/events/trigger`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'p2t_checkout',
          lot_id,
          data: {
            lot_id,
            lot_name: lot.name,
            ride_id: rideRequest.id,
            customer_email,
          },
          triggered_by: 'mobile_scanner',
        }),
      }
    );

    if (!notificationResponse.ok) {
      console.error('Failed to broadcast notification');
      // Don't fail the ride creation if notification fails
    }

    return NextResponse.json({
      success: true,
      ride_id: rideRequest.id,
      message: 'Ride request created and drivers notified',
    });
  } catch (error) {
    console.error('Ride creation error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
