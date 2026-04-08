'use client';

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";
import { Plus, Minus } from "lucide-react";
import Image from "next/image";

export default function PaymentsPage() {
  const [caseNumber, setCaseNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    found: boolean;
    supportEmail?: string;
    case?: {
      id?: string;
      case_number?: string;
      notice_number?: string;
      plate?: string;
      location_id?: string;
      photo_url?: string;
      evidence_photos?: string[];
      violation_time?: string;
      violation_type?: string;
      amount_due?: number;
      status?: string;
    };
    location?: {
      name?: string | null;
      slug?: string | null;
      display_id?: string | null;
      photos?: string[] | null;
      latitude?: number | null;
      longitude?: number | null;
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
        "Failure to pay in a timely manner may result in additional action, including referral to collections or other legal processes. Please resolve your notice today.",
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
  const payeeName = "PayParq Global Inc.";
  const payeeIban = "HR1210010051863000160";
  const payeeModel = "HR00";
  const payeePurpose = "NOVC";
  const payeeDescription = "Parking notice settlement";

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const caseVal = caseNumber.trim();
    if (!/^\d{9}$/.test(caseVal)) {
      setError("Enter a valid 9-digit case number.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams();
      params.set("case_number", caseVal);
      const res = await fetch(`/api/cases/lookup?${params.toString()}`, { method: "GET" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ found: false, supportEmail: "payparq@outlook.com", error: "lookup_failed" });
    } finally {
      setLoading(false);
    }
  }

  const amountDue = typeof result?.case?.amount_due === "number" ? result.case.amount_due : null;
  const amountNow = amountDue !== null ? Number(amountDue.toFixed(2)) : null;
  const hubReference = result?.case?.case_number || result?.case?.notice_number || caseNumber || "000000000";
  const hub3aText = [
    "HUB3A",
    payeeName,
    payeeIban,
    payeeModel,
    hubReference,
    amountNow !== null ? amountNow.toFixed(2) : "0.00",
    "EUR",
    payeePurpose,
    payeeDescription,
  ].join("|");
  const euroQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(hub3aText)}`;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-24 md:pt-28">
        <section className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            PayParq Payments
          </h1>
          <p className="text-sm md:text-base text-black/80 mb-8">
            Search your parking case by 9-digit case number.
          </p>
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Case number (9 digits)"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
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
            <p className="text-xs md:text-sm text-black/70">
              Search by plate and 5-digit location ID instead on{" "}
              <Link href="/cases" className="underline">
                PayParq Cases
              </Link>
              .
            </p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(result.case?.evidence_photos?.length ? result.case.evidence_photos.slice(0, 2) : [result.case?.photo_url || "", ""]).map((photo, idx) => (
                          photo ? (
                            <div key={`${photo}-${idx}`} className="relative w-full aspect-video rounded-xl overflow-hidden border border-black/5 bg-black">
                              <Image
                                src={photo}
                                alt={`Violation evidence ${idx + 1}`}
                                fill
                                className="object-contain"
                              />
                              <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-full font-medium backdrop-blur-sm">
                                {new Date(result.case?.violation_time || "").toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <div key={`empty-${idx}`} className="w-full aspect-video rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                              Evidence photo {idx + 1} unavailable
                            </div>
                          )
                        ))}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <h3 className="font-semibold text-lg mb-4">Legal Notice Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                          <div className="text-gray-500">Case Number</div>
                          <div className="font-mono">{result.case?.case_number || result.case?.notice_number || caseNumber}</div>

                          <div className="text-gray-500">License Plate</div>
                          <div className="font-mono">{result.case?.plate || "N/A"}</div>

                          <div className="text-gray-500">Location ID</div>
                          <div className="font-mono">{result.case?.location_id || "N/A"}</div>

                          <div className="text-gray-500">Violation Timestamp</div>
                          <div>{result.case?.violation_time ? new Date(result.case.violation_time).toLocaleString() : "N/A"}</div>

                          <div className="text-gray-500">GPS Coordinates</div>
                          <div className="font-mono">
                            {typeof result.location?.latitude === "number" && typeof result.location?.longitude === "number"
                              ? `${result.location.latitude.toFixed(6)}, ${result.location.longitude.toFixed(6)}`
                              : "N/A"}
                          </div>

                          <div className="text-gray-500">Violation Type</div>
                          <div>{result.case?.violation_type || "Parking Violation"}</div>

                          <div className="text-gray-500">Status</div>
                          <div className="capitalize">{result.case?.status || "Issued"}</div>

                          <div className="text-gray-500 font-semibold pt-2">Amount Due</div>
                          <div className="font-semibold text-lg pt-1">
                            {typeof result.case?.amount_due === "number"
                              ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(result.case.amount_due)
                              : "Check status"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="font-semibold text-base mb-2">Croatia Invoice HUB3A</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Pay the full notice amount to the platform using the invoice details or euro QR code.
                        </p>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs space-y-2">
                          <div className="flex justify-between gap-3"><span className="text-gray-500">Primatelj</span><span className="font-medium text-right">{payeeName}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-gray-500">IBAN</span><span className="font-mono text-right">{payeeIban}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-gray-500">Model</span><span className="font-mono text-right">{payeeModel}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-gray-500">Poziv na broj</span><span className="font-mono text-right">{hubReference}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-gray-500">Svrha</span><span className="font-mono text-right">{payeePurpose}</span></div>
                          <div className="flex justify-between gap-3"><span className="text-gray-500">Iznos za uplatu</span><span className="font-semibold text-right">{amountNow !== null ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amountNow) : "N/A"}</span></div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <Image
                            src={euroQrUrl}
                            alt="Euro QR code"
                            width={176}
                            height={176}
                            unoptimized
                            className="w-44 h-44 rounded-lg border border-gray-200 bg-white p-2"
                          />
                        </div>
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
            <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-start">
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
