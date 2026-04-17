'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";
import { Plus, Minus, Download, AlertTriangle } from "lucide-react";

type CaseItem = {
  id?: string;
  case_number?: string;
  notice_number?: string;
  plate?: string;
  location_id?: string;
  photo_url?: string;
  evidence_photos?: string[];
  violation_time?: string;
  violation_type?: string;
  is_warning?: boolean;
  amount_due?: number;
  status?: string;
};

type LookupResult = {
  found: boolean;
  supportEmail?: string;
  case?: CaseItem;
  cases?: CaseItem[];
  location?: {
    name?: string | null;
    slug?: string | null;
    display_id?: string | null;
    photos?: string[] | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  error?: string;
};

const PAYEE_NAME = process.env.NEXT_PUBLIC_CASE_PAYEE_NAME || "PayParq Global Inc.";
const PAYEE_IBAN = process.env.NEXT_PUBLIC_CASE_PAYEE_IBAN || "HR1210010051863000160";
const PAYEE_MODEL = process.env.NEXT_PUBLIC_CASE_PAYEE_MODEL || "HR00";
const PAYEE_ADDRESS_1 = process.env.NEXT_PUBLIC_CASE_PAYEE_ADDRESS_1 || "Trg Gaje Bulata 1";
const PAYEE_ADDRESS_2 = process.env.NEXT_PUBLIC_CASE_PAYEE_ADDRESS_2 || "21000 Split, Hrvatska";
const PAYEE_DESCRIPTION = "Parking notice settlement";

function buildHub3aText(reference: string, amountStr: string) {
  const cents = Math.round((parseFloat(amountStr) || 0) * 100);
  return [
    "HRVHUB3",
    "EUR",
    cents.toString().padStart(15, "0"),
    "",
    "",
    "",
    PAYEE_NAME,
    PAYEE_ADDRESS_1,
    PAYEE_ADDRESS_2,
    PAYEE_IBAN,
    PAYEE_MODEL,
    reference,
    "OTHR",
    PAYEE_DESCRIPTION,
  ].join("\n");
}

function buildEpcText(reference: string, amountStr: string) {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    "",
    PAYEE_NAME,
    PAYEE_IBAN,
    `EUR${amountStr}`,
    "",
    "",
    reference,
  ].join("\n");
}

function QRCanvas({ text, size = 140 }: { text: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      QRCode.toCanvas(canvasRef.current, text, {
        width: size,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
    });
    return () => { cancelled = true; };
  }, [text, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg border border-gray-200 bg-white p-1"
    />
  );
}

export default function PaymentsPage() {
  const [caseNumber, setCaseNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const faqs = [
    {
      q: "Why did I receive a notice?",
      a: "You or another operator of your vehicle recently parked at a PayParq‑managed facility and left without paying. Your notice includes a vehicle photo with location and time stamp.",
    },
    {
      q: "Can I dispute the notice?",
      a: "Yes. Enter your license plate and 5‑digit location ID above to locate your notice, then use the contact and dispute options on the following page.",
    },
    {
      q: "What happens if I don't pay my notice?",
      a: "Failure to pay in a timely manner may result in additional action, including referral to collections or other legal processes. Please resolve your notice today.",
    },
    {
      q: "How do I pay or dispute a parking notice?",
      a: "Use PayParq Cases to find your notice using your license plate and 5‑digit location ID. Follow the on‑screen steps to pay or submit a dispute.",
    },
    {
      q: "Where can I find my location ID?",
      a: "Check on‑site signage. The location ID is a 5‑digit number printed near the PayParq instructions.",
    },
    {
      q: "Wrong plate or ID?",
      a: 'Re‑enter your details above. If issues persist, contact <a href="mailto:payparq@outlook.com" class="underline">payparq@outlook.com</a>.',
    },
  ];
  const [open, setOpen] = useState<Record<number, boolean>>({});

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

  const activeCase = result?.case;
  const amountDue = typeof activeCase?.amount_due === "number" ? activeCase.amount_due : null;
  const hubReference = activeCase?.case_number || activeCase?.notice_number || caseNumber || "000000000";
  const isWarning = Boolean(activeCase?.is_warning);

  const violationDate = activeCase?.violation_time ? new Date(activeCase.violation_time) : null;
  const daysSince = violationDate ? (Date.now() - violationDate.getTime()) / (1000 * 60 * 60 * 24) : null;
  const earlyPayEligible = daysSince !== null && daysSince <= 3 && amountDue !== null;
  const daysLeft = earlyPayEligible && daysSince !== null ? Math.max(0, Math.ceil(3 - daysSince)) : 0;
  const discountedAmount = amountDue !== null ? Math.round((amountDue * 2) / 3 * 100) / 100 : null;
  const payAmount = earlyPayEligible && discountedAmount !== null ? discountedAmount : amountDue;
  const amountFormatted = payAmount !== null ? payAmount.toFixed(2) : "0.00";

  const hub3aText = buildHub3aText(hubReference, amountFormatted);
  const epcText = buildEpcText(hubReference, amountFormatted);

  function handleDownloadNotice() {
    const caseNum = activeCase?.case_number || activeCase?.notice_number || caseNumber;
    if (caseNum) {
      window.open(`/cases/notice?case_number=${encodeURIComponent(caseNum)}`, "_blank");
    }
  }

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
              <div className="text-[#5F3DFC] text-xs md:text-sm">{error}</div>
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
                ) : isWarning ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <h3 className="font-semibold text-amber-900">Advisory Warning — No Fine Due</h3>
                    </div>
                    <p className="text-sm text-amber-800">
                      This is a warning notice. No payment is required at this time.
                      To avoid receiving an actual fine in future visits, please purchase a parking ticket before leaving.
                    </p>
                    {activeCase?.violation_time && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Issued</div>
                        <div className="text-sm">{new Date(activeCase.violation_time).toLocaleString()}</div>
                      </div>
                    )}
                    <Link
                      href="/cases"
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors mt-2"
                    >
                      Search by Plate to Get a Parking Ticket
                    </Link>
                  </div>
                ) : (
                  /* Fine panel — conversion-optimised */
                  <div className="space-y-5">
                    {/* 1. Amount due + early-settlement clause */}
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Iznos za uplatu / Amount Due</div>
                          <div className="text-2xl font-bold">
                            {payAmount !== null
                              ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(payAmount)
                              : "—"}
                          </div>
                        </div>
                        {earlyPayEligible && amountDue !== null && (
                          <div className="text-sm text-gray-400 line-through self-end pb-0.5">
                            {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amountDue)}
                          </div>
                        )}
                      </div>
                      {earlyPayEligible && (
                        <div className="border-l-4 border-gray-800 pl-3 py-1">
                          <p className="text-xs font-semibold text-gray-800 leading-snug">
                            Plaćanjem ove obavijesti u roku od 3 dana od datuma izdavanja, obavijest se smatra namirenom u cijelosti uz umanjenje kazne od 1/3.
                          </p>
                          <p className="text-xs text-gray-500 mt-1 leading-snug">
                            Payment of this notice within 3 days of the issue date will result in full settlement at a reduced amount — a 1/3 reduction applies. {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 2. Payment QRs */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <h3 className="font-semibold text-base mb-2">Plaćanje / Payment</h3>

                      <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 mb-4 text-xs text-blue-800 leading-relaxed">
                        <span className="font-semibold">Kako platiti:</span> Otvorite bankovnu aplikaciju → Plaćanje → &ldquo;Plati QR kodom&rdquo; → skenirajte jedan od QR kodova ispod.<br />
                        <span className="font-semibold">How to pay:</span> Open your banking app → Payments → &ldquo;Pay by QR&rdquo; → scan one QR below. <span className="text-blue-600">Do not scan with your phone camera.</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center mb-4">
                        <div className="space-y-2">
                          <div className="flex justify-center"><QRCanvas text={hub3aText} size={160} /></div>
                          <p className="text-[11px] font-semibold text-gray-700">Hrvatska uplatnica</p>
                          <p className="text-[10px] text-gray-500">HUB3A · ZABA · PBZ · Erste · RBA</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-center"><QRCanvas text={epcText} size={160} /></div>
                          <p className="text-[11px] font-semibold text-gray-700">EU Payment (SEPA)</p>
                          <p className="text-[10px] text-gray-500">Revolut · N26 · ING · Wise · sve EU</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs space-y-1.5">
                        <div className="flex justify-between gap-3"><span className="text-gray-500">Primatelj</span><span className="font-medium">{PAYEE_NAME}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-gray-500">IBAN</span><span className="font-mono">{PAYEE_IBAN}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-gray-500">Model</span><span className="font-mono">{PAYEE_MODEL}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-gray-500">Poziv na broj</span><span className="font-mono">{hubReference}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-gray-500">Iznos / Amount</span><span className="font-semibold">{payAmount !== null ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(payAmount) : "N/A"}</span></div>
                      </div>
                    </div>

                    {/* 3. Notice details */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
                      <h3 className="font-semibold mb-3">Notice Details</h3>
                      <div className="grid grid-cols-2 gap-y-2">
                        <span className="text-gray-500">Case No.</span><span className="font-mono">{activeCase?.case_number || caseNumber}</span>
                        <span className="text-gray-500">Plate</span><span className="font-mono">{activeCase?.plate || "N/A"}</span>
                        <span className="text-gray-500">Location</span><span className="font-mono">{activeCase?.location_id || "N/A"}</span>
                        <span className="text-gray-500">Issued</span><span>{activeCase?.violation_time ? new Date(activeCase.violation_time).toLocaleString() : "N/A"}</span>
                        <span className="text-gray-500">Type</span><span>{activeCase?.violation_type || "Parking Violation"}</span>
                        <span className="text-gray-500">Status</span><span className="capitalize">{activeCase?.status || "Issued"}</span>
                      </div>
                    </div>

                    {/* 4. Download + footer */}
                    <button
                      onClick={handleDownloadNotice}
                      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Official Notice
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      Failure to pay may result in further legal action. · Neplaćanje može rezultirati daljnjim pravnim mjerama.
                    </p>
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
                  <Link href="/about" className="block hover:text-white transition-colors">About</Link>
                  <Link href="/careers" className="block hover:text-white transition-colors">Careers</Link>
                  <Link href="/news" className="block hover:text-white transition-colors">News</Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Vision</p>
                  <Link href="/product" className="block hover:text-white transition-colors">Product</Link>
                  <Link href="/parking" className="block hover:text-white transition-colors">Parking</Link>
                  <Link href="/security" className="block hover:text-white transition-colors">Security</Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Policies</p>
                  <Link href="/legal" className="block hover:text-white transition-colors">Legal</Link>
                  <Link href="/privacy" className="block hover:text-white transition-colors">Privacy</Link>
                  <Link href="/terms" className="block hover:text-white transition-colors">Terms</Link>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platform</p>
                  <Link href="/locations" className="block hover:text-white transition-colors">Locations</Link>
                  <Link href="/members" className="block hover:text-white transition-colors">Members</Link>
                  <Link href="/support" className="block hover:text-white transition-colors">Support</Link>
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
