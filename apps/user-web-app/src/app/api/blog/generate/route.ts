import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const CROATIAN_CITIES = [
  { city: 'Split', slug_prefix: 'parking-split' },
  { city: 'Dubrovnik', slug_prefix: 'parking-dubrovnik' },
  { city: 'Zagreb', slug_prefix: 'parking-zagreb' },
  { city: 'Zadar', slug_prefix: 'parking-zadar' },
  { city: 'Rijeka', slug_prefix: 'parking-rijeka' },
  { city: 'Pula', slug_prefix: 'parking-pula' },
  { city: 'Šibenik', slug_prefix: 'parking-sibenik' },
  { city: 'Rovinj', slug_prefix: 'parking-rovinj' },
  { city: 'Hvar', slug_prefix: 'parking-hvar' },
  { city: 'Makarska', slug_prefix: 'parking-makarska' },
  { city: 'Opatija', slug_prefix: 'parking-opatija' },
  { city: 'Trogir', slug_prefix: 'parking-trogir' },
];

async function generateWithGroq(prompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('No GROQ_API_KEY');

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function fallbackContent(city: string): { title: string; title_hr: string; excerpt: string; excerpt_hr: string; content: string; content_hr: string; meta_description: string; meta_keywords: string } {
  return {
    title: `Parking in ${city} — Complete Guide`,
    title_hr: `Parking u ${city}u — Kompletni vodič`,
    excerpt: `Everything you need to know about parking in ${city}, Croatia.`,
    excerpt_hr: `Sve što trebate znati o parkingu u ${city}u, Hrvatska.`,
    content: `<h2>Parking in ${city}</h2><p>Finding parking in ${city} can be challenging, especially during tourist season. Payparq connects you with private parking spaces across the city.</p><h2>Why use Payparq?</h2><p>Payparq makes it easy to find, reserve, and pay for parking in ${city}. Our platform connects drivers with private hosts who offer affordable parking solutions.</p><h2>How it works</h2><p>Simply search for available parking near your destination, choose a space, and pay securely through the app. No more circling the block looking for parking.</p>`,
    content_hr: `<h2>Parking u ${city}u</h2><p>Pronalaženje parkinga u ${city}u može biti izazov, posebno u turističkoj sezoni. Payparq vas povezuje s privatnim parkirnim mjestima diljem grada.</p><h2>Zašto koristiti Payparq?</h2><p>Payparq olakšava pronalaženje, rezervaciju i plaćanje parkinga u ${city}u. Naša platforma povezuje vozače s privatnim domaćinima koji nude povoljne parkirne opcije.</p><h2>Kako funkcionira</h2><p>Jednostavno pretražite dostupna parkirna mjesta blizu vašeg odredišta, odaberite mjesto i platite sigurno putem aplikacije. Nema više kruženja u potrazi za parkingom.</p>`,
    meta_description: `Parking u ${city}u — pronađite privatna parkirna mjesta po najboljim cijenama. Payparq platforma za rezervaciju parkinga.`,
    meta_keywords: `parking ${city}, parking ${city.toLowerCase()} cijena, privatni parking ${city.toLowerCase()}, rezervacija parkinga ${city.toLowerCase()}`,
  };
}

async function generateBlogPost(city: string): Promise<ReturnType<typeof fallbackContent>> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return fallbackContent(city);

  try {
    const hrPrompt = `Napiši SEO blog post na hrvatskom jeziku o parkingu u ${city}u, Hrvatska.
Format: JSON objekt s poljima:
- title_hr: SEO naslov (50-60 znakova)
- excerpt_hr: kratak opis (150-160 znakova)
- content_hr: HTML sadržaj s h2 naslovima, paragrafima (600-800 riječi), uključi lokalne savjete, cijene, područja, sezonske informacije
- meta_description: SEO opis (150-160 znakova)
- meta_keywords: 5-8 ključnih riječi odvojenih zarezima

Odgovori SAMO s JSON objektom, bez objašnjenja.`;

    const raw = await generateWithGroq(hrPrompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackContent(city);

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      title: `Parking in ${city} — Complete Guide`,
      title_hr: parsed.title_hr || fallbackContent(city).title_hr,
      excerpt: `Everything you need to know about parking in ${city}, Croatia.`,
      excerpt_hr: parsed.excerpt_hr || fallbackContent(city).excerpt_hr,
      content: fallbackContent(city).content,
      content_hr: parsed.content_hr || fallbackContent(city).content_hr,
      meta_description: parsed.meta_description || fallbackContent(city).meta_description,
      meta_keywords: parsed.meta_keywords || fallbackContent(city).meta_keywords,
    };
  } catch {
    return fallbackContent(city);
  }
}

async function pingIndexNow(slug: string) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return;

  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'payparq.com',
        key,
        keyLocation: `https://payparq.com/${key}.txt`,
        urlList: [`https://payparq.com/blog/${slug}`],
      }),
    });
  } catch {
    // non-critical
  }
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const tokenParam = new URL(req.url).searchParams.get('token');
    const provided = authHeader?.replace('Bearer ', '') || tokenParam;
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!supabaseAdmin) return NextResponse.json({ error: 'db_unavailable' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const { city: specificCity, publish = true } = body;

  // Find which cities don't have posts yet
  const { data: existing } = await supabaseAdmin
    .from('blog_posts')
    .select('city');

  const existingCities = new Set((existing || []).map(r => r.city));

  let targetCity: typeof CROATIAN_CITIES[0] | undefined;

  if (specificCity) {
    targetCity = CROATIAN_CITIES.find(c => c.city.toLowerCase() === specificCity.toLowerCase());
  } else {
    targetCity = CROATIAN_CITIES.find(c => !existingCities.has(c.city));
  }

  if (!targetCity) {
    return NextResponse.json({ message: 'All cities covered', covered: CROATIAN_CITIES.map(c => c.city) });
  }

  const generated = await generateBlogPost(targetCity.city);
  const slug = `${targetCity.slug_prefix}-${Date.now()}`.replace(/\s+/g, '-').toLowerCase();

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .insert({
      slug,
      title: generated.title,
      title_hr: generated.title_hr,
      excerpt: generated.excerpt,
      excerpt_hr: generated.excerpt_hr,
      content: generated.content,
      content_hr: generated.content_hr,
      city: targetCity.city,
      meta_description: generated.meta_description,
      meta_keywords: generated.meta_keywords,
      status: publish ? 'published' : 'draft',
      published_at: publish ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (publish) await pingIndexNow(slug);

  return NextResponse.json({
    ok: true,
    city: targetCity.city,
    slug,
    title: generated.title_hr,
    indexed: !!process.env.INDEXNOW_KEY,
    source: process.env.GROQ_API_KEY ? 'groq' : 'templates',
  });
}
