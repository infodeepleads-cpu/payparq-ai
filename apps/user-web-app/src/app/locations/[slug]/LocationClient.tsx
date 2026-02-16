'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ChevronDown, Car, Camera, MessageCircle, CreditCard, Plus, Minus } from "lucide-react";
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";

type HubData = {
  id: string;
  name: string;
  address?: string;
  display_id?: string;
  canonical_slug?: string;
  latitude?: number;
  longitude?: number;
  verification_photos?: string[];
  verification_metadata?: Record<string, unknown>;
};

export default function LocationClient({ hub, priceLabel, hero, faqItems }: { 
  hub: HubData; 
  priceLabel: string; 
  hero: string; 
  faqItems: Array<{ q: string; a: string }>;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number[]>([]);
  
  const locationName = hub.name || "Split Airport car park";
  const locationId = hub.id || "parkng split airport";
  const checkoutHref = `/pay?loc=${encodeURIComponent(locationId)}`;
  const canonicalSlug = (hub.canonical_slug || "").trim().toLowerCase();
  const vm = hub.verification_metadata as Record<string, unknown> | undefined;
  const hideHeaderMeta = typeof vm?.["hide_header"] === "boolean" ? (vm?.["hide_header"] as boolean) : false;
  const hideHeader = hideHeaderMeta || canonicalSlug === "1-81977";
  
  const howItWorks = [
    {
      label: "Book & Pay Instantly",
      title: "1. Book & Pay Instantly",
      description:
        "Choose your parking time and pay securely via Stripe or simply scan the QR code upon arrival. No tickets, no gates—just a seamless digital checkout.",
      image: hero || "/Split_Airport_new_terminal_main_hall.jpg",
    },
    {
      label: "Connect with Your City Manager",
      title: "2. Connect with Your City Manager",
      description:
        "Immediately after payment, you can send a personal WhatsApp message to our City Manager. This is your direct line for 24/7 support or any assistance you need during your stay.",
      image: hero || "/Split_Airport_new_terminal_main_hall.jpg",
    },
    {
      label: "Arrange Your Ride & Protection",
      title: "3. Arrange Your Ride & Protection",
      description:
        "Once booked, you can easily reserve a 1-way or 2-way Uber/Taxi through our application or our dedicated support line. You also have the flexibility to: Add vehicle insurance for extra peace of mind. Rearrange or cancel your ride up to 60 minutes before arrival. Rely on our Return Back Guarantee if your plans change.",
      image: hero || "/Split_Airport_new_terminal_main_hall.jpg",
    },
    {
      label: "Park & Go",
      title: "4. Park & Go",
      description:
        "Upon arrival, simply pull into any empty, unmarked space or your assigned dedicated spot. Your plate is your permit—our AI takes care of the rest.",
      image: hero || "/Split_Airport_new_terminal_main_hall.jpg",
    },
  ];

  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "ParkingFacility",
    name: `PayParq ${locationName}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: hub.address ? hub.address.split(',')[0] : "Unknown",
      addressRegion: hub.address ? hub.address.split(',')[1] : "Unknown",
      addressCountry: "HR",
    },
    areaServed: "Split, Trogir, Kaštela, Dalmatian Coast",
    url: `https://payparq.ai/locations/${hub.canonical_slug}`,
    slogan: "Effortless airport parking",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "On‑demand Uber/Taxi", value: true },
      { "@type": "LocationFeatureSpecification", name: "AI Camera Monitoring", value: true },
      { "@type": "LocationFeatureSpecification", name: "Stripe Secure Checkout", value: true },
    ],
  };

  const defaultFaq = [
    {
      q: "How long does transfer to Split Airport take?",
      a: "On‑demand rides via Uber/Taxi typically take 2–3 minutes from the PayParq car park to Split Airport (SPU) in Kaštela.",
    },
    {
      q: "When and how often is there a transfer?",
      a: "Transfers are on‑demand 24/7 via Uber/Taxi. Arrive, request a ride, and go directly to your chosen terminal.",
    },
    {
      q: "Can I book a parking space without a transfer?",
      a: "Yes. Choose parking‑only at checkout if you prefer to arrange your own transport.",
    },
  ];
  const finalFaq = faqItems && faqItems.length > 0 ? faqItems : defaultFaq;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: finalFaq.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: i.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      {hideHeader ? null : <SiteHeader />}
      <header className="hidden">
        <div className="w-full px-4 md:px-10 pt-3 md:pt-4 pointer-events-auto">
          <div className="bg-white/95 shadow-lg border border-black/5">
            <div className="h-14 md:h-16 grid grid-cols-3 items-center px-4 md:px-8 text-[11px] font-medium text-black">
              <div className="flex items-center justify-start md:justify-center gap-4">
                <button
                  type="button"
                  className="md:hidden flex flex-col justify-center gap-[3px]"
                  onClick={() => setMobileOpen((open) => !open)}
                  aria-label="Toggle navigation"
                  aria-expanded={mobileOpen}
                >
                  <span className="h-[1.5px] w-4 bg-black" />
                  <span className="h-[1.5px] w-4 bg-black" />
                </button>
                <div className="hidden md:flex items-center justify-center gap-7 text-[10px] uppercase tracking-[0.24em]">
                  <Link href="/experience" className="hover:text-gray-700 transition-colors">
                    Experience
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setBusinessOpen((open) => !open);
                        setCompanyOpen(false);
                      }}
                    >
                      <span>Business</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/parking"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Parking
                        </Link>
                        <Link
                          href="/security"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Security
                        </Link>
                        <Link
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link href="/technology" className="hover:text-gray-700 transition-colors">
                    Technology
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setCompanyOpen((open) => !open);
                        setBusinessOpen(false);
                      }}
                    >
                      <span>Company</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {companyOpen && (
                      <div className="absolute right-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[200px] z-50">
                        <Link
                          href="/about"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          About
                        </Link>
                        <Link
                          href="/careers"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          Careers
                        </Link>
                        <Link
                          href="/news"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          News
                        </Link>
                        <Link
                          href="/contact"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          Get in touch
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Link href="/" className="relative flex items-center justify-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg.white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                      <span className="text-sm md:text-base font-semibold tracking-tight leading-none text-white">
                        P
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="flex items-center justify-end gap-2 md:gap-3">
                <Link
                  href="/contact"
                  className="hidden md:inline-flex px-4 py-2 rounded-full border border-gray-300 text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get in Touch
                </Link>
                <Link
                  href={checkoutHref}
                  className="px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
                >
                  Book Parking
                </Link>
              </div>
            </div>
            {mobileOpen && (
              <div className="md:hidden border-t border-black/5 bg.white px-0 pb-3">
                <div className="flex flex-col gap-2 pt-2 text-[12px] font-medium text-black w-full max-w-xs mx-auto">
                  <Link
                    href="/experience"
                    className="w-full py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Experience
                  </Link>
                  <button
                    className="w-full flex items-center justify-center gap-1 py-3 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setBusinessOpen((open) => !open);
                      setCompanyOpen(false);
                    }}
                  >
                    <span>Business</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {businessOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/parking"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Parking
                      </Link>
                      <Link
                        href="/security"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Security
                      </Link>
                      <Link
                        href="/business"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Smart City
                      </Link>
                    </div>
                  )}
                  <Link
                    href="/technology"
                    className="w-full py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Technology
                  </Link>
                  <button
                    className="w-full flex items-center justify-center gap-1 py-3 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setCompanyOpen((open) => !open);
                      setBusinessOpen(false);
                    }}
                  >
                    <span>Company</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {companyOpen && (
                    <div className="flex flex-col gap-1 pb-1 pl-4">
                      <Link
                        href="/about"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        About
                      </Link>
                      <Link
                        href="/careers"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        Careers
                      </Link>
                      <Link
                        href="/news"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        News
                      </Link>
                      <Link
                        href="/contact"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setCompanyOpen(false);
                        }}
                      >
                        Get in touch
                      </Link>
                    </div>
                  )}
                  <Link
                    href="/contact"
                    className="w-full mt-2 border-t border-b border-gray-200 py-3 text-center hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get in Touch
                  </Link>
                  <Link
                    href={checkoutHref}
                    className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[12px] font-semibold text.white shadow-sm hover:bg-[#4330c4] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Book Parking
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(locationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <main className="flex-1 bg-white pt-16 md:pt-20">
        <article className="max-w-6xl mx-auto px-4 md:px-10 pt-4 pb-5 md:pt-6 md:pb-5">
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight mb-6 md:mb-8 text-black md:-ml-10">
            {locationName} parking from {priceLabel} per hour - just 2 minutes away.
          </h1>

          <section className="grid gap-8 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start">
            <div className="space-y-8 md:-ml-10">
              <div className="h-full min-h-[480px] rounded-3xl overflow-hidden border border-black/5 bg-black shadow-lg">
                <div className="relative w-full h-full">
                  <Image
                    src={hero || "/Split_Airport_new_terminal_main_hall.jpg"}
                    alt={`${locationName} parking`}
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#4B5563_0,_transparent_55%),radial-gradient(circle_at_bottom,_#1F2937_0,_transparent_55%)]" />
                  <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                        PayParq car park
                      </p>
                      <p className="text-sm md:text-base text-white font-semibold">
                        Rows of covered and open-air parking bays, ready for take-off.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-2 py-1 text-[10px] text-white">
                          <Car className="w-3 h-3" />
                          <span>Uber/Taxi</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg.white/15 border border.white/25 px-2 py-1 text-[10px] text.white">
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp 24/7</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg.white/15 border border.white/25 px-2 py-1 text-[10px] text.white">
                          <CreditCard className="w-3 h-3" />
                          <span>Stripe</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg.white/15 border border.white/25 px-2 py-1 text-[10px] text.white">
                          <Camera className="w-3 h-3" />
                          <span>AI Cameras</span>
                        </span>
                      </div>
                    </div>
                    <span className="hidden md:inline-flex px-3 py-1 rounded-full bg-white/10 text-[10px] text-white/80 border border-white/20">
                      Photo of {locationName} parking
                    </span>
                  </div>
                </div>
              </div>

              <section className="mt-4 rounded-3xl border border-black/10 bg-white overflow-hidden">
                <div className="relative w-full h-[260px] md:h-[360px]">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${locationName}&output=embed`}
                  />
                </div>
              </section>
            </div>

            <div className="flex flex-col items-end md:sticky md:top-24">
              <div className="rounded-3xl border border-black/5 bg-white shadow-lg p-3 pb-1 md:p-5 md:pb-2 text-black h-full min-h-[480px] max-w-md ml-auto flex flex-col">
                <div className="mb-5 flex flex-col items-center text-center text-black/80">
                  <div className="inline-flex items-center gap-2 text-[11px] md:text-sm">
                    <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-1">
                      <span className="w-4 h-4 rounded-full bg-[#4285F4] text-[9px] font-bold text-white flex items-center justify-center">
                        G
                      </span>
                      <span className="text-[11px] md:text-sm font-semibold">Google</span>
                    </div>
                    <span className="font-semibold">4.9</span>
                    <span className="text-[10px] md:text-xs text-black/60">• 24,098 reviews</span>
                  </div>
                  <h2 className="mt-3 text-base md:text-xl font-semibold text-black">
                    Select Dates to Calculate Price
                  </h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-3 relative -top-10">
                    <button className="flex flex-col justify-between rounded-2xl border border-black/20 bg-white px-4 py-4 md:py-5 text-left shadow-sm hover:bg-[#F3F4FF] hover:border-[#5F3DFC] transition-colors">
                      <span className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-black/50">
                        Check In
                      </span>
                      <span className="mt-2 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-black/40" />
                      </span>
                    </button>
                    <button className="flex flex-col justify-between rounded-2xl border border-black/20 bg-white px-4 py-4 md:py-5 text-left shadow-sm hover:bg-[#F3F4FF] hover:border-[#5F3DFC] transition-colors">
                      <span className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-black/50">
                        Check Out
                      </span>
                      <span className="mt-2 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-black/40" />
                      </span>
                    </button>
                  </div>
                </div>
                <Link
                  href={checkoutHref}
                  className="mt-auto inline-flex w-full items-center justify-center rounded.full bg-[#5F3DFC] px-6 py-3.5 text-sm md:text-base font-semibold text.white shadow hover:bg-[#4330c4] transition-colors"
                >
                  Check price
                </Link>
              </div>
            </div>
          </section>
        </article>
        <section className="bg-white text-black border-t border-black/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="space-y-12">
              <div className="text-center space-y-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">How it works</p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Your parking experience, simplified</h2>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {howItWorks.map((step, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="relative h-48 rounded-2xl overflow-hidden border border-black/5">
                      <Image
                        src={step.image}
                        alt={step.label}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">{step.label}</h3>
                      <p className="text-xs text-black/70">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="bg-white text-black border-t border-black/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid md:grid-cols-[2fr,3fr] gap-12">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">About the location</p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{locationName}</h2>
                <p className="text-sm md:text-base text-black/75">{hub.address || ""}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">FAQ</p>
                <div className="space-y-3">
                  {finalFaq.map((i, idx) => {
                    const open = openFaq.includes(idx);
                    return (
                      <div key={i.q} className="rounded-xl border border-black/10 bg-[#F8F8F9]">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left"
                          aria-expanded={open}
                          onClick={() =>
                            setOpenFaq((prev) =>
                              prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
                            )
                          }
                        >
                          <span>{i.q}</span>
                          {open ? (
                            <Minus className="w-4 h-4 text-black/60" />
                          ) : (
                            <Plus className="w-4 h-4 text-black/60" />
                          )}
                        </button>
                        {open ? <div className="px-4 pb-4 text-sm text-black/75">{i.a}</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#05020A] border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                  Company
                </p>
                <Link href="/about" className="block hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/careers" className="block hover:text-white transition-colors">
                  Careers
                </Link>
                <Link href="/news" className="block hover:text-white transition-colors">
                  News
                </Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                  Experience
                </p>
                <Link href="/product" className="block hover:text-white transition-colors">
                  Product
                </Link>
                <Link href="/parking" className="block hover:text-white transition-colors">
                  Parking
                </Link>
                <Link href="/security" className="block hover:text-white transition-colors">
                  Security
                </Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                  Policies
                </p>
                <Link href="/legal" className="block hover:text-white transition-colors">
                  Legal
                </Link>
                <Link href="/privacy" className="block hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="block hover:text-white transition-colors">
                  Terms
                </Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                  Platform
                </p>
                <Link href="/locations" className="block hover:text-white transition-colors">
                  Locations
                </Link>
                <Link href="/members" className="block hover:text-white transition-colors">
                  Members
                </Link>
                <Link href="/support" className="block hover:text-white transition-colors">
                  Support
                </Link>
              </div>
            </div>
            <div className="mt-12 pt-6 border-t border-white/10">
              <FooterBrand />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
