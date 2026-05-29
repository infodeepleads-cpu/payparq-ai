import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const AD_TEMPLATES = {
  host_parking: {
    hr: [
      'Iznajmite svoje parking mjesto i zaradite svaki dan. Payparq automatizira sve. 🚗💰',
      'Vaše parking mjesto čeka stanare. Postavite ga online za 5 minuta. Payparq.',
      'Pasivni prihod od parkinga? Da. Payparq za domaćine. Počnite besplatno.',
      'Svako slobodno parking mjesto = zarada. Pridružite se Payparq mreži danas.',
      'Airbnb za parkiralište. Jednostavno. Automatski. Payparq.',
    ],
    en: [
      'Rent out your parking space and earn every day. Payparq automates everything. 🚗💰',
      'Your parking spot is waiting for renters. List it online in 5 minutes. Payparq.',
      'Passive income from parking? Yes. Payparq for hosts. Start free.',
      'Every empty parking space = revenue. Join the Payparq network today.',
      'Airbnb for parking. Simple. Automatic. Payparq.',
    ],
  },
  hotel: {
    hr: [
      'Povećajte prihod hotela s pametnim upravljanjem parkingom. Payparq.',
      'Vaše parkiralište radi za vas 24/7. Payparq za hotele i apartmane.',
      'Automatska rezervacija, automatska naplata. Parking bez brige. Payparq.',
    ],
    en: [
      'Increase hotel revenue with smart parking management. Payparq.',
      'Your parking lot works for you 24/7. Payparq for hotels and apartments.',
      'Automatic booking, automatic billing. Parking without worries. Payparq.',
    ],
  },
  general: {
    hr: [
      'Parkiralište = profit. Payparq čini to jednostavnim.',
      'Upravljajte parkingom s mobitela. Payparq.',
      'Više slobodnih mjesta = više zarade. Payparq.',
    ],
    en: [
      'Parking = profit. Payparq makes it simple.',
      'Manage parking from your phone. Payparq.',
      'More spaces = more earnings. Payparq.',
    ],
  },
};

export async function POST(req: NextRequest) {
  const { topic, platform, language, custom } = await req.json();

  const lang = language === 'hr' ? 'hr' : 'en';
  const category = topic || 'host_parking';
  const templates = AD_TEMPLATES[category as keyof typeof AD_TEMPLATES]?.[lang] || AD_TEMPLATES.general[lang];

  // Try Groq if API key is set, otherwise use templates
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey && custom) {
    try {
      const prompt = lang === 'hr'
        ? `Ti si stručnjak za digitalni marketing. Napiši 5 kratkih Instagram/Facebook oglasnih tekstova na hrvatskom jeziku za: "${custom}".
           Ciljna publika: vlasnici parkinga, Airbnb domaćini, hotelijeri u Hrvatskoj.
           Format: svaki oglas u novom redu, max 150 znakova, uključi emoji, završi s "Payparq".
           Samo tekstovi, bez numeriranja ili objašnjenja.`
        : `You are a digital marketing expert. Write 5 short Instagram/Facebook ad copies in English for: "${custom}".
           Target audience: parking owners, Airbnb hosts, hotel managers in Croatia.
           Format: each ad on a new line, max 150 chars, include emoji, end with "Payparq".
           Only the ad texts, no numbering or explanation.`;

      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.8,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const ads = text.split('\n').filter((l: string) => l.trim().length > 10).slice(0, 5);
        if (ads.length >= 3) {
          return NextResponse.json({ ads, source: 'groq' });
        }
      }
    } catch {
      // fall through to templates
    }
  }

  // Return templates with platform-specific CTA appended
  const cta = platform === 'instagram'
    ? (lang === 'hr' ? '\n👉 Link u biu.' : '\n👉 Link in bio.')
    : (lang === 'hr' ? '\n👉 Saznaj više.' : '\n👉 Learn more.');

  const ads = templates.map(t => t + cta);

  return NextResponse.json({ ads, source: 'templates' });
}
