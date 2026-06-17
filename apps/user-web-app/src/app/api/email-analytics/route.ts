import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
    }

    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json([]);
    }

    // For each campaign, calculate metrics
    const analytics = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        const { data: events } = await supabaseAdmin!
          .from('email_campaign_events')
          .select('*')
          .eq('campaign_id', campaign.id);

        const eventsList = events || [];

        // Calculate metrics per variant
        const variantA = {
          sent: campaign.variant_a_sent_count || 0,
          opened: eventsList.filter(e => e.variant === 'A' && e.event_type === 'opened').length,
          bounced: eventsList.filter(e => e.variant === 'A' && e.event_type === 'bounced').length,
          clicked: eventsList.filter(e => e.variant === 'A' && e.event_type === 'clicked').length,
        };

        const variantB = {
          sent: campaign.variant_b_sent_count || 0,
          opened: eventsList.filter(e => e.variant === 'B' && e.event_type === 'opened').length,
          bounced: eventsList.filter(e => e.variant === 'B' && e.event_type === 'bounced').length,
          clicked: eventsList.filter(e => e.variant === 'B' && e.event_type === 'clicked').length,
        };

        const openRateA = variantA.sent > 0 ? (variantA.opened / variantA.sent) * 100 : 0;
        const openRateB = variantB.sent > 0 ? (variantB.opened / variantB.sent) * 100 : 0;
        const clickRateA = variantA.sent > 0 ? (variantA.clicked / variantA.sent) * 100 : 0;
        const clickRateB = variantB.sent > 0 ? (variantB.clicked / variantB.sent) * 100 : 0;

        let winner: 'A' | 'B' | 'tie' | undefined;
        if (openRateA > openRateB) {
          winner = 'A';
        } else if (openRateB > openRateA) {
          winner = 'B';
        } else if (openRateA > 0) {
          winner = 'tie';
        }

        return {
          campaignId: campaign.id,
          variantA: {
            sent: variantA.sent,
            opened: variantA.opened,
            bounced: variantA.bounced,
            clicked: variantA.clicked,
            openRate: openRateA,
            clickRate: clickRateA,
          },
          variantB: {
            sent: variantB.sent,
            opened: variantB.opened,
            bounced: variantB.bounced,
            clicked: variantB.clicked,
            openRate: openRateB,
            clickRate: clickRateB,
          },
          winner,
          createdAt: campaign.created_at,
        };
      })
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
