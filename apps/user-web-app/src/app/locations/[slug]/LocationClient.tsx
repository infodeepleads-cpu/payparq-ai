'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Car, Camera, MessageCircle, CreditCard, Plus, Minus, ChevronLeft, ChevronRight, MapPin, Route, Info } from "lucide-react";
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

type SectionKey =
  | "howItWorks"
  | "map"
  | "distance"
  | "about"
  | "faq"
  | "access"
  | "hours"
  | "extras"
  | "space"
  | "reviews"
  | "cancellation"
  | "guarantee"
  | "report";

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
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    howItWorks: true,
    map: true,
    distance: false,
    about: false,
    faq: false,
    access: false,
    hours: false,
    extras: false,
    space: false,
    reviews: false,
    cancellation: false,
    guarantee: false,
    report: false,
  });
  const [isDesktop, setIsDesktop] = useState(false);
  
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
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
  const compactTravelTime = travelTime.replace("minutes", "min").replace("minute", "min");
  const reviewsLabel = "4.8 reviews";
  const extrasLabel = "Extras available";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("favorite-locations");
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    setIsFavorite(parsed.includes(locationId));
  }, [locationId]);

  function toggleFavorite() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("favorite-locations");
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    const next = parsed.includes(locationId)
      ? parsed.filter((id) => id !== locationId)
      : [...parsed, locationId];
    window.localStorage.setItem("favorite-locations", JSON.stringify(next));
    setIsFavorite(next.includes(locationId));
  }
  
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
  const formatEur = (value: number) => `€${value.toFixed(2)}`;
  const hourlyPrice = priceValue > 0 ? priceValue : 2.5;
  const dailyPrice = hourlyPrice * 24;
  const oneWayRidePrice = Math.max(8, Math.round(hourlyPrice * 3));
  const twoWayRidePrice = oneWayRidePrice * 2 - 2;
  const competitorHourly = hourlyPrice + 0.9;
  const competitorDaily = dailyPrice + 7;
  const competitorOneWay = oneWayRidePrice + 3;
  const competitorTwoWay = twoWayRidePrice + 6;
  const monthlyPrice = dailyPrice * 30;
  const uberBoltRidePrice = 5;
  const parqRidePrice = 4.5;
  const busCamperDailyPrice = 50;

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
  const miniPhotos = Array.from({ length: 7 }, (_, idx) => photos[idx % photos.length]);
  const streetViewHref =
    typeof hub.latitude === "number" && typeof hub.longitude === "number"
      ? `https://www.google.com/maps?q=&layer=c&cbll=${hub.latitude},${hub.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
  const cityManagerName =
    (typeof vm?.["city_manager_name"] === "string" && vm["city_manager_name"].trim().length > 0
      ? vm["city_manager_name"]
      : typeof vm?.["manager_name"] === "string" && vm["manager_name"].trim().length > 0
      ? vm["manager_name"]
      : "City Manager") as string;
  const cityManagerPhoto =
    (typeof vm?.["city_manager_photo"] === "string" && vm["city_manager_photo"].trim().length > 0
      ? vm["city_manager_photo"]
      : typeof vm?.["manager_photo"] === "string" && vm["manager_photo"].trim().length > 0
      ? vm["manager_photo"]
      : "") as string;
  const cityManagerWhatsappRaw =
    (typeof vm?.["city_manager_whatsapp"] === "string" && vm["city_manager_whatsapp"].trim().length > 0
      ? vm["city_manager_whatsapp"]
      : typeof vm?.["whatsapp"] === "string" && vm["whatsapp"].trim().length > 0
      ? vm["whatsapp"]
      : typeof vm?.["whatsapp_number"] === "string" && vm["whatsapp_number"].trim().length > 0
      ? vm["whatsapp_number"]
      : "") as string;
  const cityManagerWhatsapp = cityManagerWhatsappRaw.replace(/[^\d]/g, "");
  const cityManagerMessageHref = cityManagerWhatsapp
    ? `https://wa.me/${cityManagerWhatsapp}?text=${encodeURIComponent(`Pozdrav ${cityManagerName}, zanima me ${locationName}.`)}` 
    : `https://wa.me/?text=${encodeURIComponent(`Pozdrav ${cityManagerName}, zanima me ${locationName}.`)}`;
  const reviewItems = [
    { quote: "Čisto, brzo i bez čekanja. Ušli smo i izašli bez papira.", author: "Ana M.", rating: "5.0" },
    { quote: "Podrška je odmah odgovorila i pomogla oko promjene termina.", author: "Marko R.", rating: "4.9" },
    { quote: "Lokacija je jednostavna, cijena jasna i sve je prošlo bez stresa.", author: "Ivana K.", rating: "4.8" },
  ];

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
        "Zatražite Parq vožnju do odredišta u nekoliko minuta. Fleksibilne opcije, jednostavan proces.",
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

  const serviceWidgets = [
    {
      id: "access" as SectionKey,
      title: "Access",
      value: "License plate entry",
      description: "Automatic plate recognition at entry and exit.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
          <rect x="3" y="11" width="18" height="8" rx="2" />
          <circle cx="8" cy="15" r="1" />
          <path d="M11 15h6" />
        </svg>
      ),
    },
    {
      id: "hours" as SectionKey,
      title: "Radno Vrijeme",
      value: "24/7 operacije",
      description: "Open day and night including weekends.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      ),
    },
    {
      id: "extras" as SectionKey,
      title: "Available extras",
      value: "Parq vožnja + support",
      description: "On-demand rides and direct city manager support.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v18" />
          <path d="M3 12h18" />
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      ),
    },
    {
      id: "space" as SectionKey,
      title: "Space",
      value: "Otvoreno",
      description: "Otvoreni parking prostor.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 15V9h3a2 2 0 0 1 0 4H8" />
        </svg>
      ),
    },
    {
      id: "reviews" as SectionKey,
      title: "Reviews",
      value: "4.8 average",
      description: "Consistently high-rated by recent customers.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="currentColor" aria-hidden="true">
          <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ),
    },
    {
      id: "cancellation" as SectionKey,
      title: "Cancellation policy",
      value: "Besplatno otkazivanje unutar 60 minuta",
      description: "Otkazivanje je besplatno unutar 60 minuta prije dolaska.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <path d="m9 16 6-6" />
        </svg>
      ),
    },
    {
      id: "guarantee" as SectionKey,
      title: "Booking guarantee",
      value: "Instant confirmation",
      description: "Secure your spot immediately after checkout.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3 5 7v5c0 5 3.5 8 7 9 3.5-1 7-4 7-9V7l-7-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: "report" as SectionKey,
      title: "Report a problem",
      value: "Contact support + payarq@outlook.com",
      description: "Reach the team quickly for urgent assistance via email or support chat.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H6l-3 3V12A8.5 8.5 0 0 1 11.5 3.5h1A8.5 8.5 0 0 1 21 12Z" />
          <path d="M12 8v5" />
          <circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none" />
        </svg>
      ),
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
      { "@type": "LocationFeatureSpecification", name: "On‑demand Parq vožnja", value: true },
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
    { q: `How close is PayParq to ${cityName} Airport?`, a: `Typical transfer is 2–5 minutes by Parq vožnja depending on traffic. Our location is optimised for quick access to key destination routes.` },
    { q: `Is the car park secure?`, a: `Yes. We use AI‑powered cameras to monitor every entry and exit 24/7. The lot is remote but digitally supervised at all times.` },
    { q: `Do I need to display a ticket?`, a: `No. Your license plate is your digital permit. Our system recognises your car automatically.` },
    { q: `Can I cancel or change my booking?`, a: `Yes. You can cancel for a full refund up to 1 hour before your arrival time.` },
    { q: `Do you offer on‑demand transfers?`, a: `Yes. Zatražite Parq vožnju direktno iz aplikacije za instant transfer do odredišta, obično u nekoliko minuta.` },
    { q: `Is the car park monitored?`, a: `AI camera monitoring, well‑lit bays, and activity logs provide a secure environment for short‑ and long‑stay parking.` },
    { q: `Do you support EVs?`, a: `Selected locations include EV charging. If not available at this site, nearby public chargers are suggested in the app.` },
    { q: `Are there height or size limits?`, a: `Most standard vehicles fit. Oversized vehicles should contact support for dedicated guidance before booking.` },
    { q: `Can I book long‑stay parking?`, a: `Yes. Choose your duration and extend if needed. Long‑stay customers often prefer covered bays for extra protection.` },
    { q: `Is customer support available?`, a: `24/7 WhatsApp and in‑app support. Contact the City Manager directly from your confirmation.` },
    { q: `Which languages are supported?`, a: `English is supported universally; local languages are available depending on location.` },
    { q: `Can I get an invoice for business travel?`, a: `Yes. Stripe issues a detailed receipt, and VAT invoicing is available upon request.` },
    { q: `What happens if my flight is delayed?`, a: `For airport lots only: adjust your end time in the app or contact support — we’ll help update your reservation.` },
    { q: `Is pricing transparent?`, a: `Yes. Clear hourly rates with no hidden fees. Total is shown before you confirm.` },
    { q: `Can I order transport or buy insurance from your site?`, a: `Yes. After your booking is confirmed, you'll be redirected to a success page where you can arrange Parq vožnju, purchase insurance, and download your booking receipt. <a href="/success" class="underline text-blue-600" target="_blank">View Success Page Demo</a>` },
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
          <div className="flex items-start justify-between gap-2 mb-3 md:mb-8 md:-ml-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-2xl md:text-4xl font-semibold tracking-tight leading-tight text-black">
                  {locationName}
                </h1>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 w-full text-[11px] md:text-xs text-black/70">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#5F3DFC]" fill="currentColor" aria-hidden="true">
                    <circle cx="10.5" cy="4.8" r="1.8" />
                    <path d="M9.5 7.2h2.3l1.4 3 2.4 1.2-.9 1.6-2.7-1.4-.8-1.6-.8 3 1.9 2 1.3 4.9h-2l-1.1-4.1-1.8-1.9-.7 3.3-2.2 2.3-1.2-1.1 1.8-2 1.5-6.9z" />
                  </svg>
                  {compactTravelTime}
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#5F3DFC]" fill="currentColor" aria-hidden="true">
                    <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {reviewsLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 3v18" />
                    <path d="M3 12h18" />
                    <path d="m5.6 5.6 12.8 12.8" />
                    <path d="m18.4 5.6-12.8 12.8" />
                  </svg>
                  {extrasLabel}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleFavorite}
              className={`mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full border border-black/10 bg-white transition-colors shrink-0 ${isFavorite ? "text-red-500 hover:bg-red-50" : "text-black hover:bg-black/5"}`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m12 21-1.45-1.32C5.4 15.03 2 11.95 2 8.25 2 5.17 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A5.98 5.98 0 0 1 16.5 3C19.58 3 22 5.17 22 8.25c0 3.7-3.4 6.78-8.55 11.43z" />
              </svg>
            </button>
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

              <div className="w-full rounded-2xl border border-black/10 bg-white p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-xl border border-[#5F3DFC]/20 bg-[#F8F6FF] p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#5F3DFC] font-semibold">PayParq cjenik</p>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between"><span>Sat</span><span className="font-semibold">{formatEur(hourlyPrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Dan</span><span className="font-semibold">{formatEur(dailyPrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Vožnja 1 Smjer</span><span className="font-semibold">{formatEur(oneWayRidePrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Vožnja 2 Smjera</span><span className="font-semibold">{formatEur(twoWayRidePrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Mjesec</span><span className="font-semibold">{formatEur(monthlyPrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Parq vožnja</span><span className="font-semibold">{formatEur(parqRidePrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Autobusi i kamperi</span><span className="font-semibold">{formatEur(busCamperDailyPrice)}/dan</span></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-[#FAFAFA] p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/70 font-semibold">Konkurentske cijene</p>
                    <div className="mt-2 space-y-1.5 text-xs text-black/80">
                      <div className="flex items-center justify-between"><span>Sat</span><span className="font-semibold">{formatEur(competitorHourly)}</span></div>
                      <div className="flex items-center justify-between"><span>Dan</span><span className="font-semibold">{formatEur(competitorDaily)}</span></div>
                      <div className="flex items-center justify-between"><span>Vožnja 1 Smjer</span><span className="font-semibold">{formatEur(competitorOneWay)}</span></div>
                      <div className="flex items-center justify-between"><span>Vožnja 2 Smjera</span><span className="font-semibold">{formatEur(competitorTwoWay)}</span></div>
                      <div className="flex items-center justify-between"><span>Uber/Bolt (cca)</span><span className="font-semibold">{formatEur(uberBoltRidePrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Naš Parq</span><span className="font-semibold">{formatEur(parqRidePrice)}</span></div>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] md:text-xs text-black/65">Napomena o dostupnosti: cijene i raspoloživost mjesta ovise o terminu dolaska i trenutačnom kapacitetu.</p>
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

              <div className="w-full rounded-2xl border border-black/10 bg-white p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-[#5F3DFC]" aria-hidden="true">
                    <path d="M12 2c3.9 0 7 3.1 7 7 0 5.2-7 13-7 13S5 14.2 5 9c0-3.9 3.1-7 7-7Z" fill="currentColor" />
                    <circle cx="12" cy="9" r="2.8" fill="white" fillOpacity="0.95" />
                    <path d="M11.1 4.8a4.2 4.2 0 0 1 5.1.6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    <path d="M7.8 8.2a4.2 4.2 0 0 1 2.8-3.2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs md:text-sm font-semibold text-black">Street View & Photos (8)</p>
                </div>
                <p className="mt-1 text-[11px] md:text-xs text-black/60">Provjerite ulaz i okolinu prije dolaska</p>
                <div className="mt-3 grid grid-cols-4 md:grid-cols-8 gap-2">
                  <a
                    href={streetViewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl border border-black/10 bg-[#F7F7FB] flex flex-col items-center justify-center text-center px-1 hover:bg-[#F0EEFF] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#5F3DFC]" aria-hidden="true">
                      <path d="M12 2c3.9 0 7 3.1 7 7 0 5.2-7 13-7 13S5 14.2 5 9c0-3.9 3.1-7 7-7Z" fill="currentColor" />
                      <circle cx="12" cy="9" r="2.8" fill="white" fillOpacity="0.95" />
                      <path d="M11.1 4.8a4.2 4.2 0 0 1 5.1.6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                      <path d="M7.8 8.2a4.2 4.2 0 0 1 2.8-3.2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    </svg>
                    <span className="text-[9px] font-semibold text-[#5F3DFC] mt-1 leading-tight">Street View</span>
                  </a>
                  {miniPhotos.map((photo, idx) => {
                    const photoIndex = idx % photos.length;
                    const isActiveThumb = currentPhotoIndex === photoIndex;
                    return (
                      <button
                        key={`${photo}-${idx}`}
                        type="button"
                        onClick={() => setCurrentPhotoIndex(photoIndex)}
                        className={`relative aspect-square rounded-xl overflow-hidden border ${isActiveThumb ? "border-[#5F3DFC]" : "border-black/10"}`}
                        aria-label={`Photo ${idx + 1}`}
                      >
                        <Image src={photo} alt={`${locationName} photo ${idx + 1}`} fill className="object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="mt-4 md:mt-6 bg-transparent rounded-none overflow-hidden w-full">
                <div className="px-0 pt-0 pb-16 md:pb-20 space-y-4 w-full">
                  <div className="rounded-2xl border border-black/10 bg-white text-black overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-4 text-left"
                      aria-expanded={openSections.howItWorks}
                      onClick={() => setOpenSections((prev) => ({ ...prev, howItWorks: !prev.howItWorks }))}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Car className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        <span className="text-sm md:text-base font-semibold">How it works</span>
                      </span>
                      {openSections.howItWorks ? (
                        <Minus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      )}
                    </button>
                    {openSections.howItWorks ? (
                      <div className="px-4 md:px-6 pb-4 md:pb-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          {howItWorks.map((step, idx) => (
                            <div key={idx} className="space-y-2 rounded-2xl border border-black/10 bg-white p-4 text-black">
                              <h3 className="text-sm font-semibold">{step.label}</h3>
                              <p className="text-xs text-black/70">{step.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {serviceWidgets.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-black/10 bg-white text-black overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-4 text-left"
                        aria-expanded={openSections[item.id]}
                        onClick={() => setOpenSections((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      >
                        <span className="inline-flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#5F3DFC]/10 flex items-center justify-center shrink-0">{item.icon}</span>
                          <span className="text-sm md:text-base font-semibold">{item.title}</span>
                        </span>
                        {openSections[item.id] ? (
                          <Minus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        ) : (
                          <Plus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        )}
                      </button>
                      {openSections[item.id] ? (
                        <div className="px-4 md:px-6 pb-4 md:pb-6">
                          <div className="rounded-2xl border border-black/10 bg-white text-black p-4 md:p-5">
                            <p className="text-sm font-semibold">{item.value}</p>
                            <p className="text-xs text-black/70 mt-2">{item.description}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  <div className="rounded-2xl border border-black/10 bg-white text-black overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-4 text-left"
                      aria-expanded={openSections.map}
                      onClick={() => setOpenSections((prev) => ({ ...prev, map: !prev.map }))}
                    >
                      <span className="inline-flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        <span className="text-sm md:text-base font-semibold">Map</span>
                      </span>
                      {openSections.map ? (
                        <Minus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      )}
                    </button>
                    {openSections.map ? (
                      <div className="px-4 md:px-6 pb-4 md:pb-6">
                        <div className="relative w-full h-[240px] md:h-[360px] rounded-2xl border border-black/10 bg-white overflow-hidden">
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
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white text-black overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-4 text-left"
                      aria-expanded={openSections.distance}
                      onClick={() => setOpenSections((prev) => ({ ...prev, distance: !prev.distance }))}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Route className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        <span className="text-sm md:text-base font-semibold">Distance</span>
                      </span>
                      {openSections.distance ? (
                        <Minus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      )}
                    </button>
                    {openSections.distance ? (
                      <div className="px-4 md:px-6 pb-4 md:pb-6">
                        <div className="rounded-2xl border border-black/10 bg-white text-black p-4 md:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="px-2 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">Distance</p>
                              <p className="text-sm font-semibold">City Centre</p>
                              <p className="text-xs text-black/70">{typeof distCenter === "number" ? `${distCenter} km` : "N/A"}</p>
                            </div>
                            <div className="px-2 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">Distance</p>
                              <p className="text-sm font-semibold">Airport</p>
                              <p className="text-xs text-black/70">{typeof distAirport === "number" ? `${distAirport} km` : "N/A"}</p>
                            </div>
                            <div className="px-2 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">Distance</p>
                              <p className="text-sm font-semibold">{cityConfig.beach.name}</p>
                              <p className="text-xs text-black/70">{typeof distBeach === "number" ? `${distBeach} km` : "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white text-black overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-4 text-left"
                      aria-expanded={openSections.about}
                      onClick={() => setOpenSections((prev) => ({ ...prev, about: !prev.about }))}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Info className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        <span className="text-sm md:text-base font-semibold">About the location</span>
                      </span>
                      {openSections.about ? (
                        <Minus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      )}
                    </button>
                    {openSections.about ? (
                      <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3">
                        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{locationName}</h2>
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
                            <div key={item.q} className="px-2 py-2">
                              <p className="text-xs font-semibold">{item.q}</p>
                              <p className="text-xs text-black/70">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white text-black overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-4 text-left"
                      aria-expanded={openSections.reviews}
                      onClick={() => setOpenSections((prev) => ({ ...prev, reviews: !prev.reviews }))}
                    >
                      <span className="inline-flex items-center gap-3">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#5F3DFC] shrink-0" fill="currentColor" aria-hidden="true">
                          <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span className="text-sm md:text-base font-semibold">Recenzije i podrška</span>
                      </span>
                      {openSections.reviews ? (
                        <Minus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      )}
                    </button>
                    {openSections.reviews ? (
                      <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          {reviewItems.map((item) => (
                            <div key={item.author} className="rounded-xl border border-black/10 bg-[#FBFAFF] p-3">
                              <p className="text-[11px] font-semibold text-[#5F3DFC]">{item.rating} / 5</p>
                              <p className="mt-1 text-xs leading-relaxed text-black/80">“{item.quote}”</p>
                              <p className="mt-2 text-[11px] font-semibold text-black">{item.author}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-[#5F3DFC]/25 bg-white p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {cityManagerPhoto ? (
                              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-black/10 shrink-0">
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${cityManagerPhoto}")` }} aria-label={`${cityManagerName} profile`} />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#F0EEFF] text-[#5F3DFC] font-semibold text-sm inline-flex items-center justify-center shrink-0">
                                {cityManagerName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-black truncate">{cityManagerName}</p>
                              <p className="text-xs text-black/65">City Manager • Prosječni odgovor &lt; 5 min</p>
                            </div>
                          </div>
                          <a
                            href={cityManagerMessageHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-xl bg-[#5F3DFC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F33D4] transition-colors"
                          >
                            Pošalji poruku
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white text-black overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-4 text-left"
                      aria-expanded={openSections.faq}
                      onClick={() => setOpenSections((prev) => ({ ...prev, faq: !prev.faq }))}
                    >
                      <span className="inline-flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        <span className="text-sm md:text-base font-semibold">FAQ</span>
                      </span>
                      {openSections.faq ? (
                        <Minus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                      )}
                    </button>
                    {openSections.faq ? (
                      <div className="px-4 md:px-6 pb-4 md:pb-6">
                        <div className="space-y-2">
                          {finalFaq.map((i, idx) => {
                            const open = openFaq.includes(idx);
                            return (
                              <div key={i.q}>
                                <button
                                  type="button"
                                  className="w-full flex items-start gap-3 py-3 text-sm font-semibold text-left"
                                  aria-expanded={open}
                                  onClick={() =>
                                    setOpenFaq((prev) =>
                                      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
                                    )
                                  }
                                >
                                  {open ? (
                                    <Minus className="w-4 h-4 text-[#5F3DFC] mt-0.5 shrink-0" />
                                  ) : (
                                    <Plus className="w-4 h-4 text-[#5F3DFC] mt-0.5 shrink-0" />
                                  )}
                                  <span className="text-left">{i.q}</span>
                                </button>
                                {open ? <div className="pb-3 pl-7 text-sm text-black/75" dangerouslySetInnerHTML={{ __html: i.a }} /> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
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
                              {open ? <div className="px-4 pb-4 text-sm text-black/75" dangerouslySetInnerHTML={{ __html: i.a }} /> : null}
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
                <button
                  type="button"
                  className="block hover:text-white transition-colors text-left"
                  onClick={() => {
                    window.location.assign("/locations");
                  }}
                >
                  Locations
                </button>
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
