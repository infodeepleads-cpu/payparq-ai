import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const sessionId = (req.nextUrl.searchParams.get('session_id') ?? '').trim();
  const minutesParam = req.nextUrl.searchParams.get('minutes');
  const minutes = minutesParam ? Math.max(60, Math.min(2880, Number(minutesParam))) : 60;

  if (!sessionId) {
    return NextResponse.json({ error: 'missing_session_id' }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 500 });
  }

  try {
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('parking_sessions')
      .select('id,exit_time,email')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'session_not_found', html: '<h1>Sesija nije pronađena</h1><p>Molim pokušajte ponovno.</p>' },
        { status: 404 }
      );
    }

    const currentExit = new Date(session.exit_time);
    const newExit = new Date(currentExit.getTime() + minutes * 60_000);

    const { error: updateError } = await supabaseAdmin
      .from('parking_sessions')
      .update({ exit_time: newExit.toISOString(), updated_at: new Date().toISOString() })
      .eq('id', session.id);

    if (updateError) {
      return NextResponse.json({ error: 'update_failed' }, { status: 500 });
    }

    const html = `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Boravak produljen</title>
</head>
<body style="font-family:Arial,sans-serif;padding:40px;text-align:center;background:#f4f4f5;">
  <div style="max-width:400px;margin:0 auto;background:#fff;padding:40px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-size:48px;margin-bottom:16px;">✓</div>
    <h1 style="color:#0F6E56;margin:0 0 16px 0;">Boravak produljen</h1>
    <p style="color:#666;margin:0 0 8px 0;">Vaš boravak je produljen za <strong>${minutes} minuta</strong></p>
    <p style="color:#999;font-size:14px;margin:16px 0 0 0;">Novi izlazak: <strong>${newExit.toLocaleString('hr-HR')}</strong></p>
    <a href="https://www.payparq.com/success?session_id=${encodeURIComponent(sessionId)}"
       style="display:inline-block;margin-top:24px;padding:12px 32px;background:#0F6E56;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
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
    console.error('[EXTEND] Error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
