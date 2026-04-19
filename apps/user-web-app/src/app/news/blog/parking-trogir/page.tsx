import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

const SITE_URL = "https://www.payparq.com";
const SLUG = "parking-trogir";
const CANONICAL = `${SITE_URL}/news/blog/${SLUG}`;

export const metadata: Metadata = {
  title: "Parking Trogir – Gdje Parkirati u Trogiru 2025 | PayParq",
  description:
    "Sve o parkiranju u Trogiru: gdje parkirati blizu Staroga grada, cijene, Park&Ride rješenje i kako izbjeći gužve. PayParq nudi Park&Ride od €0.90/sat s pristupom UNESCO baštini.",
  keywords: [
    "parking Trogir",
    "gdje parkirati u Trogiru",
    "parking Trogir stari grad",
    "parking Trogir centar",
    "parking Trogir cijena",
    "Park Ride Trogir",
    "parking Trogir UNESCO",
    "jeftino parkiranje Trogir",
    "parking Trogir ljeto",
    "Trogir old town parking",
    "parking near Trogir Croatia",
    "PayParq Trogir",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "article",
    title: "Parking Trogir – Gdje Parkirati uz UNESCO Stari Grad 2025 | PayParq",
    description: "Park&Ride parking uz Trogir od €0.90/sat. Bez gužvi, bez kruženja — parkirajte i hodajte do starog grada za 10 minuta.",
    url: CANONICAL,
    siteName: "PayParq",
    locale: "hr_HR",
  },
  twitter: { card: "summary_large_image", title: "Parking Trogir od €0.90/sat | PayParq Park&Ride", description: "Parkirajte blizu Trogira, hodajte do UNESCO starog grada." },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${CANONICAL}#article`,
      "headline": "Parking Trogir – Gdje Parkirati u Trogiru 2025",
      "description": "Kompletni vodič za parkiranje u Trogiru: Park&Ride opcije, cijene, savjeti za sezonu i PayParq lokacija uz UNESCO Stari grad.",
      "datePublished": "2025-05-15",
      "dateModified": "2026-04-01",
      "author": { "@type": "Organization", "name": "PayParq", "url": SITE_URL },
      "publisher": { "@type": "Organization", "name": "PayParq", "url": SITE_URL, "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon-192.png` } },
      "mainEntityOfPage": { "@type": "WebPage", "@id": CANONICAL },
      "keywords": "parking Trogir, Park Ride Trogir, jeftino parkiranje Trogir",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Gdje parkirati u Trogiru?", "acceptedAnswer": { "@type": "Answer", "text": "Najbliže i najpovoljnije parkiranje uz Trogirski stari grad je PayParq Park&Ride lokacija (61440) koja se nalazi 800m od ulaza u stari grad. Cijena je €0.90/sat, bez tiketa, plaćanje karticom online." } },
        { "@type": "Question", "name": "Koliko košta parkiranje u Trogiru?", "acceptedAnswer": { "@type": "Answer", "text": "Parkiranje u centru Trogira (gradski parking) košta €1–2/sat u sezoni. PayParq Park&Ride lokacija nudi parkiranje od €0.90/sat, 800m pješačke udaljenosti od starog grada." } },
        { "@type": "Question", "name": "Može li se parkirati u samom centru Trogira?", "acceptedAnswer": { "@type": "Answer", "text": "Trogirski stari grad je na otočiću — osobnim automobilima nije dopušten ulaz. Parking je potrebno pronaći na kopnu ili Čiovu. Preporuka je Park&Ride koji je najbliži pristupu starom gradu." } },
        { "@type": "Question", "name": "Koliko je daleko PayParq parking od Trogira?", "acceptedAnswer": { "@type": "Answer", "text": "PayParq Park&Ride Trogir (lokacija 61440) nalazi se 800m od ulaza u stari grad — otprilike 10 minuta pješice. Idealna opcija za izbjegavanje prometnih gužvi u centru." } },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "PayParq", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/news` },
        { "@type": "ListItem", "position": 3, "name": "Parking Trogir", "item": CANONICAL },
      ],
    },
  ],
};

export default function ParkingTrogir() {
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
            <span className="text-black/70">Parking Trogir</span>
          </nav>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#5F3DFC] font-semibold mb-3">Vodič — Trogir, Hrvatska</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-black leading-tight">
            Parking Trogir:<br className="hidden md:block" /> Gdje Parkirati uz UNESCO Stari Grad
          </h1>
          <p className="text-base md:text-lg text-black/70 max-w-2xl leading-relaxed">
            Trogir je jedan od najljepših gradova Jadranske obale — ali parkiranje može pretvoriti ljepotu u frustraciju. Ovaj vodič govori vam točno gdje parkirati, kako izbjeći gužve i zašto je Park&Ride pravo rješenje.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["parking Trogir","Park&Ride Trogir","parking stari grad","jeftino parkiranje Trogir"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#F5F2FF] text-[#5F3DFC] text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </section>

        <section className="border-t border-black/5 bg-[#F9FAFB]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Cijena", value: "od €0.90/sat" },
              { label: "Do starog grada", value: "10 min pješice" },
              { label: "Tip", value: "Park & Ride" },
              { label: "Radno vrijeme", value: "24/7" },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-2xl border border-black/8 p-4 text-center">
                <p className="text-[11px] uppercase tracking-wider text-black/40 mb-1">{item.label}</p>
                <p className="text-base font-bold text-black">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 md:px-12 py-14 space-y-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Zašto je parking u Trogiru problem?</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Trogirski stari grad upisan je na UNESCO-ov Popis svjetske baštine 1997. godine. Smješten je na malom otočiću između kopna i otoka Čiova, pristupan sa dva mosta. Ovakva geografija znači jedno: unutar zidina nema mjesta za automobile. Promet osobnih vozila u stari grad je zabranjen.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              Parking na kopnenoj strani Trogira brzo se puni — pogotovo u srpnju i kolovozu kada grad posjeti nekoliko tisuća turista dnevno. Kruženje u potrazi za mjestom u blizini centra može potrajati 20–30 minuta, posebno između 10h i 17h.
            </p>
            <p className="text-black/75 leading-relaxed">
              Rješenje je <strong>Park&Ride</strong>: parkirati izvan gužve i kratko prošetati ili uzeti prijevoz do starog grada. PayParq Park&Ride Trogir (lokacija 61440) nalazi se 800m od ulaza u stari grad — manje od 10 minuta hoda.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Što morate znati o PayParq Park&Ride Trogir</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Lokacija", body: "Lokacija 61440 — Safe Park&Ride by PayParq Trogir. Koordinate: 43.5446°N 16.2799°E, uz pristupnu cestu do Trogira, 800m od Sjeverne gradske kapije." },
                { title: "Cijena", body: "€0.90/sat. Plaćanje karticom online — nema tiketa, nema kovanica, nema papira. Račun stiže na email odmah." },
                { title: "Sigurnost", body: "AI kamere rade 24/7. Sustav prepoznavanja tablice bilježi svaki ulazak i izlazak. Ograđen perimetar, bez nesigurnosti." },
                { title: "Pristup starom gradu", body: "10 minuta pješice do Kopnene kapije (Porta Terraferma). Ugodan šetalište uz kanal. Idealno za obitelji s djecom." },
              ].map(item => (
                <div key={item.title} className="rounded-2xl border border-black/8 bg-[#F9FAFB] p-5">
                  <p className="font-bold text-black mb-2">{item.title}</p>
                  <p className="text-sm text-black/65 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Trogir: što posjetiti i kada ići</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Stari grad Trogira krije neke od najvažnijih romaničko-gotičkih građevina na Mediteranu. Katedrala sv. Lovre s portalom Radovana (13. st.) remek je djelo europske skulpture. Trg Ivana Pavla II., Cipikova palača i gradske zidine zajedno čine urbani muzej na otvorenom.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              Savjet za izbjegavanje gužvi: dolazak <strong>prije 9h ili nakon 17h</strong> znači mirnije šetnje, dostupne terrase i lakše fotografiranje bez mase turista. U tom terminu i parking je slobodniji — i jeftiniji.
            </p>
            <p className="text-black/75 leading-relaxed">
              Trogir se nalazi 27 km od Splita i 6 km od Aerodroma Split — što ga čini idealnom prvom ili posljednjom destinacijom na vašem putovanju kroz Dalmaciju.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-black">Česta pitanja — Parking Trogir</h2>
            <div className="space-y-4">
              {[
                { q: "Gdje parkirati u Trogiru?", a: "Najbliže i najpovoljnije parkiranje uz Trogirski stari grad je PayParq Park&Ride lokacija (61440) — 800m od ulaza u stari grad, €0.90/sat, bez tiketa." },
                { q: "Koliko košta parkiranje u Trogiru?", a: "PayParq Park&Ride košta €0.90/sat. Gradski parking u centru (na kopnu) kreće se od €1–2/sat u sezoni, ali mjesta se brzo popune." },
                { q: "Može li se ući automobilom u stari grad Trogira?", a: "Ne. Trogirski stari grad je na otočiću — osobnim automobilima nije dopušten ulaz. Parkirajte na kopnu ili koristite Park&Ride." },
                { q: "Koliko je daleko PayParq parking od centra Trogira?", a: "800 metara — otprilike 10 minuta ugodnog hoda uz kanal do Kopnene gradske kapije." },
              ].map(item => (
                <div key={item.q} className="rounded-2xl border border-black/8 bg-white p-5">
                  <p className="font-bold text-black mb-2">{item.q}</p>
                  <p className="text-sm text-black/65 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#5F3DFC] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 mb-2">PayParq Park&Ride Trogir</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Parkirajte uz Trogir od €0.90/sat</h2>
            <p className="text-white/75 mb-6 max-w-md mx-auto">10 minuta pješice do UNESCO starog grada. Bez gužvi, bez tiketa.</p>
            <Link href="/locations/safe-parkride-by-payparq-trogir-61440" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#5F3DFC] font-bold rounded-full text-sm hover:bg-white/90 transition-colors">
              Rezerviraj parking →
            </Link>
          </div>
        </section>
      </main>
      <FooterBrand />
    </div>
  );
}
