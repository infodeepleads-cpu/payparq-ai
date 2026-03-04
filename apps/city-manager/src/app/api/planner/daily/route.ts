import { getSupabase } from "../../../../lib/supabase";

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

type Lead = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  score: number;
  source: string;
  nearestParkingId?: string;
  nearestParkingDistanceM?: number;
};

function parseBbox(search: URLSearchParams) {
  const bboxRaw = search.get("bbox");
  if (bboxRaw) {
    const parts = bboxRaw.split(",").map((v) => parseFloat(v.trim()));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      return parts as [number, number, number, number];
    }
  }
  return [43.37, 16.15, 43.66, 16.80] as [number, number, number, number];
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

function getCoords(e: OverpassElement) {
  if (typeof e.lat === "number" && typeof e.lon === "number") {
    return { lat: e.lat, lon: e.lon };
  }
  if (e.center) return e.center;
  return null;
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
  if (tourism === "guest_house") return "villa";
  if (tourism === "chalet") return "villa";
  const amenity = tags["amenity"];
  if (amenity === "restaurant") return "restaurant";
  if (amenity === "cafe") return "cafe";
  if (amenity === "bar") return "bar";
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
  const bbox = parseBbox(url.searchParams);
  const data = await fetchOverpass(bbox);
  const all = data.elements
    .map((e) => {
      const tags = e.tags || {};
      const coords = getCoords(e);
      if (!coords) return null;
      const name = tags["name"] || tags["operator"] || tags["brand"] || "Nepoznato";
      const venueType = getVenueType(tags);
      const type = isParking(tags) ? "parking" : venueType || "poi";
      const score = weightFor(tags);
      return {
        id: `${e.type}_${e.id}`,
        name,
        type,
        lat: coords.lat,
        lon: coords.lon,
        score,
        source: "osm",
        tags,
      };
    })
    .filter((x) => !!x) as (Lead & { tags: Record<string, string> })[];

  const parkings = all.filter((x) => x.type === "parking");
  const venues = all.filter((x) => x.type !== "parking" && x.type !== "poi");

  const focusedVenues: Lead[] = [];
  venues.forEach((v) => {
    let nearestParking: Lead | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const p of parkings) {
      const d = distanceMeters(v.lat, v.lon, p.lat, p.lon);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestParking = p;
      }
    }
    if (!nearestParking || !Number.isFinite(nearestDistance) || nearestDistance > 300) return;
    const proximityBonus = Math.max(0, 300 - nearestDistance) / 100;
    focusedVenues.push({
      id: v.id,
      name: v.name,
      type: v.type,
      lat: v.lat,
      lon: v.lon,
      score: Number((v.score + proximityBonus).toFixed(2)),
      source: v.source,
      nearestParkingId: nearestParking.id,
      nearestParkingDistanceM: Math.round(nearestDistance),
    });
  });

  focusedVenues.sort((a, b) => b.score - a.score);
  const fallbackVenues = venues
    .map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      lat: v.lat,
      lon: v.lon,
      score: v.score,
      source: v.source,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  let topVenues = (focusedVenues.length > 0 ? focusedVenues : fallbackVenues).slice(0, 20);
  if (topVenues.length === 0) {
    try {
      const supabase = getSupabase();
      const { data: dbLeads, error } = await supabase
        .from("leads")
        .select("id,name,type,latitude,longitude,score,source")
        .in("type", ["hotel", "apartment", "villa", "restaurant", "cafe", "bar", "bakery"])
        .gte("latitude", bbox[0])
        .gte("longitude", bbox[1])
        .lte("latitude", bbox[2])
        .lte("longitude", bbox[3])
        .order("score", { ascending: false })
        .limit(20);
      if (!error && dbLeads && dbLeads.length > 0) {
        topVenues = dbLeads.map((l: any) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          lat: l.latitude,
          lon: l.longitude,
          score: l.score || 0,
          source: l.source || "db",
        }));
      }
    } catch {}
  }
  const parkingIds = Array.from(new Set(focusedVenues.map((v) => v.nearestParkingId).filter(Boolean))) as string[];
  const mappedParkings = parkingIds
    .map((id) => parkings.find((p) => p.id === id))
    .filter((x): x is Lead & { tags: Record<string, string> } => !!x)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      lat: p.lat,
      lon: p.lon,
      score: p.score,
      source: p.source,
    }))
    .slice(0, 10);

  const leads: Lead[] = [...topVenues, ...mappedParkings].filter(
    (lead, idx, arr) => arr.findIndex((x) => x.id === lead.id) === idx
  );

  const outreachPool = Math.max(1, topVenues.length);
  const quotas = {
    calls: Math.max(2, Math.min(8, Math.ceil(outreachPool * 0.35))),
    emails: Math.max(1, Math.min(6, Math.ceil(outreachPool * 0.25))),
    messages: Math.max(1, Math.min(6, Math.ceil(outreachPool * 0.25))),
    walk_in_zones: Math.max(1, Math.min(4, Math.ceil(outreachPool * 0.1))),
    ads: Math.max(1, Math.min(3, Math.ceil(outreachPool * 0.05))),
  };

  const bestParking = mappedParkings[0] || leads.find((l) => l.type === "parking") || leads[0] || null;
  const mappableLeads = topVenues.filter((l) => l.type !== "parking");
  const tasks = [
    ...(bestParking ? [{ type: "activate_lot", leadId: bestParking.id }] : []),
    ...(mappableLeads.length > 0 ? mappableLeads : topVenues).slice(0, 12).map((l) => ({ type: "map_lot", leadId: l.id })),
  ];

  const zoneLead = topVenues[0] || mappedParkings[0] || null;
  const zone = zoneLead
    ? { lat: zoneLead.lat, lon: zoneLead.lon }
    : { lat: (bbox[0] + bbox[2]) / 2, lon: (bbox[1] + bbox[3]) / 2 };

  const plan = {
    date: new Date().toISOString().slice(0, 10),
    quotas,
    zone,
    leads,
    tasks,
    rationale: `Brain selected ${tasks.length} tasks using nearby lead density around ${zone.lat.toFixed(3)}, ${zone.lon.toFixed(3)} and today's outreach quotas (${quotas.calls} calls, ${quotas.emails} emails, ${quotas.messages} messages, ${quotas.walk_in_zones} walk-in zones, ${quotas.ads} ads).`,
  };

  return new Response(JSON.stringify(plan), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
