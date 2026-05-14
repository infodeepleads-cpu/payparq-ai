import { NextRequest, NextResponse } from "next/server";
import { AppLocale } from "@/lib/locale";

const memoryCache = new Map<string, string>();
const TRANSLATE_CONCURRENCY = 8;
const hrOverrides = new Map<string, string>([
  ["Experience", "Iskustvo"],
  ["payparq makes cities", "PayParq stvara svijet"],
  ["payparq makes cities move with you", "PayParq stvara svijet koji se kreće s tobom"],
  ["move with you", "koji se kreće s tobom"],
  ["The world’s first mobile software-only platform for frictionless urban mobility.", "Prva svjetska mobilna softverska platforma za urbanu mobilnost."],
  ["The world's first mobile software-only platform for frictionless urban mobility.", "Prva svjetska mobilna softverska platforma za urbanu mobilnost."],
  ["For drivers, operators, and cities", "Za vozače, operatere i gradove"],
  ["Frictionless access to anywhere you want to be", "Pristup bilo gdje, gdje želite ići"],
  ["Using industry-leading Mobile LPR technology and advanced computer vision, we create a real-time digital map of physical spaces to provide frictionless, automated parking solutions that anticipate driver needs and maximize real estate asset value.", "Koristeći vodeću Mobile LPR tehnologiju i naprednu AI vidljivost, stvaramo digitalnu kartu fizičkih prostora u stvarnom vremenu kako bismo osigurali automatizirana rješenja za parkiranje koja predviđaju potrebe vozača i maksimiziraju vrijednost nekretnina."],
  ["The Intelligent Curb", "Inteligentni asfalt"],
  ["The Intelligent Curb: Mapped & Managed.", "Inteligentni asfalt: mapiran i upravljan."],
  ["We digitize every parking space to make physical infrastructure as intuitive as the digital world. Using Mobile LPR and AI Computer Vision, we create frictionless, real-time parking maps that connect cities to people.", "Digitaliziramo svako parkirno mjesto kako bismo fizičku infrastrukturu učinili intuitivnom poput digitalnog svijeta. Koristeći Mobile LPR i AI vidljivost, stvaramo karte parkiranja u stvarnom vremenu koje povezuju gradove s ljudima."],
  ["Want to come for a ride?", "Želiš se pridružiti?"],
  ["Payparq secures smarter parking portfolios across the Country. Our software-only platform enables parking operators and cities to manage payments, enforcement, and compliance in real time — without costly hardware. Reduce operational costs, increase revenue, and deploy in days, not months.", "PayParq osigurava pametnije portfelje parkinga diljem zemlje. Naša platforma koja se sastoji samo od softvera omogućuje operaterima parkirališta i gradovima upravljanje plaćanjima, provedbom i usklađenošću u stvarnom vremenu — bez skupog hardvera. Smanjite operativne troškove, povećajte prihod i implementirajte u danima, a ne mjesecima."],
  ["About", "O nama"],
  ["ABOUT", "O nama"],
  ["Business", "Posao"],
  ["BUSINESS", "POSAO"],
  ["Support", "Podrška"],
  ["Policies", "Politika"],
  ["Members", "Članovi"],
  ["Payparq secures parking portfolios across the Country", "PayParq stvara svijet koji se kreće s tobom"],
  ["secures parking portfolios across the Country", "stvara svijet koji se kreće s tobom"],
  ["– read more", "– saznaj više"],
  ["- read more", "- saznaj više"],
  ["read more", "saznaj više"],
  ["What if every parking space is a digital asset?", "Što ako je svako parkirno mjesto digitalna imovina?"],
  ["What if every parking space was a digital asset?", "Što ako je svako parkirno mjesto digitalna imovina?"],
  ["We bridge the gap between curb and data, creating a real-time intelligence layer for every stall.", "Premošćujemo jaz između pločnika i podataka, stvarajući sloj inteligencije u stvarnom vremenu za svako stajalište."],
  ["We bridge the gap between pavement and data, creating a real-time layer of intelligence for every stall.", "Smanjujemo jaz između pločnika i podataka, stvarajući sloj inteligencije u stvarnom vremenu za svako stajalište."],
  ["Data unlocks higher NOI and portfolio liquidity at scale.", "Podaci otključavaju veći ROI i pokretljivost portfelja na razini."],
  ["We convert static pavement into live, monetizable infrastructure. Real-time visibility, automated operations, and data-backed control unlock higher NOI and frictionless mobility at scale.", "Pretvaramo statični asfalt u živu infrastrukturu koja donosi prihod. Vidljivost u stvarnom vremenu, automatizirane operacije i upravljanje temeljeno na podacima otključavaju veći ROI i pokretljivost na razini."],
  ["Security", "Sigurnost"],
  ["Space Intelligence in Real Time.", "Moderna inteligencija u stvarnom vremenu."],
  ["Real-time space intelligence.", "Moderna inteligencija u stvarnom vremenu."],
  ["Digitize every stall with AI-powered recognition that keeps your parking assets safer, smarter, and always visible.", "Digitalizirajte svako stajalište s prepoznavanjem pomoću umjetne inteligencije koje vaša parkirna sredstva drži sigurnijima, pametnijima i uvijek na vidiku."],
  ["Digitize every stall with AI-powered recognition that keeps your parking assets safer, smarter, and always in view.", "Digitalizirajte svako stajalište s prepoznavanjem pomoću umjetne inteligencije koje vaša parkirna sredstva drži sigurnijima, pametnijima i uvijek na vidiku."],
  ["Enterprise-ready digitization.", "Digitalizacija spremna za poduzeća."],
  ["Live in hours, not months.", "Live u 24 sata, ne čekajte mjesecima."],
  ["Live in days, not months.", "Live u 24 sata, ne čekajte mjesecima."],
  ["Go live in hours, not months. Whether you manage a single garage or a global portfolio, Payparq scales via Mobile LPR to protect and optimize every asset.", "Live u 24 sata, ne čekajte mjesecima. Bez obzira upravljate li jednom garažom ili globalnim portfeljem, PayParq se skalira putem Mobile LPR-a kako bi zaštitio i optimizirao svaku imovinu."],
  ["Portfolio Growth", "Povećanje portfelja"],
  ["Portfolio uplift", "Povećanje portfelja"],
  ["Protect revenue, reduce leakage, and increase NOI in every asset.", "Zaštitite prihode, smanjite curenje i povećajte ROI u svakoj imovini."],
  ["Protect revenue, reduce leakage, and drive higher NOI across every asset.", "Zaštitite prihode, smanjite curenje i povećajte ROI u svakoj imovini."],
  ["Zero Capital Expenditure", "NULA KAPITALNIH ULAGANJA"],
  ["Zero CapEx deployment", "NULA KAPITALNIH ULAGANJA"],
  ["Zero CapEx. Live in 3 Days.", "Nula kapitalnih ulaganja. Live za 24 sata."],
  ["We bring even more. Live in 3 days. Properly informed and satisfied customers.", "Donosimo još više. Live za 24 sata. Pravilno informirani i zadovoljni korisnici."],
  ["Parking", "Parking"],
  ["Find a cheaper lot? We’ll refund the difference plus 50% off your next stay.", "Pronašli ste jeftiniju parcelu? Vratit ćemo razliku plus 50% popusta na vaš sljedeći boravak."],
  ["From mixed-use garages to open-air lots, payparq turns any space into a seamless, app-free arrival experience while unlocking new revenue.", "Od garaža mješovite namjene do parcela na otvorenom, payparq pretvara bilo koji prostor u besprijekoran doživljaj dolaska bez aplikacije, a istovremeno donosi nove prihode."],
  ["Pay Now", "Plati sada"],
  ["Reserve", "Rezerviraj"],
  ["Home", "Početna"],
  ["Rest easy with 24/7 AI Computer Vision monitoring every vehicle. We ensure all cars are authorized and offer an optional insurance where applicable for total peace of mind.", "Budite sigurni uz 24/7 AI vidljivost koja nadzire svako vozilo. Osiguravamo da su sva vozila autorizirana i nudimo opcionalno osiguranje gdje je primjenjivo za potpuni mir."],
  ["Apply", "Apliciraj"],
  ["Space-level awareness", "Svijest na razini prostora"],
  ["Stay aware of key vehicles and zones across your portfolio with continuous, accurate recognition.", "Budite svjesni ključnih vozila i zona u svom portfelju uz stalno, precizno prepoznavanje."],
  ["By treating every bay as a live digital asset, we help partners unlock new revenue, reduce leakage, and deliver better experiences without rebuilding physical infrastructure.", "Tretirajući svaku parcelu kao živu digitalnu imovinu, pomažemo partnerima otključati nove prihode, smanjiti curenje i pružiti bolje iskustvo bez obnove fizičke infrastrukture."],
  ["A comprehensive resource to help you with onboarding, parking, billing, and account management.", "Opsežan resurs koji će vam pomoći s prijavom, parkiranjem, naplatom i upravljanjem računom."],
  ["Software-first approach", "Softverski pristup"],
  ["Software-first deployment", "Softverski pristup"],
  ["Payparq is building a software-only mobility platform that turns every space into a connected, data-driven asset. We use Mobile LPR, AI Computer Vision, and automation to make arrival effortless for drivers and operations simple for cities and operators.", "Payparq gradi softversku mobilnu platformu koja svaki prostor pretvara u povezanu imovinu vođenu podacima. Koristimo Mobile LPR, AI Computer Vision i automatizaciju kako bismo dolazak vozačima učinili lakšim, a operacije jednostavnim za gradove i operatere."],
  ["Payparq combines Mobile License Plate Recognition with AI Computer Vision to turn every space, curb, and garage into a live digital asset. One cloud platform powers payments, enforcement, and analytics across cities and portfolios.", "Payparq kombinira mobilno prepoznavanje registarskih pločica s računalnim AI kako bi svaki prostor, rubnjak i garažu pretvorio u živu digitalnu imovinu. Jedna platforma u oblaku pokreće plaćanja, provedbu i analitiku u gradovima i portfeljima."],
  ["Payparq is building a software-only platform for parking and urban mobility. We are assembling a focused team across product, engineering, operations, and partnerships to redesign how parking portfolios are run.", "Payparq gradi softversku platformu za parkiranje i urbanu mobilnost. Okupljamo fokusirani tim kroz proizvod, inženjering, operacije i partnerstva kako bismo redizajnirali način upravljanja parkirnim portfeljima."],
  ["We review every introduction and follow up when there is a strong match.", "Pregledavamo svaki mail i odgovorimo kada postoji snažna sinergija."],
  ["Make an impact on how cities move and park.", "Utječite na to kako se gradovi kreću i parkiraju."],
  ["We operate with a founder mindset: high autonomy, clear ownership, and bias toward shipping. Agentic roles, not traditional employment constructs.", "Djelujemo s načinom razmišljanja osnivača: visoka autonomija, jasno vlasništvo. Agentičke uloge, a ne tradicionalni oblici zaposlenja."],
  ["Outcome-aligned model tied to city growth and performance — not salaries or benefits. Build value, share in the upside.", "Model usklađen s rezultatima povezan s rastom i učinkom grada — ne s plaćama ili beneficijama. Izgradite vrijednost, sudjelujte u dobitku."],
  ["Remote-friendly", "Prikladan za daljinski"],
  // Calendar and booking related
  ["calendar", "kalendar"],
  ["Calendar", "Kalendar"],
  ["Manage calendar and pricing", "Upravljaj kalendarom i cijenama"],
  ["Manage calendar", "Upravljaj kalendarom"],
  // Parking categories
  ["Airport", "Zračna Luka"],
  ["airport", "Zračna Luka"],
  ["Hotels", "Hoteli"],
  ["hotels", "Hoteli"],
  ["Events", "Eventovi"],
  ["events", "Eventovi"],
  ["Parking near airports", "Parking blizu aerodroma"],
  ["Parking near hotels", "Parking blizu hotela"],
  ["Parking near event venues", "Parking blizu događaja"],
  ["Browse by category", "Pretraži po kategoriji"],
  // Parking terms that Google Translate gets wrong
  ["Valet", "Valet"],
  ["Valet Parking", "Valet parking"],
  ["Self Park", "Samoparkiralište"],
  ["Garage - Covered", "Garaža - natkrivena"],
  ["Lot - Uncovered", "Parcela - Nepokrivena"],
  ["Immediate Parking", "Trenutno parkiranje"],
  ["On-Site Staff", "Osoblje na licu mjesta"],
  ["Month to Month", "Mjesečni najam"],
  ["Iz mjeseca u mjesec", "Mjesečni najam"],
  ["Mjesečni najam", "Mjesečni najam"],
  ["Wheelchair Accessible", "Pristup invalidskim kolicima"],
  ["EV Charging", "Punjenje el. vozila"],
  ["Instant Access", "Rampa"],
  ["Covered Garage", "Natkrivena garaža"],
  ["All Parking Options", "Sve opcije parkiranja"],
  // Sort options
  ["Sort by Relevance", "Poredaj po relevantnosti"],
  ["Sort by Distance", "Poredaj po udaljenosti"],
  ["Sort by Price", "Poredaj po cijeni"],
  ["Poredaj po relevantnosti", "Poredaj po relevantnosti"],
  ["Poredaj po udaljenosti", "Poredaj po udaljenosti"],
  ["Poredaj po cijeni", "Poredaj po cijeni"],
]);

function normalizeInput(text: unknown) {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

async function translateText(text: string, target: AppLocale): Promise<string | null> {
  if (target === "en") return text;
  const override = hrOverrides.get(text);
  if (override) return override;
  const cacheKey = `${target}:${text}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  const parts = Array.isArray(data) && Array.isArray(data[0]) ? (data[0] as Array<Array<unknown>>) : [];
  const translated = parts.map((part) => (typeof part[0] === "string" ? part[0] : "")).join("").trim();
  if (!translated) return null;
  memoryCache.set(cacheKey, translated);
  return translated;
}

async function translateMany(texts: string[], target: AppLocale) {
  if (texts.length === 0) return [];
  const translations = new Array<string | null>(texts.length);
  let cursor = 0;

  async function worker() {
    while (cursor < texts.length) {
      const currentIndex = cursor;
      cursor += 1;
      const text = texts[currentIndex];
      try {
        translations[currentIndex] = await translateText(text, target);
      } catch {
        translations[currentIndex] = null;
      }
    }
  }

  const workers = Math.min(TRANSLATE_CONCURRENCY, texts.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return translations;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    texts?: unknown[];
    target?: string;
  } | null;
  const target: AppLocale = body?.target === "hr" ? "hr" : "en";
  const inputTexts = Array.isArray(body?.texts) ? body?.texts : [];
  const texts = inputTexts.map(normalizeInput).filter(Boolean).slice(0, 400);

  const translations = await translateMany(texts, target);

  return NextResponse.json({ translations });
}
