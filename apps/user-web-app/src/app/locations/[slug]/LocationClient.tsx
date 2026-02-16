'use client';

import { useState, useEffect } from "react";
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

export default function LocationClient({ hub, priceLabel, hero, faqItems, travelTime }: { 
  hub: HubData; 
  priceLabel: string; 
  hero: string; 
  faqItems: Array<{ q: string; a: string }>;
  travelTime: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reserve' | 'park_now'>('reserve');
  const [openFaq, setOpenFaq] = useState<number[]>([]);
  
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Set default check-in to now, check-out to 1 hour from now on mount
  useEffect(() => {
    const now = new Date();
    // Adjust to local timezone for datetime-local input
    const offset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - offset);
    const inStr = localNow.toISOString().slice(0, 16);
    
    const later = new Date(localNow);
    later.setHours(later.getHours() + 1);
    const outStr = later.toISOString().slice(0, 16);
    
    if (!checkIn) setCheckIn(inStr);
    if (!checkOut) setCheckOut(outStr);
  }, []);
  
  const locationName = hub.name || "Split Airport car park";
  const locationId = hub.id || "parkng split airport";
  
  // Calculate total price and hours
  let totalHours = 1;
  let totalPrice = 0;
  
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      totalHours = Math.ceil(diff / (1000 * 60 * 60));
    }
  }

  // Parse price from label (e.g. "€2.50/hr" -> 2.50)
  const priceValue = parseFloat(priceLabel.replace(/[^0-9.]/g, '')) || 0;
  totalPrice = totalHours * priceValue;
  const totalPriceLabel = `€${totalPrice.toFixed(2)}`;

  const checkoutHref = `/pay?loc=${encodeURIComponent(locationId)}&in=${encodeURIComponent(checkIn)}&out=${encodeURIComponent(checkOut)}`;
  
  async function handleBook(e: React.MouseEvent) {
    if (activeTab === 'reserve' && (!checkIn || !checkOut)) return;
    
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: locationId,
          display_id: hub.display_id,
          check_in: activeTab === 'reserve' ? checkIn : undefined,
          check_out: activeTab === 'reserve' ? checkOut : undefined,
          flow_type: activeTab,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Checkout error response:", errData);
        throw new Error(errData.error || "Checkout failed");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const canonicalSlug = (hub.canonical_slug || "").trim().toLowerCase();
  const vm = hub.verification_metadata as Record<string, unknown> | undefined;
  const hideHeaderMeta = typeof vm?.["hide_header"] === "boolean" ? (vm?.["hide_header"] as boolean) : false;
  const hideHeader = hideHeaderMeta || canonicalSlug === "1-81977";
  const hideAnnouncementBar = canonicalSlug === "m-94585";
  
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
      {hideHeader ? null : <SiteHeader hideAnnouncementBar={hideAnnouncementBar} />}
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
                  onClick={checkIn && checkOut ? handleBook : undefined}
                  className={`px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? "Processing..." : (checkIn && checkOut ? `Book (${totalPriceLabel})` : `Book (${priceLabel}/hr)`)}
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
                    className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#4330c4] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Book Parking ({priceLabel}/hr)
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
            {locationName} parking from {priceLabel} per hour - just {travelTime} away.
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
                    src={
                      hub.latitude && hub.longitude
                        ? `https://www.google.com/maps?q=${hub.latitude},${hub.longitude}&output=embed`
                        : `https://www.google.com/maps?q=${encodeURIComponent(locationName)}&output=embed`
                    }
                  />
                </div>
              </section>
            </div>

            <div className="flex flex-col items-end md:sticky md:top-24">
            {/* Check Price Widget */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6">Check price & availability</h2>
              
              {/* Tab Switcher */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setActiveTab('reserve')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'reserve' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Reserve
                </button>
                <button
                  onClick={() => setActiveTab('park_now')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'park_now' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Park Now
                </button>
              </div>

              {activeTab === 'reserve' ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        From
                      </label>
                      <input
                        type="datetime-local"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#5F3DFC]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        To
                      </label>
                      <input
                        type="datetime-local"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#5F3DFC]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-8 py-4 border-t border-gray-100">
                    <span className="text-gray-500 font-medium">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{totalPriceLabel}</div>
                      <div className="text-xs text-gray-400 font-medium">{totalHours} hours</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mb-8">
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-4">
                    <strong>Park Immediately</strong>
                    <p className="mt-1 text-xs opacity-90">
                      Start your session now. You can adjust the duration (hours) directly in the checkout.
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <span className="text-gray-500 font-medium">Rate</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{priceLabel}/hr</div>
                      <div className="text-xs text-gray-400 font-medium">Select hours in next step</div>
                    </div>
                  </div>
                </div>
              )}

              <Link
                href={checkoutHref}
                onClick={(activeTab === 'reserve' && checkIn && checkOut) || activeTab === 'park_now' ? handleBook : undefined}
                className={`w-full block text-center bg-[#5F3DFC] text-white font-bold py-4 rounded-xl hover:bg-[#4a2fe0] transition-colors shadow-lg shadow-indigo-200 ${
                  loading || (activeTab === 'reserve' && (!checkIn || !checkOut)) ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? "Processing..." : (activeTab === 'reserve' ? "Book Now" : "Park Now")}
              </Link>
              
              <p className="mt-4 text-xs text-center text-gray-400">
                Secure payment via Stripe • Free cancellation
              </p>
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
