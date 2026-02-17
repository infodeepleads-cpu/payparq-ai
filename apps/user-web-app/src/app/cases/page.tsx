 'use client';
 
 import { useState } from "react";
 import Link from "next/link";
 import { SiteHeader } from "@/components/SiteHeader";
 import { FooterBrand } from "@/components/FooterBrand";
 import { Plus, Minus } from "lucide-react";
 import Image from "next/image";
 
 export default function CasesPage() {
   const [plate, setPlate] = useState("");
   const [locationId, setLocationId] = useState("");
   const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    found: boolean;
    supportEmail?: string;
    case?: {
      id?: string;
      notice_number?: string;
      plate?: string;
      location_id?: string;
      photo_url?: string;
      violation_time?: string;
      violation_type?: string;
      amount_due?: number;
      status?: string;
    };
    location?: {
      name?: string;
      slug?: string | null;
      display_id?: string | null;
      photos?: string[] | null;
    };
    error?: string;
  }>(null);
  const faqs = [
    {
      q: "Why did I receive a notice?",
      a:
        "You or another operator of your vehicle recently parked at a PayParq‑managed facility and left without paying. Your notice includes a vehicle photo with location and time stamp.",
    },
    {
      q: "Can I dispute the notice?",
      a:
        "Yes. Enter your license plate and 5‑digit location ID above to locate your notice, then use the contact and dispute options on the following page.",
    },
    {
      q: "What happens if I don’t pay my notice?",
      a:
        "Failure to pay in a timely manner may result in PayParq or its operating partners taking additional action, including referral to collections or other legal processes. Please resolve your notice today.",
    },
    {
      q: "How do I pay or dispute a parking notice?",
      a:
        "Use PayParq Cases to find your notice using your license plate and 5‑digit location ID. Follow the on‑screen steps to pay or submit a dispute.",
    },
    {
      q: "Where can I find my location ID?",
      a:
        "Check on‑site signage. The location ID is a 5‑digit number printed near the PayParq instructions.",
    },
    {
      q: "Wrong plate or ID?",
      a:
        'Re‑enter your details above. If issues persist, contact <a href="mailto:payparq@outlook.com" class="underline">payparq@outlook.com</a>.',
    },
  ];
  const [open, setOpen] = useState<Record<number, boolean>>({});
 
  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
     event.preventDefault();
     setError("");
     const plateVal = plate.trim();
     const locVal = locationId.trim();
     if (!plateVal || !locVal || !/^\d{5}$/.test(locVal)) {
       setError("Enter your license plate and a 5-digit location ID.");
       return;
     }
    setLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams();
      params.set("plate", plateVal.toUpperCase());
      params.set("location_id", locVal);
      const res = await fetch(`/api/cases/lookup?${params.toString()}`, { method: "GET" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ found: false, supportEmail: "payparq@outlook.com", error: "lookup_failed" });
    } finally {
      setLoading(false);
    }
   }
 
   return (
     <div className="min-h-screen bg-white text-black flex flex-col">
       <SiteHeader />
       <main className="flex-1 pt-24 md:pt-28">
         <section className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
           <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
             PayParq Cases
           </h1>
           <p className="text-sm md:text-base text-black/80 mb-8">
             Pay or dispute your parking notice.
           </p>
           <form onSubmit={handleLookup} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input
                 type="text"
                 inputMode="text"
                 autoCapitalize="characters"
                 autoComplete="off"
                 spellCheck={false}
                 placeholder="License plate"
                 value={plate}
                 onChange={(e) => setPlate(e.target.value.toUpperCase())}
                 className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm md:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]"
               />
               <input
                 type="text"
                 inputMode="numeric"
                 autoComplete="off"
                 placeholder="Location ID (5 digits)"
                 value={locationId}
                 onChange={(e) => setLocationId(e.target.value.replace(/\\D/g, "").slice(0, 5))}
                 className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm md:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]"
               />
             </div>
             {error && (
               <div className="text-[#5F3DFC] text-xs md:text-sm">
                 {error}
               </div>
             )}
             <button
               type="submit"
               className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-[#5F3DFC] text-white text-[12px] md:text-[13px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
             >
               Find My Parking Case
             </button>
           </form>
 
           <div className="mt-8">
             {loading && (
               <div className="text-sm md:text-base text-black/70">Looking up your case…</div>
             )}
             {!loading && result && (
               <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                 {!result.found ? (
                   <div className="space-y-2">
                     <p className="text-sm md:text-base text-black/80">
                       We couldn&apos;t locate a case for the details provided.
                     </p>
                     <p className="text-sm md:text-base">
                       Contact support at{" "}
                       <a href="mailto:payparq@outlook.com" className="underline">
                         payparq@outlook.com
                       </a>
                       .
                     </p>
                   </div>
                 ) : (
                    <div className="grid gap-8 md:grid-cols-[1.5fr,1fr] items-start">
                      <div className="space-y-4">
                        {result.case?.photo_url ? (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-black/5 bg-black">
                            <Image
                              src={result.case.photo_url}
                              alt="Violation Evidence"
                              fill
                              className="object-contain"
                            />
                            <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-full font-medium backdrop-blur-sm">
                              {new Date(result.case.violation_time || "").toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-[200px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                            No evidence photo available
                          </div>
                        )}
                        
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <h3 className="font-semibold text-lg mb-4">Violation Details</h3>
                          <div className="grid grid-cols-2 gap-y-4 text-sm">
                            <div className="text-gray-500">Notice Number</div>
                            <div className="font-mono">{result.case?.notice_number || "N/A"}</div>
                            
                            <div className="text-gray-500">License Plate</div>
                            <div className="font-mono">{result.case?.plate || plate.toUpperCase()}</div>
                            
                            <div className="text-gray-500">Location ID</div>
                            <div className="font-mono">{result.case?.location_id || locationId}</div>
                            
                            <div className="text-gray-500">Violation Type</div>
                            <div>{result.case?.violation_type || "Parking Violation"}</div>
                            
                            <div className="text-gray-500">Status</div>
                            <div className="capitalize">{result.case?.status || "Issued"}</div>
                            
                            <div className="text-gray-500 font-semibold pt-2">Amount Due</div>
                            <div className="font-semibold text-lg pt-1">
                              {result.case?.amount_due 
                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result.case.amount_due)
                                : "Check status"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                          <h3 className="font-semibold text-base mb-2">Location Verification</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Ensure the photos match where you parked.
                          </p>
                          {result.location?.photos?.[0] && (
                            <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={result.location.photos[0]}
                                alt="Location preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                             {result.location?.slug ? (
                              <Link
                                href={`/locations/${result.location.slug}`}
                                target="_blank"
                                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80 transition-colors"
                              >
                                View Location Details
                              </Link>
                            ) : (
                              <div className="text-xs text-gray-500 text-center py-2">
                                Location details unavailable
                              </div>
                            )}
                            
                            <a 
                              href={`mailto:payparq@outlook.com?subject=Location Mismatch Report - Notice ${result.case?.notice_number}&body=I am reporting a mismatch for Notice ${result.case?.notice_number} at Location ID ${locationId}.`}
                              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                              Report Location Mismatch
                            </a>
                          </div>
                        </div>

                        <div className="bg-[#5F3DFC]/5 rounded-xl border border-[#5F3DFC]/10 p-5">
                          <h3 className="font-semibold text-[#5F3DFC] mb-2">Need to dispute?</h3>
                          <p className="text-sm text-gray-700 mb-4">
                            If you believe this notice was issued in error, you can submit a dispute with evidence.
                          </p>
                          <Link
                             href="/contact"
                             className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-[#5F3DFC] text-white text-sm font-medium hover:bg-[#4330c4] transition-colors"
                          >
                            Contact Support to Dispute
                          </Link>
                        </div>
                      </div>
                    </div>
                 )}
               </div>
             )}
           </div>
         </section>
 
        <section className="bg-[#05020A] text-white border-t border-white/10">
           <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
             <div className="grid gap-12 md:grid-cols-1 items-start">
               <div>
                 <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">
                   Frequently Asked Questions
                 </p>
                 <h2 className="text-3xl md:text-4xl font-semibold mb-6">
                   Cases and Notices
                 </h2>
                <div className="space-y-2">
                  {faqs.map((item, i) => {
                    const isOpen = !!open[i];
                    return (
                      <div key={i}>
                        <button
                          className="w-full flex items-center justify-between py-3 md:py-4"
                          onClick={() => setOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
                          aria-expanded={isOpen}
                        >
                          <span className="text-sm md:text-base font-semibold text-left">{item.q}</span>
                          {isOpen ? (
                            <Minus className="w-4 h-4 text-white/80" />
                          ) : (
                            <Plus className="w-4 h-4 text-white/80" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="pb-4 md:pb-5 text-sm md:text-base text-white/80 text-left">
                            <div dangerouslySetInnerHTML={{ __html: item.a }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Company</p>
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
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Vision</p>
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
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Policies</p>
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
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platform</p>
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
            </div>
             <div className="mt-12 pt-6 border-t border-white/10">
               <FooterBrand />
             </div>
           </div>
         </section>
       </main>
     </div>
   );
 }
