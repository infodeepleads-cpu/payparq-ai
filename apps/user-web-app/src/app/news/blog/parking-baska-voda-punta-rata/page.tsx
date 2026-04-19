import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

const SITE_URL = "https://www.payparq.com";
const SLUG = "parking-baska-voda-punta-rata";
const CANONICAL = `${SITE_URL}/news/blog/${SLUG}`;

export const metadata: Metadata = {
  title: "Parking Baška Voda i Plaža Punta Rata – Vodič 2025 | PayParq",
  description:
    "Gdje parkirati u Baškoj Vodi i kod plaže Punta Rata? PayParq nudi sigurno parkiranje od €1.00/sat uz Makarsku Rivieru. Savjeti za ljetnu sezonu, cijene i rezervacija.",
  keywords: [
    "parking Baška Voda",
    "parking plaža Punta Rata",
    "parking Punta Rata beach",
    "parking Brela Baška Voda",
    "parking Makarska Riviera",
    "parkiranje Baška Voda",
    "gdje parkirati Baška Voda",
    "parking Split Dalmatia beach",
    "PayParq Baška Voda",
    "parking kraj plaže Makarska",
    "beach parking Croatia Dalmatia",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "article",
    title: "Parking Baška Voda & Punta Rata – od €1.00/sat | PayParq",
    description: "Sigurno parkiranje uz Makarsku Rivieru i plažu Punta Rata. PayParq od €1.00/sat — AI kamere, bez tiketa, rezervacija online.",
    url: CANONICAL,
    siteName: "PayParq",
    locale: "hr_HR",
  },
  twitter: { card: "summary_large_image", title: "Parking Baška Voda / Punta Rata od €1.00/sat | PayParq", description: "Parkirajte sigurno uz najljepšu plažu Makarske Riviere." },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${CANONICAL}#article`,
      "headline": "Parking Baška Voda i Plaža Punta Rata – Vodič 2025",
      "description": "Sve što trebate znati o parkiranju u Baškoj Vodi i kod plaže Punta Rata na Makarskoj Rivieri — cijene, savjeti i PayParq lokacija.",
      "datePublished": "2025-06-10",
      "dateModified": "2026-04-01",
      "author": { "@type": "Organization", "name": "PayParq", "url": SITE_URL },
      "publisher": { "@type": "Organization", "name": "PayParq", "url": SITE_URL, "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon-192.png` } },
      "mainEntityOfPage": { "@type": "WebPage", "@id": CANONICAL },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Gdje parkirati u Baškoj Vodi?", "acceptedAnswer": { "@type": "Answer", "text": "PayParq lokacija 23025 — Safe Parking by PayParq Baška Voda/Punta Rata — nudi sigurno parkiralište od €1.00/sat uz AI nadzor 24/7. Rezervacija online na payparq.com." } },
        { "@type": "Question", "name": "Ima li parking kod plaže Punta Rata?", "acceptedAnswer": { "@type": "Answer", "text": "Da. PayParq parking (23025) nalazi se u blizini plaže Punta Rata kod Brele/Baške Vode. Kapaciteti se brzo pune u srpnju i kolovozu — rezervirajte unaprijed." } },
        { "@type": "Question", "name": "Koliko košta parkiranje na Makarskoj Rivieri?", "acceptedAnswer": { "@type": "Answer", "text": "PayParq parking uz Baška Voda/Punta Rata košta €1.00/sat. Gradska parkinga u Makarskoj i okolici kreću se od €1–3/sat u sezoni, uz ograničene kapacitete." } },
        { "@type": "Question", "name": "Kada je najgušće na parkingu uz Puntu Ratu?", "acceptedAnswer": { "@type": "Answer", "text": "Najgušće je između 9h i 14h u srpnju i kolovozu. Savjetujemo dolazak do 8h ili rezervaciju dan ranije kako biste osigurali mjesto u blizini plaže." } },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "PayParq", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/news` },
        { "@type": "ListItem", "position": 3, "name": "Parking Baška Voda Punta Rata", "item": CANONICAL },
      ],
    },
  ],
};

export default function ParkingBaskaVodaPuntaRata() {
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
            <span className="text-black/70">Parking Baška Voda / Punta Rata</span>
          </nav>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#5F3DFC] font-semibold mb-3">Vodič — Makarska Riviera, Hrvatska</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-black leading-tight">
            Parking Baška Voda<br className="hidden md:block" /> i Plaža Punta Rata
          </h1>
          <p className="text-base md:text-lg text-black/70 max-w-2xl leading-relaxed">
            Punta Rata jednom je bila proglašena jednom od deset najljepših plaža Europe. Dolaze tisuće — a mjesta za parkiranje tek stotine. Evo što trebate znati da biste stigli bez stresa.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["parking Baška Voda","parking Punta Rata","Makarska Riviera","plaža parking Hrvatska"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#F5F2FF] text-[#5F3DFC] text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </section>

        <section className="border-t border-black/5 bg-[#F9FAFB]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Cijena", value: "od €1.00/sat" },
              { label: "Lokacija", value: "Baška Voda / Brela" },
              { label: "Nadzor", value: "AI kamere 24/7" },
              { label: "Rezervacija", value: "Online" },
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Makarska Riviera i problem ljetnog parkinga</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Makarska Riviera proteže se 60 km uz podnožje planine Biokovo, od Brele do Gradca. Plaže poput Punta Rate kod Brele, Baških voda i Nugala privlače posjetitelje iz cijele Europe — posebno u srpnju i kolovozu kada se temperatura mora penje iznad 26°C.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              Problem: uska jadranska magistrala D8 i ograničena lokalna cestovna mreža ne prate turistički rast. Parkirna mjesta u neposrednoj blizini plaža pune se do 9 ili 10 ujutro. Kaznene kartice, remorkeri i blokade svakodnevna su pojava.
            </p>
            <p className="text-black/75 leading-relaxed">
              PayParq nudi rješenje: <strong>sigurno, čuvano parkiralište uz Baška Vodu i Puntu Ratu</strong> s rezervacijom online, AI kamerama i fiksnom satnom cijenom od €1.00. Nema iznenađenja, nema kaznenih kartona.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Plaža Punta Rata — što je čini posebnom</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Punta Rata (<em>hrv. šiljati rt</em>) smještena je na rubu Brele, u Splitsko-dalmatinskoj županiji. Karakterizira je iznimno čista voda (Plava zastava), kameni šljunak, borova šuma koja seže do same linije mora i uvala zaštićena od vjetra.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              Plaža nije masovni turistički pogon — nema glasne glazbe ni restorana direktno na pješčanoj liniji. Upravo ta diskretna ljepota privlači one koji žele autentičnu dalmatinsku obalu. I upravo zato kapaciteti — uključujući parking — lako dostignu maksimum.
            </p>
            <p className="text-black/75 leading-relaxed">
              Baška Voda, jedva 3 km prema jugu, nudi nešto širu infrastrukturu: promenadu, restorane i smještaj. PayParq parking lokacija 23025 u blizini Baške Vode idealna je baza za istraživanje oba područja.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">5 savjeta za parkiranje uz Puntu Ratu i Baška Vodu</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { n: "01", title: "Stignite rano", body: "Dolazak do 8:30h osigurava vam parkiranje i sunčalište. Sve poslije 10h u konici — i parking i plaža su puni." },
                { n: "02", title: "Rezervirajte unaprijed", body: "PayParq online rezervacija jamči vam place — bez kruženja i stresa pri dolasku. Možete rezervirati dan unaprijed." },
                { n: "03", title: "Planirajte duži boravak", body: "Satna cijena €1.00 znači da cijeli dan na plaži (8h) košta €8 — jeftinije od jednog koktela na terasi." },
                { n: "04", title: "Izbjegavajte vikende u kolovozu", body: "Subote i nedjelje u kolovozu su kritične. Ako možete, posjetite Puntu Ratu radnim danom — razlika je drastična." },
                { n: "05", title: "Kombinirajte s Brelom", body: "Brela je 3 km sjeverno — ujutro Punta Rata, popodne Brela promenada, večer Baška Voda. Idealna dnevna ruta." },
                { n: "06", title: "Provjerite vremenske prilike", body: "Bura i maestral mogu podići valove. Na dana s jugom plaža je posebno ugodna — ali i gužvovitija." },
              ].map(tip => (
                <div key={tip.n} className="rounded-2xl border border-black/8 bg-[#F9FAFB] p-5 flex gap-4">
                  <span className="text-2xl font-black text-[#5F3DFC]/30 shrink-0">{tip.n}</span>
                  <div>
                    <p className="font-bold text-black mb-1">{tip.title}</p>
                    <p className="text-sm text-black/65">{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-black">Česta pitanja</h2>
            <div className="space-y-4">
              {[
                { q: "Gdje parkirati u Baškoj Vodi?", a: "PayParq lokacija 23025 — Safe Parking by PayParq Baška Voda/Punta Rata — €1.00/sat uz AI nadzor 24/7. Rezervacija online na payparq.com." },
                { q: "Ima li parking kod plaže Punta Rata?", a: "Da. PayParq parking u blizini Punta Rate/Baške Vode — kapaciteti se brzo pune u srpnju i kolovozu, rezervirajte unaprijed." },
                { q: "Koliko košta parking na Makarskoj Rivieri?", a: "PayParq parking uz Baška Vodu/Puntu Ratu košta €1.00/sat. Gradska parkinga u okolici kreću se od €1–3/sat u sezoni." },
                { q: "Kako doći do Baške Vode iz Splita?", a: "Baška Voda je 55 km od Splita — oko 45 minuta vožnje D8 jadranske magistrale. Preporučujemo izbjegavati magistralu u jutarnjim špicama (8–10h) u sezoni." },
              ].map(item => (
                <div key={item.q} className="rounded-2xl border border-black/8 bg-white p-5">
                  <p className="font-bold text-black mb-2">{item.q}</p>
                  <p className="text-sm text-black/65 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#5F3DFC] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 mb-2">PayParq Baška Voda / Punta Rata</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Rezervirajte parking uz Makarsku Rivieru</h2>
            <p className="text-white/75 mb-6 max-w-md mx-auto">€1.00/sat. Sigurno, čuvano, bez tiketa. Rezervirajte odmah — mjesta su ograničena.</p>
            <Link href="/locations/parking-izmi-baka-voda-23025" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#5F3DFC] font-bold rounded-full text-sm hover:bg-white/90 transition-colors">
              Rezerviraj parking →
            </Link>
          </div>
        </section>
      </main>
      <FooterBrand />
    </div>
  );
}
