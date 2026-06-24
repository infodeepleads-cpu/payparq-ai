import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    let synced = 0;
    let cursor: string | undefined;
    const limit = 100;

    // Fetch all emails from Resend with pagination
    while (true) {
      const params: any = { limit };
      if (cursor) params.after = cursor;

      const result = await (resend.emails.list as any)(params);

      if (!result || !result.data) {
        break;
      }

      const emails = Array.isArray(result.data) ? result.data : result.data.data || [];

      if (emails.length === 0) {
        break;
      }

      // Insert or update each email
      for (const email of emails) {
        try {
          // Determine status from email object
          let status = 'email.sent';
          if (email.bounced) status = 'email.bounced';
          else if (email.complained) status = 'email.complained';
          else if (email.replied) status = 'email.replied';
          else if (email.clicked) status = 'email.clicked';
          else if (email.opened) status = 'email.opened';

          const { error: insertError } = await supabaseAdmin.from('email_sequence_events').insert({
            recipient_email: email.to,
            email_id: email.id,
            event_type: status,
            occurred_at: email.created_at || new Date().toISOString(),
          });

          if (!insertError || insertError.code === '23505') {
            synced++;
          } else {
            console.error(`Error syncing email ${email.id}:`, insertError.message);
          }
        } catch (error) {
          console.error(`Error syncing email ${email.id}:`, error);
        }
      }

      // Check for next page
      cursor = (result as any).pagination?.next;
      if (!cursor) break;
    }

    return NextResponse.json({ 
      success: true, 
      synced,
      message: `Synced ${synced} emails from Resend`
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
