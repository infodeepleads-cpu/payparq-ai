import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

const SITE_URL = "https://www.payparq.com";
const SLUG = "parking-zagreb-city-center";
const CANONICAL = `${SITE_URL}/news/blog/${SLUG}`;

export const metadata: Metadata = {
  title: "Parking Zagreb City Center 2026 – Cheapest & Safest Options | PayParq",
  description:
    "Find the cheapest parking in Zagreb city center 2026. Compare prices, locations near Trg bana Jelačića, Ban Jelačić Square, and the old town. Book online from €0.80/hr — no ticket, no app needed.",
  keywords: [
    "parking Zagreb city center",
    "parking Zagreb centar",
    "cheap parking Zagreb",
    "Zagreb parking 2026",
    "parking Ban Jelačić Square",
    "parking Zagreb old town",
    "parking Zagreb downtown",
    "best parking Zagreb",
    "where to park in Zagreb",
    "PayParq Zagreb",
    "parking Gornji Grad Zagreb",
    "parking Zagreb per hour",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "article",
    title: "Parking Zagreb City Center 2026 – From €0.80/hr | PayParq",
    description:
      "Best parking options in Zagreb city center. AI-monitored, bookable online. From €0.80/hr near Ban Jelačić Square. No ticket, no app.",
    url: CANONICAL,
    siteName: "PayParq",
    locale: "en_US",
    images: [{ url: `${SITE_URL}/og-zagreb.jpg`, width: 1200, height: 630, alt: "PayParq parking Zagreb city center" }],
  },
  twitter: { card: "summary_large_image", title: "Parking Zagreb City Center from €0.80/hr | PayParq", description: "Safe, cheap parking in Zagreb downtown. Book online — no ticket, no app needed." },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${CANONICAL}#article`,
      "headline": "Parking Zagreb City Center 2026 – Cheapest & Safest Options",
      "description": "Complete guide to parking in Zagreb city center: best locations, prices per hour, tips for busy days, and how PayParq's AI system works.",
      "datePublished": "2026-05-11",
      "dateModified": "2026-05-11",
      "author": { "@type": "Organization", "name": "PayParq", "url": SITE_URL },
      "publisher": {
        "@type": "Organization",
        "name": "PayParq",
        "url": SITE_URL,
        "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon-192.png` },
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": CANONICAL },
      "keywords": "parking Zagreb city center, cheap parking Zagreb, parking Zagreb 2026",
      "inLanguage": "en",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does parking cost in Zagreb city center?",
          "acceptedAnswer": { "@type": "Answer", "text": "Parking in Zagreb city center typically costs €1–4/hr at municipal garages and €0.80–2/hr at PayParq locations. Monthly passes are available from €60/month for commuters." },
        },
        {
          "@type": "Question",
          "name": "Where is the cheapest parking in Zagreb downtown?",
          "acceptedAnswer": { "@type": "Answer", "text": "PayParq offers some of the most affordable parking near Zagreb center, starting from €0.80/hr with online booking. Municipal street parking zones (Zone 1–3) can be cheaper but are limited and hard to find in peak hours." },
        },
        {
          "@type": "Question",
          "name": "Is there parking near Ban Jelačić Square in Zagreb?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. There are several parking garages within 300–500m of Ban Jelačić Square. PayParq locations in the center offer secure, AI-monitored parking close to the main square." },
        },
        {
          "@type": "Question",
          "name": "Do I need an app to use PayParq parking in Zagreb?",
          "acceptedAnswer": { "@type": "Answer", "text": "No app needed. PayParq uses AI license plate recognition cameras. Just drive in — the camera reads your plate, you park, and you're charged for exactly the time you used. Book online at payparq.com." },
        },
        {
          "@type": "Question",
          "name": "Is parking in Zagreb city center safe?",
          "acceptedAnswer": { "@type": "Answer", "text": "PayParq parking locations in Zagreb are equipped with 24/7 AI cameras and are fully fenced. Your vehicle is monitored throughout your stay." },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "PayParq", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/news` },
        { "@type": "ListItem", "position": 3, "name": "Parking Zagreb City Center", "item": CANONICAL },
      ],
    },
  ],
};

export default function ParkingZagrebCityCenter() {
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
            <span className="text-black/70">Parking Zagreb City Center</span>
          </nav>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#5F3DFC] font-semibold mb-3">Guide — Zagreb, Croatia</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-black leading-tight">
            Parking Zagreb City Center 2026:<br className="hidden md:block" /> Cheapest, Safest Options
          </h1>
          <p className="text-base md:text-lg text-black/70 max-w-2xl leading-relaxed">
            Zagreb draws millions of visitors every year — and parking in the city center is one of the biggest headaches. This guide covers all your options: from cheap street zones to secure AI-monitored garages near Ban Jelačić Square and the upper town.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["parking Zagreb city center", "cheap parking Zagreb", "parking Ban Jelačić", "Zagreb 2026"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#F5F2FF] text-[#5F3DFC] text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </section>

        {/* Key facts */}
        <section className="border-t border-black/5 bg-[#F9FAFB]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Starting price", value: "€0.80/hr" },
              { label: "Locations", value: "Zagreb center" },
              { label: "Security", value: "AI 24/7" },
              { label: "Booking", value: "No app needed" },
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Why parking in Zagreb center is challenging</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Zagreb&apos;s historic center — built around the medieval upper town (Gornji Grad) and the bustling Ban Jelačić Square — was not designed for modern car traffic. Narrow streets, limited garage capacity, and high demand from commuters, tourists, and residents combine to make parking one of the most frustrating parts of any Zagreb visit.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              The city operates a zone-based street parking system with three price tiers. Zone 1 (the very center) costs around €1.30/hr and has a strict 2-hour time limit. By mid-morning on weekdays, nearly every space is taken. Garages like Importanne and Kaptol Center fill up before 9am during business days.
            </p>
            <p className="text-black/75 leading-relaxed">
              PayParq provides a modern alternative: <strong>AI-monitored, pre-bookable parking spots</strong> near the city center, starting from <strong>€0.80/hr</strong>. You book online, drive in, and your license plate is automatically recognized — no ticket machine, no app, no stress.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Zagreb parking zones explained</h2>
            <div className="overflow-x-auto rounded-2xl border border-black/10">
              <table className="w-full text-sm text-black/80">
                <thead className="bg-[#F9FAFB] text-[11px] uppercase tracking-wider text-black/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Zone</th>
                    <th className="px-4 py-3 text-left">Area</th>
                    <th className="px-4 py-3 text-left">Price/hr</th>
                    <th className="px-4 py-3 text-left">Max time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  <tr>
                    <td className="px-4 py-3 font-semibold">Zone 1</td>
                    <td className="px-4 py-3">City core, Jelačić Sq.</td>
                    <td className="px-4 py-3">~€1.30</td>
                    <td className="px-4 py-3">2 hrs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Zone 2</td>
                    <td className="px-4 py-3">Inner ring, Ilica, Maksimir</td>
                    <td className="px-4 py-3">~€0.80</td>
                    <td className="px-4 py-3">3 hrs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Zone 3</td>
                    <td className="px-4 py-3">Outer ring, suburbs</td>
                    <td className="px-4 py-3">~€0.40</td>
                    <td className="px-4 py-3">Unlimited</td>
                  </tr>
                  <tr className="bg-[#F5F2FF]">
                    <td className="px-4 py-3 font-semibold text-[#5F3DFC]">PayParq (recommended)</td>
                    <td className="px-4 py-3">Near center</td>
                    <td className="px-4 py-3 font-bold">from €0.80</td>
                    <td className="px-4 py-3">Unlimited, bookable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">How PayParq works in Zagreb</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              PayParq uses <strong>AI license plate recognition (LPR) cameras</strong> at every location. There are no barriers to fiddle with, no paper tickets to lose, and no app to download. Here&apos;s what happens when you use a PayParq parking spot in Zagreb:
            </p>
            <ul className="space-y-3 text-black/75">
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Book online:</strong> Visit payparq.com, select your Zagreb location, pick your date/time, enter your plate number. Done in 60 seconds.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Drive in:</strong> The camera reads your plate and records your arrival time. The barrier opens automatically.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Park and go:</strong> Your car is monitored by 24/7 AI cameras. Walk to your destination — Ban Jelačić Square is a short walk from most PayParq central locations.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Drive out:</strong> Camera logs your exit, you&apos;re charged exactly for the time used. Receipt goes to your email.</span></li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Best tips for parking in Zagreb city center</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Book the night before", body: "PayParq spots near Zagreb center fill up fast on weekdays. A booking made the evening before guarantees your space and locks in the price." },
                { title: "Avoid the morning rush", body: "Traffic and parking pressure is heaviest 7:30–9:30am and 4–6pm. Arriving outside these windows saves 15–20 minutes of circling." },
                { title: "Consider monthly passes", body: "If you commute to Zagreb daily, PayParq monthly passes start from €60/month — significantly cheaper than daily municipal garage rates." },
                { title: "Park & walk strategy", body: "Zone 2 PayParq spots are 10–15 minutes on foot from the main square. The walk is pleasant through Zagreb's green streets and saves 30–40% on cost." },
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-black">FAQ — Parking Zagreb City Center</h2>
            <div className="space-y-4">
              {[
                { q: "How much does parking cost in Zagreb city center?", a: "Municipal street parking in Zone 1 costs ~€1.30/hr with a 2-hour limit. PayParq garage-style parking near the center starts from €0.80/hr with no time limit. Monthly passes from €60/month." },
                { q: "Where is the cheapest parking near Ban Jelačić Square?", a: "PayParq locations near Zagreb center offer the best combination of price and security from €0.80/hr. Street parking in Zone 2 is cheaper but limited to 3 hours and hard to find during peak times." },
                { q: "Do I need to download an app for PayParq?", a: "No. PayParq's AI camera system recognizes your license plate automatically. Book on the website, drive in, park — no app installation required." },
                { q: "Is there 24-hour parking available in Zagreb city center?", a: "Yes. PayParq locations are open 24/7 and can be booked for any duration. Municipal street parking is only allowed during working hours in most Zone 1 areas." },
                { q: "Is parking in Zagreb safe for tourists?", a: "PayParq locations are fully fenced and monitored by AI cameras 24/7. Your vehicle is secure throughout your stay. Street parking in Zagreb is generally safe but lacks monitoring." },
              ].map(item => (
                <div key={item.q} className="rounded-2xl border border-black/8 bg-white p-5">
                  <p className="font-bold text-black mb-2">{item.q}</p>
                  <p className="text-sm text-black/65 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Internal links */}
          <div className="rounded-2xl border border-black/8 bg-[#F9FAFB] p-6">
            <h3 className="font-bold text-black mb-4">Explore more Zagreb & Croatia parking</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/guides/zagreb" className="text-[#5F3DFC] hover:underline">Zagreb Parking Guide — all locations →</Link></li>
              <li><Link href="/regions/hrvatska" className="text-[#5F3DFC] hover:underline">Parking in Croatia — all cities →</Link></li>
              <li><Link href="/news/blog/parking-aerodrom-split" className="text-[#5F3DFC] hover:underline">Parking Split Airport — complete guide →</Link></li>
              <li><Link href="/search" className="text-[#5F3DFC] hover:underline">Search all parking locations →</Link></li>
            </ul>
          </div>

          {/* CTA */}
          <div className="rounded-3xl bg-[#5F3DFC] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 mb-2">PayParq Zagreb</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Book Parking in Zagreb City Center</h2>
            <p className="text-white/75 mb-6 max-w-md mx-auto">Secure, affordable, no app needed. AI cameras monitor your car 24/7. From €0.80/hr.</p>
            <Link href="/guides/zagreb" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#5F3DFC] font-bold rounded-full text-sm hover:bg-white/90 transition-colors">
              Find Zagreb parking →
            </Link>
          </div>

        </section>
      </main>
      <FooterBrand />
    </div>
  );
}
