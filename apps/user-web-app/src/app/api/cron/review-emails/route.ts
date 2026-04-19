import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const FROM = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PayParq Team <team@info.payparq.com>';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.payparq.com';

export async function GET() {
  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'resend_not_configured' }, { status: 500 });

  // Find sessions that ended (exit_time < now), have an email, and no review row yet
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // at least 30min ago
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions } = await client
    .from('sessions')
    .select('id,email,contact_email,location_id,exit_time,stripe_metadata')
    .not('exit_time', 'is', null)
    .lt('exit_time', cutoff)
    .gt('exit_time', twoWeeksAgo)
    .eq('payment_status', 'paid')
    .limit(50);

  if (!sessions || sessions.length === 0) return NextResponse.json({ sent: 0 });

  const resend = new Resend(resendKey);
  let sent = 0;

  for (const session of sessions) {
    const email = (session.email || session.contact_email || '').trim().toLowerCase();
    if (!email) continue;

    // Check if review already exists for this session
    const { data: existing } = await client
      .from('parking_reviews')
      .select('id')
      .eq('session_id', session.id)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Fetch location name
    let locationName = 'vašu parking lokaciju';
    if (session.location_id) {
      const { data: loc } = await client.from('locations').select('name').eq('id', session.location_id).single();
      if (loc?.name) locationName = loc.name;
    }

    const token = crypto.randomBytes(24).toString('hex');
    const reviewUrl = `${BASE_URL}/review?token=${token}`;

    // Insert review placeholder
    const { error: insertErr } = await client.from('parking_reviews').insert({
      session_id: session.id,
      location_id: session.location_id ?? null,
      member_email: email,
      review_token: token,
      email_sent_at: new Date().toISOString(),
    });

    if (insertErr) continue;

    // Send email
    const { error: sendErr } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Kako je bilo parkiranje? Ocijenite ${locationName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#5F3DFC;padding:32px 24px;text-align:center;">
            <p style="color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 8px;">PayParq</p>
            <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0;">Kako je bilo parkiranje?</h1>
          </div>
          <div style="padding:32px 24px;">
            <p style="color:#111;font-size:15px;font-weight:600;margin:0 0 8px;">Vaše iskustvo je važno.</p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
              Parkiranje na <strong>${locationName}</strong> je završilo. Podijelite svoje iskustvo i pomozite drugima da odaberu pravo parkiralište.
            </p>
            <div style="text-align:center;">
              <a href="${reviewUrl}" style="display:inline-block;padding:14px 32px;background:#5F3DFC;color:#fff;font-weight:900;font-size:14px;text-decoration:none;border-radius:999px;letter-spacing:0.05em;">
                Ocijenite parking ★
              </a>
            </div>
            <p style="color:#9ca3af;font-size:11px;text-align:center;margin:24px 0 0;">
              Veza vrijedi 14 dana. Niste koristili PayParq? Zanemarite ovu poruku.
            </p>
          </div>
        </div>`,
    });

    if (!sendErr) sent++;
  }

  return NextResponse.json({ sent });
}
