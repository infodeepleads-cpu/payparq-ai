import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const {
      user_id,
      fcm_token,
      device_type, // 'android', 'ios', 'web'
      endpoint,
      auth,
      p256dh,
    } = await req.json();

    if (!user_id || !device_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 500 }
      );
    }

    // Mobile scanner sends FCM token
    if (fcm_token && (device_type === 'android' || device_type === 'ios')) {
      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .upsert({
          user_id,
          fcm_token,
          device_type,
          endpoint: `fcm://${fcm_token}`,
          is_active: true,
        });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `FCM token registered for ${device_type}`,
      });
    }

    // Web browser sends Web Push subscription
    if (endpoint && device_type === 'web') {
      const { error } = await supabaseAdmin
        .from('push_subscriptions')
        .upsert({
          user_id,
          endpoint,
          auth,
          p256dh,
          device_type: 'web',
          is_active: true,
        });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Web Push subscription registered',
      });
    }

    return NextResponse.json(
      { error: 'Invalid subscription data' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user_id, endpoint } = await req.json();

    if (!user_id || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('endpoint', endpoint);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
