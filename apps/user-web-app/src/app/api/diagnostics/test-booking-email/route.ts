import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const FROM = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PayParq <team@info.payparq.com>';

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to');
  if (!to) return NextResponse.json({ error: 'missing ?to= param' }, { status: 400 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

  const resend = new Resend(resendKey);

  const fakeSessionId = 'cs_test_diagnostics_' + Date.now();
  const reservationCode = 'RZ-' + (1000 + (Math.abs(fakeSessionId.split('').reduce((h, c) => (h * 41 + c.charCodeAt(0)) & 0xffffffff, 0)) % 9000));

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `[TEST] Rezervacija potvrđena · ${reservationCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111;">
        <h2 style="margin:0 0 8px;">Payparq</h2>
        <p style="color:#555;">Ovo je testni email za dijagnostiku.</p>
        <div style="background:#f4f4f5;border-radius:12px;padding:16px;margin-top:16px;">
          <div style="font-size:11px;color:#999;">Rezervacija potvrđena</div>
          <div style="font-size:16px;font-weight:700;margin-top:4px;">${reservationCode}</div>
          <div style="margin-top:12px;font-size:12px;color:#666;">Lokacija: Test Parking · Od: 24.04.2026 10:00 · Kraj: 25.04.2026 10:00 · Cijena: 15,00 €</div>
        </div>
        <p style="margin-top:20px;font-size:11px;color:#aaa;">RESEND_API_KEY: ${resendKey.slice(0,8)}... FROM: ${FROM}</p>
      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ ok: false, error, from: FROM }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id, to, from: FROM, reservationCode });
}
