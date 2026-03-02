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

function parseBbox(search: URLSearchParams) {
  const bboxRaw = search.get("bbox");
  if (bboxRaw) {
    const parts = bboxRaw.split(",").map((v) => parseFloat(v.trim()));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      return parts as [number, number, number, number];
    }
  }
  return [45.78, 15.90, 45.85, 16.00] as [number, number, number, number];
}

function weightFor(tags: Record<string, string>) {
  if (tags["amenity"] === "parking") return 10;
  const t = tags["tourism"];
  if (t === "hotel") return 8;
  if (t === "guest_house") return 7;
  if (t === "apartment") return 6;
  return 5;
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
  const bbox = parseBbox(url.searchParams);
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
    .filter((x) => !!x)
    .slice(0, 300) as {
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

  const quotas = {
    calls: 10,
    emails: 10,
    messages: 10,
    walk_in_zones: 1,
    ads: 1,
  };

  const tasks = [
    ...top.slice(0, 10).map((l) => ({ type: "call", leadId: l.id })),
    ...top.slice(0, 10).map((l) => ({ type: "email", leadId: l.id })),
    ...top.slice(0, 10).map((l) => ({ type: "message", leadId: l.id })),
  ];

  const zoneLead = top[0] || leads[0] || null;
  const zone = zoneLead
    ? { lat: zoneLead.lat, lon: zoneLead.lon }
    : { lat: (bbox[0] + bbox[2]) / 2, lon: (bbox[1] + bbox[3]) / 2 };

  const plan = {
    date: new Date().toISOString().slice(0, 10),
    quotas,
    zone,
    leads: top,
    tasks,
  };

  return new Response(JSON.stringify(plan), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

