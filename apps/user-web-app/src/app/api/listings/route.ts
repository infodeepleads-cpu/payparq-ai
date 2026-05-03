import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    // Get auth from cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const type = formData.get('type') as string;
    const capacity = formData.get('capacity') as string;
    const features = JSON.parse(formData.get('features') as string);
    const openTime = formData.get('openTime') as string;
    const closeTime = formData.get('closeTime') as string;
    const smartPricing = formData.get('smartPricing') === 'true';
    const permits = formData.get('permits') as string;
    const photoUrls: string[] = [];

    // Validate required fields
    if (!name || !address || !latitude || !longitude || !type || !capacity || features.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle photo uploads (for now, just store file names as placeholder)
    // In production, these would be uploaded to Supabase Storage
    const files = formData.getAll('photos') as File[];
    if (files.length < 5) {
      return NextResponse.json({ error: 'At least 5 photos required' }, { status: 400 });
    }

    // Store photo file names (in production, upload to storage and get URLs)
    for (const file of files) {
      photoUrls.push(file.name);
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Insert location record
    const { data: location, error: locationError } = await supabaseAdmin
      .from('locations')
      .insert({
        owner_id: user.id,
        name,
        address,
        latitude,
        longitude,
        rate_per_hour: 0,
        base_price_hourly: 0,
        base_price_daily: 0,
        base_price_monthly: 0,
        valet_enabled: false,
        shuttle_enabled: false,
        addons_config: {},
        verification_metadata: {
          listing_status: 'active',
          type,
          capacity,
          features,
          openTime,
          closeTime,
          smartPricing,
          permits,
          photos: photoUrls,
          created_at: new Date().toISOString(),
        },
      })
      .select();

    if (locationError) {
      console.error('Location insert error:', locationError);
      return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
    }

    // Update user role to "manager"
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'manager' })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail here - location was created, role update is secondary
    }

    return NextResponse.json({
      success: true,
      location_id: location?.[0]?.id,
      message: 'Lot created successfully and is now live!',
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
