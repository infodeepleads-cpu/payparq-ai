import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

const SITE_URL = "https://www.payparq.com";
const SLUG = "smart-parking-hrvatska-2025";
const CANONICAL = `${SITE_URL}/news/blog/${SLUG}`;

export const metadata: Metadata = {
  title: "Smart Parking Croatia 2025 – How PayParq Works | PayParq",
  description:
    "PayParq is Croatia's first software-only parking platform. No tickets, no apps, no barriers — AI license plate cameras handle everything. Deployed across Split, Trogir, and the Makarska Riviera.",
  keywords: [
    "smart parking Croatia",
    "pametno parkiranje Hrvatska",
    "AI parking Croatia",
    "parking technology Croatia",
    "LPR parking Croatia",
    "cashless parking Croatia",
    "PayParq technology",
    "parking bez tiketa Hrvatska",
    "automatsko parkiranje Split",
    "parking Dalmacija tehnologija",
    "frictionless parking Adriatic",
    "PayParq Croatia 2025",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "article",
    title: "Smart Parking Croatia 2025 – No Tickets, No Apps, No Barriers | PayParq",
    description: "How PayParq's AI camera platform is transforming parking across Croatia — from Split Airport to Trogir and the Makarska Riviera.",
    url: CANONICAL,
    siteName: "PayParq",
    locale: "en_US",
    images: [{ url: `${SITE_URL}/og-smart-parking.jpg`, width: 1200, height: 630, alt: "PayParq smart parking Croatia" }],
  },
  twitter: { card: "summary_large_image", title: "Smart Parking Croatia 2025 | PayParq", description: "AI cameras, no tickets, no apps. PayParq is redefining parking across Croatia." },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${CANONICAL}#article`,
      "headline": "Smart Parking Croatia 2025 – How PayParq Works",
      "description": "A deep dive into PayParq's software-only parking platform deployed across Croatia: AI LPR cameras, instant booking, Park & Taxi option and real-time occupancy.",
      "datePublished": "2025-04-01",
      "dateModified": "2026-04-01",
      "author": { "@type": "Organization", "name": "PayParq", "url": SITE_URL },
      "publisher": { "@type": "Organization", "name": "PayParq", "url": SITE_URL, "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon-192.png` } },
      "mainEntityOfPage": { "@type": "WebPage", "@id": CANONICAL },
      "keywords": "smart parking Croatia, AI parking, LPR, PayParq, pametno parkiranje",
      "about": { "@type": "Organization", "name": "PayParq", "url": SITE_URL, "areaServed": { "@type": "Country", "name": "Croatia" } },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What is PayParq?", "acceptedAnswer": { "@type": "Answer", "text": "PayParq is Croatia's first software-only parking platform. It uses AI license plate recognition cameras to manage parking without tickets, barriers, or apps. Drivers enter, park, and leave — the system bills them automatically." } },
        { "@type": "Question", "name": "Where does PayParq operate in Croatia?", "acceptedAnswer": { "@type": "Answer", "text": "PayParq currently operates at three locations: Split Airport/Trogir area (€0.50/hr), Park&Ride Trogir (€0.90/hr), and Baška Voda/Punta Rata on the Makarska Riviera (€1.00/hr). More locations are being added." } },
        { "@type": "Question", "name": "Do I need an app to use PayParq?", "acceptedAnswer": { "@type": "Answer", "text": "No. PayParq identifies your vehicle by license plate automatically. You can optionally book online for guaranteed entry, but walk-up use is supported at all locations." } },
        { "@type": "Question", "name": "Is PayParq available at Split Airport?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. PayParq operates a parking lot near Split Airport (SPU) in the Trogir/Kaštela area, offering parking from €0.50/hr. The Park & Taxi option includes a shuttle service to the terminal." } },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "PayParq", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/news` },
        { "@type": "ListItem", "position": 3, "name": "Smart Parking Croatia 2025", "item": CANONICAL },
      ],
    },
  ],
};

export default function SmartParkingHrvatska2025() {
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
            <span className="text-black/70">Smart Parking Croatia 2025</span>
          </nav>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#5F3DFC] font-semibold mb-3">Technology — Croatia</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-black leading-tight">
            Smart Parking Croatia 2025:<br className="hidden md:block" /> No Tickets, No Apps, No Barriers
          </h1>
          <p className="text-base md:text-lg text-black/70 max-w-2xl leading-relaxed">
            Parking in Croatia has not changed in decades. PayParq is changing that — with AI cameras, instant booking, and a platform that works for drivers, operators, and cities alike.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["AI parking Croatia","no ticket parking","PayParq technology","pametno parkiranje"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#F5F2FF] text-[#5F3DFC] text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </section>

        <section className="border-t border-black/5 bg-[#05020A] text-white">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Platform type", value: "Software-only, no hardware barriers" },
              { label: "Technology", value: "AI LPR Camera Recognition" },
              { label: "Active locations", value: "Split Airport · Trogir · Makarska Riviera" },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">{item.label}</p>
                <p className="text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 md:px-12 py-14 space-y-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">The problem with traditional parking in Croatia</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Croatia welcomed over 21 million tourists in 2024. The Dalmatian coast — Split, Trogir, Makarska Riviera — bears the majority of that load across a 3-month window. Parking infrastructure has not scaled with visitor numbers.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              Old-model parking lots require attendants, ticket machines, boom barriers and cash. They are slow (queues at entry and exit), expensive to operate (staff costs), and prone to error (lost tickets, payment disputes). During peak season, a 15-minute queue to exit a car park is not unusual.
            </p>
            <p className="text-black/75 leading-relaxed">
              PayParq eliminates all of this with a single component: <strong>an AI camera at entry and exit</strong>. Nothing else is needed.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-black">How PayParq works — the full flow</h2>
            <div className="space-y-4">
              {[
                { step: "1", title: "Book online (optional)", body: "Visit payparq.com, select your location, enter dates and plate number. Pay by card. You receive a confirmation email. Walk-in use without booking is also supported." },
                { step: "2", title: "Arrive — camera reads your plate", body: "Drive to the entry point. The AI camera reads your license plate in under 500ms. If you have a reservation, the system confirms it instantly. No ticket issued, no barrier delay." },
                { step: "3", title: "Park and go", body: "Park normally. If you need transport to the terminal, select the Park & Taxi option — it includes a shuttle. The driver arrives in minutes." },
                { step: "4", title: "Leave — automatic billing", body: "Drive to the exit. The camera reads your plate, calculates your duration, and charges the card on file. A receipt lands in your inbox within 30 seconds." },
              ].map(item => (
                <div key={item.step} className="flex gap-5 rounded-2xl border border-black/8 bg-[#F9FAFB] p-5">
                  <div className="w-10 h-10 rounded-full bg-[#5F3DFC] text-white font-black text-base flex items-center justify-center shrink-0">{item.step}</div>
                  <div>
                    <p className="font-bold text-black mb-1">{item.title}</p>
                    <p className="text-sm text-black/65 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Where PayParq operates in Croatia</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Split Airport / Trogir", id: "40058", price: "€0.50/hr", detail: "2–3 km from SPU terminal. Park & Taxi option with shuttle.", href: "/locations/parking-trogir-40058", geo: "43.5426°N 16.3115°E" },
                { name: "Park&Ride Trogir", id: "61440", price: "€0.90/hr", detail: "800m from UNESCO old town. 10-min walk.", href: "/locations/safe-parkride-by-payparq-trogir-61440", geo: "43.5446°N 16.2799°E" },
                { name: "Baška Voda / Punta Rata", id: "23025", price: "€1.00/hr", detail: "Near Punta Rata beach, Makarska Riviera.", href: "/locations/parking-izmi-baka-voda-23025", geo: "43.3559°N 16.9565°E" },
              ].map(loc => (
                <Link key={loc.id} href={loc.href} className="group rounded-2xl border border-black/8 bg-white p-5 hover:border-[#5F3DFC]/40 hover:shadow-sm transition-all">
                  <p className="text-[11px] text-black/40 mb-1 font-mono">{loc.id}</p>
                  <p className="font-bold text-black mb-1 group-hover:text-[#5F3DFC] transition-colors">{loc.name}</p>
                  <p className="text-[#5F3DFC] font-semibold text-sm mb-2">{loc.price}</p>
                  <p className="text-xs text-black/55 mb-2">{loc.detail}</p>
                  <p className="text-[10px] text-black/30 font-mono">{loc.geo}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-black">FAQ — Smart Parking Croatia</h2>
            <div className="space-y-4">
              {[
                { q: "What is PayParq?", a: "PayParq is Croatia's first software-only parking platform. AI license plate cameras manage parking without tickets, barriers, or apps. Drivers enter, park, and leave — the system bills automatically." },
                { q: "Where does PayParq operate in Croatia?", a: "Currently at Split Airport/Trogir (€0.50/hr), Park&Ride Trogir (€0.90/hr), and Baška Voda/Punta Rata on the Makarska Riviera (€1.00/hr). More locations launching in 2025." },
                { q: "Do I need an app to use PayParq?", a: "No. PayParq identifies your vehicle by license plate automatically. Optional online booking guarantees your spot, but walk-up use is supported at all locations." },
                { q: "Is PayParq available at Split Airport?", a: "Yes. PayParq operates near Split Airport (SPU) from €0.50/hr. The Park & Taxi option includes a shuttle to the terminal. Book at payparq.com/locations/parking-trogir-40058." },
              ].map(item => (
                <div key={item.q} className="rounded-2xl border border-black/8 bg-white p-5">
                  <p className="font-bold text-black mb-2">{item.q}</p>
                  <p className="text-sm text-black/65 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#05020A] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-2">PayParq Croatia</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Experience smart parking on your next trip</h2>
            <p className="text-white/65 mb-6 max-w-md mx-auto">Split Airport · Park&Ride Trogir · Makarska Riviera. Book in 60 seconds.</p>
            <Link href="/locations" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-full text-sm hover:bg-white/90 transition-colors">
              View all locations →
            </Link>
          </div>
        </section>
      </main>
      <FooterBrand />
    </div>
  );
}
