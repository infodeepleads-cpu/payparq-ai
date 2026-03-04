export const dynamic = "force-dynamic";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

type ScrapedLead = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  score: number;
  street: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
};

function getCoords(e: OverpassElement) {
  if (typeof e.lat === "number" && typeof e.lon === "number") {
    return { lat: e.lat, lon: e.lon };
  }
  if (e.center) return e.center;
  return null;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n];
}

function similarity(a: string, b: string) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.92;
  const maxLen = Math.max(na.length, nb.length);
  const dist = levenshtein(na, nb);
  return Math.max(0, 1 - dist / maxLen);
}

function venueType(tags: Record<string, string>) {
  if (tags["tourism"] === "hotel") return "hotel";
  if (tags["tourism"] === "apartment") return "apartment";
  if (tags["tourism"] === "guest_house" || tags["tourism"] === "chalet") return "villa";
  if (tags["amenity"] === "restaurant") return "restaurant";
  if (tags["amenity"] === "cafe") return "cafe";
  if (tags["amenity"] === "bar") return "bar";
  if (tags["shop"] === "bakery") return "bakery";
  if (tags["shop"]) return "shop";
  return "poi";
}

function baseScore(tags: Record<string, string>) {
  if (tags["tourism"] === "hotel") return 13;
  if (tags["tourism"] === "apartment") return 11;
  if (tags["tourism"] === "guest_house") return 10;
  if (tags["amenity"] === "restaurant") return 11;
  if (tags["amenity"] === "cafe") return 9;
  if (tags["amenity"] === "bar") return 9;
  if (tags["shop"] === "bakery") return 8;
  return 6;
}

async function fetchOverpass(city: string) {
  const escapedCity = city.replace(/"/g, '\\"');
  const q = `[out:json][timeout:30];
area["name"="${escapedCity}"]["boundary"="administrative"]->.a;
(
  node(area.a)["tourism"~"hotel|guest_house|apartment|chalet"];
  way(area.a)["tourism"~"hotel|guest_house|apartment|chalet"];
  relation(area.a)["tourism"~"hotel|guest_house|apartment|chalet"];
  node(area.a)["amenity"~"restaurant|cafe|bar"];
  way(area.a)["amenity"~"restaurant|cafe|bar"];
  relation(area.a)["amenity"~"restaurant|cafe|bar"];
  node(area.a)["shop"~"bakery|convenience|supermarket"];
  way(area.a)["shop"~"bakery|convenience|supermarket"];
  relation(area.a)["shop"~"bakery|convenience|supermarket"];
);
out center tags;`;
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: new URLSearchParams({ data: q }),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as OverpassResponse;
      if (Array.isArray(json.elements)) return json;
    } catch {}
  }
  return { elements: [] } as OverpassResponse;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const street = (url.searchParams.get("street") || "").trim();
  const city = (url.searchParams.get("city") || "Split").trim();
  const limitParam = url.searchParams.get("limit");
  const limit = Math.max(1, Math.min(30, limitParam ? parseInt(limitParam, 10) : 10));
  if (!street) {
    return new Response(JSON.stringify({ error: "missing_street" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await fetchOverpass(city);
  const streetQuery = normalizeText(street);
  const leads = data.elements
    .map((e) => {
      const tags = e.tags || {};
      const coords = getCoords(e);
      if (!coords) return null;
      const name = tags["name"] || tags["operator"] || tags["brand"] || "Unknown";
      const mappedType = venueType(tags);
      const addrStreet = tags["addr:street"] || null;
      const addrNumber = tags["addr:housenumber"] || null;
      const addrCity = tags["addr:city"] || city || null;
      const composedAddress = [addrStreet || "", addrNumber || "", addrCity || ""].filter(Boolean).join(" ").trim() || null;
      const streetCandidate = addrStreet || tags["name"] || "";
      const streetMatch = similarity(streetQuery, streetCandidate);
      const score = Number((baseScore(tags) + streetMatch * 10).toFixed(2));
      const rec: ScrapedLead & { streetMatch: number } = {
        id: `${e.type}_${e.id}`,
        name,
        type: mappedType,
        lat: coords.lat,
        lon: coords.lon,
        score,
        street: addrStreet,
        city: addrCity,
        address: composedAddress,
        phone: tags["contact:phone"] || tags["phone"] || null,
        email: tags["contact:email"] || tags["email"] || null,
        website: tags["contact:website"] || tags["website"] || null,
        streetMatch,
      };
      return rec;
    })
    .filter((x): x is ScrapedLead & { streetMatch: number } => !!x)
    .filter((x) => x.streetMatch >= 0.45)
    .sort((a, b) => {
      if (b.streetMatch !== a.streetMatch) return b.streetMatch - a.streetMatch;
      return b.score - a.score;
    })
    .slice(0, limit)
    .map(({ streetMatch, ...lead }) => lead);

  return new Response(
    JSON.stringify({
      street,
      city,
      count: leads.length,
      leads,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
