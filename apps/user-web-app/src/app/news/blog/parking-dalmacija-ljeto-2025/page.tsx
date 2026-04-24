import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

const SITE_URL = "https://www.payparq.com";
const SLUG = "parking-dalmacija-ljeto-2025";
const CANONICAL = `${SITE_URL}/news/blog/${SLUG}`;

export const metadata: Metadata = {
  title: "Parking u Dalmaciji Ljeto 2025 – Vodič za Turiste i Domaće | PayParq",
  description:
    "Sve što trebate znati o parkiranju u Dalmaciji ljeto 2025: Split, Trogir, Makarska Riviera, Baška Voda. Cijene, savjeti, parking blizu plaža i aerodroma. PayParq sigurno parkiranje.",
  keywords: [
    "parking Dalmacija ljeto 2025",
    "parking Hrvatska ljeto 2025",
    "parking Split ljeto",
    "parking Trogir ljeto",
    "parking Makarska Riviera",
    "ljetovanje Hrvatska parking",
    "parking Split aerodrom ljeto",
    "gdje parkirati Dalmacija",
    "parking hrvatska obala 2025",
    "jeftino parking Dalmacija",
    "turistički parking Hrvatska",
    "PayParq Dalmacija",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "article",
    title: "Parking u Dalmaciji Ljeto 2025 – Kompletni Vodič | PayParq",
    description: "Split, Trogir, Baška Voda, Makarska — sve opcije parkiranja za ljetnu sezonu 2025. Cijene, savjeti i PayParq lokacije uz obalu.",
    url: CANONICAL,
    siteName: "PayParq",
    locale: "hr_HR",
  },
  twitter: { card: "summary_large_image", title: "Parking u Dalmaciji Ljeto 2025 | PayParq", description: "Kompletni vodič za parkiranje uz dalmatinsku obalu — Split, Trogir, Makarska Riviera." },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${CANONICAL}#article`,
      "headline": "Parking u Dalmaciji Ljeto 2025 – Vodič za Turiste i Domaće",
      "description": "Kompletni vodič za parkiranje uz dalmatinsku obalu u ljeto 2025 — Split, Trogir, Makarska Riviera, Baška Voda. Cijene, savjeti i PayParq lokacije.",
      "datePublished": "2025-05-01",
      "dateModified": "2026-04-01",
      "author": { "@type": "Organization", "name": "PayParq", "url": SITE_URL },
      "publisher": { "@type": "Organization", "name": "PayParq", "url": SITE_URL, "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon-192.png` } },
      "mainEntityOfPage": { "@type": "WebPage", "@id": CANONICAL },
      "keywords": "parking Dalmacija, parking Hrvatska ljeto, parking Split, parking Trogir, parking Makarska",
      "about": { "@type": "Place", "name": "Dalmatia, Croatia", "geo": { "@type": "GeoCoordinates", "latitude": 43.5, "longitude": 16.5 } },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Gdje parkirati u Dalmaciji ljeto 2025?", "acceptedAnswer": { "@type": "Answer", "text": "PayParq nudi tri lokacije uz dalmatinsku obalu: Split Airport/Trogir (€0.50/sat), Park&Ride Trogir (€0.90/sat) i Baška Voda/Punta Rata (€1.00/sat). Sve lokacije imaju AI kamera nadzor 24/7 i online rezervaciju." } },
        { "@type": "Question", "name": "Kada je najgušće parkiranje u Dalmaciji?", "acceptedAnswer": { "@type": "Answer", "text": "Najgušće je u srpnju i kolovozu, posebno vikendom između 9h i 15h. Savjet: dolazite do 8:30h ili rezervirajte online dan ranije. PayParq omogućuje unaprijednu rezervaciju bez dodatne naknade." } },
        { "@type": "Question", "name": "Koliko košta parkiranje u Splitu?", "acceptedAnswer": { "@type": "Answer", "text": "Parkiranje u centru Splita kreće se od €1.50–3/sat. Službeni airport parking košta €0.50–5/sat. PayParq lokacije uz Split Airport u Trogiru/Kaštelima nude parkiranje od €0.50/sat — Park & Taxi opcija uključuje shuttle do terminala." } },
        { "@type": "Question", "name": "Postoji li jeftino parkiranje uz dalmatinsku obalu?", "acceptedAnswer": { "@type": "Answer", "text": "Da. PayParq nudi najpovoljnije čuvano parkiranje uz obalu: od €0.50/sat blizu aerodroma Split, €0.90/sat u Trogiru i €1.00/sat na Makarskoj Rivieri. Sve lokacije su osigurane AI kamerama." } },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "PayParq", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/news` },
        { "@type": "ListItem", "position": 3, "name": "Parking Dalmacija Ljeto 2025", "item": CANONICAL },
      ],
    },
  ],
};

export default function ParkingDalmacijaLjeto2025() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-14 md:py-20">
          <nav className="text-[11px] text-black/40 mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-black">PayParq</Link>
            <span>/</span>
            <Link href="/news" className="hover:text-black">Blog</Link>
            <span>/</span>
            <span className="text-black/70">Parking Dalmacija Ljeto 2025</span>
          </nav>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#5F3DFC] font-semibold mb-3">Vodič — Dalmacija, Hrvatska</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-black leading-tight">
            Parking u Dalmaciji<br className="hidden md:block" /> Ljeto 2025
          </h1>
          <p className="text-base md:text-lg text-black/70 max-w-2xl leading-relaxed">
            Dalmatinska obala je ljeti najljepše mjesto na Mediteranu. I jedno od najgušćih. Ovaj vodič pomaže vam da pronađete parking, izbjegnete kaznene kartice i uštedite na troškovima — od aerodroma Split do najudaljenijih plaža.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["parking Dalmacija","parking Hrvatska ljeto","Split Trogir Makarska","ljetovanje bez stresa"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#F5F2FF] text-[#5F3DFC] text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </section>

        <section className="border-t border-black/5 bg-[#F9FAFB]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
            <h2 className="text-xl font-bold text-black mb-6">PayParq lokacije uz dalmatinsku obalu</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Split Aerodrom / Trogir", price: "€0.50/sat", detail: "Park & Taxi opcija s shuttleom · 2–3 km od SPU", href: "/locations/parking-trogir-40058", tag: "Aerodrom" },
                { name: "Park&Ride Trogir", price: "€0.90/sat", detail: "10 min hoda do UNESCO starog grada", href: "/locations/safe-parkride-by-payparq-trogir-61440", tag: "Stari grad" },
                { name: "Baška Voda / Punta Rata", price: "€1.00/sat", detail: "Uz Makarsku Rivieru · plaža Punta Rata", href: "/locations/parking-izmi-baka-voda-23025", tag: "Plaža" },
              ].map(loc => (
                <Link key={loc.name} href={loc.href} className="group bg-white rounded-2xl border border-black/8 p-5 hover:border-[#5F3DFC]/40 hover:shadow-sm transition-all">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#F5F2FF] text-[#5F3DFC] text-[10px] font-bold mb-3">{loc.tag}</span>
                  <p className="font-bold text-black mb-1 group-hover:text-[#5F3DFC] transition-colors">{loc.name}</p>
                  <p className="text-[#5F3DFC] font-semibold text-sm mb-1">{loc.price}</p>
                  <p className="text-xs text-black/50">{loc.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 md:px-12 py-14 space-y-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Realna situacija na parkingima u Dalmaciji ljeto 2025</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Hrvatska je 2024. godine zabilježila rekordnih 21+ milijuna turističkih dolazaka. Dalmacija — Split, Dubrovnik, Šibenik, Makarska Riviera — prima najveći udio tog prometa. Pritisak na cestovnu infrastrukturu i parkinge raste iz godine u godinu bez proporcionalnog rasta kapaciteta.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              U kolovozu 2024., prometna policija u Splitsko-dalmatinskoj županiji izdala je tisuće kaznenih naloga za nepravilno parkiranje. Remorkeri su radili prekovremeno. Turisti su gubili sat-dva na potražnji za parkirnim mjestom umjesto da se opuštaju.
            </p>
            <p className="text-black/75 leading-relaxed">
              Rješenje nije graditi više parkinga — to traje godinama. Rješenje je <strong>pametnija raspodjela postojećih kapaciteta</strong>. PayParq to čini online rezervacijom, AI nadzorom i transparentnim cijenama dostupnim svima.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Grad po grad: stanje parkinga u ljetnoj Dalmaciji</h2>

            <div className="space-y-6">
              <div className="rounded-2xl border border-black/8 p-6">
                <h3 className="text-lg font-bold text-black mb-2">Split i aerodrom</h3>
                <p className="text-black/70 text-sm leading-relaxed mb-3">
                  Split je gravitacijski centar Dalmacije. Trajektna luka, aerodrom, autocesta — sve ceste vode prema Splitu. Centar grada nema dovoljno parkinga za lokalne stanovnike, a kamoli za 2–3 milijuna turista godišnje. Podzemna garaža Gripe i gradski parkovi pune se do kapaciteta do 9h u sezoni.
                </p>
                <p className="text-black/70 text-sm leading-relaxed">
                  <strong>PayParq preporuka:</strong> Za dolaske avionom, PayParq uz aerodrom (€0.50/sat) znatno je povoljniji od airportskih opcija (€0.50–5/sat). Park & Taxi opcija uključuje shuttle do terminala za 5 minuta — bez stresa, bez kruženja.
                </p>
              </div>

              <div className="rounded-2xl border border-black/8 p-6">
                <h3 className="text-lg font-bold text-black mb-2">Trogir — UNESCO stari grad</h3>
                <p className="text-black/70 text-sm leading-relaxed mb-3">
                  Trogir prima 800.000+ posjetitelja godišnje, a stari grad je zabranjen za osobna vozila. Parkiranje na kopnenoj strani brzo se popuni, a alternativa su nesigurna mjesta uz magistralu ili skupi privatni parking.
                </p>
                <p className="text-black/70 text-sm leading-relaxed">
                  <strong>PayParq preporuka:</strong> Park&Ride Trogir (€0.90/sat) — 800m hoda do Kopnene kapije, osiguran i pristupačan.
                </p>
              </div>

              <div className="rounded-2xl border border-black/8 p-6">
                <h3 className="text-lg font-bold text-black mb-2">Makarska Riviera — Baška Voda, Brela, Makarska</h3>
                <p className="text-black/70 text-sm leading-relaxed mb-3">
                  Riviera je 60 km plaža s ograničenim pristupnim cestama. U srpnju i kolovozu dolaze turisti iz Češke, Slovačke, Njemačke i Poljske s autobusima i automobilima. Parkiranje uz plaže najgušće je između 9h i 16h.
                </p>
                <p className="text-black/70 text-sm leading-relaxed">
                  <strong>PayParq preporuka:</strong> Baška Voda/Punta Rata (€1.00/sat) — rezervirajte večer ranije, dođite rano, uživajte bez kaznenih kartona.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">10 pravila za bezstresno parkiranje u Dalmaciji</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { n: "1", t: "Rezervirajte dan ranije", b: "Posebno za aerodrom i popularnih plaža. Online rezervacija PayParq je besplatna." },
                { n: "2", t: "Stignite prije 9h", b: "Na svim popularnim lokacijama kapaciteti se pune do 9:30h u sezoni." },
                { n: "3", t: "Izbjegavajte vikende", b: "Subota–nedjelja u kolovozu su kritične. Radni dan = 30–40% manje gužve." },
                { n: "4", t: "Nikad ne parkirajte uz magistralu", b: "D8 je strogo nadgledana. Remorkeri rade cijeli dan — rizik nije vrijedan uštede." },
                { n: "5", t: "Koristite Park&Ride", b: "U Trogiru i Splitu Park&Ride je brži od traženja mjesta u centru." },
                { n: "6", t: "Platite unaprijed karticom", b: "Kovanice i gotovina sve su rjeđe. Svi PayParq parkizi prihvaćaju kartice online." },
                { n: "7", t: "Provjerite radno vrijeme", b: "Neke plaže imaju sezonske parking tarife — skuplje u vrhuncu sezone." },
                { n: "8", t: "Fotografirajte ulaz", b: "Na neoznačenim lokacijama zabilježite gdje ste parkirati — uže ulice izgledaju jednako." },
                { n: "9", t: "Planirajte izlazno vrijeme", b: "Izlaz s popularnih plaža (15–17h) može biti zastoj od 20–30 minuta." },
                { n: "10", t: "Budite fleksibilni", b: "Ako je parking pun — prošetajte 10 minuta dalje. Obično ima mjesta." },
              ].map(tip => (
                <div key={tip.n} className="flex gap-3 rounded-xl border border-black/8 bg-[#F9FAFB] p-4">
                  <span className="w-7 h-7 rounded-full bg-[#5F3DFC] text-white font-black text-xs flex items-center justify-center shrink-0">{tip.n}</span>
                  <div>
                    <p className="font-bold text-black text-sm mb-0.5">{tip.t}</p>
                    <p className="text-xs text-black/55">{tip.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-black">Česta pitanja — Parking Dalmacija 2025</h2>
            <div className="space-y-4">
              {[
                { q: "Gdje parkirati u Dalmaciji ljeto 2025?", a: "PayParq nudi tri lokacije uz dalmatinsku obalu: Split Airport/Trogir (€0.50/sat), Park&Ride Trogir (€0.90/sat) i Baška Voda/Punta Rata (€1.00/sat). Sve imaju AI nadzor i online rezervaciju." },
                { q: "Kada je najgušće parkiranje u Dalmaciji?", a: "Srpanj i kolovoz, posebno vikendom između 9h i 15h. Savjet: dolazite do 8:30h ili rezervirajte dan ranije." },
                { q: "Koliko košta parkiranje u Splitu?", a: "Centar Splita: €1.50–3/sat. Službeni airport parking: €0.50–5/sat. PayParq lokacija uz Split Airport u Trogiru: od €0.50/sat — Park & Taxi opcija uključuje shuttle." },
                { q: "Postoji li jeftino čuvano parkiranje uz dalmatinsku obalu?", a: "Da — PayParq nudi najpovoljnije sigurno parkiranje uz obalu: od €0.50/sat kod aerodroma, €0.90/sat u Trogiru, €1.00/sat na Makarskoj Rivieri." },
              ].map(item => (
                <div key={item.q} className="rounded-2xl border border-black/8 bg-white p-5">
                  <p className="font-bold text-black mb-2">{item.q}</p>
                  <p className="text-sm text-black/65 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#5F3DFC] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 mb-2">PayParq Dalmacija</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Parkirajte pametno ovog ljeta</h2>
            <p className="text-white/75 mb-6 max-w-md mx-auto">Split Aerodrom · Trogir · Makarska Riviera. Rezervirajte za 60 sekundi.</p>
            <Link href="/locations" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#5F3DFC] font-bold rounded-full text-sm hover:bg-white/90 transition-colors">
              Sve lokacije →
            </Link>
          </div>
        </section>
      </main>
      <FooterBrand />
    </div>
  );
}
