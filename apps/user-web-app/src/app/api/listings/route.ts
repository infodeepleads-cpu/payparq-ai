import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = supabaseAdmin;
    if (!client) {
      return NextResponse.json({ locations: [], error: 'supabase_not_configured' }, { status: 500 });
    }
    const { data: locations, error } = await client
      .from('locations')
      .select('*')
      .limit(100);

    if (error) {
      console.error('Listings API error:', error);
      return NextResponse.json({ locations: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ locations: locations || [] });
  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json({ locations: [], error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || !supabaseAdmin) {
      return NextResponse.json({ error: 'Neovlašteno' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Neovlašteno' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const type = formData.get('type') as string;
    const capacity = formData.get('capacity') as string;
    const features = JSON.parse((formData.get('features') as string) || '[]');
    const openTime = formData.get('openTime') as string;
    const closeTime = formData.get('closeTime') as string;
    const smartPricing = formData.get('smartPricing') === 'true';
    const permits = formData.get('permits') as string;
    const vehicleSize = formData.get('vehicleSize') as string;
    const maxHeight = formData.get('maxHeight') as string;
    const available24_7 = formData.get('available24_7') === 'true';
    const daysAvailable = JSON.parse((formData.get('daysAvailable') as string) || '[]');
    const acceptMonthlyBookings = formData.get('acceptMonthlyBookings') === 'true';
    const acceptHourlyDailyBookings = formData.get('acceptHourlyDailyBookings') === 'true';
    const pricingModel = formData.get('pricingModel') as string;
    const additionalDescription = formData.get('additionalDescription') as string;
    const postBookingInstructions = formData.get('postBookingInstructions') as string;
    const photoUrls: string[] = [];

    // Validate required fields
    if (!name || !address || !latitude || !longitude || !type || !capacity || features.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const files = formData.getAll('photos') as File[];
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
        capacity: parseInt(capacity) || 1,
        total_spots: parseInt(capacity) || 1,
        verification_metadata: {
          listing_status: 'pending',
          hub_enabled: true,
          section_status: { section1: true, section2: true, section3: true },
          type,
          capacity,
          features,
          openTime,
          closeTime,
          smartPricing,
          permits,
          vehicleSize,
          maxHeight,
          available24_7,
          daysAvailable,
          acceptMonthlyBookings,
          acceptHourlyDailyBookings,
          pricingModel,
          additionalDescription,
          getting_there: postBookingInstructions,
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
