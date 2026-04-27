import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createServerClient } from '@supabase/ssr';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return Object.entries(req.cookies.getAll()).map(([name, cookie]) => ({
              name,
              value: cookie.value,
            }));
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profileRow } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profileRow as { role?: string } | null)?.role;
    if (role !== 'superadmin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Only superadmins can send campaigns' }, { status: 403 });
    }

    const { data: campaign, error: fetchError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'Resend not configured' }, { status: 500 });
    }

    const resend = new Resend(resendKey);

    // Fetch recipient emails based on recipient_list
    let recipientEmails: string[] = [];
    if (campaign.recipient_list === 'all') {
      const { data: recipients } = await supabaseAdmin
        .from('email_recipients')
        .select('email')
        .not('email', 'is', null);
      recipientEmails = (recipients || []).map((r: any) => r.email);
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json({
        error: 'No recipients found for campaign',
      }, { status: 400 });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const email of recipientEmails) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: 'Payparq <campaigns@payparq.com>',
          to: email,
          subject: campaign.subject,
          html: campaign.html_content,
        });

        if (!sendError) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_count: sentCount,
      })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      sentCount,
      failedCount,
      message: `Campaign sent to ${sentCount} recipients`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
