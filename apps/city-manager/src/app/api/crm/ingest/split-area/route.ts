import { getSupabase } from "../../../../../lib/supabase";

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

function getCoords(e: OverpassElement) {
  if (typeof e.lat === "number" && typeof e.lon === "number") {
    return { lat: e.lat, lon: e.lon };
  }
  if (e.center) return e.center;
  return null;
}

function weightFor(tags: Record<string, string>) {
  if (tags["tourism"] === "hotel") return 14;
  if (tags["tourism"] === "apartment") return 12;
  if (tags["tourism"] === "guest_house") return 11;
  if (tags["tourism"] === "chalet") return 11;
  if (tags["amenity"] === "restaurant") return 11;
  if (tags["amenity"] === "cafe") return 10;
  if (tags["amenity"] === "bar") return 10;
  if (tags["shop"] === "bakery") return 10;
  if (tags["amenity"] === "parking") return 9;
  return 6;
}

async function fetchOverpass(bbox: [number, number, number, number]) {
  const [s, w, n, e] = bbox;
  const q = `[out:json][timeout:25];
(
  node["amenity"="parking"](${s},${w},${n},${e});
  way["amenity"="parking"](${s},${w},${n},${e});
  relation["amenity"="parking"](${s},${w},${n},${e});
  node["tourism"~"hotel|guest_house|apartment|chalet"](${s},${w},${n},${e});
  way["tourism"~"hotel|guest_house|apartment|chalet"](${s},${w},${n},${e});
  relation["tourism"~"hotel|guest_house|apartment|chalet"](${s},${w},${n},${e});
  node["amenity"~"restaurant|cafe|bar"](${s},${w},${n},${e});
  way["amenity"~"restaurant|cafe|bar"](${s},${w},${n},${e});
  relation["amenity"~"restaurant|cafe|bar"](${s},${w},${n},${e});
  node["shop"="bakery"](${s},${w},${n},${e});
  way["shop"="bakery"](${s},${w},${n},${e});
  relation["shop"="bakery"](${s},${w},${n},${e});
);
out center;`;
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
      if (Array.isArray(json.elements) && json.elements.length > 0) {
        return json;
      }
    } catch {}
  }
  return { elements: [] } as OverpassResponse;
}

function isParking(tags: Record<string, string>) {
  return tags["amenity"] === "parking";
}

function getVenueType(tags: Record<string, string>) {
  const tourism = tags["tourism"];
  if (tourism === "hotel") return "hotel";
  if (tourism === "apartment") return "apartment";
  if (tourism === "guest_house" || tourism === "chalet") return "villa";
  if (tags["amenity"] === "restaurant") return "restaurant";
  if (tags["amenity"] === "cafe") return "cafe";
  if (tags["amenity"] === "bar") return "bar";
  if (tags["shop"] === "bakery") return "bakery";
  return null;
}

function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const persist = url.searchParams.get("persist") === "true";
  const limit = Math.max(1, Math.min(200, limitParam ? parseInt(limitParam, 10) : 40));
  const bbox: [number, number, number, number] = [43.37, 16.15, 43.66, 16.80];
  const data = await fetchOverpass(bbox);
  const all = data.elements
    .map((e) => {
      const tags = e.tags || {};
      const coords = getCoords(e);
      if (!coords) return null;
      const name = tags["name"] || tags["operator"] || tags["brand"] || "Nepoznato";
      const type = isParking(tags) ? "parking" : getVenueType(tags) || "poi";
      const score = weightFor(tags);
      const rec = {
        id: `${e.type}_${e.id}`,
        name,
        type,
        lat: coords.lat,
        lon: coords.lon,
        score,
        source: "osm",
        tags,
        address: [
          tags["addr:street"] || "",
          tags["addr:housenumber"] || "",
          tags["addr:city"] || "",
        ]
          .filter(Boolean)
          .join(" ")
          .trim() || null,
      };
      return rec;
    })
    .filter((x) => !!x) as {
    id: string;
    name: string;
    type: string;
    lat: number;
    lon: number;
    score: number;
    source: string;
    tags: Record<string, string>;
    address: string | null;
  }[];

  const parkings = all.filter((x) => x.type === "parking");
  const venues = all.filter((x) => x.type !== "parking" && x.type !== "poi");
  const focused = venues
    .map((v) => {
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const p of parkings) {
        const d = distanceMeters(v.lat, v.lon, p.lat, p.lon);
        if (d < nearestDistance) nearestDistance = d;
      }
      if (!Number.isFinite(nearestDistance) || nearestDistance > 300) return null;
      const proximityBonus = Math.max(0, 300 - nearestDistance) / 100;
      return {
        id: v.id,
        name: v.name,
        type: v.type,
        lat: v.lat,
        lon: v.lon,
        score: Number((v.score + proximityBonus).toFixed(2)),
        source: v.source,
        address: v.address,
      };
    })
    .filter((x): x is {
      id: string;
      name: string;
      type: string;
      lat: number;
      lon: number;
      score: number;
      source: string;
      address: string | null;
    } => !!x);

  focused.sort((a, b) => b.score - a.score);
  const fallback = venues
    .map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      lat: v.lat,
      lon: v.lon,
      score: v.score,
      source: v.source,
      address: v.address,
    }))
    .sort((a, b) => b.score - a.score);
  const top = (focused.length > 0 ? focused : fallback).slice(0, limit);

  let stored = 0;
  let storeError: string | null = null;
  if (persist) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("leads")
        .upsert(
          top.map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            latitude: l.lat,
            longitude: l.lon,
            score: Math.round(l.score),
            source: l.source,
            address: l.address,
          })),
          { onConflict: "id", ignoreDuplicates: false }
        )
        .select("*");
      if (error) {
        storeError = error.message;
      } else {
        stored = Array.isArray(data) ? data.length : 0;
      }
    } catch (e: any) {
      storeError = e?.message || "store_failed";
    }
  }

  return new Response(
    JSON.stringify({
      bbox,
      count: top.length,
      stored,
      storeError,
      leads: top,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
