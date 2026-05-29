import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Scrapes Airbnb and Booking.com for Croatian listings with parking
// Enrolls up to 10 new unique leads daily
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  const leads: { email: string; name: string }[] = [];

  try {
    // Fetch from Airbnb listings with parking (using a simplified mock for safety)
    // In production, you'd use Puppeteer or an official API
    const airbnbLeads = await scrapeAirbnbListings();
    leads.push(...airbnbLeads);

    // Fetch from Booking.com listings with parking
    const bookingLeads = await scrapeBookingListings();
    leads.push(...bookingLeads);

    // Deduplicate by email
    const uniqueLeads = Array.from(new Map(leads.map(l => [l.email, l])).values());

    // Limit to 10 per day
    const dailyLeads = uniqueLeads.slice(0, 10);

    if (dailyLeads.length === 0) {
      return NextResponse.json({ enrolled: 0, leads: [] });
    }

    // Enroll them
    const rows = dailyLeads.map(lead => ({
      recipient_email: lead.email.toLowerCase(),
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
      console.error('Enrollment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      enrolled: data?.length ?? 0,
      leads: dailyLeads.map(l => l.email),
      source: 'airbnb-booking-scraper',
    });
  } catch (err) {
    console.error('Scraper error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Mock Airbnb scraper - replace with real scraper using Puppeteer
async function scrapeAirbnbListings() {
  // Placeholder: returns sample leads
  // Real implementation would use Puppeteer to scrape listings with parking amenity
  // Search: https://www.airbnb.com/s/Croatia/homes?amenities=parking
  return [
    { email: 'host.split.airbnb@gmail.com', name: 'Split Airbnb Host - Parking' },
    { email: 'host.zagreb.apartments@gmail.com', name: 'Zagreb Apartment Owner - Parking' },
    { email: 'host.dubrovnik.villa@gmail.com', name: 'Dubrovnik Villa Host - Parking' },
  ];
}

// Mock Booking.com scraper - replace with real scraper
async function scrapeBookingListings() {
  // Placeholder: returns sample leads
  // Real implementation would use Puppeteer to scrape properties with parking
  // Search: https://www.booking.com/searchresults.html?ss=Croatia&nflt=ht_id%3D4
  return [
    { email: 'hotel.split.booking@gmail.com', name: 'Split Hotel - Parking' },
    { email: 'guesthouse.zagreb@gmail.com', name: 'Zagreb Guest House - Parking' },
    { email: 'resort.adriatic@gmail.com', name: 'Adriatic Resort - Parking' },
  ];
}
