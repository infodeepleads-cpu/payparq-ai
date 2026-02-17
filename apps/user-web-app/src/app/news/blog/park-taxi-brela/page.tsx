import Link from "next/link";
import { FooterBrand } from "@/components/FooterBrand";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
 
export const metadata: Metadata = {
  title: "Park & Taxi Brela — 20–40 cars captured daily, routed to remote lots | PayParq Blog",
  description:
    "Case study from Brela, Makarska Riviera (Split-Dalmatia County, Croatia): software-only Park & Taxi flow captures 20–40 cars per day at a seaside chokepoint and routes them to remote lots for smoother arrivals.",
  keywords: [
    "Brela",
    "Makarska Riviera",
    "Split-Dalmatia County",
    "Croatia",
    "Park & Taxi",
    "LPR",
    "chokepoint",
    "remote lots",
    "smart parking",
    "PayParq",
  ],
  openGraph: {
    type: "article",
    title:
      "Park & Taxi Brela — 20–40 cars captured daily, routed to remote lots | PayParq Blog",
    description:
      "Software-first parking case study in Brela, Croatia. Captures 20–40 cars per day at chokepoints and routes them to remote capacity.",
    url: "/news/blog/park-taxi-brela",
    siteName: "PayParq",
    locale: "en_US",
  },
  alternates: {
    canonical: "/news/blog/park-taxi-brela",
  },
};
 
export default function BrelaBlogPost() {
 
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      <header className="hidden">
        <div className="w-full px-4 md:px-10 pt-3 md:pt-4 pointer-events-auto">
          <div className="bg-white/95 shadow-lg border border-black/5">
            <div className="h-14 md:h-16 grid grid-cols-3 items-center px-4 md:px-8 text-[11px] font-medium text-black">
              <div className="flex items-center justify-start md:justify-center gap-4">
                <div className="hidden md:flex items-center justify-center gap-7 text-[10px] uppercase tracking-[0.24em]">
                  <Link href="/vision" className="hover:text-gray-700 transition-colors">
                    Experience
                  </Link>
                  <Link href="/parking" className="hover:text-gray-700 transition-colors">
                    Parking
                  </Link>
                  <Link href="/security" className="hover:text-gray-700 transition-colors">
                    Security
                  </Link>
                  <Link href="/business" className="hover:text-gray-700 transition-colors">
                    Smart City
                  </Link>
                  <Link href="/technology" className="hover:text-gray-700 transition-colors">
                    Technology
                  </Link>
                  <Link href="/about" className="hover:text-gray-700 transition-colors">
                    About
                  </Link>
                  <Link href="/careers" className="hover:text-gray-700 transition-colors">
                    Careers
                  </Link>
                  <Link href="/news" className="hover:text-gray-700 transition-colors">
                    News
                  </Link>
                  <Link href="/contact" className="hover:text-gray-700 transition-colors">
                    Contact
                  </Link>
                </div>
              </div>
 
              <div className="flex items-center justify-center">
                <Link href="/" className="relative flex items-center justify-center">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                      <span className="text-sm md:text-base font-semibold tracking-tight leading-none text-white">
                        P
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
 
              <div className="flex items-center justify-end gap-2 md:gap-3">
                <Link
                  href="/contact"
                  className="hidden md:inline-flex px-4 py-2 rounded-full border border-gray-300 text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get in Touch
                </Link>
                <Link
                  href="/pay"
                  className="px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
                >
                  Pay Now
                </Link>
              </div>
            </div>
            {/* static header on blog page */}
          </div>
        </div>
      </header>
 
      <main className="flex-1 bg-white pt-24 md:pt-28">
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">
              PayParq Blog
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
              Park &amp; Taxi — Brela, Croatia
            </h1>
            <p className="text-sm md:text-base text-black/75">
              Brela, Makarska Riviera (Split-Dalmatia County, Croatia). A seaside junction creates
              a daily chokepoint in summer. PayParq&apos;s Park &amp; Taxi flow captures 20–40 cars
              per day and routes them to remote lots for smoother arrivals and better capacity use.
            </p>
          </div>
        </section>
 
        <section className="border-t border-black/5 bg-white">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-10 md:grid-cols-[1.2fr,1fr] items-start">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4 text-black">
                Why it works
              </h2>
              <p className="text-sm md:text-base text-black/75 mb-4">
                The approach is software-only: mobile LPR captures plates and a live dashboard
                shows occupancy and dwell time across zones. At the chokepoint, drivers are
                offered a guided route to remote lots where spaces are available.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-black/80">
                <li>20–40 cars captured daily during peak season at the junction.</li>
                <li>Reduced congestion along the promenade and town center.</li>
                <li>Protected resident and staff zones with better compliance.</li>
                <li>Improved arrivals for visitors, taxis, and deliveries.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-black/5 bg-[#F5F5F7] p-5 text-xs md:text-sm text-black/80">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-2">
                Location
              </p>
              <p className="mb-1">Brela — Makarska Riviera</p>
              <p className="mb-1">Split-Dalmatia County, Croatia</p>
              <p className="mb-1">Nearby hubs: Baška Voda, Makarska</p>
              <p className="text-black/70">
                Context-rich keywords: Brela parking, seaside chokepoint, Makarska Riviera traffic,
                Split-Dalmatia parking optimization, Croatia smart parking.
              </p>
            </div>
          </div>
        </section>
 
        <section className="bg-[#05020A] text-white border-t border-black/5">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20 grid gap-6 md:grid-cols-3 text-sm md:text-base text-white/80">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">Results</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Shorter queues at the junction and waterfront.</li>
                <li>Higher remote lot utilization during peak hours.</li>
                <li>More predictable enforcement and patrol routes.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">Playbook</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Mobile LPR capture; dashboard route guidance.</li>
                <li>Standardized rules across zones and times.</li>
                <li>Partner-first support for local operators.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">Next</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Extend to nearby towns along Makarska Riviera.</li>
                <li>Add seasonal pricing and dynamic tariffs.</li>
                <li>Integrate visitor permits and delivery windows.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
 
      <footer className="border-t border-white/10 bg-[#05020A] font-apple-ui">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Company
              </p>
              <Link href="/about" className="block hover:text-white transition-colors">
                About
              </Link>
              <Link href="/careers" className="block hover:text-white transition-colors">
                Careers
              </Link>
              <Link href="/news" className="block hover:text-white transition-colors">
                News
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Experience
              </p>
              <Link href="/product" className="block hover:text-white transition-colors">
                Product
              </Link>
              <Link href="/parking" className="block hover:text-white transition-colors">
                Parking
              </Link>
              <Link href="/security" className="block hover:text-white transition-colors">
                Security
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Policies
              </p>
              <Link href="/legal" className="block hover:text-white transition-colors">
                Legal
              </Link>
              <Link href="/privacy" className="block hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="block hover:text-white transition-colors">
                Terms
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Platform
              </p>
              <Link href="/locations" className="block hover:text-white transition-colors">
                Locations
              </Link>
              <Link href="/members" className="block hover:text-white transition-colors">
                Members
              </Link>
              <Link href="/support" className="block hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10">
            <FooterBrand />
          </div>
        </div>
      </footer>
 
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline:
              "Park & Taxi Brela — 20–40 cars captured daily, routed to remote lots",
            articleSection: "Brela, Croatia",
            keywords:
              "Brela, Makarska Riviera, Split-Dalmatia County, Croatia, Park & Taxi, LPR, chokepoint, remote lots, smart parking",
            author: {
              "@type": "Organization",
              name: "PayParq",
            },
            publisher: {
              "@type": "Organization",
              name: "PayParq",
            },
            about: {
              "@type": "Place",
              name: "Brela",
              address: {
                "@type": "PostalAddress",
                addressCountry: "HR",
                addressRegion: "Split-Dalmatia County",
              },
            },
          }),
        }}
      />
    </div>
  );
}
