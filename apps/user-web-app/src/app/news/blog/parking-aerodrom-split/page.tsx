import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

const SITE_URL = "https://www.payparq.com";
const SLUG = "parking-aerodrom-split";
const CANONICAL = `${SITE_URL}/news/blog/${SLUG}`;

export const metadata: Metadata = {
  title: "Parking Aerodrom Split – Jeftino i Sigurno Parkiranje uz SPU | PayParq",
  description:
    "Trebate parking blizu Aerodroma Split (SPU)? PayParq nudi sigurno parkiranje od €0.50/sat. Park & Taxi opcija uključuje shuttle do terminala. Bez papira, bez čekanja — registracija tablice kamerom.",
  keywords: [
    "parking aerodrom Split",
    "parking Split airport",
    "parking SPU",
    "jeftino parkiranje aerodrom Split",
    "parking blizu aerodroma Split",
    "parking Trogir aerodrom",
    "parking Kaštela aerodrom",
    "dugo parkiranje Split aerodrom",
    "PayParq Split",
    "parking Hrvatska aerodrom",
    "park and taxi aerodrom Split",
    "cheap parking Split airport Croatia",
    "long stay parking Split airport",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "article",
    title: "Parking Aerodrom Split – od €0.50/sat, Park & Taxi opcija | PayParq",
    description:
      "Sigurno i jeftino parkiranje uz Split Airport (SPU) — od €0.50/sat, AI kamera registracija tablice. Park & Taxi opcija uključuje shuttle do terminala. Rezervirajte online bez aplikacije.",
    url: CANONICAL,
    siteName: "PayParq",
    locale: "hr_HR",
    images: [{ url: `${SITE_URL}/og-split-airport.jpg`, width: 1200, height: 630, alt: "PayParq parking Split aerodrom" }],
  },
  twitter: { card: "summary_large_image", title: "Parking Aerodrom Split od €0.50/sat | PayParq", description: "Sigurno parkiranje uz SPU. Park & Taxi opcija sa shuttleom dostupna. Bez tiketa, bez aplikacije." },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${CANONICAL}#article`,
      "headline": "Parking Aerodrom Split – Jeftino i Sigurno Parkiranje uz SPU",
      "description": "Vodič za parkiranje uz Split Airport (SPU): cijene, lokacije, PayParq Park & Taxi servis i savjeti za ljetnu sezonu.",
      "datePublished": "2025-06-01",
      "dateModified": "2026-04-01",
      "author": { "@type": "Organization", "name": "PayParq", "url": SITE_URL },
      "publisher": {
        "@type": "Organization",
        "name": "PayParq",
        "url": SITE_URL,
        "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon-192.png` },
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": CANONICAL },
      "keywords": "parking aerodrom Split, parking SPU, jeftino parkiranje Split airport",
      "about": {
        "@type": "LocalBusiness",
        "name": "PayParq Safe Parking – Split Airport / Trogir",
        "url": `${SITE_URL}/locations/parking-trogir-40058`,
        "geo": { "@type": "GeoCoordinates", "latitude": 43.5426, "longitude": 16.3115 },
        "priceRange": "€€",
        "address": { "@type": "PostalAddress", "addressLocality": "Trogir", "addressRegion": "Split-Dalmatia County", "addressCountry": "HR" },
      },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Koliko košta parking blizu Aerodroma Split?",
          "acceptedAnswer": { "@type": "Answer", "text": "PayParq parkiranje uz Split Airport (SPU) košta od €0.50 po satu. Za usporedbu, službeni airport parking košta €3–8/sat. Dnevna karta dostupna za dugotrajno parkiranje." },
        },
        {
          "@type": "Question",
          "name": "Ima li shuttle do terminala Aerodroma Split?",
          "acceptedAnswer": { "@type": "Answer", "text": "PayParq standardno parkiranje ne uključuje shuttle. Park & Taxi opcija uključuje shuttle servis od parkinga do terminala SPU — vožnja traje 3–5 minuta." },
        },
        {
          "@type": "Question",
          "name": "Trebam li aplikaciju za PayParq parking?",
          "acceptedAnswer": { "@type": "Answer", "text": "Ne. PayParq koristi AI kamera tehnologiju koja automatski prepoznaje registarsku tablicu vašeg vozila. Nema tiketa, nema aplikacije, nema čekanja na ulaz/izlaz." },
        },
        {
          "@type": "Question",
          "name": "Kako rezervirati parking uz aerodrom Split?",
          "acceptedAnswer": { "@type": "Answer", "text": "Posjetite payparq.com, odaberite lokaciju Split Airport/Trogir, unesite datum dolaska i odlaska te registarsku tablicu. Plaćanje kartom online. Potvrda stigne na email." },
        },
        {
          "@type": "Question",
          "name": "Koliko je daleko PayParq parking od terminala SPU?",
          "acceptedAnswer": { "@type": "Answer", "text": "PayParq parking se nalazi 2–3 km od terminala Aerodroma Split. Park & Taxi opcija uključuje shuttle do terminala za 3–5 minuta." },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "PayParq", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/news` },
        { "@type": "ListItem", "position": 3, "name": "Parking Aerodrom Split", "item": CANONICAL },
      ],
    },
  ],
};

export default function ParkingAerodromSplit() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main className="flex-1 bg-white pt-24 md:pt-28">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-14 md:py-20">
          <nav className="text-[11px] text-black/40 mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-black">PayParq</Link>
            <span>/</span>
            <Link href="/news" className="hover:text-black">Blog</Link>
            <span>/</span>
            <span className="text-black/70">Parking Aerodrom Split</span>
          </nav>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#5F3DFC] font-semibold mb-3">Vodič — Split, Hrvatska</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-black leading-tight">
            Parking Aerodrom Split:<br className="hidden md:block" /> Jeftino, Sigurno i bez Čekanja
          </h1>
          <p className="text-base md:text-lg text-black/70 max-w-2xl leading-relaxed">
            Split Airport (SPU) primi više od 4 milijuna putnika godišnje — a pitanje parkinga vrijedi rješiti unaprijed. Ovaj vodič objašnjava gdje parkirati, koliko košta i zašto PayParq nudi najpovoljniju opciju uz aerodrom.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["parking aerodrom Split","parking SPU","park & taxi Split airport","jeftino parkiranje Split"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#F5F2FF] text-[#5F3DFC] text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </section>

        {/* Key facts */}
        <section className="border-t border-black/5 bg-[#F9FAFB]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Cijena", value: "od €0.50/sat" },
              { label: "Udaljenost od SPU", value: "2–3 km" },
              { label: "Park & Taxi", value: "shuttle uključen" },
              { label: "Rezervacija", value: "bez aplikacije" },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-2xl border border-black/8 p-4 text-center">
                <p className="text-[11px] uppercase tracking-wider text-black/40 mb-1">{item.label}</p>
                <p className="text-base font-bold text-black">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Main content */}
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-14 space-y-12">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Zašto je parking uz aerodrom Split problem?</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Aerodrom Split (IATA: SPU) smješten je u Kaštelima, između Splita i Trogira, uz obalu Kaštelanskog zaljeva. U ljetnoj sezoni — lipanj do rujan — prometna opterećenost na D8 jadranskoj magistrali i pristupnim cestama dostiže kritične razine. Dolazak automobilom bez rezerviranog parkinga znači kruženje, izgubljeno vrijeme i nervozu upravo onda kada vam to najmanje treba.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              Službeni airport parking (<em>P1, P2, P3</em>) nudi praktičnost, ali po cijeni: kratkoročno parkiranje kreće od €0.50 do €5/sat, a tjednac može koštati i do €70. Za porodice ili dulja putovanja, to je značajan trošak koji se može izbjeći.
            </p>
            <p className="text-black/75 leading-relaxed">
              PayParq parking uz Split Airport nudi alternativu — sigurnost, online rezervacija i AI kamera sustav po cijeni koja počinje od <strong>€0.50/sat</strong>. Lokacija se nalazi 2–3 km od terminala. Za putnike koji trebaju prijevoz do terminala dostupna je <strong>Park & Taxi opcija koja uključuje shuttle</strong> (3–5 minuta do vrata za ukrcaj).
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Kako funkcionira PayParq sustav bez tiketa?</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              PayParq koristi <strong>AI kamera tehnologiju prepoznavanja registarskih tablica</strong> (LPR — License Plate Recognition). Kada uđete na parking, kamera bilježi vašu tablicu. Nema tiketa, nema kartice, nema aplikacije za instaliranje. Sustav prati vaše vozilo od ulaska do izlaska i automatski naplaćuje točan iznos.
            </p>
            <ul className="space-y-3 text-black/75">
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Ulaz:</strong> Vozite do rampe — kamera čita tablicu, rampa se automatski otvara.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Park & Taxi (opcija):</strong> Odaberite Park & Taxi pri rezervaciji — vozač stiže za &lt;5 minuta i odvozi vas do terminala. Shuttle je uključen u ovu opciju.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Povratak:</strong> Dogovorite povratak Park & Taxi shuttleom čim preuzmete prtljagu — vozač čeka pred terminalom.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Izlaz:</strong> Kamera bilježi izlaz, naplaćuje se točno trajanje, potvrda ide na email.</span></li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Usporedba opcija parkinga uz SPU</h2>
            <div className="overflow-x-auto rounded-2xl border border-black/10">
              <table className="w-full text-sm text-black/80">
                <thead className="bg-[#F9FAFB] text-[11px] uppercase tracking-wider text-black/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Opcija</th>
                    <th className="px-4 py-3 text-left">Cijena/sat</th>
                    <th className="px-4 py-3 text-left">Shuttle</th>
                    <th className="px-4 py-3 text-left">Rezervacija</th>
                    <th className="px-4 py-3 text-left">Sigurnost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  <tr className="bg-[#F5F2FF]">
                    <td className="px-4 py-3 font-semibold text-[#5F3DFC]">PayParq (preporučeno)</td>
                    <td className="px-4 py-3 font-bold">€0.50</td>
                    <td className="px-4 py-3">Park & Taxi opcija</td>
                    <td className="px-4 py-3">Online</td>
                    <td className="px-4 py-3">AI kamere 24/7</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Airport P1/P2</td>
                    <td className="px-4 py-3">€0.50–5</td>
                    <td className="px-4 py-3">✓ Pješice</td>
                    <td className="px-4 py-3">Na licu mjesta</td>
                    <td className="px-4 py-3">Čuvano</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Ulična parkinga Kaštela</td>
                    <td className="px-4 py-3">€0–1</td>
                    <td className="px-4 py-3">✗ Nema</td>
                    <td className="px-4 py-3">Nema</td>
                    <td className="px-4 py-3">Nema</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Savjeti za parkiranje uz Split Airport u sezoni</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Rezervirajte unaprijed", body: "U srpnju i kolovozu kapaciteti se pune brzo. Rezervacija dan-dva ranije osigurava vam mjesto i fiksnu cijenu." },
                { title: "Izbjegavajte jutarnje špice", body: "Prijevozi prema SPU najgušći su između 5–8h i 16–19h. Dovedite auto večer prije ako letite rano ujutro." },
                { title: "Provjerite terminal", body: "SPU ima jedan putnički terminal. Park & Taxi shuttle vas vozi direktno pred ulaz — nema zabune s terminalima." },
                { title: "Dugotrajno parkiranje", body: "Za putovanja dulja od 3 dana PayParq dnevna tarifa značajno štedi u usporedbi s airportskim opcijama." },
              ].map(tip => (
                <div key={tip.title} className="rounded-2xl border border-black/8 bg-[#F9FAFB] p-5">
                  <p className="font-bold text-black mb-2">{tip.title}</p>
                  <p className="text-sm text-black/65">{tip.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-black">Česta pitanja — Parking Aerodrom Split</h2>
            <div className="space-y-4">
              {[
                { q: "Koliko košta parking blizu Aerodroma Split?", a: "PayParq parkiranje uz Split Airport (SPU) košta od €0.50 po satu. Za usporedbu, službeni airport parking košta €0.50–5/sat. Dostupne su i dnevne i tjedne karte za dugotrajno parkiranje." },
                { q: "Ima li shuttle do terminala Aerodroma Split?", a: "PayParq standardno parkiranje ne uključuje shuttle. Park & Taxi opcija uključuje shuttle servis od parkinga do terminala SPU — vožnja traje 3–5 minuta. Vozač dolazi odmah nakon rezervacije." },
                { q: "Trebam li aplikaciju za PayParq parking?", a: "Ne. PayParq koristi AI kamera tehnologiju koja automatski prepoznaje registarsku tablicu. Nema tiketa, nema aplikacije, nema čekanja na ulaz/izlaz." },
                { q: "Je li parking uz aerodrom Split siguran?", a: "Da. PayParq lokacije opremljene su AI kamerama koje rade 24/7, imaju ograđen perimetar i online nadzor. Vaše vozilo je sigurno dok ste vi na putu." },
                { q: "Mogu li rezervirati parking za dulje od tjedan dana?", a: "Da. PayParq podržava dugotrajne rezervacije. Za putovanja dulja od 7 dana kontaktirajte podršku za posebne tarife." },
              ].map(item => (
                <div key={item.q} className="rounded-2xl border border-black/8 bg-white p-5">
                  <p className="font-bold text-black mb-2">{item.q}</p>
                  <p className="text-sm text-black/65 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-3xl bg-[#5F3DFC] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 mb-2">PayParq Split Airport</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Rezervirajte parking uz SPU od €0.50/sat</h2>
            <p className="text-white/75 mb-6 max-w-md mx-auto">Sigurno, jeftino, bez tiketa. Park & Taxi opcija s shuttleom do terminala dostupna.</p>
            <Link href="/locations/parking-trogir-40058" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#5F3DFC] font-bold rounded-full text-sm hover:bg-white/90 transition-colors">
              Rezerviraj parking →
            </Link>
          </div>

        </section>
      </main>
      <FooterBrand />
    </div>
  );
}
