export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-build-key'
);

export async function POST(request: NextRequest) {
  try {
    // Fetch all leads from host_registration_leads
    const { data: leads, error: fetchError } = await supabase
      .from('host_registration_leads')
      .select('*');

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch leads: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: 'No leads to migrate' });
    }

    // Migrate each lead to locations table
    const insertData = leads.map((lead) => {
      const timestamp = lead.created_at ? new Date(lead.created_at).getTime() : Date.now();
      return {
        name: `Host Interest - ${lead.email}`,
        address: `Registration Inquiry`,
        display_id: String((timestamp % 90000) + 10000),
        canonical_slug: `registration-interest-${timestamp}`,
        verification_status: 'pending',
        verification_submitted_at: lead.created_at || new Date().toISOString(),
        verification_metadata: {
          contact_email: lead.email,
          owner_phone: lead.phone,
          country: lead.country,
          source: 'landing_page_registration',
        },
        capacity: 0,
        total_spots: 0,
        occupancy: 0,
      };
    });

    const { data: inserted, error: insertError } = await supabase
      .from('locations')
      .insert(insertData)
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to insert: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Migrated ${inserted?.length || 0} registration leads`,
      count: inserted?.length || 0,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
