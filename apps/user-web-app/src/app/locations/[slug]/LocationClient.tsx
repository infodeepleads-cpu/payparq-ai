'use client';

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Car, Camera, MessageCircle, CreditCard, Plus, Minus, ChevronLeft, ChevronRight, MapPin, Route, Info } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

const LotMap = lazy(() => import('@/components/LotMap'));
import { FooterBrand } from "@/components/FooterBrand";
import { SiteHeader } from "@/components/SiteHeader";
import { normalizeLocationName, resolveParkTaxiPriceEuro, resolveScannerTruthPriceEuro } from "@/lib/locationPricing";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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
  addons_config?: Record<string, unknown> | null;
  rate_per_hour?: number;
  base_price_hourly?: number;
  base_price_daily?: number;
  base_price_monthly?: number;
  rate_per_hour_floor?: number;
  rate_per_hour_ceiling?: number;
  base_price_daily_floor?: number;
  base_price_daily_ceiling?: number;
  base_price_monthly_floor?: number;
  base_price_monthly_ceiling?: number;
  review_score?: number | null;
  review_count?: number | null;
  review_scores?: {
    security?: number; accessibility?: number; cleanliness?: number;
    staff?: number; value?: number; location?: number;
  } | null;
  capacity?: number;
  total_spots?: number;
  nearby_landmarks?: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;
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
  | "report"
  | "spots";

const TRANSLATIONS = {
  'Ukupno': { en: 'Total', hr: 'Ukupno' },
  'Ukupno recenzija': { en: 'Total reviews', hr: 'Ukupno recenzija' },
  'Natkriveno': { en: 'Covered', hr: 'Natkriveno' },
  'Garaža': { en: 'Garage', hr: 'Garaža' },
  'Valet': { en: 'Valet', hr: 'Valet' },
  'Samoparkirani': { en: 'Self-Park', hr: 'Samoparkirani' },
  'Parking uvijek otvoren.': { en: 'Parking always open.', hr: 'Parking uvijek otvoren.' },
  'Access Hours': { en: 'Access Hours', hr: 'Vremenske granice' },
  'How it works': { en: 'How it works', hr: 'Kako radi' },
  'Getting There': { en: 'Getting There', hr: 'Kako doći' },
  'Things You Should Know': { en: 'Things You Should Know', hr: 'Važne informacije' },
  'Free Cancellation Policy': { en: 'Free Cancellation Policy', hr: 'Politika besplatnog otkazivanja' },
  'Amenities': { en: 'Amenities', hr: 'Usluge' },
} as const;

const t = (key: string, locale: 'en' | 'hr'): string => {
  const trans = TRANSLATIONS[key as keyof typeof TRANSLATIONS];
  return trans ? trans[locale] : key;
};

const translateText = (text: string, locale: 'en' | 'hr'): string => {
  if (locale === 'hr') return text;

  const commonPhrases: Record<string, string> = {
    'Pokažite službeniku svoju PayParq parkirnu propusnicu, ispisanu ili na mobilnom uređaju': 'Show the attendant your PayParq parking pass, printed or on your mobile device',
    'Samo uđite ako nema nikoga': 'Only enter if no one is there',
    'Odvezite se kad budete spremni otići': 'Drive away when you\'re ready to leave',
    'Pratite Google Maps': 'Follow Google Maps',
    'U ovoj ustanovi imate vremena do trenutka kada vaša rezervacija počne otkazati svoje parkiranje za puni povrat novca': 'At this facility, you have until your reservation starts to cancel your parking for a full refund',
    'Rezervaciju možete otkazati na web stranici ili aplikaciji PayParq': 'You can cancel your reservation on the PayParq website or app',
    'Ako imate problema sa svojom rezervacijom': 'If you have problems with your reservation',
    'obratite se našim PayParq timom koji će rado pomoći ispraviti svaku situaciju': 'contact our PayParq team who will be happy to help fix any situation',
    'Vozila parkiraju lagano ukoso redom s lijeve strane od ulaza': 'Vehicles park slowly at an angle in a row from the left side of the entrance',
    'Osoblje se nalazi u jutarnjoj smjeni, u špici sezone na licu mjesta': 'Staff is available during morning shifts, in peak season on-site',
    'Parking uvijek otvoren': 'Parking always open',
    'Pristup invalidskim kolicima': 'Wheelchair accessible',
    'Prvi parking, skreni lijevo pored Ulaza u Restoran Burin': 'First parking, turn left next to the Restaurant Burin entrance',
    'Odmah prvi se lijeve strane ulaz': 'Immediately first on the left side entrance',
  };

  let result = text;
  Object.entries(commonPhrases).forEach(([hr, en]) => {
    result = result.replace(new RegExp(hr, 'g'), en);
  });

  return result;
};

export default function LocationClient({ hub, priceLabel, hero: _hero, faqItems, travelTime }: {
  hub: HubData;
  priceLabel: string;
  hero: string;
  faqItems: Array<{ q: string; a: string }>;
  travelTime: string;
}) {
  const { locale } = useLocale();
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
    report: false,
    spots: false,
  });
  const [isDesktop, setIsDesktop] = useState(false);
  
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [premiumSpots, setPremiumSpots] = useState<Array<{ id: string; label: string; price_modifier_cents: number; available: boolean }>>([]);
  const parkTaxiLeadMinutes = 60;
  const parkTaxiDefaultOffsetMinutes = 65;
  const parkTaxiDefaultDurationHours = 1;
  
  // Set default check-in to now, check-out to 1 hour from now on mount
  useEffect(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localNow = new Date(now.getTime() - offset);
    const inStr = localNow.toISOString().slice(0, 16);
    
    const later = new Date(localNow);
    later.setHours(later.getHours() + 1);
    const outStr = later.toISOString().slice(0, 16);
    
    if (!checkIn) setCheckIn(inStr);
    if (!checkOut) setCheckOut(outStr);
  }, [checkIn, checkOut]);
  
  useEffect(() => {
    if (activeTab !== 'park_now') return;
    const minDate = new Date(Date.now() + parkTaxiLeadMinutes * 60 * 1000);
    const defaultCheckInDate = new Date(Date.now() + parkTaxiDefaultOffsetMinutes * 60 * 1000);
    const defaultOutDate = new Date(defaultCheckInDate.getTime() + parkTaxiDefaultDurationHours * 60 * 60 * 1000);
    const toLocalDatetimeInput = (value: Date) => {
      const offset = value.getTimezoneOffset() * 60000;
      return new Date(value.getTime() - offset).toISOString().slice(0, 16);
    };
    const minCheckIn = toLocalDatetimeInput(defaultCheckInDate);
    const minCheckOut = toLocalDatetimeInput(defaultOutDate);
    setCheckIn((prev) => {
      if (!prev) return minCheckIn;
      const prevDate = new Date(prev);
      if (Number.isNaN(prevDate.getTime()) || prevDate.getTime() < minDate.getTime()) return minCheckIn;
      return prev;
    });
    setCheckOut((prev) => {
      if (!prev) return minCheckOut;
      const prevDate = new Date(prev);
      if (Number.isNaN(prevDate.getTime()) || prevDate.getTime() <= minDate.getTime()) return minCheckOut;
      return prev;
    });
  }, [activeTab, parkTaxiDefaultDurationHours, parkTaxiDefaultOffsetMinutes, parkTaxiLeadMinutes]);

  useEffect(() => {
    if (activeTab !== 'reserve') return;
    const now = new Date();
    const reserveOutDate = new Date(now.getTime() + 60 * 60 * 1000);
    const parkTaxiAutoCheckIn = new Date(now.getTime() + parkTaxiDefaultOffsetMinutes * 60 * 1000);
    const parkTaxiAutoCheckOut = new Date(now.getTime() + (parkTaxiDefaultOffsetMinutes * 60 * 1000) + (parkTaxiDefaultDurationHours * 60 * 60 * 1000));
    const twoMinutesMs = 2 * 60 * 1000;
    const toLocalDatetimeInput = (value: Date) => {
      const offset = value.getTimezoneOffset() * 60000;
      return new Date(value.getTime() - offset).toISOString().slice(0, 16);
    };
    const reserveNowStr = toLocalDatetimeInput(now);
    const reserveOutStr = toLocalDatetimeInput(reserveOutDate);
    setCheckIn((prev) => {
      if (!prev) return reserveNowStr;
      const prevDate = new Date(prev);
      if (Number.isNaN(prevDate.getTime())) return reserveNowStr;
      const isParkTaxiAutoTime =
        Math.abs(prevDate.getTime() - parkTaxiAutoCheckIn.getTime()) <= twoMinutesMs;
      return isParkTaxiAutoTime ? reserveNowStr : prev;
    });
    setCheckOut((prev) => {
      if (!prev) return reserveOutStr;
      const prevDate = new Date(prev);
      if (Number.isNaN(prevDate.getTime())) return reserveOutStr;
      const isParkTaxiAutoTime =
        Math.abs(prevDate.getTime() - parkTaxiAutoCheckOut.getTime()) <= twoMinutesMs;
      return isParkTaxiAutoTime ? reserveOutStr : prev;
    });
  }, [activeTab, parkTaxiDefaultDurationHours, parkTaxiDefaultOffsetMinutes]);
  
  useEffect(() => {
    if (!hub.id) return;
    fetch(`/api/spots?location_id=${encodeURIComponent(hub.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.spots)) {
          setPremiumSpots(d.spots.filter((s: { price_modifier_cents: number; available: boolean }) => s.price_modifier_cents > 0 && s.available));
        }
      })
      .catch(() => {});
  }, [hub.id]);

  const locationName = normalizeLocationName(String(hub.name || '')) || "Parking Trogir";
  const locationId = hub.id || "parkng split airport";
  const slugKey = (hub.canonical_slug || "").toString().trim().toLowerCase();
  const locationKey = `${locationName} ${slugKey}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isBaskaVodaPuntaRataLocation =
    locationKey.includes("baska voda") ||
    locationKey.includes("baska-voda") ||
    locationKey.includes("punta rata") ||
    locationKey.includes("punta-rata");
  const isInsigniaLocation = locationKey.includes("insignia");
  const walkingDistanceLabel = isBaskaVodaPuntaRataLocation
    ? "6-13 min Baška Voda"
    : "7-12 min";
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
  let totalDays = 1;
  
  if (checkIn && checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      totalHours = Math.ceil(diff / (1000 * 60 * 60));
      totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  }

  // Parse price from label (e.g. "€2.50/hr" -> 2.50)
  const priceValue = parseFloat(priceLabel.replace(/[^0-9.]/g, '')) || 0;
  const formatEur = (value: number) => `€${value.toFixed(2)}`;
  const hourlyPrice = resolveScannerTruthPriceEuro(hub, "hourly") || (priceValue > 0 ? priceValue : 2.5);
  const dailyPrice = resolveScannerTruthPriceEuro(hub, "daily");
  const parkTaxiUnitPrice = resolveParkTaxiPriceEuro(hub) || dailyPrice;
  const reserveUsesDailyPricing = totalHours > 24;
  const reserveSubtotal = reserveUsesDailyPricing ? totalDays * dailyPrice : totalHours * hourlyPrice;
  const reserveServiceFee = 0;
  const reserveTotalAmount = reserveSubtotal + reserveServiceFee;
  const reserveTotalPriceLabel = `€${reserveTotalAmount.toFixed(2)}`;
  const reserveDurationLabel = reserveUsesDailyPricing
    ? `${totalDays} days (${formatEur(dailyPrice)}/day)`
    : `${totalHours} hours (${formatEur(hourlyPrice)}/hr)`;
  const parkTaxiSubtotal = parkTaxiUnitPrice + (totalDays - 1) * dailyPrice;
  const parkTaxiServiceFee = 0;
  const parkTaxiTotal = parkTaxiSubtotal + parkTaxiServiceFee;
  const parkTaxiTotalPriceLabel = `€${parkTaxiTotal.toFixed(2)}`;
  const parkTaxiBreakdownLabel = totalDays > 1
    ? `P&T ${formatEur(parkTaxiUnitPrice)} + ${totalDays - 1} dan${totalDays > 2 ? 'a' : ''} (${formatEur(dailyPrice)}/dan)`
    : `Park & Taxi (${formatEur(parkTaxiUnitPrice)})`;
  const reserveTotalAmountCents = Math.max(0, Math.round(reserveTotalAmount * 100));
  const parkTaxiTotalAmountCents = Math.max(0, Math.round((parkTaxiUnitPrice + (totalDays - 1) * dailyPrice) * 100));
  const activeFlowAmountCents = activeTab === "park_now" ? parkTaxiTotalAmountCents : reserveTotalAmountCents;
  const showMinChargeWalletExplainer = activeFlowAmountCents > 0 && activeFlowAmountCents < 50;
  const minChargeWalletExplainerText = "Card min €0.50. Extra is added to wallet.";
  const monthlyPrice = resolveScannerTruthPriceEuro(hub, "monthly");
  const uberOneWayRidePrice = 5;
  const uberTwoWayRidePrice = 10;
  const competitorHourly = 1.5;
  const competitorDaily = dailyPrice + 7;
  const camperDailyPrice = 20;
  const busDailyPrice = 50;
  const checkoutHref = `/pay?loc=${encodeURIComponent(locationId)}&in=${encodeURIComponent(checkIn)}&out=${encodeURIComponent(checkOut)}&flow=${encodeURIComponent(activeTab)}&amount_cents=${encodeURIComponent(String(activeFlowAmountCents))}`;

  const parkTaxiMinCheckIn = (() => {
    const minDate = new Date(Date.now() + parkTaxiDefaultOffsetMinutes * 60 * 1000);
    const offset = minDate.getTimezoneOffset() * 60000;
    return new Date(minDate.getTime() - offset).toISOString().slice(0, 16);
  })();
  const validateParkTaxiLeadTime = () => {
    if (activeTab !== 'park_now') return "";
    if (!checkIn || !checkOut) return "Odaberite vrijeme dolaska i odlaska.";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Vrijeme dolaska i odlaska nije ispravno.";
    }
    if (end.getTime() <= start.getTime()) {
      return "Vrijeme odlaska mora biti nakon vremena dolaska.";
    }
    const minStart = Date.now() + parkTaxiLeadMinutes * 60 * 1000;
    if (start.getTime() < minStart) {
      return "Početna vožnja mora biti rezervirana najmanje 60 minuta ranije.";
    }
    return "";
  };
  const mapCheckoutErrorMessage = (errorValue: string) => {
    if (errorValue === "park_taxi_requires_check_in_and_check_out") return "Za Park & Taxi morate odabrati dolazak i odlazak.";
    if (errorValue === "invalid_check_in_or_check_out") return "Vrijeme dolaska i odlaska nije ispravno.";
    if (errorValue === "check_out_must_be_after_check_in") return "Vrijeme odlaska mora biti nakon vremena dolaska.";
    if (errorValue === "park_taxi_requires_60_min_advance") return "Početna vožnja mora biti rezervirana najmanje 60 minuta ranije.";
    if (errorValue === "missing_location_id") return "Lokacija nije ispravno odabrana. Pokušajte ponovno.";
    if (errorValue === "missing_or_invalid_stripe_secret") return "Plaćanje trenutno nije dostupno. Pokušajte ponovno za nekoliko minuta.";
    if (errorValue === "pricing_resolution_failed") return "Ne mogu izračunati cijenu za ovu lokaciju. Pokušajte ponovno.";
    return errorValue;
  };
  const canSubmitCheckout = Boolean(checkIn && checkOut);
  
  async function handleBook(e: React.MouseEvent<HTMLElement>) {
    if (!canSubmitCheckout) return;
    const parkTaxiError = validateParkTaxiLeadTime();
    if (parkTaxiError) {
      setCheckoutError(parkTaxiError);
      return;
    }
    
    e.preventDefault();
    setCheckoutError("");
    setLoading(true);
    
    try {
      let customerEmail: string | undefined = undefined;
      let authToken: string | undefined = undefined;
      if (supabase && isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        customerEmail = data.session?.user?.email?.trim().toLowerCase() || undefined;
        authToken = data.session?.access_token || undefined;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          location_id: locationId,
          display_id: hub.display_id,
          check_in: checkIn ? new Date(checkIn).toISOString() : undefined,
          check_out: checkOut ? new Date(checkOut).toISOString() : undefined,
          flow_type: activeTab,
          customer_email: customerEmail,
          type: activeTab === 'park_now' || (activeTab === 'reserve' && reserveUsesDailyPricing) ? 'daily' : undefined,
          park_taxi: activeTab === 'park_now' ? 1 : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Checkout error response:", errData);
        const normalizedError =
          typeof errData?.error === "string" && errData.error.trim()
            ? mapCheckoutErrorMessage(errData.error)
            : "Checkout nije uspio. Pokušajte ponovno.";
        throw new Error(normalizedError);
      }
      let checkoutUrl = "";
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (contentType.includes("application/json")) {
        const data = (await res.json().catch(() => null)) as { url?: string } | null;
        checkoutUrl = (data?.url || "").toString().trim();
      } else if (res.redirected && res.url) {
        checkoutUrl = res.url;
      }
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      setCheckoutError("Checkout link not available. Please try again.");
      setLoading(false);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : "Checkout nije uspio. Pokušajte ponovno.";
      setCheckoutError(errorMessage);
      setLoading(false);
    }
  }
  
  useEffect(() => {
    setCheckoutError((prev) => (prev ? "" : prev));
  }, [activeTab, checkIn, checkOut]);

  const vm = hub.verification_metadata as Record<string, unknown> | undefined;
  const hideHeaderMeta = typeof vm?.["hide_header"] === "boolean" ? (vm?.["hide_header"] as boolean) : false;
  const hideHeader = hideHeaderMeta;
  const hideAnnouncementBar = true; // Always hide announcement bar for location pages
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const isSupabaseStorageUrl = (url: string) =>
    /^https?:\/\/[^/]+\/storage\/v1\/object\/public\//.test(url);
  const photoList = Array.isArray(hub.verification_photos) ? hub.verification_photos.filter((p) => typeof p === "string" && p.trim().length > 0) : [];
  const candidateHero = typeof _hero === "string" && _hero.trim().length > 0 ? _hero : undefined;
  const hasLotCoords = typeof hub.latitude === "number" && typeof hub.longitude === "number";
  const effectivePhotoCount = (photoList.length > 0 ? photoList.length : 1);
  const streetAndPhotoCount = 1 + photoList.length;
  let photos = photoList.length > 0 ? photoList : [candidateHero || "/Split_Airport_new_terminal_main_hall.jpg"];
  // Ensure at least 4 real photos for slider
  if (photos.length < 4) {
    const original = [...photos];
    while (photos.length < 4) {
      photos = [...photos, ...original];
    }
    photos = photos.slice(0, 4);
  }
  const currentPhoto = photos[currentPhotoIndex] || "/Split_Airport_new_terminal_main_hall.jpg";
  const currentPhotoIsSupabase = isSupabaseStorageUrl(currentPhoto);
  const miniPhotosSource = photoList.length > 0 ? photoList : [candidateHero || "/Split_Airport_new_terminal_main_hall.jpg"];
  const miniPhotos = miniPhotosSource.slice(0, 7);
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
      : "+385 992166037") as string;
  const cityManagerWhatsapp = cityManagerWhatsappRaw.replace(/[^\d]/g, "");
  const cityManagerWhatsappDisplay = cityManagerWhatsapp ? `+${cityManagerWhatsapp}` : cityManagerWhatsappRaw;
  const cityManagerMessageHref = cityManagerWhatsapp
    ? `https://wa.me/${cityManagerWhatsapp}?text=${encodeURIComponent(`Pozdrav ${cityManagerName}, zanima me ${locationName}.`)}` 
    : `https://wa.me/?text=${encodeURIComponent(`Pozdrav ${cityManagerName}, zanima me ${locationName}.`)}`;
  const hasRealReviews = (hub.review_count ?? 0) > 0 && hub.review_score != null;
  const totalReviews = hasRealReviews ? (hub.review_count ?? 0) : 0;
  const averageRatingNumeric = hasRealReviews ? (hub.review_score ?? 0) : 0;
  const averageRating = hasRealReviews ? averageRatingNumeric.toFixed(1) : "—";
  const reviewsLabel = hasRealReviews ? `${averageRating} / 10 (${totalReviews})` : "New Object";

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
      label: "Choose your location",
      title: "1. Choose your location",
      description:
        "Browse and choose your location",
      icon: CreditCard,
    },
    {
      label: "Unesi podatke i plati",
      title: "2. Unesi podatke i plati",
      description:
        "Odaberi količinu (broj sati), unesi email, broj mobitela i plati.",
      icon: Car,
    },
    {
      label: "Dodaj vožnju ili produži parking",
      title: "3. Dodaj vožnju ili produži parking",
      description:
        "Možeš dodati Vožnju ili produžiti parking putem aplikacije. Za najbolje iskustvo vožnje rezerviraj 60 min unaprijed.",
      icon: Camera,
    },
  ];

  const serviceWidgets = [
    {
      id: "hours" as SectionKey,
      title: "Radno Vrijeme",
      value: "24/7 Operacije",
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
      value: "Parq vožnja",
      description: "On-demand rides available from the app.",
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
      value: "Otvoreno, zid uz cestu, rasvjeta",
      description: "Otvoreni parking prostor sa zidom uz cestu i rasvjetom.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 15V9h3a2 2 0 0 1 0 4H8" />
        </svg>
      ),
    },
    {
      id: "cancellation" as SectionKey,
      title: "Cancellation policy",
      value: "Besplatno otkazivanje + garancija rezervacije",
      description: "Otkazivanje je besplatno unutar 60 minuta prije dolaska, a rezervacija je garantirana nakon potvrde.",
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <path d="m9 16 6-6" />
        </svg>
      ),
    },
    {
      id: "report" as SectionKey,
      title: "Report a problem",
      value: "Contact support + payparq@outlook.com",
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

  // Parse Croatian addresses robustly — formats vary:
  // Full:  "Street, City, Municipality, Region, PostalCode, Country"  (6 parts)
  // Short: "Općina City, Region, Country"                             (3 parts)
  const addrParts = hub.address ? hub.address.split(",").map((s) => s.trim()) : [];
  const _isAdmin = (p: string) => /^(?:Općina|Grad|Gradska\s+četvrt)\s+/i.test(p);
  const _isRegion = (p: string) => /županija/i.test(p);
  const _isPostal = (p: string) => /^\d{5}$/.test(p);
  const _isCountry = (p: string) => /^hrvatska$/i.test(p);
  const _stripAdmin = (p: string) => p.replace(/^(?:Općina|Grad|Gradska\s+četvrt)\s+/i, "").trim();
  // If first part has no admin prefix and there are 4+ parts, it's a street; city is at index 1
  const hasStreet = addrParts.length >= 4 && !_isAdmin(addrParts[0]);
  const addressStreet = hasStreet ? addrParts[0] : "";
  const addressCity = (() => {
    const candidates = hasStreet ? addrParts.slice(1) : addrParts;
    for (const p of candidates) {
      if (_isRegion(p) || _isPostal(p) || _isCountry(p)) continue;
      return _stripAdmin(p);
    }
    return (addrParts[0] ? _stripAdmin(addrParts[0]) : '') || locationName;
  })();
  const addressRegion = addrParts.find((p) => _isRegion(p)) || "";
  const addressPostal = addrParts.find((p) => _isPostal(p)) || "";
  const hubUrl = `https://payparq.ai/locations/${hub.canonical_slug}`;
  const heroPhoto = Array.isArray(hub.verification_photos) && hub.verification_photos[0]
    ? hub.verification_photos[0] as string
    : undefined;
  const whatsapp = typeof hub.verification_metadata?.city_manager_whatsapp === "string"
    ? hub.verification_metadata.city_manager_whatsapp
    : undefined;
  const googleMapsUrl = hub.latitude && hub.longitude
    ? `https://www.google.com/maps?q=${hub.latitude},${hub.longitude}`
    : undefined;

  const locationSchema = {
    "@context": "https://schema.org",
    "@type": ["ParkingFacility", "LocalBusiness"],
    "@id": hubUrl,
    name: locationName,
    description: `Secure parking at ${hub.address || locationName}. AI camera monitoring, instant booking, no ticket needed. On-demand transfers available.`,
    ...(heroPhoto ? { image: heroPhoto } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: addressStreet,
      addressLocality: addressCity,
      addressRegion: addressRegion,
      postalCode: addressPostal,
      addressCountry: "HR",
    },
    ...(hub.latitude && hub.longitude ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: hub.latitude,
        longitude: hub.longitude,
      },
    } : {}),
    ...(googleMapsUrl ? { sameAs: googleMapsUrl } : {}),
    ...(whatsapp ? { telephone: whatsapp } : {}),
    areaServed: addressCity,
    url: hubUrl,
    slogan: "Effortless parking",
    priceRange: "€",
    openingHours: "Mo-Su 00:00-23:59",
    paymentAccepted: "Credit Card, Debit Card",
    currenciesAccepted: "EUR",
    brand: {
      "@type": "Brand",
      name: "PayParq",
      url: "https://payparq.ai",
    },
    ...(totalReviews > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRatingNumeric.toFixed(1),
        reviewCount: totalReviews,
        bestRating: "10",
        worstRating: "1",
      },
    } : {}),
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "On‑demand Parq vožnja", value: true },
      { "@type": "LocationFeatureSpecification", name: "AI Camera Monitoring", value: true },
      { "@type": "LocationFeatureSpecification", name: "Stripe Secure Checkout", value: true },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://payparq.ai" },
      { "@type": "ListItem", position: 2, name: "Parking Locations", item: "https://payparq.ai/locations" },
      { "@type": "ListItem", position: 3, name: `Parking ${addressCity}`, item: hubUrl },
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
  const referencePoints = (() => {
    // Use location-specific landmarks if available
    if (hub.nearby_landmarks && hub.nearby_landmarks.length >= 3) {
      return {
        airport: { lat: hub.nearby_landmarks[0].latitude, lng: hub.nearby_landmarks[0].longitude, name: hub.nearby_landmarks[0].name },
        trogir: { lat: hub.nearby_landmarks[1].latitude, lng: hub.nearby_landmarks[1].longitude, name: hub.nearby_landmarks[1].name },
        marina: { lat: hub.nearby_landmarks[2].latitude, lng: hub.nearby_landmarks[2].longitude, name: hub.nearby_landmarks[2].name },
      };
    }
    // Fallback to hardcoded defaults
    return isBaskaVodaPuntaRataLocation
      ? {
          airport: { lat: 43.3687, lng: 16.9318, name: "Plaža Punta Rata (Brela)" },
          trogir: { lat: 43.3561, lng: 16.9502, name: "Plaža Baška Voda" },
          marina: { lat: 43.3559, lng: 16.9512, name: "Centar Baška Voda" },
        }
      : {
          airport: { lat: 43.5389, lng: 16.2976, name: "Aerodrom Kaštela" },
          trogir: { lat: 43.5157, lng: 16.2502, name: "Trogir centar" },
          marina: { lat: 43.5126, lng: 16.1112, name: "Closest Beach" },
        };
  })();
  const distanceToReferenceMeters = (targetLat: number, targetLng: number) => {
    if (typeof hub.latitude !== "number" || typeof hub.longitude !== "number") return null;
    const earthRadiusKm = 6371;
    const dLat = (targetLat - hub.latitude) * (Math.PI / 180);
    const dLon = (targetLng - hub.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(hub.latitude * (Math.PI / 180)) *
        Math.cos(targetLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c * 1000;
  };
  const formatDistance = (meters: number | null, fallback: string) => {
    if (meters == null || Number.isNaN(meters)) return fallback;
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };
  const distAirportDisplay = formatDistance(
    distanceToReferenceMeters(referencePoints.airport.lat, referencePoints.airport.lng),
    isBaskaVodaPuntaRataLocation ? "1.0 km" : "700 m",
  );
  const distTrogirDisplay = formatDistance(
    distanceToReferenceMeters(referencePoints.trogir.lat, referencePoints.trogir.lng),
    isBaskaVodaPuntaRataLocation ? "900 m" : "4.9 km",
  );
  const distMarinaDisplay = formatDistance(
    distanceToReferenceMeters(referencePoints.marina.lat, referencePoints.marina.lng),
    isBaskaVodaPuntaRataLocation ? "1.1 km" : "200 m",
  );
  const defaultFaq = [
    {
      q: isBaskaVodaPuntaRataLocation
        ? `Koliko je PayParq blizu Punta Rate i plaže Baška Voda?`
        : `Koliko je PayParq blizu zračne luke Split?`,
      a: isBaskaVodaPuntaRataLocation
        ? `Do plaže Punta Rata (Brela) stižete kratkom vožnjom, a do plaže i centra Baške Vode možete pješice.`
        : `Udaljenost pješice je oko 5 minuta, a moguć je i transfer koji traje manje od minute.`,
    },
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
    { q: `What happens if my flight is delayed?`, a: `For airport lots only: adjust your end time in the app or contact support — we'll help update your reservation.` },
    { q: `Je li cijena transparentna?`, a: `Da. Jasne satnice bez skrivenih naknada. Ukupno se prikazuje prije nego što potvrdite, uz dodani Stripeov trošak obrade transakcije.` },
    { q: `Mogu li naručiti prijevoz ili kupiti osiguranje s vaše stranice?`, a: `Da. Nakon što je vaša rezervacija potvrđena, bit ćete preusmjereni na uspješnu stranicu na kojoj možete dogovoriti Parq vožnju, kupiti osiguranje i preuzeti potvrdu o rezervaciji. Osiguranje je moguće aplicirati samo za verificirane korisnike, ovisno o lokaciji. <a href="/success" class="underline text-blue-600" target="_blank">Pogledajte demonstraciju stranice uspjeha</a>` },
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
        text: i.a.replace(/<[^>]*>/g, ""),
      },
    })),
  };

  const breakdownSubtotal = activeTab === 'reserve' ? reserveSubtotal : parkTaxiSubtotal;
  const breakdownServiceFee = activeTab === 'reserve' ? reserveServiceFee : parkTaxiServiceFee;
  const breakdownTotal = activeTab === 'reserve' ? reserveTotalPriceLabel : parkTaxiTotalPriceLabel;

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      {hideHeader ? null : <SiteHeader hideAnnouncementBar={hideAnnouncementBar} />}

      {/* Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShowBreakdown(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-72 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Price Breakdown</h3>
              <button onClick={() => setShowBreakdown(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatEur(breakdownSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-medium text-gray-900">{formatEur(breakdownServiceFee)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 pb-3 flex justify-between border-b">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{breakdownTotal}</span>
              </div>
            </div>
          </div>
        </div>
      )}
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
              <div className="flex flex-col items-end gap-2">
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
                  {loading ? "Processing..." : (checkIn && checkOut ? `Book Now (${reserveTotalPriceLabel})` : `Book Now (${priceLabel}/hr)`)}
                </Link>
                </div>
                {showMinChargeWalletExplainer ? (
                  <p className="text-[10px] text-black/65">{minChargeWalletExplainerText}</p>
                ) : null}
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
                  {showMinChargeWalletExplainer ? (
                    <p className="mt-1 text-center text-[10px] text-black/65">{minChargeWalletExplainerText}</p>
                  ) : null}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
                  {walkingDistanceLabel}
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
                    quality={100}
                    unoptimized={currentPhotoIsSupabase}
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
                        {Math.min(currentPhotoIndex + 1, effectivePhotoCount)} / {effectivePhotoCount}
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

              <div className="md:hidden w-full rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#5F3DFC]/20">
                      <Image
                        src={currentPhoto || "/Split_Airport_new_terminal_main_hall.jpg"}
                        alt="Domaćin Ivo"
                        fill
                        sizes="40px"
                        quality={100}
                        unoptimized={currentPhotoIsSupabase}
                        className="object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#5F3DFC] px-1 text-[8px] font-semibold text-white">★</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-black">Domaćin je Ivo</p>
                      <p className="text-[10px] text-black/60 leading-snug">Pošaljite poruku sada! Odgovara u manje od 5 minuta.</p>
                    </div>
                  </div>
                  <a
                    href={cityManagerMessageHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-[#5F3DFC]/25 bg-[#F8F6FF] px-3 py-1.5 text-[10px] font-semibold text-[#5F3DFC] hover:bg-[#F0EBFF] transition-colors whitespace-nowrap"
                  >
                    Poruka
                  </a>
                </div>
              </div>

              <div className="md:hidden bg-white rounded-3xl p-3 shadow-sm border border-gray-100 w-full">
                <button
                  type="button"
                  onClick={handleBook}
                  disabled={loading || !canSubmitCheckout}
                  className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-xl bg-[#5F3DFC] text-white text-sm font-semibold shadow-sm hover:bg-[#4330c4] transition-colors mb-3 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? "Processing..." : (activeTab === 'reserve' ? `Book Now (${priceLabel})` : "Book Now")}
                </button>
                {showMinChargeWalletExplainer ? (
                  <p className="mb-2 text-[10px] text-gray-500">{minChargeWalletExplainerText}</p>
                ) : null}
                {activeTab === 'reserve' ? (
                  <>
                    <div className="space-y-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">From</label>
                        <input
                          type="datetime-local"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          min={undefined}
                          className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-xs font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
                        <input
                          type="datetime-local"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || undefined}
                          className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-xs font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                        />
                      </div>
                    </div>
                    <p className="mb-2 text-[11px] text-gray-600">Napomena: Vožnju možete rezervirati nakon što rezervirate parking. Dostupna je Uber integracija.</p>
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                      <button
                        onClick={() => setActiveTab('reserve')}
                        className="flex-1 py-1 text-xs font-medium rounded-lg transition-all bg-white shadow-sm text-black"
                      >
                        Parking
                      </button>
                      <button
                        onClick={() => setActiveTab('park_now')}
                        className="hidden flex-1 py-1 text-xs font-medium rounded-lg transition-all text-gray-500 hover:text-black"
                      >
                        <span className="notranslate" translate="no">Park & Taxi</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-end">
                      <div className="p-2 w-full flex flex-col items-end gap-0">
                        <span className="font-semibold text-black" style={{ fontSize: '20px' }}>{reserveTotalPriceLabel}</span>
                        <span className="text-xs text-gray-500 border-b border-gray-400 pb-0.5">{t('Ukupno', locale)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 bg-yellow-100 rounded-md p-2" style={{ justifyContent: 'flex-end' }}>
                      <div className="flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-yellow-700 flex-shrink-0" />
                        <span className="text-xs font-semibold text-gray-900">{(() => { const s = hub.id.charCodeAt(hub.id.length - 1) % 3 + 1; return s === 1 ? '1 mjesto' : `${s} mjesta`; })()}</span>
                      </div>
                      <span className="text-xs text-gray-600">po ovoj cijeni</span>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3 text-xs text-gray-800">
                      <p className="font-semibold mb-1">Predlažemo da rezervirate odmah.</p>
                      <p>Ovdje imamo samo {(() => { const s = hub.id.charCodeAt(hub.id.length - 1) % 3 + 1; return s === 1 ? '1 mjesto' : `${s} mjesta`; })()} preostala mjesta tijekom vremena koje ste odabrali po ovoj cijeni.</p>
                    </div>
                  </>
                ) : (
                  <div className="mb-3">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-xl text-xs mb-3">
                      <strong className="notranslate" translate="no">Park & Taxi</strong>
                      <p className="mt-1 opacity-90">Parking + 2 vožnje su uključene. Početna vožnja počinje u vrijeme dolaska dok je povratna vožnja rezervirana u vrijeme odlaska. U aplikaciji možete pratiti dolazak vozača uživo. Potrebno je rezervirati min. 60 min unaprijed (samo tada je garantiran polazak).</p>
                    </div>
                    <div className="space-y-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">From</label>
                        <input
                          type="datetime-local"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          min={parkTaxiMinCheckIn}
                          className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-xs font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
                        <input
                          type="datetime-local"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || parkTaxiMinCheckIn}
                          className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-xs font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                        />
                      </div>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                      <button
                        onClick={() => setActiveTab('reserve')}
                        className="flex-1 py-1 text-xs font-medium rounded-lg transition-all text-gray-500 hover:text-black"
                      >
                        Parking
                      </button>
                      <button
                        onClick={() => setActiveTab('park_now')}
                        className="flex-1 py-1 text-xs font-medium rounded-lg transition-all bg-white shadow-sm text-black"
                      >
                        <span className="notranslate" translate="no">Park & Taxi</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-end">
                      <div className="p-2 w-full flex flex-col gap-0">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-gray-500">Price:</span>
                          <span className="font-semibold text-black" style={{ fontSize: '20px' }}>{parkTaxiTotalPriceLabel}</span>
                        </div>
                        <div className="flex justify-end -mt-3">
                          <button onClick={() => setShowBreakdown(true)}>
                            <span className="text-gray-500 font-medium text-[8px] border-b border-gray-400 pb-0.5">Međuzbroj</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {checkoutError ? <p className="mt-2 text-[11px] text-red-600">{checkoutError}</p> : null}
              </div>

              <div className="hidden md:block w-full rounded-2xl border border-black/10 bg-white p-3 md:p-4">
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border border-[#5F3DFC]/20">
                      <Image
                        src={currentPhoto || "/Split_Airport_new_terminal_main_hall.jpg"}
                        alt="Domaćin Ivo"
                        fill
                        sizes="40px"
                        quality={100}
                        unoptimized={currentPhotoIsSupabase}
                        className="object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#5F3DFC] px-1 text-[8px] font-semibold text-white">★</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-black">Domaćin je Ivo</p>
                      <p className="text-[10px] text-black/60 leading-snug">Pošaljite poruku sada! Odgovara u manje od 5 minuta.</p>
                    </div>
                  </div>
                  <a
                    href={cityManagerMessageHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full bg-[#F8F6FF] border border-[#5F3DFC]/20 px-4 py-1.5 text-[11px] font-semibold text-[#5F3DFC] hover:bg-[#F0EBFF] transition-colors whitespace-nowrap"
                  >
                    Poruka
                  </a>
                </div>
              </div>

              <div data-no-translate="true" className="w-full rounded-2xl border border-black/10 bg-white p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-xl border border-[#5F3DFC]/20 bg-[#F8F6FF] p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#5F3DFC] font-semibold">PayParq cjenik</p>
                    <div className="mt-2 space-y-1.5 text-xs text-black/85">
                      <div className="flex items-center justify-between"><span>Sati</span><span className="font-semibold">{formatEur(hourlyPrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Dan</span><span className="font-semibold">{formatEur(dailyPrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Mjesec</span><span className="font-semibold">{formatEur(monthlyPrice)}</span></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-[#FAFAFA] p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/70 font-semibold">Posebni Upiti</p>
                    <div className="mt-2 space-y-1.5 text-xs text-black/80">
                      <div className="flex items-center justify-between"><span className="notranslate" translate="no">Park & Taxi (Poruka)</span><span className="font-semibold">{formatEur(parkTaxiUnitPrice)}</span></div>
                      <div className="flex items-center justify-between"><span>Kamperi (Poruka)</span><span className="font-semibold">{formatEur(camperDailyPrice)}/dan</span></div>
                      <div className="flex items-center justify-between"><span>Autobusi (Poruka)</span><span className="font-semibold">{formatEur(busDailyPrice)}/dan</span></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full rounded-2xl border border-black/10 bg-white p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-[#5F3DFC]" aria-hidden="true">
                    <path d="M12 2c3.9 0 7 3.1 7 7 0 5.2-7 13-7 13S5 14.2 5 9c0-3.9 3.1-7 7-7Z" fill="currentColor" />
                    <circle cx="12" cy="9" r="2.8" fill="white" fillOpacity="0.95" />
                    <path d="M11.1 4.8a4.2 4.2 0 0 1 5.1.6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    <path d="M7.8 8.2a4.2 4.2 0 0 1 2.8-3.2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs md:text-sm font-semibold text-black">Street View & Photos ({streetAndPhotoCount})</p>
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
                    const photoIndex = idx;
                    const isActiveThumb = currentPhotoIndex === photoIndex;
                    return (
                      <button
                        key={`${photo}-${idx}`}
                        type="button"
                        onClick={() => setCurrentPhotoIndex(photoIndex)}
                        className={`relative aspect-square rounded-xl overflow-hidden border ${isActiveThumb ? "border-[#5F3DFC]" : "border-black/10"}`}
                        aria-label={`Photo ${idx + 1}`}
                      >
                        <Image
                          src={photo}
                          alt={`${locationName} photo ${idx + 1}`}
                          fill
                          quality={100}
                          unoptimized={isSupabaseStorageUrl(photo)}
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                  {hasLotCoords && (
                    <button
                      type="button"
                      onClick={() => setCurrentPhotoIndex(photos.length - 1)}
                      className={`relative aspect-square rounded-xl overflow-hidden border flex flex-col items-center justify-center bg-[#1a1a2e] ${currentPhotoIndex === photos.length - 1 ? "border-[#5F3DFC]" : "border-black/10"}`}
                      aria-label="Parking mapa"
                    >
                      <MapPin className="w-4 h-4 text-[#5F3DFC]" />
                      <span className="text-[8px] font-semibold text-[#5F3DFC] mt-0.5 leading-tight">Mapa</span>
                    </button>
                  )}
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
                        <div className="grid gap-4 md:grid-cols-3 max-w-6xl mx-auto">
                          {howItWorks.map((step, idx) => (
                            <div key={idx} className="rounded-2xl border border-black/10 bg-white p-5 md:p-6 text-black text-center flex h-full flex-col items-center justify-center">
                              <h3 className="text-sm font-semibold">{step.label}</h3>
                              <p className="mt-2 text-xs text-black/70">{step.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {hasLotCoords && (
                    <div className="rounded-2xl border border-black/10 bg-white text-black overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-4 text-left"
                        aria-expanded={openSections.spots}
                        onClick={() => setOpenSections((prev) => ({ ...prev, spots: !prev.spots }))}
                      >
                        <span className="inline-flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                          <span className="text-sm md:text-base font-semibold">Parking mapa</span>
                        </span>
                        {openSections.spots ? (
                          <Minus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        ) : (
                          <Plus className="w-5 h-5 text-[#5F3DFC] shrink-0" />
                        )}
                      </button>
                      {openSections.spots && (
                        <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3">
                          <p className="text-xs text-black/60">Satelitski prikaz parkirališta s točnom lokacijom mjesta.</p>
                          <div className="relative w-full h-[280px] md:h-[380px] rounded-2xl overflow-hidden border border-black/10">
                            <Suspense fallback={<div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center"><span className="text-white/50 text-xs">Učitavanje mape…</span></div>}>
                              <LotMap lat={hub.latitude as number} lng={hub.longitude as number} label={locationName} interactive={true} locationId={hub.id} boundary={(hub.verification_metadata?.boundary as Array<{lat:number;lng:number}> | undefined)} />
                            </Suspense>
                          </div>
                          <p className="text-[11px] text-black/40">Premium mjesta i numeracija spotova uskoro.</p>
                        </div>
                      )}
                    </div>
                  )}

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
                        <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3">
                          <div className="rounded-2xl border border-black/10 bg-white text-black p-4 md:p-5">
                            <p className="text-sm font-semibold">{item.value}</p>
                            <p className="text-xs text-black/70 mt-2">{item.description}</p>
                          </div>
                          {item.id === 'extras' && premiumSpots.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-black/60 uppercase tracking-wide">Premium parking spots</p>
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                {premiumSpots.map((spot) => (
                                  <div key={spot.id} className="rounded-xl border border-[#F59E0B]/40 bg-[#FFFBEB] p-3 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-black">{spot.label}</span>
                                      <span className="text-xs font-semibold text-[#F59E0B]">+{(spot.price_modifier_cents / 100).toFixed(2)} €</span>
                                    </div>
                                    <span className="text-[10px] text-black/50">Nadogradite nakon rezervacije</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[11px] text-black/45">Premium mjesta rezervirajte na stranici potvrde nakon plaćanja.</p>
                            </div>
                          )}
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
                      <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-6">
                        {(() => {
                          const pickup = hub.addons_config?.pickup_point as { lat?: number; lng?: number; label?: string } | null | undefined;
                          const hasPickup = !!(pickup?.lat && pickup?.lng);
                          const hasHub = !!(hub.latitude && hub.longitude);
                          return (
                            <>
                              {/* Map 1 — Hub / parking lot */}
                              <div className="space-y-2">
                                <div className="rounded-2xl border border-[#5F3DFC]/20 bg-[#F5F2FF] px-4 py-3 flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-[#5F3DFC] shrink-0" />
                                  <span className="text-sm font-semibold text-[#5F3DFC]">Parking lokacija</span>
                                </div>
                                <div className="relative w-full h-[240px] md:h-[360px] rounded-2xl border border-black/10 bg-white overflow-hidden">
                                  <iframe
                                    className="absolute inset-0 w-full h-full"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={
                                      hasHub
                                        ? `https://www.google.com/maps?q=${hub.latitude},${hub.longitude}&output=embed`
                                        : `https://www.google.com/maps?q=${encodeURIComponent(locationName)}&output=embed`
                                    }
                                  />
                                </div>
                              </div>

                              {/* Map 2 — Pick-Up / Drop-Off zone */}
                              {hasPickup && (
                                <div className="space-y-2">
                                  <div className="rounded-2xl border border-[#5F3DFC]/20 bg-[#F5F2FF] px-4 py-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Car className="w-4 h-4 text-[#5F3DFC] shrink-0" />
                                      <span className="text-sm font-semibold text-[#5F3DFC]">Pick-Up / Drop Off Zone</span>
                                      {pickup!.label && (
                                        <span className="text-xs text-[#5F3DFC]/70 truncate">· {pickup!.label}</span>
                                      )}
                                    </div>
                                    <a
                                      href={`https://www.google.com/maps?q=${pickup!.lat},${pickup!.lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-semibold text-[#5F3DFC] underline shrink-0"
                                    >
                                      Navigacija
                                    </a>
                                  </div>
                                  <div className="relative w-full h-[200px] rounded-2xl border border-black/10 bg-white overflow-hidden">
                                    <iframe
                                      className="absolute inset-0 w-full h-full"
                                      loading="lazy"
                                      referrerPolicy="no-referrer-when-downgrade"
                                      src={`https://www.google.com/maps?q=${pickup!.lat},${pickup!.lng}&output=embed`}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Map 3 — Combined route (both pins) */}
                              {hasHub && hasPickup && (
                                <div className="space-y-2">
                                  <div className="rounded-2xl border border-[#5F3DFC]/20 bg-[#F5F2FF] px-4 py-3 flex items-center gap-2">
                                    <Route className="w-4 h-4 text-[#5F3DFC] shrink-0" />
                                    <span className="text-sm font-semibold text-[#5F3DFC]">Ruta: parking → preuzimanje</span>
                                  </div>
                                  <div className="relative w-full h-[240px] md:h-[360px] rounded-2xl border border-black/10 bg-white overflow-hidden">
                                    <iframe
                                      className="absolute inset-0 w-full h-full"
                                      loading="lazy"
                                      referrerPolicy="no-referrer-when-downgrade"
                                      src={`https://www.google.com/maps?saddr=${hub.latitude},${hub.longitude}&daddr=${pickup!.lat},${pickup!.lng}&output=embed`}
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
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
                              <p className="text-sm font-semibold">{referencePoints.airport.name}</p>
                              <p className="text-xs text-black/70">{distAirportDisplay}</p>
                            </div>
                            <div className="px-2 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">Distance</p>
                              <p className="text-sm font-semibold">{referencePoints.trogir.name}</p>
                              <p className="text-xs text-black/70">{distTrogirDisplay}</p>
                            </div>
                            <div className="px-2 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-black/60">Distance</p>
                              <p className="text-sm font-semibold">{referencePoints.marina.name}</p>
                              <p className="text-xs text-black/70">{distMarinaDisplay}</p>
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
                            { q: `Udaljenost do ${referencePoints.airport.name}`, a: distAirportDisplay },
                            { q: `Udaljenost do ${referencePoints.trogir.name}`, a: distTrogirDisplay },
                            { q: `Udaljenost do ${referencePoints.marina.name}`, a: distMarinaDisplay },
                            { q: "Typical transfer time", a: travelTime },
                            { q: "Parking types", a: "Open‑air and covered bays" },
                            { q: "Sati", a: "24/7 operacije" },
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
                        {hasRealReviews ? (
                          <>
                            <div className="rounded-2xl border border-black/10 bg-white p-3 md:p-4 flex items-center gap-6">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.14em] text-black/60">Prosječna ocjena</p>
                                <p className="text-lg font-semibold text-black">{averageRating} / 10</p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.14em] text-black/60">{t('Ukupno recenzija', locale)}</p>
                                <p className="text-lg font-semibold text-black">{totalReviews}</p>
                              </div>
                            </div>
                            {hub.review_scores && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {[
                                  ['security', 'Sigurnost'], ['accessibility', 'Pristupačnost'],
                                  ['cleanliness', 'Čistoća'], ['staff', 'Osoblje'],
                                  ['value', 'Vrijednost'], ['location', 'Lokacija'],
                                ].map(([key, label]) => {
                                  const scores = hub.review_scores as Record<string, number>;
                                  const v = scores[key] ?? 0;
                                  const color = v >= 9 ? '#16a34a' : v >= 7 ? '#5F3DFC' : v >= 5 ? '#f59e0b' : '#dc2626';
                                  return (
                                    <div key={key} className="rounded-xl border border-black/10 bg-[#FBFAFF] px-3 py-2 flex items-center justify-between">
                                      <span className="text-[11px] text-black/60">{label}</span>
                                      <span className="text-[14px] font-black" style={{ color }}>{v > 0 ? v.toFixed(1) : '—'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="rounded-2xl border border-black/10 bg-[#FBFAFF] p-4 md:p-5 text-center">
                            <p className="text-sm font-semibold text-black/70">New Object</p>
                            <p className="text-xs text-black/40 mt-1">Ova lokacija još nema recenzija. Budite prvi koji će ocijeniti iskustvo.</p>
                          </div>
                        )}
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
                                  <span className="text-left">{translateText(i.q, locale)}</span>
                                </button>
                                {open ? <div className="pb-3 pl-7 text-sm text-black/75" dangerouslySetInnerHTML={{ __html: translateText(i.a, locale) }} /> : null}
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
                  Parking
                </button>
                <button
                  onClick={() => setActiveTab('park_now')}
                  className={`hidden flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'park_now' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span className="notranslate" translate="no">Park & Taxi</span>
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
                        min={undefined}
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
                        min={checkIn || undefined}
                        className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                      />
                    </div>
                  </div>
                  <p className="mb-3 text-xs text-gray-600">Napomena: Vožnju možete rezervirati nakon što rezervirate parking. Dostupna je Uber integracija.</p>
                  
                  <div className="border-t border-gray-100 mb-4 pt-3 flex justify-end">
                    <div className="p-3 w-full flex flex-col gap-0">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-gray-500">Price:</span>
                        <span className="font-semibold text-black" style={{ fontSize: '20px' }}>{reserveTotalPriceLabel}</span>
                      </div>
                      <div className="flex justify-end -mt-3">
                        <button onClick={() => setShowBreakdown(true)}>
                          <span className="text-gray-500 font-medium text-[10px] border-b border-gray-400 pb-0.5">Međuzbroj</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mb-4">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-xl text-xs mb-3">
                    <strong className="notranslate" translate="no">Park & Taxi</strong>
                    <p className="mt-1 opacity-90">
                      Parking + 2 vožnje su uključene. Početna vožnja počinje u vrijeme dolaska dok je povratna vožnja rezervirana u vrijeme odlaska. U aplikaciji možete pratiti dolazak vozača uživo. Potrebno je rezervirati min. 60 min unaprijed (samo tada je garantiran polazak).
                    </p>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        From
                      </label>
                      <input
                        type="datetime-local"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={parkTaxiMinCheckIn}
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
                        min={checkIn || parkTaxiMinCheckIn}
                        className="w-full bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm font-medium text-black focus:ring-2 focus:ring-[#5F3DFC]"
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 mb-4 pt-3 flex justify-end">
                    <div className="p-3 w-full flex flex-col gap-0">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-gray-500">Price:</span>
                        <span className="font-semibold text-black" style={{ fontSize: '20px' }}>{parkTaxiTotalPriceLabel}</span>
                      </div>
                      <div className="flex justify-end -mt-3">
                        <button onClick={() => setShowBreakdown(true)}>
                          <span className="text-gray-500 font-medium text-[10px] border-b border-gray-400 pb-0.5">Međuzbroj</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleBook}
                disabled={loading || !canSubmitCheckout}
                className={`w-full block text-center font-bold py-3 rounded-xl hover:opacity-90 transition-colors shadow-lg bg-[#5F3DFC] text-white shadow-indigo-200 ${
                  loading || !canSubmitCheckout ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? "Processing..." : (activeTab === 'reserve' ? "Book Now" : "Book Now")}
              </button>
              {showMinChargeWalletExplainer ? (
                <p className="mt-2 text-[10px] text-center text-gray-500">{minChargeWalletExplainerText}</p>
              ) : null}
              {checkoutError ? <p className="mt-2 text-xs text-red-600 text-center">{checkoutError}</p> : null}
              
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
