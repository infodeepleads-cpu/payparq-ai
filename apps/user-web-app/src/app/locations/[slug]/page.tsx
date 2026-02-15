import Image from "next/image";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";

function toDisplayId(slug: string) {
  return slug.replace(/-/g, " ").toLowerCase();
}

async function fetchHub(slug: string) {
  const displayId = toDisplayId(slug);
  const { data: locations } = await supabaseAdmin
    .from("locations")
    .select("id,name,label,address,display_id,latitude,longitude,verification_photos,hero_image_url,city,faq_template_key")
    .ilike("display_id", displayId)
    .limit(1);
  const hub = locations?.[0] || null;
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
    const match = rulesText.match(/€?\s?(\d+)\s*\/\s*hr/i) || rulesText.match(/\$?\s?(\d+)\s*\/\s*hr/i);
    if (match) priceLabel = `€${match[1]}/hr`;
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
  return { hub, priceLabel, hero, faqItems, displayId };
}

export default async function LocationPage(props: unknown) {
  const { params } = props as { params: { slug: string } };
  const data = await fetchHub(params.slug);
  if (!data) {
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
  const { hub, priceLabel, hero, faqItems, displayId } = data;
  const checkoutHref = `/api/stripe/checkout?loc=${encodeURIComponent(displayId)}&flow=park_now`;

  return (
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-[#05020A]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-16">
            <div className="grid md:grid-cols-[3fr,2fr] gap-8 items-center">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">PayParq hub</p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{hub.name}</h1>
                <p className="text-sm md:text-base text-white/75">{hub.label || "Parking hub"}</p>
                <div className="flex items-center gap-3">
                  <Link href={checkoutHref} className="inline-flex items-center px-4 py-2 rounded-full bg-white text-black text-[11px] font-semibold shadow hover:bg-gray-100">
                    Pay Now
                  </Link>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-black text-[11px] font-semibold border border-black/20">
                    {priceLabel}
                  </span>
                </div>
                <div className="text-xs text-white/70">
                  <span>Lat {Number(hub.latitude).toFixed(5)}</span>
                  <span className="mx-2">•</span>
                  <span>Lng {Number(hub.longitude).toFixed(5)}</span>
                </div>
              </div>
              <div className="relative aspect-[5/3] rounded-3xl overflow-hidden border border-white/10 bg-white">
                {hero ? (
                  <Image src={hero} alt={hub.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black">No image</div>
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
