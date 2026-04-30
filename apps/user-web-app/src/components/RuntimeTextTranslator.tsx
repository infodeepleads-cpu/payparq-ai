"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";

const translationCache = new Map<string, string>();
const pendingCache = new Map<string, Promise<string>>();
const TRANSLATE_BATCH_SIZE = 200;
const TRANSLATE_BATCH_RETRIES = 3;
const TRANSLATE_RETRY_DELAY_MS = 300;
const localHrOverrides = new Map<string, string>([
  ["Experience", "Iskustvo"],
  ["payparq makes cities", "PayParq stvara svijet"],
  ["payparq makes cities move with you", "PayParq stvara svijet koji se kreće s tobom"],
  ["move with you", "koji se kreće s tobom"],
  ["The world’s first mobile software-only platform for frictionless urban mobility.", "Prva svjetska mobilna softverska platforma za urbanu mobilnost."],
  ["The world’s first mobile software-only platform for frictionless urban mobility.", "Prva svjetska mobilna softverska platforma za urbanu mobilnost."],
  ["For drivers, operators, and cities", "Za vozače, operatere i gradove"],
  ["Frictionless access to anywhere you want to be", "Pristup bilo gdje, gdje želite ići"],
  ["Using industry-leading Mobile LPR technology and advanced computer vision, we create a real-time digital map of physical spaces to provide frictionless, automated parking solutions that anticipate driver needs and maximize real estate asset value.", "Koristeći vodeću Mobile LPR tehnologiju i naprednu AI vidljivost, stvaramo digitalnu kartu fizičkih prostora u stvarnom vremenu kako bismo osigurali automatizirana rješenja za parkiranje koja predviđaju potrebe vozača i maksimiziraju vrijednost nekretnina."],
  ["The Intelligent Curb", "Inteligentni asfalt"],
  ["The Intelligent Curb: Mapped & Managed.", "Inteligentni asfalt: mapiran i upravljan."],
  ["We digitize every parking space to make physical infrastructure as intuitive as the digital world. Using Mobile LPR and AI Computer Vision, we create frictionless, real-time parking maps that connect cities to people.", "Digitaliziramo svako parkirno mjesto kako bismo fizičku infrastrukturu učinili intuitivnom poput digitalnog svijeta. Koristeći Mobile LPR i AI vidljivost, stvaramo karte parkiranja u stvarnom vremenu koje povezuju gradove s ljudima."],
  ["Want to come for a ride?", "Želiš se pridružiti?"],
  ["Payparq secures smarter parking portfolios across the Country. Our software-only platform enables parking operators and cities to manage payments, enforcement, and compliance in real time — without costly hardware. Reduce operational costs, increase revenue, and deploy in days, not months.", "PayParq osigurava pametnije portfelje parkinga diljem zemlje. Naša platforma koja se sastoji samo od softvera omogućuje operaterima parkirališta i gradovima upravljanje plaćanjima, provedbom i usklađenošću u stvarnom vremenu — bez skupog hardvera. Smanjite operativne troškove, povećajte prihod i implementirajte u danima, a ne mjesecima."],
  ["About", "O nama"],
  ["ABOUT", "O nama"],
  ["Business", "Posao"],
  ["BUSINESS", "POSAO"],
  ["Support", "Podrška"],
  ["Policies", "Politika"],
  ["Members", "Članovi"],
  ["Payparq secures parking portfolios across the Country", "PayParq stvara svijet koji se kreće s tobom"],
  ["secures parking portfolios across the Country", "stvara svijet koji se kreće s tobom"],
  ["– read more", "– saznaj više"],
  ["- read more", "- saznaj više"],
  ["read more", "saznaj više"],
  ["What if every parking space is a digital asset?", "Što ako je svako parkirno mjesto digitalna imovina?"],
  ["What if every parking space was a digital asset?", "Što ako je svako parkirno mjesto digitalna imovina?"],
  ["We bridge the gap between curb and data, creating a real-time intelligence layer for every stall.", "Premošćujemo jaz između pločnika i podataka, stvarajući sloj inteligencije u stvarnom vremenu za svako stajalište."],
  ["We bridge the gap between pavement and data, creating a real-time layer of intelligence for every stall.", "Smanjujemo jaz između pločnika i podataka, stvarajući sloj inteligencije u stvarnom vremenu za svako stajalište."],
  ["Data unlocks higher NOI and portfolio liquidity at scale.", "Podaci otključavaju veći ROI i pokretljivost portfelja na razini."],
  ["We convert static pavement into live, monetizable infrastructure. Real-time visibility, automated operations, and data-backed control unlock higher NOI and frictionless mobility at scale.", "Pretvaramo statični asfalt u živu infrastrukturu koja donosi prihod. Vidljivost u stvarnom vremenu, automatizirane operacije i upravljanje temeljeno na podacima otključavaju veći ROI i pokretljivost na razini."],
  ["Security", "Sigurnost"],
  ["Space Intelligence in Real Time.", "Moderna inteligencija u stvarnom vremenu."],
  ["Real-time space intelligence.", "Moderna inteligencija u stvarnom vremenu."],
  ["Digitize every stall with AI-powered recognition that keeps your parking assets safer, smarter, and always visible.", "Digitalizirajte svako stajalište s prepoznavanjem pomoću umjetne inteligencije koje vaša parkirna sredstva drži sigurnijima, pametnijima i uvijek na vidiku."],
  ["Digitize every stall with AI-powered recognition that keeps your parking assets safer, smarter, and always in view.", "Digitalizirajte svako stajalište s prepoznavanjem pomoću umjetne inteligencije koje vaša parkirna sredstva drži sigurnijima, pametnijima i uvijek na vidiku."],
  ["Enterprise-ready digitization.", "Digitalizacija spremna za poduzeća."],
  ["Live in hours, not months.", "Live u 24 sata, ne čekajte mjesecima."],
  ["Live in days, not months.", "Live u 24 sata, ne čekajte mjesecima."],
  ["Go live in hours, not months. Whether you manage a single garage or a global portfolio, Payparq scales via Mobile LPR to protect and optimize every asset.", "Live u 24 sata, ne čekajte mjesecima. Bez obzira upravljate li jednom garažom ili globalnim portfeljem, PayParq se skalira putem Mobile LPR-a kako bi zaštitio i optimizirao svaku imovinu."],
  ["Portfolio Growth", "Povećanje portfelja"],
  ["Portfolio uplift", "Povećanje portfelja"],
  ["Protect revenue, reduce leakage, and increase NOI in every asset.", "Zaštitite prihode, smanjite curenje i povećajte ROI u svakoj imovini."],
  ["Protect revenue, reduce leakage, and drive higher NOI across every asset.", "Zaštitite prihode, smanjite curenje i povećajte ROI u svakoj imovini."],
  ["Zero Capital Expenditure", "NULA KAPITALNIH ULAGANJA"],
  ["Zero CapEx deployment", "NULA KAPITALNIH ULAGANJA"],
  ["Zero CapEx. Live in 3 Days.", "Nula kapitalnih ulaganja. Live za 24 sata."],
  ["We bring even more. Live in 3 days. Properly informed and satisfied customers.", "Donosimo još više. Live za 24 sata. Pravilno informirani i zadovoljni korisnici."],
  ["Parking", "Parking"],
  ["Find a cheaper lot? We’ll refund the difference plus 50% off your next stay.", "Pronašli ste jeftiniju parcelu? Vratit ćemo razliku plus 50% popusta na vaš sljedeći boravak."],
  ["From mixed-use garages to open-air lots, payparq turns any space into a seamless, app-free arrival experience while unlocking new revenue.", "Od garaža mješovite namjene do parcela na otvorenom, payparq pretvara bilo koji prostor u besprijekoran doživljaj dolaska bez aplikacije, a istovremeno donosi nove prihode."],
  ["Pay Now", "Plati sada"],
  ["Reserve", "Rezerviraj"],
  ["Home", "Početna"],
  ["Rest easy with 24/7 AI Computer Vision monitoring every vehicle. We ensure all cars are authorized and offer an optional insurance where applicable for total peace of mind.", "Budite sigurni uz 24/7 AI vidljivost koja nadzire svako vozilo. Osiguravamo da su sva vozila autorizirana i nudimo opcionalno osiguranje gdje je primjenjivo za potpuni mir."],
  ["Apply", "Apliciraj"],
  ["Space-level awareness", "Svijest na razini prostora"],
  ["Stay aware of key vehicles and zones across your portfolio with continuous, accurate recognition.", "Budite svjesni ključnih vozila i zona u svom portfelju uz stalno, precizno prepoznavanje."],
  ["By treating every bay as a live digital asset, we help partners unlock new revenue, reduce leakage, and deliver better experiences without rebuilding physical infrastructure.", "Tretirajući svaku parcelu kao živu digitalnu imovinu, pomažemo partnerima otključati nove prihode, smanjiti curenje i pružiti bolje iskustvo bez obnove fizičke infrastrukture."],
  ["A comprehensive resource to help you with onboarding, parking, billing, and account management.", "Opsežan resurs koji će vam pomoći s prijavom, parkiranjem, naplatom i upravljanjem računom."],
  ["Software-first approach", "Softverski pristup"],
  ["Software-first deployment", "Softverski pristup"],
  ["Payparq is building a software-only mobility platform that turns every space into a connected, data-driven asset. We use Mobile LPR, AI Computer Vision, and automation to make arrival effortless for drivers and operations simple for cities and operators.", "Payparq gradi softversku mobilnu platformu koja svaki prostor pretvara u povezanu imovinu vođenu podacima. Koristimo Mobile LPR, AI Computer Vision i automatizaciju kako bismo dolazak vozačima učinili lakšim, a operacije jednostavnim za gradove i operatere."],
  ["Payparq combines Mobile License Plate Recognition with AI Computer Vision to turn every space, curb, and garage into a live digital asset. One cloud platform powers payments, enforcement, and analytics across cities and portfolios.", "Payparq kombinira mobilno prepoznavanje registarskih pločica s računalnim AI kako bi svaki prostor, rubnjak i garažu pretvorio u živu digitalnu imovinu. Jedna platforma u oblaku pokreće plaćanja, provedbu i analitiku u gradovima i portfeljima."],
  ["Payparq is building a software-only platform for parking and urban mobility. We are assembling a focused team across product, engineering, operations, and partnerships to redesign how parking portfolios are run.", "Payparq gradi softversku platformu za parkiranje i urbanu mobilnost. Okupljamo fokusirani tim kroz proizvod, inženjering, operacije i partnerstva kako bismo redizajnirali način upravljanja parkirnim portfeljima."],
  ["We review every introduction and follow up when there is a strong match.", "Pregledavamo svaki mail i odgovorimo kada postoji snažna sinergija."],
  ["Make an impact on how cities move and park.", "Utječite na to kako se gradovi kreću i parkiraju."],
  ["We operate with a founder mindset: high autonomy, clear ownership, and bias toward shipping. Agentic roles, not traditional employment constructs.", "Djelujemo s načinom razmišljanja osnivača: visoka autonomija, jasno vlasništvo. Agentičke uloge, a ne tradicionalni oblici zaposlenja."],
  ["Outcome-aligned model tied to city growth and performance — not salaries or benefits. Build value, share in the upside.", "Model usklađen s rezultatima povezan s rastom i učinkom grada — ne s plaćama ili beneficijama. Izgradite vrijednost, sudjelujte u dobitku."],
  ["Remote-friendly", "Prikladan za daljinski"],
  // Listing/Host translations
  ["List your space", "Oglašavanje parkirnog mjesta"],
  ["Listing your space", "Oglašavanje parkirnog mjesta"],
  ["Start earning as a Payparq host", "Počnite zarađivati kao Payparq domaćin"],
  ["Turn your unused parking space into passive income. Go live in less than 60 minutes.", "Pretvorite svoje privatno parkirno mjesto u izvor pasivnog prihoda. Objavite oglas već danas — potrebno je manje od 60 minuta."],
  ["100% free to list", "100% besplatno oglašavanje"],
  ["Verified drivers and vehicles", "Provjereni vozači i vozila"],
  ["You set the prices", "Sami određujete cijenu"],
  ["List your parking space", "Objavite svoje parkirno mjesto"],
  ["Join thousands of space owners already earning from their unused parking spaces. List today and start making hundreds from your spot.", "Pridružite se tisućama vlasnika koji već zarađuju od svojih neiskorištenih parkirnih mjesta. Objavite oglas danas i počnite ostvarivati dodatni prihod."],
  ["How much could you earn?", "Koliko možete zaraditi?"],
  ["Use our earnings calculator to see how much you could earn without lifting a finger!", "Iskoristite naš kalkulator zarade i saznajte koliko možete zaraditi bez dodatnog truda."],
  ["Calculate my earnings", "Izračunaj moju zaradu"],
  ["Earnings calculator", "Kalkulator zarade"],
  ["Spaces", "Broj mjesta"],
  ["Days/week", "Dana u tjednu"],
  ["Price/day", "Cijena po danu"],
  ["Monthly earnings", "Mjesečna zarada"],
  ["How it works", "Kako funkcionira"],
  ["Three simple steps to start earning", "Tri jednostavna koraka do zarade"],
  ["Create your listing", "Izradite oglas"],
  ["Add details about your space, set your price, and upload photos in just a few minutes.", "Unesite podatke o svom parkirnom mjestu, postavite cijenu i dodajte fotografije — sve u nekoliko minuta."],
  ["Drivers book and park", "Vozači rezerviraju i parkiraju"],
  ["Verified drivers find and book your spot. Get notified instantly.", "Provjereni vozači pronalaze i rezerviraju vaše mjesto. Obavijest dobivate odmah."],
  ["You get paid", "Primate uplatu"],
  ["Earnings automatically hit your account. No chasing required.", "Zarada vam se automatski isplaćuje na račun — bez dodatnog angažmana."],
  ["Frequently asked questions", "Česta pitanja"],
  ["How will I be paid?", "Kako ću biti plaćen?"],
  ["When will I receive payment?", "Kada ću primiti uplatu?"],
  ["What if I haven’t added payment details?", "Što ako nisam dodao podatke za isplatu?"],
  ["Which payment methods are accepted?", "Koje su metode plaćanja dostupne?"],
  ["Are there any fees?", "Postoje li naknade?"],
  ["Can I withdraw my earnings early?", "Mogu li ranije podići zaradu?"],
  ["How can I track my earnings?", "Kako mogu pratiti svoju zaradu?"],
  ["What if there’s a dispute with a driver?", "Što ako dođe do spora s vozačem?"],
  ["Is my money safe?", "Je li moj novac siguran?"],
  ["Yes. All funds are securely held and transferred on schedule to your registered payment method. We use industry-standard encryption.", "Da. Sva sredstva su sigurno pohranjena i isplaćuju se prema rasporedu na vaš odabrani način plaćanja. Koristimo standardne metode enkripcije za zaštitu podataka."],
  ["Ready to start earning?", "Spremni za zaradu?"],
  ["Join thousands of hosts already making passive income with Payparq.", "Pridružite se tisućama domaćina koji već ostvaruju pasivan prihod uz Payparq."],
  ["Smart parking for the modern city", "Pametno parkiranje za moderan grad"],
  ["Payparq connects parking space owners with verified drivers, making parking simpler, more efficient, and safer.", "PayParq povezuje vlasnike parkirnih mjesta s provjerenim vozačima i omogućuje jednostavnije, učinkovitije i sigurnije parkiranje."],
]);

function shouldTranslateText(text: string) {
  const value = text.trim();
  if (!value) return false;
  if (
    /\bsafe\s+parking\s+by\s+payparq\b/i.test(value) ||
    /\bsigurno\s+parkiranje(?:\s+(?:uz|by|s))?\s+payparq\b/i.test(value)
  ) {
    return false;
  }
  if (/^(https?:\/\/|www\.)/i.test(value)) return false;
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  return true;
}

function collectTextNodes(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const result: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const parent = node.parentElement;
    const text = node.nodeValue ?? "";
    if (
      parent &&
      parent.tagName !== "SCRIPT" &&
      parent.tagName !== "STYLE" &&
      parent.tagName !== "NOSCRIPT" &&
      !parent.closest("[data-no-translate='true']") &&
      shouldTranslateText(text)
    ) {
      result.push(node);
    }
    current = walker.nextNode();
  }
  return result;
}

function collectTranslatableAttributes(root: ParentNode) {
  const attributes = ["placeholder", "title", "aria-label", "value"] as const;
  const items: Array<{ element: Element; name: (typeof attributes)[number]; value: string }> = [];
  const nodes = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(document.querySelectorAll("*"));
  for (const element of nodes) {
    if (element.closest("[data-no-translate='true']")) continue;
    for (const name of attributes) {
      const value = element.getAttribute(name);
      if (value && shouldTranslateText(value)) {
        items.push({ element, name, value });
      }
    }
  }
  return items;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function translateBatchWithRetry(batch: string[]) {
  let remaining = [...batch];
  const translatedByText = new Map<string, string>();

  for (let attempt = 0; attempt < TRANSLATE_BATCH_RETRIES && remaining.length > 0; attempt += 1) {
    const translatedList = await fetch("/api/i18n/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: remaining, target: "hr" }),
    })
      .then(async (response) => {
        if (!response.ok) return remaining.map(() => null);
        const json = (await response.json()) as { translations?: Array<string | null> };
        return Array.isArray(json.translations) ? json.translations : remaining.map(() => null);
      })
      .catch(() => remaining.map(() => null));

    const nextRemaining: string[] = [];
    remaining.forEach((text, index) => {
      const translated = translatedList[index];
      if (typeof translated === "string") {
        const normalized = translated.trim();
        if (normalized) {
          translatedByText.set(text, normalized);
          return;
        }
      }
      nextRemaining.push(text);
    });
    remaining = nextRemaining;

    if (remaining.length > 0 && attempt < TRANSLATE_BATCH_RETRIES - 1) {
      await wait(TRANSLATE_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return batch.map((text) => translatedByText.get(text) ?? null);
}

async function fetchTranslations(texts: string[]) {
  const uniqueTexts = Array.from(new Set(texts.filter(shouldTranslateText).map((text) => text.trim())));
  uniqueTexts.forEach((text) => {
    const override = localHrOverrides.get(text);
    if (override && !translationCache.has(text)) {
      translationCache.set(text, override);
    }
  });
  const unresolved = uniqueTexts.filter((text) => !translationCache.has(text) && !pendingCache.has(text));

  if (unresolved.length > 0) {
    for (let start = 0; start < unresolved.length; start += TRANSLATE_BATCH_SIZE) {
      const batch = unresolved.slice(start, start + TRANSLATE_BATCH_SIZE);
      const request = translateBatchWithRetry(batch);

      batch.forEach((text, index) => {
        const pending = request
          .then((translatedList) => {
            const translated = translatedList[index];
            if (translated) {
              translationCache.set(text, translated);
              return translated;
            }
            return text;
          })
          .finally(() => {
            pendingCache.delete(text);
          });
        pendingCache.set(text, pending);
      });
    }
  }

  const pairs = await Promise.all(
    uniqueTexts.map(async (text) => {
      const cached = translationCache.get(text);
      if (cached) return [text, cached] as const;
      const pending = pendingCache.get(text);
      if (!pending) return [text, text] as const;
      const translated = await pending;
      return [text, translated] as const;
    })
  );

  return new Map<string, string>(pairs);
}

function applyTranslations(
  textNodes: Text[],
  attributeNodes: Array<{ element: Element; name: "placeholder" | "title" | "aria-label" | "value"; value: string }>,
  translationMap: Map<string, string>
) {
  for (const node of textNodes) {
    const original = (node.nodeValue ?? "").trim();
    const translated = translationMap.get(original);
    if (translated && translated !== original) node.nodeValue = (node.nodeValue ?? "").replace(original, translated);
  }

  for (const item of attributeNodes) {
    const translated = translationMap.get(item.value.trim());
    if (translated && translated !== item.value.trim()) {
      item.element.setAttribute(item.name, translated);
    }
  }
}

async function translateDom(root: ParentNode) {
  const textNodes = collectTextNodes(root);
  const attributeNodes = collectTranslatableAttributes(root);
  const uniqueTexts: string[] = [];
  for (const node of textNodes) uniqueTexts.push((node.nodeValue ?? "").trim());
  for (const item of attributeNodes) uniqueTexts.push(item.value.trim());
  const immediateMap = new Map<string, string>();
  uniqueTexts.forEach((text) => {
    const normalized = text.trim();
    if (!normalized) return;
    const cached = translationCache.get(normalized);
    if (cached) immediateMap.set(normalized, cached);
    const override = localHrOverrides.get(normalized);
    if (override) immediateMap.set(normalized, override);
  });
  applyTranslations(textNodes, attributeNodes, immediateMap);

  const translationMap = await fetchTranslations(uniqueTexts);
  applyTranslations(textNodes, attributeNodes, translationMap);
}

export function RuntimeTextTranslator() {
  const { locale } = useLocale();

  useEffect(() => {
    if (locale !== "hr") return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await translateDom(document.body);
    };

    run();

    const observer = new MutationObserver((records) => {
      if (cancelled) return;
      const nodes = new Set<ParentNode>();
      for (const record of records) {
        if (record.type === "childList") {
          record.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              nodes.add((node as ParentNode).nodeType === Node.TEXT_NODE ? (node.parentNode as ParentNode) : (node as ParentNode));
            }
          });
        } else if (record.target) {
          nodes.add(record.target as ParentNode);
        }
      }
      nodes.forEach((node) => {
        if (node) void translateDom(node);
      });
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label", "value"],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [locale]);

  return null;
}
