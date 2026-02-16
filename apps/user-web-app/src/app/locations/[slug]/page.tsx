import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";

function toDisplayId(slugPart: string) {
  return slugPart.replace(/-/g, " ").toLowerCase();
}
function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length === 0) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return u.hostname.endsWith("supabase.co");
  } catch {
    return false;
  }
}

type HubRec = {
  id: string;
  name?: string;
  label?: string;
  address?: string;
  display_id?: string;
  canonical_slug?: string;
  latitude?: number;
  longitude?: number;
  verification_photos?: unknown[];
  hero_image_url?: string;
  city?: string;
  faq_template_key?: string;
};

type HubData = {
  hub: HubRec;
  priceLabel: string;
  hero: string;
  faqItems: Array<{ q: string; a: string }>;
  displayId: string;
};

async function fetchHub(slug: string): Promise<HubData | null> {
  const hyphenDisplay = String(slug || "").trim().toLowerCase();
  console.log('[locations/[slug]] fetching canonical_slug:', hyphenDisplay);
  const { data } = await supabaseAdmin
    .from("locations")
    .select("id,name,label,address,display_id,canonical_slug,latitude,longitude,verification_photos,hero_image_url,city,faq_template_key")
    .eq("canonical_slug", hyphenDisplay)
    .limit(1);
  let hub: HubRec | null = data?.[0] || null;
  if (!hub) {
    const parts = hyphenDisplay.split("-");
    const lastToken = parts[parts.length - 1] || "";
    console.log("[locations/[slug]] fallback display_id or id:", lastToken);
    const { data: byDisplay } = await supabaseAdmin
      .from("locations")
      .select("id,name,label,address,display_id,canonical_slug,latitude,longitude,verification_photos,hero_image_url,city,faq_template_key")
      .eq("display_id", lastToken)
      .limit(1);
    hub = byDisplay?.[0] || null;
    if (!hub) {
      const { data: byId } = await supabaseAdmin
        .from("locations")
        .select("id,name,label,address,display_id,canonical_slug,latitude,longitude,verification_photos,hero_image_url,city,faq_template_key")
        .eq("id", lastToken)
        .limit(1);
      hub = byId?.[0] || null;
    }
  }
  if (!hub) return null;
  const { data: pricing } = await supabaseAdmin
    .from("pricing_settings")
    .select("rules_text")
    .eq("location_id", hub.id)
    .eq("active", true)
    .limit(1);
  const rulesText = pricing?.[0]?.rules_text as string | undefined;
  let priceLabel = "€";
  if (rulesText) {
    const match = rulesText.match(/(?:€|\$|eur)?\s*(\d+(?:[.,]\d+)?)\s*(?:per\s*)?(?:\/)?\s*(?:hr|hour|hours|hourly)\b/i);
    if (match) {
      const v = match[1].replace(',', '.');
      priceLabel = `€${v}/hr`;
    }
  }
  const hero = (hub.hero_image_url as string) || (Array.isArray(hub.verification_photos) ? (hub.verification_photos[0] as string) : "");
  const faqKey = (hub.faq_template_key as string) || "airport-standard";
  const { data: faqs } = await supabaseAdmin
    .from("faq_templates")
    .select("content")
    .eq("key", faqKey)
    .limit(1);
  const faqContent = faqs?.[0]?.content as unknown;
  const items = (faqContent && typeof faqContent === 'object' && (faqContent as Record<string, unknown>).items) as unknown;
  const faqItems: Array<{ q: string; a: string }> = Array.isArray(items)
    ? (items as Array<unknown>).map((x) => {
        const obj = x as Record<string, unknown>;
        return { q: String(obj.q || ""), a: String(obj.a || "") };
      })
    : [];
  const displayIdOut = String(hub.display_id || "");
  return { hub, priceLabel, hero, faqItems, displayId: displayIdOut };
}

export default async function LocationPage(props: unknown) {
  const { params } = props as { params?: { slug?: string } };
  if (!params?.slug || typeof params.slug !== "string") {
    return (
      <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-white/70">Location not found</p>
            <Link href="/locations" className="text-xs font-semibold underline">
              Back to Locations
            </Link>
          </div>
        </main>
        <FooterBrand />
      </div>
    );
  }
  const data = await fetchHub(params.slug);
  if (!data) {
    console.error('[locations/[slug]] not found for canonical_slug:', params.slug);
    return (
      <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-white/70">Location not found</p>
            <Link href="/locations" className="text-xs font-semibold underline">
              Back to Locations
            </Link>
          </div>
        </main>
        <FooterBrand />
      </div>
    );
  }
  const { hub, priceLabel, hero, faqItems } = data;
  const checkoutHref = `/api/stripe/checkout?loc=${encodeURIComponent(hub.id)}&flow=park_now`;

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-[#05020A]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-16">
            <div className="grid md:grid-cols-[3fr,2fr] gap-8 items-start">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">PayParq hub</p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{hub.name}</h1>
                <p className="text-sm md:text-base text-white/75">{hub.label || "Parking hub"}</p>
                <div className="flex items-center gap-3">
                  <Link href={checkoutHref} className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow hover:bg-[#4330c4] transition-colors">
                    Book parking
                  </Link>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-semibold border border-black/20">
                    {priceLabel}
                  </span>
                </div>
                <div className="text-xs text-white/70">
                  <span>Lat {typeof hub.latitude === 'number' ? hub.latitude.toFixed(5) : '0.00000'}</span>
                  <span className="mx-2">•</span>
                  <span>Lng {typeof hub.longitude === 'number' ? hub.longitude.toFixed(5) : '0.00000'}</span>
                </div>
                {typeof hub.latitude === 'number' && typeof hub.longitude === 'number' ? (
                  <div className="relative aspect-[5/3] rounded-3xl overflow-hidden border border-white/10 bg-white">
                    <iframe
                      title="Google Maps"
                      src={`https://www.google.com/maps?q=${hub.latitude},${hub.longitude}&output=embed`}
                      className="w-full h-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : null}
                {Array.isArray(hub.verification_photos) && hub.verification_photos.length > 1 ? (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hub.verification_photos.slice(0, 6).map((u: unknown, idx: number) => {
                      const url = String(u || '');
                      return isValidImageUrl(url) ? (
                        <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white">
                          <Image src={url} alt={`${hub.name} photo ${idx + 1}`} fill sizes="(max-width:768px) 50vw, 33vw" className="object-cover" />
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : null}
              </div>
              <div className="relative aspect-[5/3] rounded-3xl overflow-hidden border border-white/10 bg-white">
                {isValidImageUrl(hero) ? (
                  <Image src={hero} alt={hub.name || "Location"} fill priority sizes="100vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white text-black border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
            <div className="grid md:grid-cols-[2fr,3fr] gap-12">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60">About the city</p>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{hub.city || "City"}</h2>
                <p className="text-sm md:text-base text-black/75">{hub.address || ""}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">FAQ</p>
                <div className="space-y-3">
                  {faqItems.map((item, idx) => (
                    <details key={idx} className="rounded-xl border border-black/10 bg-[#F8F8F9]">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{item.q}</summary>
                      <div className="px-4 pb-4 text-sm text-black/75">{item.a}</div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterBrand />
    </div>
  );
}

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { data: locations } = await supabaseAdmin
      .from("locations")
      .select("canonical_slug")
      .contains("verification_metadata", { hub_enabled: true })
      .limit(500);
    const slugs = (locations || []).map((loc: { canonical_slug: string }) => loc.canonical_slug.trim().toLowerCase());
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}
