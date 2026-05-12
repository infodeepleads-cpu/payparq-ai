import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function ensureHostAccount(email: string, name: string, phone: string) {
  if (!supabaseAdmin) return { ok: false, userId: null };

  // Try creating first — avoids expensive list-all scan
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
    email_confirm: true,
    user_metadata: { full_name: name, phone, role: 'manager', membership_source: 'host_listing' },
  });

  if (!createError && created?.user) {
    await supabaseAdmin.from('profiles').upsert({ id: created.user.id, role: 'manager' });
    // generate + send magic link below and return
    return { ok: true, userId: created.user.id, isNew: true };
  }

  // User already exists — find by listing (email is unique so first match = correct user)
  if (createError?.message?.toLowerCase().includes('already') || createError?.message?.toLowerCase().includes('exists')) {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = listData?.users?.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
    if (existing) return { ok: true, userId: existing.id, isNew: false };
  }

  return { ok: false, userId: null };
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const formData = await req.formData();

    // Contact
    const ownerName    = (formData.get('ownerName') as string) || '';
    const ownerEmail   = (formData.get('ownerEmail') as string) || '';
    const ownerPhone   = (formData.get('ownerPhone') as string) || '';

    // Lot Info
    const lotName      = (formData.get('lotName') as string) || '';
    const address      = (formData.get('address') as string) || '';
    const latitude     = parseFloat((formData.get('latitude') as string) || '0');
    const longitude    = parseFloat((formData.get('longitude') as string) || '0');

    // Lot Specifics
    const accessType           = (formData.get('accessType') as string) || '';
    const gatedPhone           = (formData.get('gatedPhone') as string) || '';
    const heightLimit          = (formData.get('heightLimit') as string) || '';
    const widthLimit           = (formData.get('widthLimit') as string) || '';
    const exoticVehicles       = (formData.get('exoticVehicles') as string) || '';
    const ownerComment         = (formData.get('ownerComment') as string) || '';
    const accessInstructions   = (formData.get('accessInstructions') as string) || '';
    const addons               = JSON.parse((formData.get('addons') as string) || '[]') as string[];
    const is247                = formData.get('is247') === 'true';
    const openDays             = JSON.parse((formData.get('openDays') as string) || '[]') as string[];
    const hoursFrom            = (formData.get('hoursFrom') as string) || '00:00';
    const hoursTo              = (formData.get('hoursTo') as string) || '23:59';
    const baseSpots            = parseInt((formData.get('baseSpots') as string) || '1');
    const dateConfigs          = JSON.parse((formData.get('dateConfigs') as string) || '{}');
    const activeSpotTypes      = JSON.parse((formData.get('activeSpotTypes') as string) || '[]') as string[];

    // Pricing
    const standardHourlyPrice  = parseFloat((formData.get('standardHourlyPrice') as string) || '0');
    const standardDailyPrice   = parseFloat((formData.get('standardDailyPrice') as string) || '0');
    const standardMonthlyPrice = parseFloat((formData.get('standardMonthlyPrice') as string) || '0');
    const useDynamicPrice      = formData.get('useDynamicPrice') === 'true';
    const minPriceHourly       = parseFloat((formData.get('minPriceHourly') as string) || '0');
    const minPriceDaily        = parseFloat((formData.get('minPriceDaily') as string) || '0');
    const minPriceMonthly      = parseFloat((formData.get('minPriceMonthly') as string) || '0');

    if (!ownerEmail || !lotName || !address) {
      return NextResponse.json({ error: 'Nedostaju obavezna polja' }, { status: 400 });
    }

    // 1. Create / find account
    const { ok, userId } = await ensureHostAccount(ownerEmail, ownerName, ownerPhone);
    if (!ok || !userId) return NextResponse.json({ error: 'Greška pri kreiranju računa' }, { status: 500 });

    // 2. Upload photos to Supabase Storage
    const photoUrls: string[] = [];
    const photoFiles = formData.getAll('photos') as File[];
    for (const file of photoFiles) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `host-listings/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabaseAdmin.storage.from('parking-photos').upload(path, buffer, { contentType: file.type });
      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage.from('parking-photos').getPublicUrl(path);
        photoUrls.push(publicUrl);
      }
    }

    // 3. Insert location
    const { data: location, error: locationError } = await supabaseAdmin
      .from('locations')
      .insert({
        owner_id: userId,
        name: lotName,
        address,
        latitude: latitude || null,
        longitude: longitude || null,
        rate_per_hour: standardHourlyPrice,
        base_price_hourly: standardHourlyPrice,
        base_price_daily: standardDailyPrice,
        base_price_monthly: standardMonthlyPrice,
        valet_enabled: addons.includes('Valet'),
        shuttle_enabled: addons.includes('Shuttle'),
        addons_config: { enabled: addons },
        capacity: baseSpots,
        total_spots: baseSpots,
        occupancy: 0,
        display_id: String((Date.now() % 90000) + 10000),
        canonical_slug: `${lotName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim() || 'lot'}-${Date.now() % 90000 + 10000}`,
        verification_status: 'pending',
        verification_metadata: {
          listing_status: 'pending',
          // Contact
          owner_name: ownerName,
          owner_phone: ownerPhone,
          // Access
          access_type: accessType,
          gated_phone: gatedPhone,
          height_limit: heightLimit,
          width_limit: widthLimit,
          exotic_vehicles: exoticVehicles,
          // Text
          things_to_know: ownerComment,
          getting_there: accessInstructions,
          // Features
          features: addons,
          amenities: addons,
          // Hours
          available24_7: is247,
          open_days: openDays,
          access_hours: is247 ? '00:00–23:59' : `${hoursFrom}–${hoursTo}`,
          openTime: hoursFrom,
          closeTime: hoursTo,
          // Capacity & Calendar
          base_spots: baseSpots,
          calendar_schedule: dateConfigs,
          // Spot types
          spot_types: activeSpotTypes,
          // Pricing
          smart_pricing: useDynamicPrice,
          dynamic_pricing: useDynamicPrice ? { min_hourly: minPriceHourly, min_daily: minPriceDaily, min_monthly: minPriceMonthly } : null,
          // Photos
          photos: photoUrls,
          verification_photos: photoUrls,
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (locationError) {
      console.error('Location insert error:', locationError);
      return NextResponse.json({ error: `Greška pri kreiranju lota: ${locationError.message} (code: ${locationError.code})` }, { status: 500 });
    }

    // 3.5 Create verification inbox entry
    if (location?.id) {
      const { error: inboxErr } = await supabaseAdmin.from('verification_inbox').insert({
        location_id: location.id,
        owner_id: userId,
        owner_name: ownerName,
        owner_email: ownerEmail,
        lot_name: lotName,
        address,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      if (inboxErr) console.error('Inbox insert error:', inboxErr);
    }

    // 4. Ensure profile role = manager
    await supabaseAdmin.from('profiles').upsert({ id: userId, role: 'manager' });

    // 5. Send magic link so host can access Moji prostori
    const { data: finalLinkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: ownerEmail,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.payparq.com'}/members?tab=moji-prostori` },
    });

    if (finalLinkData?.properties?.action_link) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PayParq Team <team@info.payparq.com>',
        to: ownerEmail,
        subject: 'Dobrodošli u Payparq - Pristupite vašem računu',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111827;background:#ffffff;">
            <h2 style="margin:0 0 16px 0;">Payparq Moji Prostori</h2>
            <p style="margin:0 0 14px 0;">Hvala što ste objavili vaše parkirno mjesto na Payparqu! Kliknite na gumb ispod za pristup vašem računu i upravljanju vašim mjestima:</p>
            <p style="margin:0 0 18px 0;">
              <a href="${finalLinkData.properties.action_link}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#5F3DFC;color:#ffffff;text-decoration:none;font-weight:600;">Otvori Moji Prostori</a>
            </p>
            <p style="margin:0 0 8px 0;color:#6B7280;font-size:12px;">Ako niste tražili ovu prijavu, slobodno zanemarite ovu poruku.</p>
            <hr style="margin:20px 0;border:none;border-top:1px solid #E5E7EB;" />
            <div style="font-size:11px;color:#6B7280;line-height:1.6;">
              <p style="margin:0 0 4px 0;"><strong>PayParq</strong></p>
              <p style="margin:0 0 4px 0;">E-pošta: payparq@outlook.com</p>
              <p style="margin:0 0 4px 0;">Sjedište: 1309 Coffeen Avenue, Suite 1200, Sheridan, WY 82801, SAD</p>
              <p style="margin:0;">EU operacije: Hrvatska - Leadvex Group LLC</p>
            </div>
          </div>
        `,
      });

      // Send admin notification
      await resend.emails.send({
        from: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PayParq Team <team@info.payparq.com>',
        to: 'admin@payparq.com',
        subject: 'Nova podnošenja za hosting - Verifikacija potrebna',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111827;background:#ffffff;">
            <h2 style="margin:0 0 16px 0;">Nova podnošenja za hosting</h2>
            <p style="margin:0 0 14px 0;">Novi lot je podnesen i trebate ga verificirati:</p>
            <table style="width:100%;margin:0 0 18px 0;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #E5E7EB;">
                <td style="padding:8px 0;"><strong>Naziv lota:</strong></td>
                <td style="padding:8px 0;">${lotName}</td>
              </tr>
              <tr style="border-bottom:1px solid #E5E7EB;">
                <td style="padding:8px 0;"><strong>Vlasnik:</strong></td>
                <td style="padding:8px 0;">${ownerName}</td>
              </tr>
              <tr style="border-bottom:1px solid #E5E7EB;">
                <td style="padding:8px 0;"><strong>E-pošta:</strong></td>
                <td style="padding:8px 0;">${ownerEmail}</td>
              </tr>
              <tr style="border-bottom:1px solid #E5E7EB;">
                <td style="padding:8px 0;"><strong>Telefon:</strong></td>
                <td style="padding:8px 0;">${ownerPhone}</td>
              </tr>
              <tr style="border-bottom:1px solid #E5E7EB;">
                <td style="padding:8px 0;"><strong>Adresa:</strong></td>
                <td style="padding:8px 0;">${address}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;"><strong>ID lokacije:</strong></td>
                <td style="padding:8px 0;">${location?.id}</td>
              </tr>
            </table>
            <p style="margin:0;color:#6B7280;font-size:12px;">Molimo da verificirate lot u Moji prostori upravljačkoj zoni.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, location_id: location?.id });
  } catch (err) {
    console.error('Host submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
