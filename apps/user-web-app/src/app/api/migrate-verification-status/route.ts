import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update all locations that have:
    // 1. verification_status = 'unverified' (web-created)
    // 2. Have photos (photos_count > 0)
    // 3. Have all sections complete
    const { data: locations, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('id, verification_status, verification_metadata')
      .eq('verification_status', 'unverified');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Filter for lots with actual photos and all sections complete
    const lotsToUpdate = locations.filter((loc: any) => {
      const metadata = loc.verification_metadata || {};
      const hasPhotos = metadata.photos_count && metadata.photos_count > 0;
      const sections = metadata.section_status || {};
      const allSectionsComplete = sections.section1 && sections.section2 && sections.section3;
      return hasPhotos && allSectionsComplete;
    });

    if (lotsToUpdate.length === 0) {
      return NextResponse.json({
        message: 'No lots to migrate',
        count: 0,
      });
    }

    // Update all matching lots to pending (awaiting verification)
    const { error: updateError } = await supabaseAdmin
      .from('locations')
      .update({ verification_status: 'pending' })
      .in('id', lotsToUpdate.map((loc: any) => loc.id));

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Migration completed successfully',
      count: lotsToUpdate.length,
      updatedIds: lotsToUpdate.map((loc: any) => loc.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
