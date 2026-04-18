import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function resolveFrom() {
  return process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL ?? 'PayParq Team <team@info.payparq.com>';
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const { location_id, location_name, new_address, reason, old_lat, old_lng, new_lat, new_lng } = body as {
    location_id?: string;
    location_name?: string;
    new_address?: string;
    reason?: string;
    old_lat?: number;
    old_lng?: number;
    new_lat?: number;
    new_lng?: number;
  };

  if (!location_id) return NextResponse.json({ error: 'missing_location_id' }, { status: 400 });

  const client = supabaseAdmin;
  if (!client) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  // Fetch upcoming sessions at this location
  const now = new Date().toISOString();
  const { data: sessions } = await client
    .from('parking_sessions')
    .select('id, customer_email, entry_time, exit_time')
    .eq('location_id', location_id)
    .gt('entry_time', now)
    .not('customer_email', 'is', null)
    .limit(200);

  const affectedSessions = sessions ?? [];
  const uniqueEmails = [...new Set(affectedSessions.map((s: { customer_email: string }) => s.customer_email).filter(Boolean))];

  const resendKey = process.env.RESEND_API_KEY;
  let emailsSent = 0;

  if (resendKey && uniqueEmails.length > 0) {
    const resend = new Resend(resendKey);
    const mapsLink = `https://www.google.com/maps?q=${new_lat},${new_lng}`;
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1a1a1a">Obavijest o promjeni lokacije parkirališta</h2>
        <p>Poštovani korisnik,</p>
        <p>Parkiralište <strong>${location_name ?? location_id}</strong> premješteno je na novu lokaciju.</p>
        ${new_address ? `<p><strong>Nova adresa:</strong> ${new_address}</p>` : ''}
        ${reason ? `<p><strong>Razlog:</strong> ${reason}</p>` : ''}
        <p>
          <a href="${mapsLink}" style="background:#5F3DFC;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">
            Otvori novu lokaciju na karti
          </a>
        </p>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Vaša nadolazeća rezervacija na ovoj lokaciji ostaje aktivna. Ako imate pitanja, kontaktirajte nas na
          <a href="https://payparq.com">payparq.com</a>.
        </p>
        <p style="color:#999;font-size:11px;margin-top:32px">PayParq d.o.o.</p>
      </div>
    `;

    for (const email of uniqueEmails) {
      try {
        await resend.emails.send({
          from: resolveFrom(),
          to: email,
          subject: `Promjena lokacije: ${location_name ?? 'parkiralište'}`,
          html,
        });
        emailsSent++;
      } catch {
        // continue — don't fail the whole request for one bad address
      }
    }
  }

  // Store audit log entry via service role
  const currentUserId = req.headers.get('x-moved-by') ?? null;
  try {
    await client.from('location_move_log').insert({
      location_id,
      moved_by: currentUserId,
      old_lat: old_lat ?? 0,
      old_lng: old_lng ?? 0,
      new_lat: new_lat ?? 0,
      new_lng: new_lng ?? 0,
      reason: reason ?? null,
      affected_sessions: affectedSessions.map((s: { id: string }) => s.id),
    });
  } catch { /* non-fatal */ }

  return NextResponse.json({ emails_sent: emailsSent, affected_count: affectedSessions.length });
}
