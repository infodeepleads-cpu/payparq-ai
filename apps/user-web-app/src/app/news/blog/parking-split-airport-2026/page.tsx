import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

const SITE_URL = "https://www.payparq.com";
const SLUG = "parking-split-airport-2026";
const CANONICAL = `${SITE_URL}/news/blog/${SLUG}`;

export const metadata: Metadata = {
  title: "Parking Split Airport 2026 – Cheapest Options Near SPU | PayParq",
  description:
    "Best parking near Split Airport (SPU) in 2026. Compare prices, find cheap long-stay options, and book online from €0.50/hr. Park & Taxi shuttle available. No app, no ticket.",
  keywords: [
    "parking Split airport 2026",
    "parking Split airport",
    "cheap parking Split airport",
    "long stay parking Split airport",
    "parking SPU 2026",
    "Split airport parking price",
    "best parking near Split airport",
    "park and ride Split airport",
    "parking near SPU Croatia",
    "PayParq Split airport",
    "parking Kaštela airport",
    "airport parking Croatia 2026",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "article",
    title: "Parking Split Airport 2026 – From €0.50/hr Near SPU | PayParq",
    description:
      "Cheapest parking near Split Airport (SPU) 2026. Book online, no app needed. AI-secured with Park & Taxi shuttle option. Long-stay rates available.",
    url: CANONICAL,
    siteName: "PayParq",
    locale: "en_US",
    images: [{ url: `${SITE_URL}/og-split-airport.jpg`, width: 1200, height: 630, alt: "PayParq parking Split Airport SPU 2026" }],
  },
  twitter: { card: "summary_large_image", title: "Parking Split Airport 2026 from €0.50/hr | PayParq", description: "Cheapest parking near SPU. Long-stay, AI-secured, Park & Taxi shuttle. Book online." },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${CANONICAL}#article`,
      "headline": "Parking Split Airport 2026 – Cheapest Options Near SPU",
      "description": "Complete guide to parking near Split Airport (SPU) in 2026: best prices, long-stay options, Park & Taxi shuttle, and how to book without an app.",
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
      "keywords": "parking Split airport 2026, cheap parking SPU, long stay parking Split airport",
      "inLanguage": "en",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does parking cost at Split Airport in 2026?",
          "acceptedAnswer": { "@type": "Answer", "text": "Official Split Airport (SPU) parking costs €0.50–5/hr. PayParq parking near SPU starts from €0.50/hr, making it one of the cheapest options. Long-stay weekly rates are also available." },
        },
        {
          "@type": "Question",
          "name": "What is the cheapest parking near Split Airport?",
          "acceptedAnswer": { "@type": "Answer", "text": "PayParq offers parking from €0.50/hr near Split Airport, significantly cheaper than official airport parking which can cost up to €5/hr for short stays. Book in advance for the best rates." },
        },
        {
          "@type": "Question",
          "name": "Is there a shuttle from parking to Split Airport terminal?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. PayParq's Park & Taxi option includes a shuttle transfer from the parking location to the SPU terminal (3–5 minutes). The driver picks you up at the parking entrance and drops you at the terminal door." },
        },
        {
          "@type": "Question",
          "name": "How far is PayParq from Split Airport terminal?",
          "acceptedAnswer": { "@type": "Answer", "text": "PayParq parking near Split Airport is located 2–3 km from the SPU terminal. With the Park & Taxi shuttle option, transfer time is 3–5 minutes." },
        },
        {
          "@type": "Question",
          "name": "Can I book airport parking in Split without an app?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. PayParq uses AI license plate recognition — no app needed. Book on payparq.com, enter your plate number, and drive in. The camera recognizes your car automatically." },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "PayParq", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/news` },
        { "@type": "ListItem", "position": 3, "name": "Parking Split Airport 2026", "item": CANONICAL },
      ],
    },
  ],
};

export default function ParkingSplitAirport2026() {
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
            <span className="text-black/70">Parking Split Airport 2026</span>
          </nav>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#5F3DFC] font-semibold mb-3">Guide — Split Airport (SPU), Croatia</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-black leading-tight">
            Parking Split Airport 2026:<br className="hidden md:block" /> Cheapest Options Near SPU
          </h1>
          <p className="text-base md:text-lg text-black/70 max-w-2xl leading-relaxed">
            Split Airport (SPU) is one of Croatia&apos;s busiest airports, handling over 4 million passengers a year. Finding affordable, secure parking nearby is a challenge — especially during summer peak season. This 2026 guide covers every option, with prices, distances, and honest comparisons.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["parking Split airport 2026", "cheap parking SPU", "long stay Split airport", "park and taxi Split"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#F5F2FF] text-[#5F3DFC] text-[11px] font-semibold">{tag}</span>
            ))}
          </div>
        </section>

        {/* Key facts */}
        <section className="border-t border-black/5 bg-[#F9FAFB]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Cheapest price", value: "€0.50/hr" },
              { label: "Distance to SPU", value: "2–3 km" },
              { label: "Shuttle", value: "Park & Taxi" },
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Split Airport parking options in 2026</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              Split Airport (IATA: SPU) is located in the Kaštela area, between Split and Trogir along the Adriatic coast. The airport has three official parking areas (P1, P2, P3) directly on-site, plus a growing number of private and third-party parking options nearby.
            </p>
            <p className="text-black/75 leading-relaxed mb-4">
              In summer 2026, demand is at an all-time high — Croatia&apos;s record tourist season means parking at or near the airport fills up fast. Booking ahead is essential if you want to avoid arriving at a full lot with a flight to catch.
            </p>
            <p className="text-black/75 leading-relaxed">
              PayParq offers <strong>pre-bookable, AI-secured parking 2–3 km from SPU terminal</strong>, starting from <strong>€0.50/hr</strong>. The Park & Taxi option includes a driver who picks you up at the parking entrance and transfers you to the terminal in 3–5 minutes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Price comparison: Split Airport parking 2026</h2>
            <div className="overflow-x-auto rounded-2xl border border-black/10">
              <table className="w-full text-sm text-black/80">
                <thead className="bg-[#F9FAFB] text-[11px] uppercase tracking-wider text-black/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Option</th>
                    <th className="px-4 py-3 text-left">Price/hr</th>
                    <th className="px-4 py-3 text-left">7-day est.</th>
                    <th className="px-4 py-3 text-left">Shuttle</th>
                    <th className="px-4 py-3 text-left">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  <tr className="bg-[#F5F2FF]">
                    <td className="px-4 py-3 font-semibold text-[#5F3DFC]">PayParq (recommended)</td>
                    <td className="px-4 py-3 font-bold">€0.50</td>
                    <td className="px-4 py-3 font-bold">~€84</td>
                    <td className="px-4 py-3">Park & Taxi option</td>
                    <td className="px-4 py-3">AI cameras 24/7</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">SPU Official P1 (short stay)</td>
                    <td className="px-4 py-3">€0.50–5</td>
                    <td className="px-4 py-3">€50–70</td>
                    <td className="px-4 py-3">Walk (on-site)</td>
                    <td className="px-4 py-3">Guarded</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">SPU Official P3 (long stay)</td>
                    <td className="px-4 py-3">€0.50–2</td>
                    <td className="px-4 py-3">€35–50</td>
                    <td className="px-4 py-3">Free shuttle</td>
                    <td className="px-4 py-3">Guarded</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Kaštela street parking</td>
                    <td className="px-4 py-3">Free–€0.50</td>
                    <td className="px-4 py-3">€0–20</td>
                    <td className="px-4 py-3">None</td>
                    <td className="px-4 py-3">None</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-black/40 mt-2">*Prices are estimates based on 2026 rates. Official SPU prices may vary. PayParq price depends on selected location.</p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">How PayParq Park & Taxi works at Split Airport</h2>
            <p className="text-black/75 leading-relaxed mb-4">
              The Park & Taxi option is designed for travellers who want the security of a private lot combined with door-to-terminal convenience. Here&apos;s the exact process:
            </p>
            <ul className="space-y-3 text-black/75">
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Book online:</strong> Select &quot;Park & Taxi&quot; at payparq.com. Enter your flight time and plate number. You get a confirmation by email.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Arrive at parking:</strong> AI camera reads your plate, barrier opens. Park your car in your reserved spot.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Shuttle to terminal:</strong> A driver meets you at the entrance and transfers you to the SPU terminal in 3–5 minutes. Included in the Park & Taxi price.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Return:</strong> Contact the driver on arrival, he picks you up at the terminal and returns you to your car.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-[#5F3DFC] shrink-0" /><span><strong>Payment:</strong> Charged for exact duration parked. Receipt to your email.</span></li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-black">Tips for parking at Split Airport in summer 2026</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Book at least 48 hours ahead", body: "Summer 2026 demand at SPU is record-breaking. PayParq spots near the airport fill up quickly in July and August. Booking 2+ days ahead locks in availability and price." },
                { title: "Choose long-stay rates for trips over 3 days", body: "For holidays longer than 3 days, PayParq's daily and weekly rates work out much cheaper than the official airport short-stay lots." },
                { title: "Avoid peak drop-off times", body: "The busiest drop-off windows at SPU are 5–9am and 2–7pm. If possible, arrive 30 minutes outside these windows to avoid road congestion near the terminal." },
                { title: "Check your flight terminal", body: "Split Airport has a single terminal. All PayParq Park & Taxi shuttles deliver directly to the main terminal entrance — no confusion." },
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-black">FAQ — Parking Split Airport 2026</h2>
            <div className="space-y-4">
              {[
                { q: "How much does parking cost at Split Airport in 2026?", a: "Official SPU short-stay parking costs €0.50–5/hr depending on duration. PayParq parking near Split Airport starts from €0.50/hr. Long-stay weekly estimates: PayParq ~€84, SPU official P3 ~€35–50." },
                { q: "What is the cheapest parking near Split Airport?", a: "PayParq offers competitive rates from €0.50/hr, with pre-booking discounts available. For trips under 5 days, official SPU P3 (long stay) is also competitive. Free street parking in Kaštela exists but is unsecured and limited." },
                { q: "Is there a shuttle from the parking to Split Airport terminal?", a: "Yes. PayParq's Park & Taxi option includes shuttle transfer to and from the SPU terminal. Transfer time is 3–5 minutes. The driver picks you up at the parking entrance." },
                { q: "How far is the PayParq parking from Split Airport?", a: "PayParq parking near Split Airport is 2–3 km from the terminal. With Park & Taxi, transfer is 3–5 minutes by car." },
                { q: "Can I leave my car at Split Airport for 2 weeks?", a: "Yes. PayParq supports long-term bookings. For a 2-week stay, contact PayParq support for special long-term rates. Estimate: from €168 for 14 days at standard rate." },
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
            <h3 className="font-bold text-black mb-4">More parking guides for Croatia</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/guides/split" className="text-[#5F3DFC] hover:underline">Split City Parking Guide — all locations →</Link></li>
              <li><Link href="/news/blog/parking-aerodrom-split" className="text-[#5F3DFC] hover:underline">Parking Aerodrom Split — vodič na hrvatskom →</Link></li>
              <li><Link href="/regions/hrvatska" className="text-[#5F3DFC] hover:underline">Parking in Croatia — all cities →</Link></li>
              <li><Link href="/news/blog/parking-zagreb-city-center" className="text-[#5F3DFC] hover:underline">Parking Zagreb City Center — complete guide →</Link></li>
              <li><Link href="/search" className="text-[#5F3DFC] hover:underline">Search all parking locations →</Link></li>
            </ul>
          </div>

          {/* CTA */}
          <div className="rounded-3xl bg-[#5F3DFC] p-8 text-white text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/60 mb-2">PayParq Split Airport</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Book Parking Near Split Airport from €0.50/hr</h2>
            <p className="text-white/75 mb-6 max-w-md mx-auto">Secure, AI-monitored, pre-bookable. Park & Taxi shuttle to SPU terminal included.</p>
            <Link href="/guides/split" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#5F3DFC] font-bold rounded-full text-sm hover:bg-white/90 transition-colors">
              Find parking near SPU →
            </Link>
          </div>

        </section>
      </main>
      <FooterBrand />
    </div>
  );
}
