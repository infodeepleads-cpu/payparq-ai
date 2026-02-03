'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ChevronDown, Car, Camera, MessageCircle, CreditCard, Star, Plus, Minus } from "lucide-react";
import { FooterBrand } from "@/components/FooterBrand";
 

const LOCATION_ID = "parkng split airport";

export default function SplitAirportLocationPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number[]>([]);
  const howItWorks = [
    {
      label: "Book & Pay Instantly",
      title: "1. Book & Pay Instantly",
      description:
        "Choose your parking time and pay securely via Stripe or simply scan the QR code upon arrival. No tickets, no gates—just a seamless digital checkout.",
      image: "/Split_Airport_new_terminal_main_hall.jpg",
    },
    {
      label: "Connect with Your City Manager",
      title: "2. Connect with Your City Manager",
      description:
        "Immediately after payment, you can send a personal WhatsApp message to our City Manager. This is your direct line for 24/7 support or any assistance you need during your stay.",
      image: "/Split_Airport_new_terminal_main_hall.jpg",
    },
    {
      label: "Arrange Your Ride & Protection",
      title: "3. Arrange Your Ride & Protection",
      description:
        "Once booked, you can easily reserve a 1-way or 2-way Uber/Taxi through our application or our dedicated support line. You also have the flexibility to: Add vehicle insurance for extra peace of mind. Rearrange or cancel your ride up to 60 minutes before arrival. Rely on our Return Back Guarantee if your plans change.",
      image: "/Split_Airport_new_terminal_main_hall.jpg",
    },
    {
      label: "Park & Go",
      title: "4. Park & Go",
      description:
        "Upon arrival, simply pull into any empty, unmarked space or your assigned dedicated spot. Your plate is your permit—our AI takes care of the rest.",
      image: "/Split_Airport_new_terminal_main_hall.jpg",
    },
  ];
  const faqItems = [
    {
      q: "How long does transfer to Split Airport take?",
      a: "On‑demand rides via Uber/Taxi typically take 2–3 minutes from the PayParq car park to Split Airport (SPU) in Kaštela. Total time from arriving at the car park to reaching your gate is usually 10–15 minutes depending on traffic.",
    },
    {
      q: "How long do I have to wait for my transfer?",
      a: "There is no scheduled waiting. Request an Uber/Taxi on arrival through the PayParq link or WhatsApp and depart within minutes. Our City Manager can coordinate priority pick‑up.",
    },
    {
      q: "When and how often is there a transfer?",
      a: "Transfers are on‑demand 24/7 via Uber/Taxi. Arrive, request a ride, and go directly to your chosen terminal at Split Airport.",
    },
    {
      q: "Can I book a parking space without a transfer?",
      a: "Yes. Choose parking‑only at checkout if you prefer to arrange your own transport or walk to nearby public transport.",
    },
    {
      q: "Can I just book the transfer without parking?",
      a: "Yes. Ride assistance is available even without PayParq parking, subject to local availability and pricing.",
    },
    {
      q: "If I'm earlier or later than planned, is that a problem?",
      a: "No. PayParq operates 24/7. You can adjust your session and request a ride at any time using your confirmation link or WhatsApp.",
    },
    {
      q: "Is there a transfer at 04:00?",
      a: "Yes. Early‑morning and late‑night rides are supported. Local ride network surcharges may apply; PayParq does not add extra fees.",
    },
    {
      q: "When do I pay for parking?",
      a: "Pay instantly when booking via Stripe or on arrival by scanning the QR code on signage. All payments are processed securely.",
    },
    {
      q: "When should I be at the car park?",
      a: "For international flights, aim to arrive about 2 hours before departure. Typical car park‑to‑terminal time is around 10 minutes.",
    },
    {
      q: "How long does the drive from the car park to Split Airport take?",
      a: "Driving time is about 2–3 minutes depending on traffic. Rides take you directly to your terminal entrance.",
    },
    {
      q: "How can I change or cancel?",
      a: "Use the link in your confirmation to rebook, extend, shorten, or cancel. No additional PayParq service fees are applied; pricing adjusts to your new times.",
    },
    {
      q: "How do I get back to my car?",
      a: "After baggage claim, open your confirmation link or message WhatsApp to request a ride back to the PayParq car park.",
    },
    {
      q: "Where is the PayParq car park?",
      a: "At Split Airport (SPU) in Kaštela, Croatia. See the embedded Google Map on this page for exact location and directions.",
    },
    {
      q: "What other services can I book?",
      a: "Optional interior/exterior cleaning is available through local partners next to the car park. Message us on WhatsApp for availability.",
    },
    {
      q: "What happens if my return flight is delayed?",
      a: "We accommodate delays. Extend your parking via the confirmation link and request an on‑demand ride when you’re ready to leave the terminal.",
    },
    {
      q: "Is there a van surcharge?",
      a: "Larger vans or minibuses may incur higher rates. The final price is shown at checkout and includes the standard ride assistance.",
    },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: i.a,
      },
    })),
  };
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "ParkingFacility",
    name: "PayParq Split Airport Parking",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kaštela",
      addressRegion: "Split-Dalmatia County",
      addressCountry: "HR",
    },
    areaServed: "Split, Trogir, Kaštela, Dalmatian Coast",
    url: "https://payparq.ai/locations/parkng-split-airport",
    slogan: "Effortless airport parking for Split & Dalmatia",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "On‑demand Uber/Taxi", value: true },
      { "@type": "LocationFeatureSpecification", name: "AI Camera Monitoring", value: true },
      { "@type": "LocationFeatureSpecification", name: "Stripe Secure Checkout", value: true },
    ],
  };

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none font-apple-ui">
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
                  <Link
                    href="/experience"
                    className="hover:text-gray-700 transition-colors hover:underline underline-offset-[6px] decoration-black/50"
                  >
                    Experience
                  </Link>
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setBusinessOpen(true);
                      setCompanyOpen(false);
                    }}
                    onMouseLeave={() => setBusinessOpen(false)}
                  >
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors hover:underline underline-offset-[6px] decoration-black/50 text-[10px]"
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
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
                        <Link
                          href="/parking"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Parking
                        </Link>
                        <Link
                          href="/security"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Security
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/technology"
                    className="hover:text-gray-700 transition-colors hover:underline underline-offset-[6px] decoration-black/50"
                  >
                    Technology
                  </Link>
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      setCompanyOpen(true);
                      setBusinessOpen(false);
                    }}
                    onMouseLeave={() => setCompanyOpen(false)}
                  >
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors hover:underline underline-offset-[6px] decoration-black/50 text-[10px]"
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
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setCompanyOpen(false)}
                        >
                          About
                        </Link>
                        <Link
                          href="/careers"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setCompanyOpen(false)}
                        >
                          Careers
                        </Link>
                        <Link
                          href="/news"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
                          onClick={() => setCompanyOpen(false)}
                        >
                          News
                        </Link>
                        <Link
                          href="/contact"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors hover:underline underline-offset-2"
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
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
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
                  href={`/pay?loc=${encodeURIComponent(LOCATION_ID)}`}
                  className="px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
                >
                  Book Parking
                </Link>
              </div>
            </div>
            {mobileOpen && (
              <div className="md:hidden border-t border-black/5 bg-white px-0 pb-3">
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
                        href="/business"
                        className="w-full py-2 text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setMobileOpen(false);
                          setBusinessOpen(false);
                        }}
                      >
                        Smart City
                      </Link>
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
                    href={`/pay?loc=${encodeURIComponent(LOCATION_ID)}`}
                    className="mt-2 inline-flex w-full justify-center items-center bg-[#5F3DFC] py-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#4330c4] transition-colors"
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

      <main className="flex-1 bg-white pt-16 md:pt-20">
        <article className="max-w-6xl mx-auto px-4 md:px-10 pt-4 pb-5 md:pt-6 md:pb-5">
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight mb-6 md:mb-8 text-black md:-ml-10">
            Split Airport parking from €0.37 per hour - just 2 minutes away.
          </h1>

          <section className="grid gap-8 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start">
            <div className="space-y-8 md:-ml-10">
              <div className="h-full min-h-[480px] rounded-3xl overflow-hidden border border-black/5 bg-black shadow-lg">
                <div className="relative w-full h-full">
                  <Image
                    src="/Split_Airport_new_terminal_main_hall.jpg"
                    alt="Split Airport new terminal main hall"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#4B5563_0,_transparent_55%),radial-gradient(circle_at_bottom,_#1F2937_0,_transparent_55%)]" />
                  <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                        Split Airport car park
                      </p>
                      <p className="text-sm md:text-base text-white font-semibold">
                        Rows of covered and open-air parking bays, ready for take-off.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-2 py-1 text-[10px] text-white">
                          <Car className="w-3 h-3" />
                          <span>Uber/Taxi</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-2 py-1 text-[10px] text-white">
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp 24/7</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-2 py-1 text-[10px] text-white">
                          <CreditCard className="w-3 h-3" />
                          <span>Stripe</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 px-2 py-1 text-[10px] text-white">
                          <Camera className="w-3 h-3" />
                          <span>AI Cameras</span>
                        </span>
                      </div>
                    </div>
                    <span className="hidden md:inline-flex px-3 py-1 rounded-full bg-white/10 text-[10px] text-white/80 border border-white/20">
                      Photo of Split Airport parking
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
                    src="https://www.google.com/maps?q=Split+Airport&output=embed"
                  />
                </div>
              </section>

              <section className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center justify-center text-center rounded-3xl border border-black/10 bg-white px-3 py-3 shadow-sm">
                    <span className="text-[11px] md:text-sm font-semibold text-black uppercase tracking-[0.14em]">
                      Uber
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-center rounded-3xl border border-black/10 bg-white px-3 py-3 shadow-sm">
                    <span className="text-[11px] md:text-sm font-semibold text-black uppercase tracking-[0.14em]">
                      WhatsApp
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-center rounded-3xl border border-black/10 bg-white px-3 py-3 shadow-sm">
                    <span className="text-[11px] md:text-sm font-semibold text-black uppercase tracking-[0.14em]">
                      Stripe
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-center rounded-3xl border border-black/10 bg-white px-3 py-3 shadow-sm">
                    <span className="text-[11px] md:text-sm font-semibold text-black uppercase tracking-[0.14em]">
                      AI LPR
                    </span>
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-1">
                    <span className="w-4 h-4 rounded-full bg-[#4285F4] text-[9px] font-bold text-white flex items-center justify-center">
                      G
                    </span>
                    <span className="text-[11px] md:text-sm font-semibold text-black">Google</span>
                  </div>
                  <span className="text-sm font-semibold text-black">4.9</span>
                  <span className="text-[11px] text-black/60">• 24,098 reviews</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:gap-5">
                  <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-black/10">
                        <Image src="/Split_Airport_new_terminal_main_hall.jpg" alt="Reviewer" fill className="object-cover" />
                      </div>
                      <div className="flex items-center gap-1 text-black">
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                      </div>
                    </div>
                    <p className="text-sm text-black">
                      “Straightforward parking next to the terminal. Paid in seconds on my phone.”
                    </p>
                    <p className="mt-2 text-[11px] text-black/60">Marta K.</p>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-black/10">
                        <Image src="/Split_Airport_new_terminal_main_hall.jpg" alt="Reviewer" fill className="object-cover" />
                      </div>
                      <div className="flex items-center gap-1 text-black">
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                      </div>
                    </div>
                    <p className="text-sm text-black">
                      “Loved that my license plate handled access and payment. No tickets to keep.”
                    </p>
                    <p className="mt-2 text-[11px] text-black/60">Ivan S.</p>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-black/10">
                        <Image src="/Split_Airport_new_terminal_main_hall.jpg" alt="Reviewer" fill className="object-cover" />
                      </div>
                      <div className="flex items-center gap-1 text-black">
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                        <Star className="w-4 h-4 text-black" />
                      </div>
                    </div>
                    <p className="text-sm text-black">
                      “Quick and simple. Parked, paid, and got to the gate in minutes.”
                    </p>
                    <p className="mt-2 text-[11px] text-black/60">David L.</p>
                  </div>
                </div>
              </section>

 

              <section className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-3">
                    Airport parking just minutes from the terminal
                  </h2>
                  <p className="text-sm md:text-base text-black/75">
                    The PayParq-enabled car park at Split Airport is designed for fast arrivals and
                    smooth departures. Drive in, park in your allocated zone, and your license plate
                    links your stay to a live parking session. No paperwork, no barriers, and no
                    searching for a pay machine.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3 text-sm text-black/80">
                  <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                      Location
                    </p>
                    <p className="font-semibold">Split Airport car park</p>
                    <p className="text-xs text-black/70 mt-1">
                      Walking distance from the terminal, with clearly marked PayParq zones.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                      Hours
                    </p>
                    <p className="font-semibold">24/7 access</p>
                    <p className="text-xs text-black/70 mt-1">
                      Perfect for early-morning departures, late arrivals, and seasonal flights.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-black/50 mb-1">
                      Stays
                    </p>
                    <p className="font-semibold">Short- and long-term</p>
                    <p className="text-xs text-black/70 mt-1">
                      Choose flexible stays from a single day to extended trips from Split.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-4">
                  Our Story
                </h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-3xl border border-black/10 bg-white shadow-sm overflow-hidden">
                    <div className="relative w-full pb-[100%]">
                      <div className="absolute inset-x-0 top-0" style={{ height: '50%' }}>
                        <Image
                          src="/Split_Airport_new_terminal_main_hall.jpg"
                          alt="Unbeatable Price Guarantee"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0" style={{ height: '50%' }}>
                        <div className="h-full p-4 md:p-5 text-black">
                          <h3 className="text-base md:text-lg font-semibold mb-1">1. Unbeatable Price Guarantee</h3>
                          <p className="text-[13px] md:text-base font-medium">
                            We’ve cut the overhead—no shuttles, gates, or staff—to offer the market’s lowest rates.
                            Find a cheaper lot? We’ll refund the difference plus 50% off your next stay.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-white shadow-sm overflow-hidden">
                    <div className="relative w-full pb-[100%]">
                      <div className="absolute inset-x-0 top-0" style={{ height: '50%' }}>
                        <Image
                          src="/Split_Airport_new_terminal_main_hall.jpg"
                          alt="Seamless Digital Entry"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0" style={{ height: '50%' }}>
                        <div className="h-full p-4 md:p-5 text-black">
                          <h3 className="text-base md:text-lg font-semibold mb-1">2. Seamless Digital Entry</h3>
                          <p className="text-[13px] md:text-base font-medium">
                            Skip the kiosks and apps. Our gateless, ticketless system uses plate recognition for instant
                            entry. Just drive in or reserve ahead for the best deal.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-white shadow-sm overflow-hidden">
                    <div className="relative w-full pb-[100%]">
                      <div className="absolute inset-x-0 top-0" style={{ height: '50%' }}>
                        <Image
                          src="/Split_Airport_new_terminal_main_hall.jpg"
                          alt="Integrated Uber & Taxi Hub"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0" style={{ height: '50%' }}>
                        <div className="h-full p-4 md:p-5 text-black">
                          <h3 className="text-base md:text-lg font-semibold mb-1">3. Integrated Uber & Taxi Hub</h3>
                          <p className="text-[13px] md:text-base font-medium">
                            While our lot is remote, you’re never stranded. We feature dedicated Uber/Taxi integration
                            and 24/7 WhatsApp support to ensure a fast, reliable bridge to your final destination.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-white shadow-sm overflow-hidden">
                    <div className="relative w-full pb-[100%]">
                      <div className="absolute inset-x-0 top-0" style={{ height: '50%' }}>
                        <Image
                          src="/Split_Airport_new_terminal_main_hall.jpg"
                          alt="AI-Monitored Security"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0" style={{ height: '50%' }}>
                        <div className="h-full p-4 md:p-5 text-black">
                          <h3 className="text-base md:text-lg font-semibold mb-1">4. AI-Monitored Security</h3>
                          <p className="text-[13px] md:text-base font-medium">
                            Rest easy with 24/7 AI Computer Vision monitoring every vehicle. We ensure all cars are
                            authorized and offer an optional insurance where applicable for total peace of mind.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-3">
                    How It Works
                  </h2>
                  <div className="border-b border-black/10">
                    <div className="flex items-center gap-6 overflow-x-auto py-2">
                      {howItWorks.map((s, i) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setActiveStep(i)}
                          className={`relative pb-2 text-[11px] md:text-sm font-semibold uppercase tracking-[0.22em] ${activeStep === i ? "text-black" : "text-black/50"}`}
                          aria-current={activeStep === i ? "step" : undefined}
                        >
                          {s.label}
                          {activeStep === i ? (
                            <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-black" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 rounded-3xl border border-black/10 bg-white overflow-hidden">
                    <div className="relative w-full h-[260px] md:h-[360px]">
                      <Image
                        src={howItWorks[activeStep].image}
                        alt={howItWorks[activeStep].label}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-x-4 bottom-4 bg-white/90 backdrop-blur-md border border-black/10 rounded-2xl p-4 md:p-5 max-w-[85%] text-black">
                        <p className="text-sm md:text-base font-semibold">
                          {howItWorks[activeStep].title}
                        </p>
                        <p className="text-xs md:text-sm text-black/70 mt-1">
                          {howItWorks[activeStep].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-3">
                    Innovations &amp; Service
                  </h2>
                  <div className="grid gap-6 md:grid-cols-[1.2fr,1fr] items-start">
                    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                      <p className="text-sm md:text-base text-black/80">
                        Gateless, ticketless arrival powered by license plate recognition with seamless mobile checkout via Stripe.
                      </p>
                      <p className="mt-3 text-sm md:text-base text-black/80">
                        A personal WhatsApp City Manager gives you direct, fast support whenever you need it.
                      </p>
                      <p className="mt-3 text-sm md:text-base text-black/80">
                        Integrated Uber/Taxi booking, optional vehicle insurance, and a Return Back Guarantee keep your plans flexible.
                      </p>
                      <p className="mt-3 text-sm md:text-base text-black/80">
                        AI Computer Vision monitors the car park and ensures every bay is authorized for peace of mind.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="rounded-3xl border border-black/10 bg-white shadow-sm overflow-hidden">
                        <div className="relative w-full pb-[60%]">
                          <Image
                            src="/Split_Airport_new_terminal_main_hall.jpg"
                            alt="Split Airport terminal hall"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="rounded-3xl border border-black/10 bg-white shadow-sm overflow-hidden">
                        <div className="relative w-full pb-[60%]">
                          <Image
                            src="/hero-bg.jpg"
                            alt="PayParq arrival experience"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-3">
                    About Us
                  </h2>
                  <div className="grid gap-8 md:grid-cols-[0.7fr,1.3fr] items-start">
                    <div className="flex flex-col items-center md:items-start gap-6">
                      <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border border-black/10">
                        <Image src="/Split_Airport_new_terminal_main_hall.jpg" alt="PayParq team" fill className="object-cover" />
                      </div>
                      <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border border-black/10">
                        <Image src="/hero-bg.jpg" alt="PayParq service" fill className="object-cover" />
                      </div>
                    </div>
                    <div className="space-y-5">
                      <p className="text-sm md:text-base text-black/80">
                        PayParq is a modern, customer-first parking platform led by Karlo Žamić. We build for friendliness, speed, and reliability at every touchpoint—from arrival to checkout.
                      </p>
                      <p className="text-sm md:text-base text-black/80">
                        Our goal is for you to try our low-cost, high-service airport parking and be so satisfied that you&apos;ll recommend us to friends and family.
                      </p>
                      <p className="text-sm md:text-base text-black/80">
                        Our team strives daily for your well-being: fast support through WhatsApp, clear signage, and a seamless digital experience without gates or tickets.
                      </p>
                      <p className="text-sm md:text-base text-black/80">
                        We focus on effortless arrivals with integrated Uber/Taxi connections and flexible options like optional vehicle insurance and a Return Back Guarantee when plans change.
                      </p>
                      <p className="text-sm md:text-base text-black/80">
                        As a community-minded company, we love seeing families start and end trips smoothly—small details and warm service matter to us.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-3">
                    Explore Split & Dalmatia
                  </h2>
                  <div className="grid gap-6 md:grid-cols-[1.2fr,1fr] items-start">
                    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
                      <p className="text-sm md:text-base text-black/80">
                        Park next to Split Airport (SPU) in Kaštela and be on your way to
                        Diocletian’s Palace, Trogir old town, and the Adriatic islands of Hvar, Brač, and Šolta.
                      </p>
                      <p className="mt-3 text-sm md:text-base text-black/80">
                        Designed for visitors and locals, PayParq connects you to fast on‑demand rides, flexible stays,
                        and a seamless digital checkout—perfect for weekend getaways and summer holidays along the Dalmatian Coast.
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] md:text-sm text-black/70">
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10">
                          Airport parking near Split
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10">
                          Kaštela & Trogir access
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10">
                          Dalmatian Coast trips
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-black/10">
                          Hvar • Brač • Šolta ferries
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="rounded-3xl border border-black/10 bg-white shadow-sm overflow-hidden">
                        <div className="relative w-full pb-[60%]">
                          <Image
                            src="/Split_Airport_new_terminal_main_hall.jpg"
                            alt="Split Airport terminal"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="rounded-3xl border border-black/10 bg-white shadow-sm overflow-hidden">
                        <div className="relative w-full pb-[60%]">
                          <Image
                            src="/hero-bg.jpg"
                            alt="Coastal route near Split"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(locationSchema) }}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-2">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-2 text-sm md:text-base text-black/80">
                  {faqItems.map((i, idx) => {
                    const open = openFaq.includes(idx);
                    return (
                      <div key={i.q} className="border-b border-black/10">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFaq((prev) =>
                              prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
                            )
                          }
                          aria-expanded={open}
                          className="w-full flex items-center justify-between py-2 text-left"
                        >
                          <span className="font-semibold">{i.q}</span>
                          {open ? <Minus className="w-4 h-4 text-black/60" /> : <Plus className="w-4 h-4 text-black/60" />}
                        </button>
                        {open ? <div className="pb-3 text-black/75">{i.a}</div> : null}
                      </div>
                    );
                  })}
                  <div>
                    <h3 className="font-semibold mb-1">Contact</h3>
                    <p>
                      WhatsApp support is available 24/7 via your booking confirmation link. Email:
                      <span className="ml-1 font-semibold">payparq@outlook.com</span>.
                    </p>
                  </div>
                </div>
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
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
                  href={`/pay?loc=${encodeURIComponent(LOCATION_ID)}`}
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-[#5F3DFC] px-6 py-3.5 text-sm md:text-base font-semibold text-white shadow hover:bg-[#4330c4] transition-colors"
                >
                  Check price
                </Link>
              </div>
            </div>
          </section>
        </article>

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
