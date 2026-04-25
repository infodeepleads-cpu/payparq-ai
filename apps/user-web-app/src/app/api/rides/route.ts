import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    const status = req.nextUrl.searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('ride_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status === 'pending') {
      query = query.eq('status', 'pending');
    } else if (status === 'accepted') {
      query = query.eq('driver_id', userId).eq('status', 'accepted');
    } else if (status === 'completed') {
      query = query.eq('driver_id', userId).eq('status', 'completed');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { ride_id, driver_id, action } = await req.json();

    if (!ride_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      if (!driver_id) {
        return NextResponse.json(
          { error: 'Missing driver_id' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from('ride_requests')
        .update({
          driver_id,
          status: 'accepted',
        })
        .eq('id', ride_id);

      if (updateError) throw updateError;

      // Update performance
      await updatePerformance(driver_id, 'accepted');

      return NextResponse.json({ success: true, action: 'accepted' });
    }

    if (action === 'decline') {
      // Get the driver_id if not provided
      const { data: ride } = await supabaseAdmin
        .from('ride_requests')
        .select('driver_id')
        .eq('id', ride_id)
        .single();

      const driverId = ride?.driver_id || driver_id;

      const { error: updateError } = await supabaseAdmin
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('id', ride_id);

      if (updateError) throw updateError;

      if (driverId) {
        await updatePerformance(driverId, 'declined');
      }

      return NextResponse.json({ success: true, action: 'declined' });
    }

    if (action === 'complete') {
      const { data: ride } = await supabaseAdmin
        .from('ride_requests')
        .select('driver_id')
        .eq('id', ride_id)
        .single();

      const driverId = ride?.driver_id;

      const { error: updateError } = await supabaseAdmin
        .from('ride_requests')
        .update({ status: 'completed' })
        .eq('id', ride_id);

      if (updateError) throw updateError;

      if (driverId) {
        // Increment completed count and add points
        const { data: perf } = await supabaseAdmin
          .from('driver_performance')
          .select('*')
          .eq('driver_id', driverId)
          .single();

        if (perf) {
          await supabaseAdmin
            .from('driver_performance')
            .update({
              completed_count: perf.completed_count + 1,
              total_score: perf.total_score + 10,
            })
            .eq('driver_id', driverId);
        }
      }

      return NextResponse.json({ success: true, action: 'completed' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

async function updatePerformance(driverId: string, action: 'accepted' | 'declined') {
  try {
    const { data: current } = await supabaseAdmin
      .from('driver_performance')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (!current) {
      await supabaseAdmin.from('driver_performance').insert({
        driver_id: driverId,
        accepted_count: action === 'accepted' ? 1 : 0,
        declined_count: action === 'declined' ? 1 : 0,
        completed_count: 0,
        accept_rate: action === 'accepted' ? 100 : 0,
        total_score: action === 'accepted' ? 100 : 0,
      });
    } else {
      const newAccepted = current.accepted_count + (action === 'accepted' ? 1 : 0);
      const newDeclined = current.declined_count + (action === 'declined' ? 1 : 0);
      const total = newAccepted + newDeclined;
      const acceptRate = total > 0 ? (newAccepted / total) * 100 : 0;

      await supabaseAdmin
        .from('driver_performance')
        .update({
          accepted_count: newAccepted,
          declined_count: newDeclined,
          accept_rate: acceptRate,
          total_score: Math.max(0, current.total_score + (action === 'accepted' ? 5 : -10)),
        })
        .eq('driver_id', driverId);
    }
  } catch (error) {
    console.error('Failed to update performance:', error);
  }
}
