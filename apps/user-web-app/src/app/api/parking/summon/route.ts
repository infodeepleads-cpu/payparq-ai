import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const sessionId = (req.nextUrl.searchParams.get('session_id') ?? '').trim();
  const type = (req.nextUrl.searchParams.get('type') ?? 'shuttle').trim().toLowerCase();

  if (!sessionId || !['valet', 'shuttle'].includes(type)) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 500 });
  }

  try {
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('parking_sessions')
      .select('id,email,location_id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'session_not_found' },
        { status: 404 }
      );
    }

    const { data: location } = await supabaseAdmin
      .from('locations')
      .select('name,display_id')
      .eq('id', session.location_id)
      .maybeSingle();

    const label = type === 'shuttle' ? 'shuttle vozača' : 'valet attendanta';
    const locName = (location?.name ?? 'lokaciji') as string;
    const whatsappMsg = encodeURIComponent(`Pozdrav! Pozivam ${label} na lokaciji: ${locName}. Molim hitnu pomoć.`);
    const whatsappUrl = `https://wa.me/385915963139?text=${whatsappMsg}`;

    const typeName = type === 'shuttle' ? 'Shuttle' : 'Valet';
    const typeEmoji = type === 'shuttle' ? '🚐' : '🚗';
    const eta = type === 'shuttle' ? '3–8 min' : '6 min';

    const html = `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${typeName} pozvan</title>
</head>
<body style="font-family:Arial,sans-serif;padding:40px;text-align:center;background:#f4f4f5;">
  <div style="max-width:400px;margin:0 auto;background:#fff;padding:40px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-size:48px;margin-bottom:16px;">${typeEmoji}</div>
    <h1 style="color:#0F6E56;margin:0 0 16px 0;">${typeName} je pozvan</h1>
    <p style="color:#666;margin:0 0 8px 0;">Vozač će stići za otprilike <strong>${eta}</strong></p>
    <p style="color:#999;font-size:14px;margin:16px 0 24px 0;">Lokacija: <strong>${locName}</strong></p>

    <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer"
       style="display:block;margin-bottom:12px;padding:12px 32px;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
      Kontaktiraj putem WhatsAppa
    </a>

    <a href="https://www.payparq.com/success?session_id=${encodeURIComponent(sessionId)}"
       style="display:block;padding:12px 32px;background:#f0f0f0;color:#333;text-decoration:none;border-radius:8px;font-weight:600;">
      Nazad na stranicu
    </a>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('[SUMMON] Error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
