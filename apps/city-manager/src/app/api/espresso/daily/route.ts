import { NextRequest } from "next/server";
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

export async function GET(req: NextRequest) {
  const persist = req.nextUrl.searchParams.get("persist") === "true";
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
      return {
        id: `${e.type}_${e.id}`,
        name,
        type,
        lat: coords.lat,
        lon: coords.lon,
        score,
        source: "osm",
      };
    })
    .filter((x) => !!x) as {
    id: string;
    name: string;
    type: string;
    lat: number;
    lon: number;
    score: number;
    source: string;
  }[];
  leads.sort((a, b) => b.score - a.score);
  const top = leads.slice(0, 20);

  const quotas = { calls: 10, emails: 10, messages: 10, walk_in_zones: 1, ads: 1 };
  const tasks = [
    ...top.slice(0, 10).map((l) => ({ type: "call", leadId: l.id })),
    ...top.slice(0, 10).map((l) => ({ type: "email", leadId: l.id })),
    ...top.slice(0, 10).map((l) => ({ type: "message", leadId: l.id })),
    { type: "walk_in_zone", lat: top[0]?.lat ?? (bbox[0] + bbox[2]) / 2, lon: top[0]?.lon ?? (bbox[1] + bbox[3]) / 2 },
    { type: "ad", channel: "social" },
  ];

  let persisted = 0;
  let persistError: string | null = null;
  if (persist) {
    try {
      const supabase = getSupabase();
      const today = new Date().toISOString().slice(0, 10);
      const payload = tasks.map((t) => ({
        type: t.type,
        lead_id: (t as any).leadId ?? null,
        due_at: today,
        status: "pending",
        payload: JSON.stringify(t),
      }));
      const { data, error } = await supabase.from("tasks").insert(payload).select("*");
      if (error) {
        persistError = error.message;
      } else {
        persisted = Array.isArray(data) ? data.length : 0;
      }
    } catch (e: any) {
      persistError = e?.message || "persist_failed";
    }
  }

  return new Response(
    JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      quotas,
      leads: top,
      tasks,
      persisted,
      persistError,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
