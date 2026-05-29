import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Resend webhook - tracks email opens, clicks, bounces, unsubscribes
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const body = await req.json();
  const { type, data } = body;

  if (!type || !data) return NextResponse.json({ ok: true });

  const email = data.to?.[0] || data.email;
  if (!email) return NextResponse.json({ ok: true });

  if (type === 'email.bounced' || type === 'email.complained') {
    await supabaseAdmin
      .from('email_sequence_enrollments')
      .update({ status: 'unsubscribed' })
      .eq('recipient_email', email.toLowerCase());
  }

  // Log event
  await supabaseAdmin.from('email_sequence_events').upsert({
    recipient_email: email.toLowerCase(),
    event_type: type,
    email_id: data.email_id,
    occurred_at: data.created_at || new Date().toISOString(),
  }, { onConflict: 'email_id,event_type', ignoreDuplicates: true });

  return NextResponse.json({ ok: true });
}
