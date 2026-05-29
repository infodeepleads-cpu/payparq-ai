import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { cookies: { getAll() { return Object.entries(req.cookies.getAll()).map(([name, cookie]) => ({ name, value: cookie.value })); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== 'superadmin' && role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  // recipients: [{ email, name }] or a single { email, name }
  const recipients: { email: string; name?: string }[] = Array.isArray(body.recipients) ? body.recipients : [body];
  const sequenceName: string = body.sequenceName || 'airbnb-host';

  const rows = recipients
    .filter(r => r.email?.includes('@'))
    .map(r => ({
      recipient_email: r.email.trim().toLowerCase(),
      recipient_name: r.name || null,
      sequence_name: sequenceName,
      next_email_number: 1,
      status: 'active',
      next_send_at: new Date().toISOString(),
    }));

  if (!rows.length) return NextResponse.json({ error: 'No valid emails' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('email_sequence_enrollments')
    .upsert(rows, { onConflict: 'recipient_email,sequence_name', ignoreDuplicates: true })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, enrolled: data?.length ?? rows.length });
}
