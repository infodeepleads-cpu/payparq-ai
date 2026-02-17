'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Car, Camera, MessageCircle, CreditCard, Plus, Minus, ChevronLeft, ChevronRight, PhoneCall } from "lucide-react";
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

export default function LocationClient({ hub, priceLabel, hero: _hero, faqItems, travelTime }: { 
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
  const [isDesktop, setIsDesktop] = useState(false);
  
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
  }, [checkIn, checkOut]);
  
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

  const vm = hub.verification_metadata as Record<string, unknown> | undefined;
  const hideHeaderMeta = typeof vm?.["hide_header"] === "boolean" ? (vm?.["hide_header"] as boolean) : false;
  const hideHeader = hideHeaderMeta;
  const hideAnnouncementBar = true; // Always hide announcement bar for location pages
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photoList = Array.isArray(hub.verification_photos) ? hub.verification_photos.filter((p) => typeof p === "string" && p.trim().length > 0) : [];
  const candidateHero = typeof _hero === "string" && _hero.trim().length > 0 ? _hero : undefined;
  let photos = photoList.length > 0 ? photoList : [candidateHero || "/Split_Airport_new_terminal_main_hall.jpg"];
  // Ensure at least 4 photos for slider
  if (photos.length < 4) {
    const original = [...photos];
    while (photos.length < 4) {
      photos = [...photos, ...original];
    }
    photos = photos.slice(0, 4);
  }
  const currentPhoto = photos[currentPhotoIndex] || "/Split_Airport_new_terminal_main_hall.jpg";

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const reserveRef = useRef<HTMLDivElement>(null);
  const [reserveHeight, setReserveHeight] = useState<number>(480);
  useEffect(() => {
    const updateHeight = () => {
      if (reserveRef.current) {
        setReserveHeight(reserveRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [activeTab, checkIn, checkOut, loading]);
  useEffect(() => {
    const updateDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    updateDesktop();
    window.addEventListener('resize', updateDesktop);
    return () => window.removeEventListener('resize', updateDesktop);
  }, []);
 
  const howItWorks = [
    {
      label: "Book & Pay Instantly",
      title: "1. Book & Pay Instantly",
      description:
        "Choose your parking time and pay securely via Stripe — digital, fast, no paper.",
      icon: CreditCard,
    },
    {
      label: "Connect with Your City Manager",
      title: "2. Connect with Your City Manager",
      description:
        "Message the City Manager via WhatsApp for 24/7 support, questions, or changes.",
      icon: MessageCircle,
    },
    {
      label: "Arrange Your Ride & Protection",
      title: "3. Arrange Your Ride & Protection",
      description:
        "Request Uber to the terminal in minutes. Flexible options, simple flow.",
      icon: Car,
    },
    {
      label: "Park & Go",
      title: "4. Park & Go",
      description:
        "Arrive, park, and go. Your license plate is your permit — monitored by AI.",
      icon: Camera,
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
      { "@type": "LocationFeatureSpecification", name: "On‑demand Uber", value: true },
      { "@type": "LocationFeatureSpecification", name: "AI Camera Monitoring", value: true },
      { "@type": "LocationFeatureSpecification", name: "Stripe Secure Checkout", value: true },
    ],
  };

  const cityName = (() => {
    const lat = hub.latitude;
    const lng = hub.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      if (lat > 45.2 && lat < 46.2 && lng > 15.4 && lng < 16.6) return "Zagreb";
      if (lat > 43.2 && lat < 44.0 && lng > 16.0 && lng < 17.0) return "Split";
    }
    return "Your City";
  })();
  const cityConfig = cityName === "Split"
    ? { center: { lat: 43.5081, lng: 16.4402 }, airport: { lat: 43.5380, lng: 16.2980 }, beach: { lat: 43.5149, lng: 16.4436, name: "Bačvice Beach" } }
    : { center: { lat: 45.8150, lng: 15.9819 }, airport: { lat: 45.7380, lng: 16.0610 }, beach: { lat: 45.7804, lng: 15.9420, name: "Jarun Lake" } };
  const distanceKm = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
    if (typeof lat1 !== "number" || typeof lon1 !== "number" || typeof lat2 !== "number" || typeof lon2 !== "number") return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 10) / 10;
  };
  const distCenter = distanceKm(hub.latitude, hub.longitude, cityConfig.center.lat, cityConfig.center.lng);
  const distAirport = distanceKm(hub.latitude, hub.longitude, cityConfig.airport.lat, cityConfig.airport.lng);
  const distBeach = distanceKm(hub.latitude, hub.longitude, cityConfig.beach.lat, cityConfig.beach.lng);
  const defaultFaq = [
    { q: `How close is PayParq to ${cityName} Airport?`, a: `Typical transfer is 2–5 minutes by Uber depending on traffic. Our location is optimised for quick access to terminal routes.` },
    { q: `Is the car park secure?`, a: `Yes. We use AI‑powered cameras to monitor every entry and exit 24/7. The lot is remote but digitally supervised at all times.` },
    { q: `Do I need to display a ticket?`, a: `No. Your license plate is your digital permit. Our system recognises your car automatically.` },
    { q: `Can I cancel or change my booking?`, a: `Yes. You can cancel for a full refund up to 1 hour before your arrival time.` },
    { q: `Do you offer on‑demand transfers?`, a: `Yes. Request Uber directly from the app for instant terminal drop‑off, typically arriving in minutes.` },
    { q: `Is the car park monitored?`, a: `AI camera monitoring, well‑lit bays, and activity logs provide a secure environment for short‑ and long‑stay parking.` },
    { q: `Do you support EVs?`, a: `Selected locations include EV charging. If not available at this site, nearby public chargers are suggested in the app.` },
    { q: `Are there height or size limits?`, a: `Most standard vehicles fit. Oversized vehicles should contact support for dedicated guidance before booking.` },
    { q: `Can I book long‑stay parking?`, a: `Yes. Choose your duration and extend if needed. Long‑stay customers often prefer covered bays for extra protection.` },
    { q: `Is customer support available?`, a: `24/7 WhatsApp and in‑app support. Contact the City Manager directly from your confirmation.` },
    { q: `Which languages are supported?`, a: `English is supported universally; local languages are available depending on location.` },
    { q: `Can I get an invoice for business travel?`, a: `Yes. Stripe issues a detailed receipt, and VAT invoicing is available upon request.` },
    { q: `What happens if my flight is delayed?`, a: `Adjust your end time in the app or contact support — we’ll help update your reservation.` },
    { q: `Is pricing transparent?`, a: `Yes. Clear hourly rates with no hidden fees. Total is shown before you confirm.` },
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
                  <Link href="/vision" className="hover:text-gray-700 transition-colors">
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
                  href={checkoutHref}
                  onClick={checkIn && checkOut ? handleBook : undefined}
                  className={`px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? "Processing..." : (checkIn && checkOut ? `Book (${totalPriceLabel})` : `Book (${priceLabel}/hr)`)}
                </Link>
              </div>
            </div>
            {mobileOpen && (
              <div className="md:hidden border-t border-black/5 bg-white px-0 pb-3">
                <div className="flex flex-col gap-2 pt-2 text-[12px] font-medium text-black w-full max-w-xs mx-auto">
                  <Link
                    href="/vision"
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
          <div className="flex items-start gap-4 mb-6 md:mb-8 md:-ml-10">
            <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-black">
              {locationName} parking from {priceLabel} per hour - just {travelTime} away.
            </h1>
          </div>

          <section className="grid gap-8 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start">
            <div className="space-y-8 md:-ml-10">
              <div className="rounded-3xl overflow-hidden border border-black/5 bg-black shadow-lg h-[240px] md:h-auto" style={isDesktop ? { height: reserveHeight } : undefined}>
                <div className="relative w-full h-full">
                  <Image
                    src={currentPhoto || "/Split_Airport_new_terminal_main_hall.jpg"}
                    alt={`${locationName} parking`}
                    fill
                    priority
                    className="object-cover"
                  />
                  {/* Photo Navigation */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevPhoto}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-sm transition-all"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-sm transition-all"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute top-4 right-6 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                        {currentPhotoIndex + 1} / {photos.length}
                      </div>
                    </>
                  )}
                  
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#4B5563_0,_transparent_55%),radial-gradient(circle_at_bottom,_#1F2937_0,_transparent_55%)] pointer-events-none" />
                  
                  <div className="absolute bottom-4 left-4 z-10">
                    <div className="w-10 h-10 rounded-full bg-[#5F3DFC] shadow-md flex items-center justify-center">
                      <svg viewBox="0 0 64 64" className="w-6 h-6">
                        <circle cx="20" cy="32" r="7" fill="#ffffff" />
                        <circle cx="44" cy="32" r="7" fill="#ffffff" />
                        <circle cx="32" cy="32" r="5" fill="#ffffff" />
                        <path d="M28 42 L32 46 L36 42 Z" fill="#ffffff" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:hidden bg-white rounded-3xl p-4 shadow-sm border border-gray-100 w-full -mt-2">
                <h2 className="text-base font-bold mb-3">Check price & availability</h2>
                <Link
                  href={checkoutHref}
                  onClick={activeTab === 'reserve' ? (checkIn && checkOut ? handleBook : undefined) : handleBook}
                  className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-xl bg-[#5F3DFC] text-white text-sm font-semibold shadow-sm hover:bg-[#4330c4] transition-colors mb-3 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? "Processing..." : `Book (${priceLabel})`}
                </Link>
                {activeTab === 'reserve' ? (
                  <>
                    <div className="space-y-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">From</label>
                        <input
                          type="datetime-local"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-xs font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
                        <input
                          type="datetime-local"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-xs font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                        />
                      </div>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                      <button
                        onClick={() => setActiveTab('reserve')}
                        className="flex-1 py-1 text-xs font-medium rounded-lg transition-all bg-white shadow-sm text-black"
                      >
                        Reserve
                      </button>
                      <button
                        onClick={() => setActiveTab('park_now')}
                        className="flex-1 py-1 text-xs font-medium rounded-lg transition-all text-gray-500 hover:text-black"
                      >
                        Park Now
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-gray-500 font-medium text-xs">Total</span>
                      <div className="text-right">
                        <div className="text-lg font-bold">{totalPriceLabel}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{totalHours} hours ({priceLabel}/hr)</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mb-3">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-xl text-xs mb-3">
                      <strong>Park Immediately</strong>
                      <p className="mt-1 opacity-90">Start your session now. Adjust duration in checkout.</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                      <button
                        onClick={() => setActiveTab('reserve')}
                        className="flex-1 py-1 text-xs font-medium rounded-lg transition-all text-gray-500 hover:text-black"
                      >
                        Reserve
                      </button>
                      <button
                        onClick={() => setActiveTab('park_now')}
                        className="flex-1 py-1 text-xs font-medium rounded-lg transition-all bg-white shadow-sm text-black"
                      >
                        Park Now
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 w-full">
                <span className="flex items-center justify-center gap-1 rounded-full bg-black/5 border border-black/10 py-1.5 text-[10px] sm:text-[11px] text-black whitespace-nowrap overflow-hidden">
                  <Car className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Uber</span>
                </span>
                <span className="flex items-center justify-center gap-1 rounded-full bg-black/5 border border-black/10 py-1.5 text-[10px] sm:text-[11px] text-black whitespace-nowrap overflow-hidden">
                  <PhoneCall className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Support 24/7</span>
                </span>
                <span className="flex items-center justify-center gap-1 rounded-full bg-black/5 border border-black/10 py-1.5 text-[10px] sm:text-[11px] text-black whitespace-nowrap overflow-hidden">
                  <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Stripe</span>
                </span>
                <span className="flex items-center justify-center gap-1 rounded-full bg-black/5 border border-black/10 py-1.5 text-[10px] sm:text-[11px] text-black whitespace-nowrap overflow-hidden">
                  <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">AI Vision</span>
                </span>
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

              <section className="bg-white text-black border-t border-black/10 rounded-3xl overflow-hidden">
                <div className="px-6 md:px-12 py-16 md:py-20">
                  <div className="space-y-12">
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">How it works</p>
                      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Your parking experience, simplified</h2>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                      {howItWorks.map((step, idx) => {
                        const Icon = step.icon as React.ComponentType<{ className?: string }>;
                        return (
                          <div key={idx} className="space-y-4">
                            <div className="relative h-32 rounded-2xl overflow-hidden border border-black/5 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center">
                              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-black/10 flex items-center justify-center">
                                <Icon className="w-8 h-8 text-black/70" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold">{step.label}</h3>
                              <p className="text-xs text-black/70">{step.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white text-black border-t border-black/10 rounded-3xl overflow-hidden">
                <div className="px-6 md:px-12 py-16 md:py-20 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-black/10 bg-[#F8F8F9] px-4 py-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">Distance</p>
                      <p className="text-sm font-semibold">City Centre</p>
                      <p className="text-xs text-black/70">{typeof distCenter === "number" ? `${distCenter} km` : "N/A"}</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-[#F8F8F9] px-4 py-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">Distance</p>
                      <p className="text-sm font-semibold">Airport</p>
                      <p className="text-xs text-black/70">{typeof distAirport === "number" ? `${distAirport} km` : "N/A"}</p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-[#F8F8F9] px-4 py-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">Distance</p>
                      <p className="text-sm font-semibold">{cityConfig.beach.name}</p>
                      <p className="text-xs text-black/70">{typeof distBeach === "number" ? `${distBeach} km` : "N/A"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">About the location</p>
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{locationName}</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        { q: "City", a: cityName },
                        { q: "Coordinates", a: typeof hub.latitude === "number" && typeof hub.longitude === "number" ? `${hub.latitude.toFixed(5)}, ${hub.longitude.toFixed(5)}` : "N/A" },
                        { q: "Distance to Airport", a: typeof distAirport === "number" ? `${distAirport} km` : "N/A" },
                        { q: "Distance to City Centre", a: typeof distCenter === "number" ? `${distCenter} km` : "N/A" },
                        { q: `${cityConfig.beach.name} Distance`, a: typeof distBeach === "number" ? `${distBeach} km` : "N/A" },
                        { q: "Typical transfer time", a: travelTime },
                        { q: "Parking types", a: "Open‑air and covered bays" },
                        { q: "Hours", a: "24/7 operations" },
                        { q: "Payment", a: "Stripe secure checkout" },
                        { q: "Security", a: "AI cameras and recorded entry/exit" },
                        { q: "Access", a: "License plate recognition" },
                        { q: "Support", a: "WhatsApp 24/7 City Manager" },
                      ].map((item) => (
                        <div key={item.q} className="rounded-xl border border-black/10 bg-[#F8F8F9] px-4 py-3">
                          <p className="text-xs font-semibold">{item.q}</p>
                          <p className="text-xs text-black/70">{item.a}</p>
                        </div>
                      ))}
                    </div>
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
              </section>
            </div>

            <div className="hidden md:flex flex-col items-end md:sticky md:top-24">
            {/* Check Price Widget */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 w-full" ref={reserveRef}>
              <h2 className="text-lg font-bold mb-4">Check price & availability</h2>
              
              {/* Tab Switcher */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button
                  onClick={() => setActiveTab('reserve')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'reserve' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Reserve
                </button>
                <button
                  onClick={() => setActiveTab('park_now')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'park_now' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Park Now
                </button>
              </div>

              {activeTab === 'reserve' ? (
                <>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        From
                      </label>
                      <input
                        type="datetime-local"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        To
                      </label>
                      <input
                        type="datetime-local"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 py-3 border-t border-gray-100">
                    <span className="text-gray-500 font-medium text-sm">Total</span>
                    <div className="text-right">
                      <div className="text-xl font-bold">{totalPriceLabel}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{totalHours} hours ({priceLabel}/hr)</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mb-4">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-xl text-xs mb-3">
                    <strong>Park Immediately</strong>
                    <p className="mt-1 opacity-90">
                      Start your session now. Adjust duration in checkout.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-4 py-3 border-t border-gray-100">
                    <span className="text-gray-500 font-medium text-sm">Total</span>
                    <div className="text-right">
                      <div className="text-xl font-bold">€{priceValue.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400 font-medium">1 hour ({priceLabel}/hr)</div>
                    </div>
                  </div>
                </div>
              )}

              <Link
                href={checkoutHref}
                onClick={(activeTab === 'reserve' && checkIn && checkOut) || activeTab === 'park_now' ? handleBook : undefined}
                className={`w-full block text-center font-bold py-3 rounded-xl hover:opacity-90 transition-colors shadow-lg bg-[#5F3DFC] text-white shadow-indigo-200 ${
                  loading || (activeTab === 'reserve' && (!checkIn || !checkOut)) ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? "Processing..." : (activeTab === 'reserve' ? "Book Now" : "Park Now")}
              </Link>
              
              <p className="mt-3 text-[10px] text-center text-gray-400">
                Secure payment via Stripe • Free cancellation
              </p>
            </div>
            </div>
          </section>
        </article>
        <section className="hidden">
          <div className="max-w-6xl mx-auto px-4 md:px-10">
            <div className="grid gap-8 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
              <div className="md:-ml-10">
                <div className="py-16 md:py-20">
                  <div className="space-y-12">
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">How it works</p>
                      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Your parking experience, simplified</h2>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                      {howItWorks.map((step, idx) => {
                        const Icon = step.icon as React.ComponentType<{ className?: string }>;
                        return (
                          <div key={idx} className="space-y-4">
                            <div className="relative h-32 rounded-2xl overflow-hidden border border-black/5 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center">
                              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-black/10 flex items-center justify-center">
                                <Icon className="w-8 h-8 text-black/70" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold">{step.label}</h3>
                              <p className="text-xs text-black/70">{step.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div></div>
            </div>
          </div>
        </section>
        <section className="hidden">
          <div className="max-w-6xl mx-auto px-4 md:px-10">
            <div className="grid gap-8 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
              <div className="md:-ml-10">
                <div className="py-16 md:py-20">
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
              </div>
              <div></div>
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
