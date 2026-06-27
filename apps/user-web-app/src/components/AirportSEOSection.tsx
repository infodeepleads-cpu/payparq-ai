'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';

interface LocationSEOSectionProps {
  location: string;
  locationName: string;
  city: string;
  region: string;
  nearbyAreas: string[];
}

const SEO_CONTENT_HR: Record<string, any> = {
  split: {
    title: "Sve što trebate znati o parkiranju blizu Aerodroma Split",
    intro: "Ne dopustite da parkiranje pokvari vaše putovanje. <strong>PayParqova mreža rezervabilnih parkirnih mjesta</strong> - uključujući privatna parkirališta i osigurane objekte - dovodi vas bliže Aerodromu Split. <strong>Rezervacijom unaprijed</strong> osiguravate najbolju cijenu i slobodno mjesto.",
    paragraphs: [
      "<strong>PayParq je vodeće hrvatsko rješenje za parkiranje</strong>, kojemu vjeruje više od <strong>100.000+ vozača</strong>. Naša mreža uključuje <strong>aerodromska parkirišta, privatna parkirališta i osigurana dvorišta</strong>. Bilo da letite iz Aerodroma Split ili trebate kratkoročno ili dugoročno parkiranje, PayParq vas pokriva.",
      "Naš <strong>inteligentni tražilac</strong> omogućuje vam lako pronalaženje najboljeg parkirnog mjesta za Aerodrom Split - birajte prema <strong>najnižoj cijeni, najbližoj lokaciji</strong> ili dodatnim značajkama poput <strong>CCTV-a, punjenja EV vozila ili natkrivenog parkinga</strong>.",
      "Rezervirajte parkiranje na Aerodromu Split unaprijed - i imat ćete <strong>pouzdano mjesto koje čeka kad stignete</strong>. Dostupno za <strong>kratke ili dugoročne boravke, uključujući noćno parkiranje</strong>.",
      "PayParq nudi više od tradicionalnih parkirališta. Pružamo pristup <strong>pristupačnim alternativama poput osiguranih privatnih dvorišta</strong>, često bliže Aerodromu Split i po boljim cijenama."
    ],
    faqs: [
      { question: "Zašto rezervirati parkiranje unaprijed blizu Aerodroma Split?", answer: "<strong>Rezervacija unaprijed jamči vaše mjesto</strong>, osigurava najbolje cijene i eliminira stres pronalaska parkinga. PayParqov <strong>proces rezervacije traje samo 2 minute</strong>." },
      { question: "Nudi li PayParq sigurno parkiranje blizu Aerodroma Split?", answer: "Apsolutno! PayParq pruža <strong>provjerene sigurnosne opcije</strong>, uključujući mjesta s <strong>CCTV-om, ograđenim prostorima i privatnim dvorištima</strong>." },
      { question: "Koliko košta parkiranje blizu Aerodroma Split?", answer: "PayParq nudi <strong>konkurentne cijene</strong> od samo <strong>€2-5 dnevno</strong>. Koristite našu pretragu kako biste pronašli cijene koje odgovaraju vašem budžetu." },
      { question: "Koje opcije parkinga PayParq nudi blizu Aerodroma Split?", answer: "Nudimo <strong>natkriveno parkiranje, otvorene prostore, objekte s 24/7 nadzorom, EV punionice</strong> i pristupačno parkiranje." },
      { question: "Ima li pristupačnog parkinga blizu Aerodroma Split?", answer: "Da! Naša mreža uključuje <strong>privatna dvorišta koja su često 50-70% jeftinija</strong> od tradicionalnih aerodromskih parkirišta." }
    ]
  },
  zadar: {
    title: "Sve što trebate znati o parkiranju blizu Aerodroma Zadar",
    intro: "Osigurajte parkirno mjesto na Aerodromu Zadar uz PayParq. Naša <strong>mreža rezervabilnih mjesta</strong> osigurava vam lak pristup aerodromu. <strong>Rezervirajte unaprijed</strong> i zaključajte konkurentne cijene.",
    paragraphs: [
      "PayParq je <strong>pouzdana hrvatska platforma za parkiranje</strong>, kojoj vjeruje više od <strong>100.000+ vozača</strong>. Od kratkih dolazaka do tjednih odmora, PayParq pojednostavljuje vaše putovanje.",
      "Naš <strong>napredni sustav pretrage</strong> omogućuje pronalaženje parkinga na Aerodromu Zadar prema vašim preferencijama - <strong>pristupačnost, blizina, sigurnosne značajke</strong> ili EV punjenje.",
      "Rezervirajte parkiranje na Aerodromu Zadar za samo nekoliko minuta. <strong>Zajamčena mjesta osiguravaju mirno putovanje</strong>.",
      "Osim tradicionalnih parkirišta, PayParq vas povezuje s <strong>privatnim alternativama blizu Aerodroma Zadar</strong> koje često nude bolju vrijednost."
    ],
    faqs: [
      { question: "Zašto rezervirati parkiranje unaprijed blizu Aerodroma Zadar?", answer: "<strong>Rezervacija unaprijed jamči vaše mjesto</strong> i osigurava najbolje dostupne cijene. PayParq to čini jednostavnim." },
      { question: "Nudi li PayParq sigurno parkiranje blizu Aerodroma Zadar?", answer: "Da, sva PayParq mjesta su <strong>provjerena i sigurna</strong>. Birajte između opcija s <strong>CCTV-om, ograđenim pristupom i 24/7 nadzorom</strong>." },
      { question: "Koliko košta parkiranje blizu Aerodroma Zadar?", answer: "Parkiranje na Aerodromu Zadar kreće od <strong>€2-5 dnevno</strong>." },
      { question: "Koje opcije parkinga PayParq nudi blizu Aerodroma Zadar?", answer: "Naša mreža uključuje <strong>natkriveno parkiranje, otvorene prostore i nadzirane objekte</strong>." },
      { question: "Mogu li pronaći pristupačno dugoročno parkiranje blizu Aerodroma Zadar?", answer: "Apsolutno! PayParq nudi <strong>značajne popuste za dulje parkiranje</strong> po cijenama nižim od aerodromskih objekata." }
    ]
  },
  zagreb: {
    title: "Sve što trebate znati o parkiranju blizu Aerodroma Zagreb",
    intro: "Pronađite idealno parkirno mjesto blizu Aerodroma Zagreb uz PayParq. Naša <strong>mreža rezervabilnih mjesta</strong> uključuje privatna parkirališta i osigurane objekte. <strong>Rezervirajte unaprijed</strong> za best cijene.",
    paragraphs: [
      "PayParq je <strong>vodeća hrvatska aplikacija za parkiranje</strong>, kojoj vjeruje <strong>100.000+ vozača</strong>. Naša raznovrsna mreža blizu Aerodroma Zagreb nudi <strong>sigurno, pristupačno i dostupno parkiranje</strong>.",
      "Koristite <strong>PayParqovu inteligentnu pretragu</strong> za pronalaženje parkinga na Aerodromu Zagreb koji odgovara vašim potrebama - <strong>najniža cijena, najbliža lokacija, natkrivena zaštita, EV punjenje</strong>.",
      "Rezervacija parkinga na Aerodromu Zagreb traje samo <strong>2 minute</strong>. Uživajte u <strong>zajamčenoj dostupnosti i trenutnoj potvrdi</strong>.",
      "PayParq nudi pristup <strong>privatnim dvorištima i stambenim parkirnim mjestima blizu Aerodroma Zagreb</strong> po boljim cijenama i blizini terminala."
    ],
    faqs: [
      { question: "Zašto rezervirati parkiranje unaprijed blizu Aerodroma Zagreb?", answer: "<strong>Rezervacija unaprijed jamči vaše parkirno mjesto</strong> i osigurava bolje cijene. PayParqov <strong>jednostavan proces rezervacije traje samo nekoliko minuta</strong>." },
      { question: "Nudi li PayParq sigurno parkiranje blizu Aerodroma Zagreb?", answer: "Da! Svaka PayParq opcija je <strong>temeljito provjerena</strong>. Birajte između mjesta s <strong>CCTV nadzorom, ograđenom sigurnošću i non-stop nadzorom</strong>." },
      { question: "Koliko košta parkiranje blizu Aerodroma Zagreb?", answer: "Parkiranje blizu Aerodroma Zagreb kreće od <strong>€2-5 dnevno</strong> s popustima za dulje boravke." },
      { question: "Koje vrste parkinga PayParq nudi blizu Aerodroma Zagreb?", answer: "Nudimo <strong>natkriveno parkiranje, otvorene prostore, nadzirane objekte, EV punionice</strong> i pristupačno parkiranje." },
      { question: "Gdje mogu pronaći jeftino parkiranje blizu Aerodroma Zagreb?", answer: "PayParq se specijalizira za <strong>pristupačne alternative</strong>, uključujući <strong>privatna dvorišta obično 50-70% jeftinija</strong> od tradicionalnih aerodromskih parkirišta." }
    ]
  },
  dubrovnik: {
    title: "Sve što trebate znati o parkiranju blizu Aerodroma Dubrovnik",
    intro: "Otkrijte pouzdano parkiranje blizu Aerodroma Dubrovnik uz PayParq. Naša <strong>platforma vas povezuje s rezervabilnim mjestima</strong> u sigurnim parkiralištima. <strong>Osigurajte svoje mjesto unaprijed</strong> za best cijene.",
    paragraphs: [
      "PayParq je <strong>pouzdano rješenje za parkiranje za hrvatske putnike</strong>, koje koristi <strong>100.000+ vozača</strong> za prikladno parkiranje blizu Aerodroma Dubrovnik.",
      "PayParqov <strong>pametni tražilac</strong> pomaže vam pronaći savršeno parkiranje na Aerodromu Dubrovnik - filtrirajte po <strong>cijeni, udaljenosti, amenitijima poput natkrivenih mjesta, EV punjenja ili 24/7 sigurnosnog nadzora</strong>.",
      "Rezervirajte parkiranje na Aerodromu Dubrovnik za samo <strong>2 minute</strong>. Primite <strong>trenutnu potvrdu i fleksibilno otkazivanje</strong>.",
      "Osim konvencionalnog aerodromskog parkinga, PayParq vas povezuje s <strong>privatnim alternativama blizu Aerodroma Dubrovnik</strong> po znatno nižim cijenama."
    ],
    faqs: [
      { question: "Zašto rezervirati parkiranje unaprijed blizu Aerodroma Dubrovnik?", answer: "<strong>Rezervacija unaprijed jamči vaše mjesto</strong> i osigurava bolje cijene. PayParqova <strong>rezervacija traje manje od 2 minute</strong>." },
      { question: "Nudi li PayParq sigurno parkiranje blizu Aerodroma Dubrovnik?", answer: "U potpunosti! Sva PayParq mjesta su <strong>provjerena za sigurnost</strong>. Birajte opcije s <strong>CCTV-om, sigurnim ulazima i 24/7 nadzorom</strong>." },
      { question: "Koliko košta parkiranje blizu Aerodroma Dubrovnik?", answer: "Parkiranje na Aerodromu Dubrovnik kreće od <strong>€2-5 dnevno</strong>. Dulje boravke nagrađujemo posebnim cijenama." },
      { question: "Koje opcije parkinga PayParq nudi blizu Aerodroma Dubrovnik?", answer: "Naša mreža uključuje <strong>natkriveno parkiranje, nadzirane objekte, pristupačno parkiranje</strong> i <strong>EV punionice</strong>." },
      { question: "Mogu li pronaći pristupačno dugoročno parkiranje blizu Aerodroma Dubrovnik?", answer: "Da! PayParqova <strong>privatna parkirna mreža nudi značajne uštedine</strong> za dulje boravke - često <strong>50-70% manje</strong> od standardnih aerodromskih objekata." }
    ]
  }
};

function generateContentHR(locationName: string) {
  return {
    title: `Sve što trebate znati o parkiranju blizu ${locationName}`,
    intro: `Osigurajte parkirno mjesto na ${locationName} uz PayParq. Naša <strong>mreža rezervabilnih mjesta</strong> osigurava vam prikladan pristup. <strong>Rezervirajte unaprijed</strong> i zaključajte konkurentne cijene.`,
    paragraphs: [
      `PayParq je pouzdana hrvatska platforma za parkiranje s mrežom koja poslužuje više od <strong>100.000+ kupaca</strong>. Od kratkih dolazaka do tjednih odmora, PayParq pojednostavljuje vaše putovanje blizu ${locationName}.`,
      `Naš <strong>napredni sustav pretrage</strong> omogućuje pronalaženje parkinga na ${locationName} prema vašim preferencijama - <strong>pristupačnost, blizina, sigurnosne značajke</strong> ili EV punjenje.`,
      `Rezervirajte parkiranje na ${locationName} za samo nekoliko minuta. Naša <strong>zajamčena mjesta osiguravaju mirno putovanje</strong>.`,
      `Osim tradicionalnih parkirišta, PayParq vas povezuje s <strong>sigurnim privatnim alternativama blizu ${locationName}</strong> koje često nude bolju vrijednost.`,
    ],
    faqs: [
      { question: `Zašto rezervirati parkiranje unaprijed blizu ${locationName}?`, answer: `<strong>Rezervacija unaprijed jamči vaše mjesto</strong>, osigurava best cijene i eliminira stres. PayParqov <strong>proces rezervacije traje samo 2 minute</strong>.` },
      { question: `Nudi li PayParq sigurno parkiranje blizu ${locationName}?`, answer: `Apsolutno! PayParq pruža <strong>provjerene sigurnosne opcije</strong> s <strong>CCTV-om, ograđenim objektima i privatnim dvorištima</strong>.` },
      { question: `Koliko košta parkiranje blizu ${locationName}?`, answer: `PayParq nudi <strong>konkurentne cijene</strong> od samo <strong>€2-5 dnevno</strong>.` },
      { question: `Koje opcije parkinga PayParq nudi blizu ${locationName}?`, answer: `Nudimo <strong>natkriveno parkiranje, otvorene prostore, 24/7 nadzirane objekte, EV punionice</strong> i pristupačno parkiranje.` },
      { question: `Mogu li pronaći pristupačno dugoročno parkiranje blizu ${locationName}?`, answer: `Da! Naša mreža uključuje <strong>privatna dvorišta koja su često 50-70% jeftinija</strong> od tradicionalnih aerodromskih parkirišta.` },
    ],
  };
}

const SEO_CONTENT: Record<string, any> = {
  split: {
    title: "Everything you need to know about parking near Split Airport",
    intro: "Don't let parking ruin your airport journey. <strong>PayParq's network of reservable parking spaces</strong> - including private car parks, driveways, and secure facilities - get you closer to Split Airport. By <strong>booking in advance</strong>, you lock in the best price and secure your space before you've even set off.",
    paragraphs: [
      "<strong>PayParq is Croatia's leading parking solution</strong>, trusted by over <strong>100,000+ drivers</strong> to help them find, book and pay for parking. Our vast network of parking spaces gets you closer to where you need to be - including <strong>airport parking, private car parks, and secure driveways</strong>. Whether you're flying out of Split Airport or need short-term or long-term parking, PayParq has you covered.",
      "Our <strong>intelligent search engine</strong> allows you to easily find the best parking spaces for Split Airport, letting you choose based on your needs - whether that's the <strong>cheapest option, nearest location</strong>, or spaces with extra features like <strong>CCTV, EV charging, or covered parking</strong>.",
      "Book your Split Airport parking in advance through our website or app - and you'll have a <strong>reliable space waiting for you when you arrive</strong>. Our parking spaces are available for <strong>short stays or long-term parking, including overnight options</strong>. Whether you're catching an early morning flight or returning late, find the space that suits your needs best.",
      "PayParq offers more than just traditional car parks. We provide access to <strong>affordable alternatives like secure private driveways and residential parking</strong>, often much nearer to Split Airport and at better prices than typical airport parking facilities. For overnight stays, enjoy <strong>peace of mind knowing your car is secure at a fraction of standard rates</strong>."
    ],
    faqs: [
      {
        question: "Why book parking in advance near Split Airport?",
        answer: "<strong>Booking in advance guarantees your space</strong>, ensures you get the best rates, and eliminates the stress of finding parking on arrival. PayParq's <strong>2-minute booking process</strong> means you can reserve your spot before you even leave home."
      },
      {
        question: "Does PayParq offer secure parking near Split Airport?",
        answer: "Absolutely! PayParq provides <strong>verified secure parking options</strong>, including spaces with <strong>CCTV, gated facilities, and private driveways</strong>. All our hosts are vetted to ensure your vehicle's safety throughout your journey."
      },
      {
        question: "How much is parking near Split Airport?",
        answer: "PayParq offers <strong>competitive pricing</strong> for Split Airport parking, with options starting from as low as <strong>€2-5 per day</strong>. Prices vary based on location, facilities, and booking duration. Use our search to find prices that fit your budget."
      },
      {
        question: "What parking options does PayParq offer near Split Airport?",
        answer: "We offer a <strong>wide range of options</strong> including <strong>covered parking, open-air spaces, 24/7 monitored facilities, EV charging stations</strong>, and accessible parking for guests with mobility needs."
      },
      {
        question: "Is there affordable parking near Split Airport?",
        answer: "Yes! PayParq specializes in finding <strong>affordable parking alternatives</strong>. Our network includes <strong>private driveways and residential parking that are often 50-70% cheaper</strong> than traditional airport parking, without compromising on security."
      }
    ]
  },
  zadar: {
    title: "Everything you need to know about parking near Zadar Airport",
    intro: "Secure your parking spot at Zadar Airport with PayParq. Our <strong>reservable parking network</strong> - including private car parks and secure facilities - ensures convenient access to the airport. <strong>Book in advance</strong> to lock in competitive prices and guarantee your space.",
    paragraphs: [
      "PayParq is <strong>Croatia's trusted parking platform</strong>, helping drivers find perfect parking solutions near Zadar Airport. Our extensive network serves over <strong>100,000+ customers</strong> with reliable, secure, and affordable parking options. From short airport drop-offs to week-long vacation parking, PayParq simplifies your journey.",
      "Our <strong>advanced search system</strong> lets you find Zadar Airport parking tailored to your preferences - whether you prioritize <strong>affordability, proximity, security features</strong>, or convenient amenities like <strong>EV charging and 24/7 monitoring</strong>.",
      "Reserve your Zadar Airport parking in minutes through our platform. Our <strong>guaranteed spaces ensure you arrive without worry</strong>, with flexible options for short-term visits or extended parking during vacations.",
      "Beyond traditional airport facilities, PayParq connects you with <strong>secure private parking alternatives near Zadar Airport</strong>. These options often offer better value and sometimes even closer proximity to the terminal than conventional car parks."
    ],
    faqs: [
      {
        question: "Why book parking in advance near Zadar Airport?",
        answer: "<strong>Advance booking guarantees your space</strong>, secures the best available rates, and eliminates arrival-day stress. PayParq makes it simple with our <strong>quick online booking system</strong>."
      },
      {
        question: "Does PayParq offer secure parking near Zadar Airport?",
        answer: "Yes, all PayParq spaces near Zadar Airport are <strong>vetted and secure</strong>. Choose from options with <strong>CCTV, gated access, and 24/7 monitoring</strong> for complete peace of mind."
      },
      {
        question: "How much is parking near Zadar Airport?",
        answer: "Zadar Airport parking through PayParq starts from <strong>€2-5 per day</strong>, with competitive rates for longer stays. Browse options to find pricing that suits your budget."
      },
      {
        question: "What parking options does PayParq offer near Zadar Airport?",
        answer: "Our network includes <strong>covered parking, open spaces, monitored facilities</strong>, and accessible parking for all needs."
      },
      {
        question: "Can I find affordable long-term parking near Zadar Airport?",
        answer: "Absolutely! PayParq offers <strong>significant discounts for extended parking</strong>. Our private parking alternatives are ideal for week-long or longer stays at <strong>rates much lower than airport facilities</strong>."
      }
    ]
  },
  zagreb: {
    title: "Everything you need to know about parking near Zagreb Airport",
    intro: "Find your ideal parking spot near Zagreb Airport with PayParq. Our <strong>network of reservable spaces</strong> includes private car parks and secure facilities. <strong>Book ahead</strong> to enjoy the best rates and guaranteed parking availability.",
    paragraphs: [
      "PayParq is <strong>Croatia's premier parking app</strong>, trusted by <strong>100,000+ drivers</strong> for convenient airport parking solutions. Our diverse network near Zagreb Airport offers <strong>secure, affordable, and accessible parking</strong> for every traveler - from quick trips to extended stays.",
      "Use <strong>PayParq's intelligent search</strong> to discover Zagreb Airport parking that matches your specific needs - <strong>lowest price, closest location, covered protection, EV charging</strong>, or wheelchair accessible spaces.",
      "Booking your Zagreb Airport parking through PayParq takes just <strong>2 minutes</strong>. Enjoy <strong>guaranteed availability, real-time confirmation</strong>, and flexible cancellation options for worry-free travel planning.",
      "PayParq goes beyond traditional parking facilities, offering access to <strong>private driveways and residential parking near Zagreb Airport</strong>. These alternatives often provide better value and closer proximity to the terminal, with <strong>excellent security standards</strong>."
    ],
    faqs: [
      {
        question: "Why book parking in advance near Zagreb Airport?",
        answer: "<strong>Advance booking guarantees your parking space</strong>, locks in better rates, and ensures stress-free airport arrival. PayParq's <strong>simple booking process takes just minutes</strong>."
      },
      {
        question: "Does PayParq offer secure parking near Zagreb Airport?",
        answer: "Yes! Every PayParq parking option is <strong>thoroughly vetted</strong>. Choose from spaces with <strong>CCTV surveillance, gated security, and round-the-clock monitoring</strong>."
      },
      {
        question: "How much is parking near Zagreb Airport?",
        answer: "Parking near Zagreb Airport through PayParq costs from <strong>€2-5 daily</strong>, with bulk discounts for extended parking. Compare options to find your best rate."
      },
      {
        question: "What types of parking does PayParq offer near Zagreb Airport?",
        answer: "We offer <strong>covered parking, open-air spaces, monitored facilities, EV charging stations</strong>, and accessible parking for guests with mobility requirements."
      },
      {
        question: "Where can I find cheap parking near Zagreb Airport?",
        answer: "PayParq specializes in <strong>affordable parking alternatives</strong>, including <strong>private driveways typically 50-70% cheaper</strong> than traditional airport parking while maintaining security standards."
      }
    ]
  },
  dubrovnik: {
    title: "Everything you need to know about parking near Dubrovnik Airport",
    intro: "Discover reliable parking near Dubrovnik Airport with PayParq. Our <strong>platform connects you with reservable spaces</strong> in secure car parks and private facilities. <strong>Secure your spot in advance</strong> for the best rates and guaranteed availability.",
    paragraphs: [
      "PayParq is the <strong>trusted parking solution for Croatian travelers</strong>, serving <strong>100,000+ drivers</strong> with convenient, secure, and affordable parking near Dubrovnik Airport. Whether you need short-term airport parking or week-long vacation storage, PayParq delivers <strong>reliable solutions</strong>.",
      "PayParq's <strong>smart search engine</strong> helps you find the perfect Dubrovnik Airport parking - filter by <strong>price, distance, amenities like covered spaces, EV charging, or 24/7 security monitoring</strong>.",
      "Reserve your Dubrovnik Airport parking in just <strong>2 minutes</strong> via our website or mobile app. Receive <strong>instant confirmation, enjoy flexible cancellation</strong>, and know your space is waiting when you arrive.",
      "Beyond conventional airport parking, PayParq connects you with <strong>secure private parking alternatives near Dubrovnik Airport</strong>. These options often cost significantly less and may be closer to the terminal, with <strong>verified host security</strong>."
    ],
    faqs: [
      {
        question: "Why book parking in advance near Dubrovnik Airport?",
        answer: "<strong>Advance booking guarantees your space</strong>, secures better rates, and eliminates parking day stress. PayParq's <strong>streamlined booking takes under 2 minutes</strong>."
      },
      {
        question: "Does PayParq offer secure parking near Dubrovnik Airport?",
        answer: "Completely! All PayParq spaces are <strong>vetted for security</strong>. Choose from options featuring <strong>CCTV, secure gates, and 24/7 monitoring</strong> for peace of mind."
      },
      {
        question: "How much is parking near Dubrovnik Airport?",
        answer: "Dubrovnik Airport parking via PayParq starts at <strong>€2-5 daily</strong>. Longer stays qualify for special rates. Browse options to find your ideal price point."
      },
      {
        question: "What parking options does PayParq offer near Dubrovnik Airport?",
        answer: "Our network includes <strong>covered parking, monitored facilities, accessible parking</strong> for guests with disabilities, and <strong>EV charging options</strong>."
      },
      {
        question: "Can I find affordable long-term parking near Dubrovnik Airport?",
        answer: "Yes! PayParq's <strong>private parking network offers substantial savings</strong> for extended stays - often <strong>50-70% less</strong> than standard airport facilities with comparable security."
      }
    ]
  }
};

function generateContent(locationName: string, city: string, region: string) {
  return {
    title: `Everything you need to know about parking near ${locationName}`,
    intro: `Secure your parking spot at ${locationName} with PayParq. Our <strong>reservable parking network</strong> - including private car parks and secure facilities - ensures convenient access. <strong>Book in advance</strong> to lock in competitive prices and guarantee your space.`,
    paragraphs: [
      `PayParq is Croatia's trusted parking platform, helping <strong>100,000+ drivers</strong> find, book and pay for parking. Our extensive network serves over <strong>100,000+ customers with reliable, secure, and affordable parking options</strong>. From short airport drop-offs to week-long vacation parking, PayParq simplifies your journey near ${locationName}.`,
      `Our <strong>advanced search system</strong> lets you find ${locationName} parking tailored to your preferences - whether you prioritize <strong>affordability, proximity, security features</strong>, or convenient amenities like <strong>CCTV monitoring, EV charging and 24/7 access</strong>.`,
      `Reserve your ${locationName} parking in minutes through our platform. Our <strong>guaranteed spaces ensure you arrive without worry</strong>, with flexible options for <strong>short-term visits or extended parking during vacations</strong>. Whether you're catching an early flight or returning late, find the space that suits you best.`,
      `Beyond traditional airport facilities, PayParq connects you with <strong>secure private parking alternatives near ${locationName}</strong>. These options often offer <strong>better value and sometimes even closer proximity</strong> than conventional car parks.`,
    ],
    faqs: [
      {
        question: `Why book parking in advance near ${locationName}?`,
        answer: `<strong>Booking in advance guarantees your space</strong>, ensures you get the best rates, and eliminates the stress of finding parking on arrival. PayParq's <strong>2-minute booking process</strong> means you can reserve your spot before you even leave home.`,
      },
      {
        question: `Does PayParq offer secure parking near ${locationName}?`,
        answer: `Absolutely! PayParq provides <strong>verified secure parking options</strong>, including spaces with <strong>CCTV, gated facilities, and private driveways</strong>. All our hosts are vetted to ensure your vehicle's safety throughout your stay.`,
      },
      {
        question: `How much is parking near ${locationName}?`,
        answer: `PayParq offers <strong>competitive pricing</strong> for ${locationName} parking, with options starting from as low as <strong>€2-5 per day</strong>. Prices vary based on location, facilities, and booking duration. Use our search to find prices that fit your budget.`,
      },
      {
        question: `What parking options does PayParq offer near ${locationName}?`,
        answer: `We offer a <strong>wide range of options</strong> including <strong>covered parking, open-air spaces, 24/7 monitored facilities, EV charging stations</strong>, and accessible parking for guests with mobility needs.`,
      },
      {
        question: `Can I find affordable long-term parking near ${locationName}?`,
        answer: `Yes! PayParq specializes in finding <strong>affordable parking alternatives</strong>. Our network includes <strong>private driveways and residential parking that are often 50-70% cheaper</strong> than traditional airport parking, without compromising on security.`,
      },
    ],
  };
}

export function AirportSEOSection({ location, locationName, city, region, nearbyAreas }: LocationSEOSectionProps) {
  const { locale } = useLocale();
  const contentMap = locale === 'hr' ? SEO_CONTENT_HR : SEO_CONTENT;
  const fallback = locale === 'hr' ? generateContentHR(locationName) : generateContent(locationName, city, region);
  const content = contentMap[location] || fallback;
  const faqTitle = locale === 'hr' ? 'Česta pitanja' : 'Frequently Asked Questions';
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <section className="w-full px-6 md:px-12 py-16 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-black mb-8 leading-tight">
          {content.title}
        </h1>

        {/* Intro */}
        <p className="text-lg text-black/70 mb-12 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: content.intro }} />
        </p>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Left Side - About Location */}
          <div className="space-y-6">
            {content.paragraphs.map((para: string, idx: number) => (
              <p key={idx} className="text-base text-black/65 leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: para }} />
              </p>
            ))}
          </div>

          {/* Right Side - FAQ Accordion */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-black mb-6">{faqTitle}</h2>

            <div className="space-y-4">
              {content.faqs.map((faq: any, idx: number) => (
                <div key={idx} className="border border-black/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition text-left"
                  >
                    <h3 className="font-semibold text-black text-sm pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      size={20}
                      className={`flex-shrink-0 text-black/60 transition-transform ${
                        openFAQ === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openFAQ === idx && (
                    <div className="px-4 py-4 border-t border-black/10 bg-black/2">
                      <p className="text-sm text-black/65 leading-relaxed">
                        <span dangerouslySetInnerHTML={{ __html: faq.answer }} />
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
