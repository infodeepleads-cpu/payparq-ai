import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

export async function GET(req: Request) {
  // Require CRON_SECRET token
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const tokenParam = new URL(req.url).searchParams.get('token');
    const provided = authHeader?.replace('Bearer ', '') || tokenParam;
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });
  }

  const leads: { email: string; name: string }[] = [];

  try {
    // Search Croatian tourism board listings
    const tourismLeads = await scrapeTouristickZajednica();
    leads.push(...tourismLeads);

    // Search for Croatian properties with parking via Google
    const googleLeads = await scrapeGoogleSearch();
    leads.push(...googleLeads);

    // Deduplicate by email
    const uniqueLeads = Array.from(new Map(leads.map(l => [l.email, l])).values());
    const dailyLeads = uniqueLeads.slice(0, 10);

    if (dailyLeads.length === 0) {
      return NextResponse.json({ enrolled: 0, leads: [], message: 'No new leads found' });
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
      .upsert(rows, { onConflict: 'recipient_email,sequence_name' })
      .select();

    if (error) {
      console.error('Enrollment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count newly inserted (not updated)
    const newCount = data?.filter(d => d.created_at === d.updated_at).length ?? 0;

    return NextResponse.json({
      ok: true,
      enrolled: newCount,
      total_touched: data?.length ?? 0,
      leads: dailyLeads.map(l => l.email),
      source: 'google-scraper',
    });
  } catch (err) {
    console.error('Scraper error:', err);
    return NextResponse.json({ error: String(err), status: 'error' }, { status: 500 });
  }
}

async function scrapeTouristickZajednica() {
  const leads: { email: string; name: string }[] = [];

  // Croatian tourism board regions
  const regions = [
    { name: 'Split', url: 'https://www.visitsplit.com' },
    { name: 'Dubrovnik', url: 'https://www.dubrovnikneretva.hr' },
    { name: 'Zagreb', url: 'https://www.infozagreb.hr' },
    { name: 'Zadar', url: 'https://www.zadarregion.hr' },
    { name: 'Rijeka', url: 'https://www.visitrijeka.hr' },
    { name: 'Istria', url: 'https://www.istra.hr' },
  ];

  for (const region of regions) {
    try {
      const response = await fetch(region.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const html = await response.text();

      // Look for accommodation/smještaj pages
      const accomUrl = html.includes('smještaj')
        ? `${region.url}/en/accommodation`
        : `${region.url}/accommodation`;

      const accomResponse = await fetch(accomUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }).catch(() => null);

      if (accomResponse?.ok) {
        const accomHtml = await accomResponse.text();

        // Extract emails from accommodation listings
        const matches = accomHtml.match(EMAIL_REGEX) || [];
        const uniqueEmails = [...new Set(matches)];

        for (const email of uniqueEmails) {
          if (
            email.includes('@') &&
            !email.includes('google') &&
            !email.includes('site:') &&
            !email.includes('tourism.gov')
          ) {
            leads.push({
              email,
              name: `${region.name} - Parking`,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Tourism board error for ${region.name}:`, err);
      continue;
    }
  }

  return leads;
}

async function scrapeGoogleSearch() {
  const leads: { email: string; name: string }[] = [];

  const queries = [
    'Airbnb Croatia parking contact',
    'hotel Croatia parking email',
    'Booking.com Croatia parking host',
    'vacation rental Croatia parking contact',
  ];

  for (const query of queries) {
    try {
      // Search Google and extract emails from top results
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const html = await response.text();

      // Extract emails using regex
      const matches = html.match(EMAIL_REGEX) || [];
      const emails = [...new Set(matches)];

      for (const email of emails) {
        if (email.includes('@') && !email.includes('google') && !email.includes('site:')) {
          leads.push({
            email,
            name: `Host - ${query.substring(0, 20)}`,
          });
        }
      }

      // Limit to avoid too many requests
      if (leads.length >= 10) break;
    } catch (err) {
      console.error(`Query failed: ${query}`, err);
      continue;
    }
  }

  return leads;
}
