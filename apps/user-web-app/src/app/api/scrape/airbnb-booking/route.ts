import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
const PHONE_REGEX = /(?:\+|00)?[\d\s\-()]{7,20}/g;

interface ScrapedLead {
  company: string;
  contact: string;
  email: string;
  phone?: string;
  city: string;
  source: string;
}

const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || '2000', 10);
const MAX_PAGES = parseInt(process.env.SCRAPE_MAX_PAGES || '75', 10);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
];

function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function GET(req: Request) {
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

  const leads: ScrapedLead[] = [];

  try {
    console.log('Starting scrape...');

    // Fetch existing cities from database
    const { data: existingEntries } = await supabaseAdmin
      .from('crm_entries')
      .select('city');

    const existingCities = [...new Set((existingEntries || []).map(e => e.city).filter(Boolean))];
    console.log(`Found ${existingCities.length} existing cities:`, existingCities);

    const parkosLeads = await scrapeParkos();
    leads.push(...parkosLeads);
    console.log(`Parkos: ${parkosLeads.length} leads found`);

    await sleep(DELAY_MS);

    const parkviaLeads = await scrapeParkvia();
    leads.push(...parkviaLeads);
    console.log(`Parkvia: ${parkviaLeads.length} leads found`);

    if (leads.length === 0) {
      return NextResponse.json({
        enrolled: 0,
        total: 0,
        leads: [],
        message: 'No leads found'
      });
    }

    // Deduplicate by email
    const uniqueLeads = Array.from(new Map(leads.map(l => [l.email, l])).values());
    console.log(`After dedup: ${uniqueLeads.length} unique leads`);

    // Enrich leads with existing city matches
    const enrichedLeads = uniqueLeads.map(lead => {
      const matchedCity = findBestCityMatch(lead.city || '', existingCities);
      return {
        ...lead,
        city: matchedCity,
      };
    });

    console.log('City matching complete');

    // Prepare rows for crm_entries table
    const rows = enrichedLeads.map(lead => ({
      id: generateId(),
      company: lead.company || 'Unnamed Parking',
      contact: lead.contact || 'N/A',
      email: lead.email.toLowerCase(),
      phone: lead.phone || null,
      city: lead.city || 'Unknown City',
      status: 'Newly Contacted',
      next_action: 'Follow up',
      notes: `Scraped from ${lead.source}`,
      date: new Date().toISOString().split('T')[0],
    }));

    // Check for existing emails to avoid duplicates
    const emailsToCheck = uniqueLeads.map(l => l.email.toLowerCase());
    const { data: existing } = await supabaseAdmin
      .from('crm_entries')
      .select('email')
      .in('email', emailsToCheck);

    const existingEmails = new Set((existing || []).map(e => e.email?.toLowerCase()));
    const newRows = rows.filter(r => !existingEmails.has(r.email));

    if (newRows.length === 0) {
      return NextResponse.json({
        enrolled: 0,
        total: 0,
        leads: [],
        message: 'All leads already exist'
      });
    }

    // Insert new leads
    const { data: inserted, error } = await supabaseAdmin
      .from('crm_entries')
      .insert(newRows)
      .select();

    if (error) {
      console.error('Insertion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unique cities from inserted leads
    const insertedCities = [...new Set(inserted?.map(l => l.city) || [])];

    return NextResponse.json({
      ok: true,
      enrolled: newRows.length,
      total: inserted?.length ?? 0,
      leads_sample: uniqueLeads.slice(0, 3),
      cities_created: insertedCities,
      sources: {
        parkos: parkosLeads.length,
        parkvia: parkviaLeads.length,
      },
    });
  } catch (err) {
    console.error('Scraper error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function scrapeParkos(): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];
  const baseUrl = 'https://www.parkos.eu';

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const url = page === 1 ? baseUrl : `${baseUrl}/?page=${page}`;
        console.log(`Fetching parkos page ${page}...`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': randomUserAgent(),
            'Referer': baseUrl,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (response.status === 429) {
          console.warn('Parkos rate limited, backing off...');
          await sleep(DELAY_MS * 3);
          continue;
        }

        if (!response.ok) break;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract listings
        const listings = $('[data-listing], .listing, .parking-item, .property, [class*="card"]');

        if (listings.length === 0) {
          console.log(`No listings found on parkos page ${page}`);
          break;
        }

        listings.each((_, elem) => {
          const $elem = $(elem);
          const text = $elem.text();

          const emailMatch = text.match(EMAIL_REGEX);
          const phoneMatch = text.match(PHONE_REGEX);

          if (emailMatch && emailMatch[0]) {
            // Try to extract company/facility name from title or heading
            const companyName =
              $elem.find('h1, h2, h3, [class*="title"], [class*="name"]').first().text().trim() ||
              'Parkos Listing';

            // Try to extract contact name
            const contactName =
              $elem.find('[class*="owner"], [class*="contact"], [class*="host"]').first().text().trim() ||
              'Unknown Contact';

            // Try to extract city/location
            const cityName =
              $elem.find('[class*="city"], [class*="location"], [class*="address"]').first().text().trim() ||
              extractCityFromText(text);

            leads.push({
              company: companyName,
              contact: contactName,
              email: emailMatch[0],
              phone: phoneMatch ? phoneMatch[0] : undefined,
              city: cityName || 'Parkos Listing',
              source: 'parkos',
            });
          }
        });

        if (listings.length < 5) {
          console.log(`Parkos page ${page} has fewer than 5 listings, likely last page`);
          break;
        }

        await sleep(DELAY_MS);
      } catch (pageErr) {
        console.error(`Parkos page ${page} error:`, pageErr);
        continue;
      }
    }
  } catch (err) {
    console.error('Parkos scraper error:', err);
  }

  return leads;
}

async function scrapeParkvia(): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = [];
  const baseUrl = 'https://www.parkvia.com';

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const url = page === 1 ? baseUrl : `${baseUrl}/?page=${page}`;
        console.log(`Fetching parkvia page ${page}...`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': randomUserAgent(),
            'Referer': baseUrl,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (response.status === 429) {
          console.warn('Parkvia rate limited, backing off...');
          await sleep(DELAY_MS * 3);
          continue;
        }

        if (!response.ok) break;

        const html = await response.text();
        const $ = cheerio.load(html);

        const listings = $('[data-listing], .listing, .parking-item, .property, [class*="card"]');

        if (listings.length === 0) {
          console.log(`No listings found on parkvia page ${page}`);
          break;
        }

        listings.each((_, elem) => {
          const $elem = $(elem);
          const text = $elem.text();

          const emailMatch = text.match(EMAIL_REGEX);
          const phoneMatch = text.match(PHONE_REGEX);

          if (emailMatch && emailMatch[0]) {
            const companyName =
              $elem.find('h1, h2, h3, [class*="title"], [class*="name"]').first().text().trim() ||
              'Parkvia Listing';

            const contactName =
              $elem.find('[class*="owner"], [class*="contact"], [class*="host"]').first().text().trim() ||
              'Unknown Contact';

            const cityName =
              $elem.find('[class*="city"], [class*="location"], [class*="address"]').first().text().trim() ||
              extractCityFromText(text);

            leads.push({
              company: companyName,
              contact: contactName,
              email: emailMatch[0],
              phone: phoneMatch ? phoneMatch[0] : undefined,
              city: cityName || 'Parkvia Listing',
              source: 'parkvia',
            });
          }
        });

        if (listings.length < 5) {
          console.log(`Parkvia page ${page} has fewer than 5 listings, likely last page`);
          break;
        }

        await sleep(DELAY_MS);
      } catch (pageErr) {
        console.error(`Parkvia page ${page} error:`, pageErr);
        continue;
      }
    }
  } catch (err) {
    console.error('Parkvia scraper error:', err);
  }

  return leads;
}

function extractCityFromText(text: string): string {
  // Common city patterns (European parking sites)
  const cityPatterns = [
    /(?:in|in\s|at\s|at\s)([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/,
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*(?:Germany|Italy|Austria|Croatia|Serbia|Slovenia|Hungary)/,
  ];

  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return '';
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findBestCityMatch(scrapedCity: string, existingCities: string[]): string {
  if (!scrapedCity || existingCities.length === 0) {
    return scrapedCity;
  }

  const normalized = scrapedCity.toLowerCase().trim();

  // Try exact match (case-insensitive)
  for (const existing of existingCities) {
    if (existing.toLowerCase().trim() === normalized) {
      console.log(`City match: "${scrapedCity}" → "${existing}" (exact)`);
      return existing;
    }
  }

  // Try fuzzy match (allow 1-2 character differences for typos)
  let bestMatch = scrapedCity;
  let bestDistance = 3; // threshold

  for (const existing of existingCities) {
    const distance = levenshteinDistance(
      normalized,
      existing.toLowerCase().trim()
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = existing;
    }
  }

  if (bestDistance < 3) {
    console.log(`City match: "${scrapedCity}" → "${bestMatch}" (fuzzy, distance: ${bestDistance})`);
    return bestMatch;
  }

  console.log(`City new: "${scrapedCity}" (no match found)`);
  return scrapedCity;
}
