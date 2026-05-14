import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function deriveReservationCode(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 41 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  return `RZ-${1000 + (Math.abs(hash) % 9000)}`;
}

async function buildEmailHtml(params: {
  sessionId: string;
  reservationCode: string;
  email: string;
  locationName: string | null;
  locationDisplayId: string | null;
  entryTime: string;
  exitTime: string;
  plate?: string;
  address?: string;
  coverPhoto?: string | null;
}): Promise<string> {
  const { reservationCode, email, locationName, locationDisplayId, entryTime, exitTime, plate, address, coverPhoto } = params;

  const fmt = (iso: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const fmtT = (iso: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(reservationCode)}&format=png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media only screen and (max-width:600px) {
      .card { width:100% !important; }
      .inner { padding:16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
  <tr><td align="center">
    <table class="card" cellpadding="0" cellspacing="0" style="width:100%;max-width:420px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr><td style="background:#1A3A6B;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><div style="color:#fff;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">Parking Pass</div></td>
          <td align="right"><div style="color:#fff;font-family:monospace;font-size:13px;font-weight:900;background:rgba(255,255,255,0.15);border-radius:6px;padding:5px 10px;">${reservationCode}</div></td>
        </tr></table>
      </td></tr>

      <!-- Accent bar -->
      <tr><td style="height:5px;background:linear-gradient(90deg,#2451A0 0%,#3B82F6 50%,#2451A0 100%);"></td></tr>

      <!-- Location -->
      <tr><td class="inner" style="padding:20px;">
        <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Location</div>
        <div style="font-size:18px;font-weight:900;color:#000;margin-bottom:4px;">${locationName || locationDisplayId || 'Parking'}</div>
        ${locationDisplayId ? `<div style="font-size:10px;color:#64748b;margin-bottom:6px;">#${locationDisplayId}</div>` : ''}
        ${address ? `<div style="font-size:11px;color:#64748b;line-height:1.5;margin-bottom:4px;">${address}</div>` : ''}
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 20px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- Dates -->
      <tr><td class="inner" style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:50%;padding-right:12px;vertical-align:top;">
              <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Dovezite se</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:3px;">${fmt(entryTime)}</div>
              <div style="font-size:26px;font-weight:900;color:#1A3A6B;font-family:monospace;line-height:1;">${fmtT(entryTime)}</div>
            </td>
            <td style="width:50%;padding-left:12px;vertical-align:top;border-left:1px solid #e2e8f0;">
              <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Odvezite se</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:3px;">${fmt(exitTime)}</div>
              <div style="font-size:26px;font-weight:900;color:#1A3A6B;font-family:monospace;line-height:1;">${fmtT(exitTime)}</div>
            </td>
          </tr>
        </table>
      </td></tr>

      ${plate ? `
      <!-- Divider -->
      <tr><td style="padding:0 20px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>
      <!-- Plate -->
      <tr><td class="inner" style="padding:16px 20px;">
        <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Registarska pločica</div>
        <div style="font-size:18px;font-weight:900;font-family:monospace;letter-spacing:4px;color:#000;">${plate}</div>
      </td></tr>` : ''}

      <!-- Divider dashed -->
      <tr><td style="padding:0 20px;"><div style="border-top:2px dashed #2451A0;"></div></td></tr>

      <!-- QR Code -->
      <tr><td class="inner" style="padding:20px;text-align:center;">
        <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Scan QR Code</div>
        <div style="display:inline-block;border:2px solid #2451A0;border-radius:10px;padding:10px;background:#fff;">
          <img src="${qrUrl}" width="140" height="140" alt="QR Code" style="display:block;" />
        </div>
        <div style="font-family:monospace;font-size:11px;color:#64748b;margin-top:8px;">${reservationCode}</div>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 20px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

      <!-- Footer -->
      <tr><td style="background:#F0F5FF;padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Total Paid</div>
            <div style="font-size:22px;font-weight:900;color:#1A3A6B;">€0.00</div>
          </td>
          <td align="right" style="vertical-align:bottom;">
            ${email ? `<div style="font-family:monospace;font-size:10px;color:#94a3b8;margin-bottom:4px;">${email}</div>` : ''}
            <div style="color:#2451A0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">✓ VALID</div>
          </td>
        </tr></table>
      </td></tr>

      <!-- Kako doći -->
      <tr><td style="background:#F0F5FF;border-top:1px solid #CBD5E1;border-bottom:1px solid #CBD5E1;padding:10px 20px;">
        <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;">Kako doći · Getting There</div>
      </td></tr>
      <tr><td class="inner" style="padding:16px 20px;">
        ${locationName || address ? `<div style="font-size:14px;font-weight:700;color:#000;margin-bottom:4px;">${locationName || ''}</div>` : ''}
        ${address ? `<div style="font-size:12px;color:#64748b;margin-bottom:12px;">${address}</div>` : ''}
        ${address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" style="display:table;background:#EBF0FA;border:1px solid #2451A0;border-radius:12px;padding:10px 16px;text-decoration:none;">
          <span style="color:#1A3A6B;font-size:13px;font-weight:700;">Otvori u Google Maps</span>
        </a>` : '<div style="font-size:12px;color:#94a3b8;font-style:italic;">Adresa nije dostupna</div>'}
        ${coverPhoto ? `<div style="margin-top:12px;border-radius:10px;overflow:hidden;border:1px solid #CBD5E1;"><img src="${coverPhoto}" width="100%" style="display:block;max-height:180px;object-fit:cover;" alt="Ulaz parkinga" /></div>` : ''}
      </td></tr>

      <!-- Upute -->
      <tr><td style="background:#F0F5FF;border-top:1px solid #CBD5E1;border-bottom:1px solid #CBD5E1;padding:10px 20px;">
        <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;">Upute za korištenje · Instructions</div>
      </td></tr>
      <tr><td class="inner" style="padding:8px 20px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F0;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:top;padding-right:12px;">
                <div style="width:22px;height:22px;border-radius:50%;background:#2451A0;text-align:center;line-height:22px;font-size:10px;font-weight:900;color:#fff;">1</div>
              </td>
              <td style="vertical-align:top;">
                <div style="font-size:13px;font-weight:700;color:#000;">Dovezite se unutra</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;line-height:1.5;">Uđite direktno na parking. Ako je rampa zatvorena, pritisnite gumb ili nazovite broj za hitne slučajeve.</div>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F0;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:top;padding-right:12px;">
                <div style="width:22px;height:22px;border-radius:50%;background:#2451A0;text-align:center;line-height:22px;font-size:10px;font-weight:900;color:#fff;">2</div>
              </td>
              <td style="vertical-align:top;">
                <div style="font-size:13px;font-weight:700;color:#000;">Parkirajte</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;line-height:1.5;">Pronađite slobodan spot i parkirajte. Ako je prisutan attendant, pokažite mu ovaj pass.</div>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:10px 0;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:top;padding-right:12px;">
                <div style="width:22px;height:22px;border-radius:50%;background:#2451A0;text-align:center;line-height:22px;font-size:10px;font-weight:900;color:#fff;">3</div>
              </td>
              <td style="vertical-align:top;">
                <div style="font-size:13px;font-weight:700;color:#000;">Odvezite se van</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;line-height:1.5;">Izađite s parkinga slobodno. Ako je rampa zatvorena, nazovite broj za hitne slučajeve.</div>
              </td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>

      <!-- Kontakt -->
      <tr><td style="background:#F0F5FF;border-top:1px solid #CBD5E1;border-bottom:1px solid #CBD5E1;padding:10px 20px;">
        <div style="color:#2451A0;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;">Kontakt · Support</div>
      </td></tr>
      <tr><td class="inner" style="padding:16px 20px;space-y:8px;">
        <a href="tel:+385915963139" style="display:block;background:#EBF0FA;border:1px solid #CBD5E1;border-radius:12px;padding:12px 16px;text-decoration:none;margin-bottom:8px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#2451A0;">PayParq Priority Support</div>
          <div style="font-size:15px;font-weight:900;color:#000;margin-top:2px;">+385 91 596 3139</div>
        </a>
        <div style="background:#EBF0FA;border:1px solid #CBD5E1;border-radius:12px;padding:12px 16px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#2451A0;">Lot Emergency Number</div>
          <div style="font-size:13px;font-weight:500;color:#94a3b8;margin-top:2px;">Prikazat će se pri dolasku</div>
        </div>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:12px 20px;text-align:center;">
        <div style="font-size:9px;color:#cbd5e1;">© 2026 PayParq · payparq.com</div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location_id, email, plate, phone, check_in, check_out, promo_code } = body;

    if (!location_id) {
      return NextResponse.json({ error: 'missing_location_id' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 500 });
    }

    const entryTime = check_in ? new Date(check_in).toISOString() : new Date().toISOString();
    const exitTime = check_out ? new Date(check_out).toISOString() : new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 60000));
    const sessionId = `free_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const { error } = await supabaseAdmin.from('parking_sessions').insert({
      location_id,
      plate: plate || 'FREE_SESSION',
      mobile: phone || '',
      email: email || '',
      price: 0,
      currency: 'eur',
      stripe_session_id: sessionId,
      payment_status: 'paid',
      status: 'active',
      entry_time: entryTime,
      exit_time: exitTime,
      quantity: 1,
      duration_minutes: durationMinutes,
      stripe_metadata: JSON.stringify({
        location_id,
        check_in,
        check_out,
        ...(promo_code ? { promo_code } : {}),
        source: 'free_promo',
      }),
    });

    if (error) {
      console.error('Free session insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Always fetch location data (needed for cover photo + email)
    let locationName: string | null = null;
    let locationDisplayId: string | null = null;
    let locationAddress: string | null = null;
    let coverPhoto: string | null = null;
    try {
      const { data: locRow, error: locErr } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('id', location_id)
        .maybeSingle();
      console.log('📸 locRow found:', !!locRow, 'locErr:', locErr?.message, 'location_id:', location_id);
      if (locRow) {
        // Dump all keys that might contain photo data
        const photoKeys = Object.keys(locRow).filter(k => k.toLowerCase().includes('photo') || k.toLowerCase().includes('image'));
        console.log('📸 photo-related keys:', photoKeys);
        for (const k of photoKeys) {
          console.log(`📸 ${k}:`, JSON.stringify((locRow as Record<string,unknown>)[k])?.slice(0, 200));
        }
        // Also dump verification_metadata
        console.log('📸 verification_metadata:', JSON.stringify((locRow as Record<string,unknown>).verification_metadata)?.slice(0, 300));

        locationName = (locRow as { name?: string | null }).name ?? null;
        locationDisplayId = (locRow as { display_id?: string | null }).display_id ?? null;
        locationAddress = (locRow as { address?: string | null }).address ?? null;
        const rawVp = (locRow as { verification_photos?: unknown }).verification_photos;
        const rawPhotos = (locRow as { photos?: unknown }).photos;
        const vpArr: string[] = Array.isArray(rawVp) ? rawVp : (typeof rawVp === 'string' ? (() => { try { return JSON.parse(rawVp); } catch { return []; } })() : []);
        const photosArr: string[] = Array.isArray(rawPhotos) ? rawPhotos : (typeof rawPhotos === 'string' ? (() => { try { return JSON.parse(rawPhotos); } catch { return []; } })() : []);
        const meta = (locRow as { verification_metadata?: Record<string, unknown> | null }).verification_metadata;
        const metaUrls: string[] = Array.isArray(meta?.photo_urls) ? (meta!.photo_urls as string[]) : [];
        const metaPhotos: string[] = Array.isArray(meta?.photos) ? (meta!.photos as string[]) : [];
        const fallback = (locRow as { photo?: string | null }).photo;
        coverPhoto = (vpArr.length > 0 ? vpArr[0] : null) ?? (photosArr.length > 0 ? photosArr[0] : null) ?? (metaUrls.length > 0 ? metaUrls[0] : null) ?? (metaPhotos.length > 0 ? metaPhotos[0] : null) ?? fallback ?? null;
        console.log('📸 coverPhoto resolved:', coverPhoto);
      }
    } catch (e) { console.error('📸 locRow fetch error:', e); }

    // Send parking pass email
    const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_SECRET_KEY;
    const fromAddress = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PayParq <team@info.payparq.com>';
    const normalizedEmail = (email ?? '').trim().toLowerCase();

    if (normalizedEmail && resendKey) {
      try {
        const reservationCode = deriveReservationCode(sessionId);
        const html = await buildEmailHtml({
          sessionId,
          reservationCode,
          email: normalizedEmail,
          locationName,
          locationDisplayId,
          entryTime,
          exitTime,
          plate: plate || undefined,
          address: locationAddress || undefined,
          coverPhoto,
        });

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromAddress, to: normalizedEmail, subject: `Rezervacija potvrđena · ${reservationCode}`, html }),
        });
        const resBody = await res.text().catch(() => '');
        console.log(`📧 Free session email: ${res.status} to ${normalizedEmail} — ${resBody}`);
      } catch (e) {
        console.error('📧 Free session email error:', e);
      }
    }

    return NextResponse.json({ ok: true, session_id: sessionId, cover_photo: coverPhoto });
  } catch (err) {
    console.error('Free session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
