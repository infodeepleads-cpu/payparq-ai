import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Test endpoint - enrolls 10 sample leads for testing the sequence system
export async function POST(req: Request) {
  const secret = req.headers.get('x-test-secret');
  if (secret !== process.env.TEST_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  const testLeads = [
    { email: 'kzamic@gmail.com', name: 'Karlo - Test' },
    { email: 'marko.apartment@gmail.com', name: 'Marko - 1 spot Airbnb' },
    { email: 'jasna.villa@gmail.com', name: 'Jasna - 3 spot Villa' },
    { email: 'ivan.property@gmail.com', name: 'Ivan - 5 spot Property' },
    { email: 'petra.apartments@gmail.com', name: 'Petra - 8 spot Apartments' },
    { email: 'darko.complex@gmail.com', name: 'Darko - 12 spot Complex' },
    { email: 'info@hotel-adriatic.hr', name: 'Hotel Adriatic - 25 spots' },
    { email: 'reservations@splitpalace.hr', name: 'Split Palace Hotel - 40 spots' },
    { email: 'dubrovnik@hoteldeluxe.hr', name: 'Dubrovnik Deluxe - 60 spots' },
    { email: 'zagreb.central@hotelgroup.hr', name: 'Zagreb Central Hotel - 100 spots' },
  ];

  const rows = testLeads.map(lead => ({
    recipient_email: lead.email,
    recipient_name: lead.name,
    sequence_name: 'airbnb-host',
    next_email_number: 1,
    status: 'active',
    next_send_at: new Date().toISOString(),
  }));

  const { data, error } = await supabaseAdmin
    .from('email_sequence_enrollments')
    .upsert(rows, { onConflict: 'recipient_email,sequence_name', ignoreDuplicates: true })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    enrolled: data?.length ?? rows.length,
    leads: testLeads.map(l => l.email)
  });
}
