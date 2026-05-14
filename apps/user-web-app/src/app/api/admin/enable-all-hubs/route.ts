import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Basic security check - only allow from admin context
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || !supabaseAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all locations without hub_enabled or with it set to false
    const { data: locations, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('id, verification_metadata')
      .not('verification_metadata', 'is', null);

    if (fetchError) {
      return NextResponse.json({ error: `Fetch error: ${fetchError.message}` }, { status: 500 });
    }

    let updatedCount = 0;

    // Update each location to enable hub
    for (const loc of locations || []) {
      const metadata = loc.verification_metadata || {};
      if (metadata.hub_enabled !== true) {
        const { error: updateError } = await supabaseAdmin
          .from('locations')
          .update({
            verification_metadata: {
              ...metadata,
              hub_enabled: true,
            },
          })
          .eq('id', loc.id);

        if (!updateError) {
          updatedCount++;
        } else {
          console.error(`Failed to update location ${loc.id}:`, updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Enabled hubs for ${updatedCount} locations`,
      updated: updatedCount,
    });
  } catch (error) {
    console.error('Enable all hubs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
