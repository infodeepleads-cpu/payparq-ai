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
  if (tags["amenity"] === "parking") return 10;
  const t = tags["tourism"];
  if (t === "hotel") return 8;
  if (t === "guest_house") return 7;
  if (t === "apartment") return 6;
  return 5;
}

async function fetchOverpass(bbox: [number, number, number, number]) {
  const [s, w, n, e] = bbox;
  const q = `[out:json][timeout:25];
(
  node["amenity"="parking"](${s},${w},${n},${e});
  way["amenity"="parking"](${s},${w},${n},${e});
  relation["amenity"="parking"](${s},${w},${n},${e});
  node["tourism"~"hotel|guest_house|apartment"](${s},${w},${n},${e});
  way["tourism"~"hotel|guest_house|apartment"](${s},${w},${n},${e});
  relation["tourism"~"hotel|guest_house|apartment"](${s},${w},${n},${e});
);
out center;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body: new URLSearchParams({ data: q }),
    cache: "no-store",
  });
  if (!res.ok) return { elements: [] } as OverpassResponse;
  const json = (await res.json()) as OverpassResponse;
  return json;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const persist = url.searchParams.get("persist") === "true";
  const limit = Math.max(1, Math.min(200, limitParam ? parseInt(limitParam, 10) : 40));
  const bbox: [number, number, number, number] = [43.37, 16.15, 43.66, 16.80];
  const data = await fetchOverpass(bbox);
  const leads = data.elements
    .map((e) => {
      const tags = e.tags || {};
      const coords = getCoords(e);
      if (!coords) return null;
      const name = tags["name"] || tags["operator"] || tags["brand"] || "Nepoznato";
      const type =
        tags["amenity"] === "parking"
          ? "parking"
          : tags["tourism"] || "poi";
      const score = weightFor(tags);
      const rec = {
        id: `${e.type}_${e.id}`,
        name,
        type,
        lat: coords.lat,
        lon: coords.lon,
        score,
        source: "osm",
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
    address: string | null;
  }[];

  leads.sort((a, b) => b.score - a.score);
  const top = leads.slice(0, limit);

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
            score: l.score,
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
