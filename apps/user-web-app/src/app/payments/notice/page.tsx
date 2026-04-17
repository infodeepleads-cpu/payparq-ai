'use client';

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

const PAYEE_NAME = process.env.NEXT_PUBLIC_CASE_PAYEE_NAME || "Indirektno";
const PAYEE_IBAN = process.env.NEXT_PUBLIC_CASE_PAYEE_IBAN || "HR0523600001103001054";
const PAYEE_MODEL = process.env.NEXT_PUBLIC_CASE_PAYEE_MODEL || "HR00";
const PAYEE_DESCRIPTION = "Parking notice settlement";
const PAYEE_ADDRESS_1 = process.env.NEXT_PUBLIC_CASE_PAYEE_ADDRESS_1 || "Obala kneza Domagoja 52";
const PAYEE_ADDRESS_2 = process.env.NEXT_PUBLIC_CASE_PAYEE_ADDRESS_2 || "21322 Brela";


function buildHub3aText(reference: string, amountStr: string) {
  const cents = Math.round((parseFloat(amountStr) || 0) * 100);
  return [
    "HRVHUB3", "EUR", cents.toString().padStart(15, "0"),
    "", "", "",
    PAYEE_NAME, PAYEE_ADDRESS_1, PAYEE_ADDRESS_2,
    PAYEE_IBAN, PAYEE_MODEL, reference, "OTHR", PAYEE_DESCRIPTION,
  ].join("\n");
}

function buildEpcText(reference: string, amountStr: string) {
  return ["BCD", "002", "1", "SCT", "", PAYEE_NAME, PAYEE_IBAN, `EUR${amountStr}`, "", "", reference].join("\n");
}

const OG = "#f07030"; // official uplatnica orange

function AmountCells({ amount }: { amount: number | null }) {
  const raw = amount !== null
    ? new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
    : "";
  // 10 chars wide (matches official form cell count), right-aligned
  const padded = raw.padStart(10, " ").split("");
  return (
    <div style={{ display: "flex", gap: "1px" }}>
      {padded.map((ch, i) => (
        <div key={i} style={{ border: `1px solid ${OG}`, width: "15px", height: "18px", fontSize: "11px", fontWeight: 700, textAlign: "center", lineHeight: "18px", fontFamily: "monospace", background: "#fff" }}>
          {ch.trim()}
        </div>
      ))}
    </div>
  );
}

function QRCanvas({ text, size }: { text: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current || !text) return;
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      QRCode.toCanvas(canvasRef.current, text, { width: size, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
    });
    return () => { cancelled = true; };
  }, [text, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />;
}

type CaseData = {
  id?: string;
  case_number?: string;
  notice_number?: string;
  plate?: string;
  location_id?: string;
  violation_time?: string;
  violation_type?: string;
  is_warning?: boolean;
  amount_due?: number;
  status?: string;
  evidence_photos?: string[];
  photo_url?: string;
};

type LocationData = {
  name?: string | null;
  display_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function NoticeContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("case_id") ?? "";
  const caseNumber = searchParams.get("case_number") ?? "";

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [allCases, setAllCases] = useState<CaseData[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!caseId && !caseNumber) { setNotFound(true); setLoading(false); return; }
    const params = new URLSearchParams();
    if (caseNumber) params.set("case_number", caseNumber);
    fetch(`/api/cases/lookup?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.found) { setNotFound(true); return; }
        setCaseData(data.case ?? null);
        setAllCases(data.cases ?? (data.case ? [data.case] : []));
        setLocationData(data.location ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [caseId, caseNumber]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        Loading notice…
      </div>
    );
  }

  if (notFound || !caseData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <p>Notice not found. <a href="/payments" style={{ textDecoration: "underline" }}>Return to Payments</a></p>
      </div>
    );
  }

  const amountDue = typeof caseData.amount_due === "number" ? caseData.amount_due : null;
  const violationDateN = caseData.violation_time ? new Date(caseData.violation_time) : null;
  const daysSinceN = violationDateN ? (Date.now() - violationDateN.getTime()) / (1000 * 60 * 60 * 24) : null;
  const earlyPayN = daysSinceN !== null && daysSinceN <= 3 && amountDue !== null;
  const daysLeftN = earlyPayN && daysSinceN !== null ? Math.max(0, Math.ceil(3 - daysSinceN)) : 0;
  const discountedN = amountDue !== null ? Math.round((amountDue * 2) / 3 * 100) / 100 : null;
  const payAmount = earlyPayN && discountedN !== null ? discountedN : amountDue;
  const amountFormatted = payAmount !== null ? payAmount.toFixed(2) : "0.00";
  const amountDisplay = payAmount !== null
    ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(payAmount)
    : "N/A";
  const reference = caseData.case_number || caseData.notice_number || caseNumber || "000000000";
  const hub3aText = buildHub3aText(reference, amountFormatted);
  const epcText = buildEpcText(reference, amountFormatted);
  // Collect all evidence photos from every row for this case number
  const photos = allCases.flatMap(c =>
    c.evidence_photos?.length ? c.evidence_photos : c.photo_url ? [c.photo_url] : []
  );
  const issueDate = caseData.violation_time ? new Date(caseData.violation_time).toLocaleString("hr-HR") : "N/A";
  const locationName = locationData?.name ?? "";
  const locationDisplayId = locationData?.display_id ?? caseData.location_id ?? "";
  const lat = typeof locationData?.latitude === "number" ? locationData.latitude.toFixed(6) : null;
  const lng = typeof locationData?.longitude === "number" ? locationData.longitude.toFixed(6) : null;

  return (
    <div style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", color: "#000", background: "#fff", maxWidth: "794px", margin: "0 auto", padding: "40px 48px", minHeight: "100vh" }}>

      {/* Print button — hidden in print */}
      <div className="no-print" style={{ marginBottom: "24px", display: "flex", gap: "12px" }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "10px 20px", background: "#5F3DFC", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
        >
          Print / Save as PDF
        </button>
        <a
          href="/payments"
          style={{ padding: "10px 20px", background: "#f3f4f6", color: "#111", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "14px", textDecoration: "none", display: "inline-block" }}
        >
          ← Back
        </a>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "22px", letterSpacing: "-0.5px" }}>PayParq</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>payparq.com</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", textTransform: "uppercase", letterSpacing: "1px" }}>Obavijest o Prekršaju</div>
          <div style={{ fontWeight: 600, fontSize: "13px", color: "#555", marginTop: "2px" }}>Parking Notice</div>
          <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>Datum izdavanja: {issueDate}</div>
        </div>
      </div>

      {/* Case details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px", fontSize: "12px", marginBottom: "20px" }}>
        <Row label="Broj predmeta / Case No." value={reference} mono />
        <Row label="Tip prekršaja / Violation" value={caseData.violation_type || "Parking Violation"} />
        <Row label="Registarska oznaka / Plate" value={caseData.plate || "N/A"} mono />
        <Row label="Status" value={caseData.status || "Issued"} />
        <Row label="Lokacija / Location" value={[locationName, locationDisplayId ? `ID ${locationDisplayId}` : ""].filter(Boolean).join(" · ")} />
        {lat && lng && <Row label="GPS" value={`${lat}, ${lng}`} mono />}
      </div>

      {/* Early-settlement clause — always printed on the notice */}
      {amountDue !== null && discountedN !== null && (
        <div style={{ borderLeft: "4px solid #111", paddingLeft: "12px", paddingTop: "6px", paddingBottom: "6px", marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#111", margin: 0, lineHeight: "1.5" }}>
            Plaćanjem ove obavijesti u roku od 3 dana od datuma izdavanja, obavijest se smatra namirenom u cijelosti uz umanjenje iznosa za 1/3 (umanjeni iznos: {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(discountedN)}).
          </p>
          <p style={{ fontSize: "11px", color: "#555", margin: "4px 0 0", lineHeight: "1.5" }}>
            Payment of this notice within 3 days of the issue date will result in full settlement at a reduced amount — a 1/3 reduction applies (reduced amount: {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(discountedN)}).{earlyPayN ? ` ${daysLeftN} day${daysLeftN === 1 ? "" : "s"} remaining.` : " Early payment period has elapsed — full amount is now due."}
          </p>
        </div>
      )}

      {/* Amount + recipient */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", border: "1.5px solid #000", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "16px 20px", borderRight: "1.5px solid #000" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", color: "#666", marginBottom: "6px" }}>Iznos za uplatu / Amount Due</div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{amountDisplay}</div>
          {earlyPayN && amountDue !== null && (
            <div style={{ fontSize: "10px", color: "#888", textDecoration: "line-through", marginTop: "2px" }}>
              Puni iznos: {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amountDue)}
            </div>
          )}
          <div style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>IBAN plaćanje · Bank transfer only</div>
        </div>
        <div style={{ padding: "16px 20px", fontSize: "12px", lineHeight: "1.7" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", color: "#666", marginBottom: "6px" }}>Primatelj / Recipient</div>
          <div style={{ fontWeight: 700 }}>{PAYEE_NAME}</div>
          <div>{PAYEE_ADDRESS_1}</div>
          <div>{PAYEE_ADDRESS_2}</div>
          <div style={{ marginTop: "6px" }}><span style={{ color: "#666" }}>IBAN:</span> <span style={{ fontFamily: "monospace" }}>{PAYEE_IBAN}</span></div>
          <div><span style={{ color: "#666" }}>Model:</span> <span style={{ fontFamily: "monospace" }}>{PAYEE_MODEL}</span></div>
          <div><span style={{ color: "#666" }}>Poziv na broj:</span> <span style={{ fontFamily: "monospace" }}>{reference}</span></div>
          <div><span style={{ color: "#666" }}>Svrha:</span> <span style={{ fontFamily: "monospace" }}>OTHR</span></div>
        </div>
      </div>

      {/* QR instruction */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "10px 14px", marginBottom: "12px", fontSize: "11px", color: "#1e40af", lineHeight: "1.6" }}>
        <strong>Kako platiti:</strong> Otvorite bankovnu aplikaciju → Plaćanje → &quot;Plati QR kodom&quot; → skenirajte QR ispod.<br />
        <strong>How to pay:</strong> Open banking app → Payments → &quot;Pay by QR&quot; → scan QR below. <em>Ne skenirajte telefonskom kamerom · Do not scan with phone camera.</em>
      </div>

      {/* QR codes */}
      <div className="qr-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            Hrvatska uplatnica (HUB3A)
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <QRCanvas text={hub3aText} size={160} />
          </div>
          <div style={{ fontSize: "10px", color: "#666", marginTop: "8px" }}>
            ZABA · PBZ · Erste · RBA · sve HR banke
          </div>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            EU Payment (SEPA)
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <QRCanvas text={epcText} size={160} />
          </div>
          <div style={{ fontSize: "10px", color: "#666", marginTop: "8px" }}>
            Revolut · N26 · ING · Wise · sve EU banke
          </div>
        </div>
      </div>

      {/* Evidence photos */}
      {photos.length > 0 && (
        <div style={{ marginBottom: "20px", breakBefore: "page", pageBreakBefore: "always" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", color: "#666", marginBottom: "10px" }}>
            Dokazni materijal / Evidence
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(photos.length, 2)}, 1fr)`, gap: "12px" }}>
            {photos.map((src, i) => (
              <div key={i} style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb", background: "#000", breakInside: "avoid", pageBreakInside: "avoid" }}>
                <Image src={src} alt={`Evidence ${i + 1}`} fill style={{ objectFit: "contain" }} unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px", fontSize: "10px", color: "#888", lineHeight: "1.6" }}>
        <p>
          Neplaćanje ove obavijesti u roku može rezultirati dodatnim pravnim mjerama uključujući pokretanje naplate potraživanja.
          Failure to pay this notice within the due period may result in further legal action including referral to debt collection.
        </p>
        <p style={{ marginTop: "6px" }}>
          Za sporove i upite: payparq@outlook.com · payparq.com/payments
        </p>
      </div>

      {/* HUB3A Uplatnica — Nalog za nacionalna plaćanja */}
      <div style={{ breakBefore: "page", pageBreakBefore: "always", paddingTop: "4px", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px" }}>

        {/* Outer container: main form (75%) + right stub (25%) */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", border: `2px solid ${OG}` }}>

          {/* ── LEFT: main form ── */}
          <div style={{ borderRight: `2px solid ${OG}` }}>

            {/* Title */}
            <div style={{ textAlign: "center", color: OG, fontWeight: 700, fontSize: "12px", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: `1px solid ${OG}`, padding: "5px 8px" }}>
              Nalog za nacionalna plaćanja
            </div>

            {/* ROW 1 — Platitelj (35%) | Hitno+Valuta+Iznos / IBAN platitelja / Model+Poziv platitelja */}
            <div style={{ display: "grid", gridTemplateColumns: "35% 65%", borderBottom: `1px solid ${OG}`, minHeight: "96px" }}>

              <div style={{ borderRight: `1px solid ${OG}`, padding: "5px 8px", display: "flex", flexDirection: "column" }}>
                <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "7px" }}>PLATITELJ (naziv/ime i adresa):</div>
                <div style={{ borderBottom: `1px solid ${OG}`, minHeight: "20px", marginBottom: "6px" }}></div>
                <div style={{ borderBottom: `1px solid ${OG}`, minHeight: "20px", marginBottom: "6px" }}></div>
                <div style={{ borderBottom: `1px solid ${OG}`, minHeight: "20px" }}></div>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>

                {/* Hitno | Valuta | Iznos */}
                <div style={{ display: "grid", gridTemplateColumns: "52px 90px 1fr", borderBottom: `1px solid ${OG}`, minHeight: "42px" }}>
                  <div style={{ borderRight: `1px solid ${OG}`, padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Hitno:</div>
                    <div style={{ border: `1.5px solid ${OG}`, width: "14px", height: "14px" }}></div>
                  </div>
                  <div style={{ borderRight: `1px solid ${OG}`, padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Valuta plaćanja:</div>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>EUR</div>
                  </div>
                  <div style={{ padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Iznos:</div>
                    <AmountCells amount={payAmount} />
                  </div>
                </div>

                {/* IBAN platitelja */}
                <div style={{ borderBottom: `1px solid ${OG}`, padding: "4px 6px", minHeight: "32px" }}>
                  <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>IBAN ili broj računa platitelja:</div>
                  <div style={{ display: "flex", gap: "1px" }}>
                    {Array.from({ length: 21 }).map((_, i) => (
                      <div key={i} style={{ border: `1px solid ${OG}`, width: "13px", height: "14px" }}></div>
                    ))}
                  </div>
                </div>

                {/* Model | Poziv platitelja */}
                <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", minHeight: "30px" }}>
                  <div style={{ borderRight: `1px solid ${OG}`, padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Model:</div>
                    <div style={{ border: `1px solid ${OG}`, height: "14px", width: "52px" }}></div>
                  </div>
                  <div style={{ padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Poziv na broj platitelja:</div>
                    <div style={{ borderBottom: `1px solid ${OG}`, minHeight: "14px" }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* IBAN primatelja — full-width highlighted row */}
            <div style={{ borderBottom: `1px solid ${OG}`, padding: "5px 10px", display: "flex", alignItems: "center", gap: "12px", minHeight: "36px", background: "#fff8f2" }}>
              <div style={{ color: OG, fontSize: "8px", fontWeight: 700, whiteSpace: "nowrap" }}>IBAN ili broj računa primatelja:</div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "15px", letterSpacing: "2.5px" }}>{PAYEE_IBAN}</div>
            </div>

            {/* ROW 3 — Primatelj (35%) | Model+Poziv / Šifra+Opis / Datum */}
            <div style={{ display: "grid", gridTemplateColumns: "35% 65%", borderBottom: `1px solid ${OG}`, minHeight: "90px" }}>

              <div style={{ borderRight: `1px solid ${OG}`, padding: "5px 8px", display: "flex", flexDirection: "column" }}>
                <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "6px" }}>PRIMATELJ (naziv/ime i adresa):</div>
                <div style={{ fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}>{PAYEE_NAME}</div>
                <div style={{ fontSize: "10px", marginBottom: "2px" }}>{PAYEE_ADDRESS_1}</div>
                <div style={{ fontSize: "10px" }}>{PAYEE_ADDRESS_2}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>

                {/* Model | Poziv primatelja */}
                <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", borderBottom: `1px solid ${OG}`, minHeight: "34px" }}>
                  <div style={{ borderRight: `1px solid ${OG}`, padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Model:</div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "13px" }}>{PAYEE_MODEL}</div>
                  </div>
                  <div style={{ padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Poziv na broj primatelja:</div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "13px" }}>{reference}</div>
                  </div>
                </div>

                {/* Šifra namjene | Opis plaćanja */}
                <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", borderBottom: `1px solid ${OG}`, minHeight: "30px" }}>
                  <div style={{ borderRight: `1px solid ${OG}`, padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Šifra namjene:</div>
                    <div style={{ border: `1px solid ${OG}`, height: "14px", width: "40px" }}></div>
                  </div>
                  <div style={{ padding: "4px 6px" }}>
                    <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Opis plaćanja:</div>
                    <div style={{ fontSize: "10px" }}>{PAYEE_DESCRIPTION}</div>
                  </div>
                </div>

                {/* Datum izvršenja */}
                <div style={{ padding: "4px 6px", minHeight: "26px" }}>
                  <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Datum izvršenja:</div>
                  <div style={{ borderBottom: `1px solid ${OG}`, minHeight: "14px" }}></div>
                </div>

              </div>
            </div>

            {/* ROW 4 — QR | Pečat | Potpis — equal thirds */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", minHeight: "110px" }}>
              <div style={{ borderRight: `1px solid ${OG}`, padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <QRCanvas text={hub3aText} size={88} />
                <div style={{ fontSize: "7px", color: OG, fontWeight: 700, letterSpacing: "0.5px" }}>Obr. HUB 3A</div>
              </div>
              <div style={{ borderRight: `1px solid ${OG}`, padding: "7px 9px" }}>
                <div style={{ color: OG, fontSize: "8px", fontWeight: 700 }}>Pečat korisnika PU</div>
              </div>
              <div style={{ padding: "7px 9px" }}>
                <div style={{ color: OG, fontSize: "8px", fontWeight: 700 }}>Potpis korisnika PU</div>
              </div>
            </div>

          </div>

          {/* ── RIGHT: bank stub ── */}
          <div style={{ display: "flex", flexDirection: "column", fontSize: "9px" }}>

            {/* Title placeholder (aligns with main title row) */}
            <div style={{ borderBottom: `1px solid ${OG}`, padding: "5px 7px", minHeight: "30px" }}></div>

            {/* Valuta i iznos */}
            <div style={{ borderBottom: `1px solid ${OG}`, padding: "5px 7px", minHeight: "42px" }}>
              <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "5px" }}>Valuta i iznos:</div>
              <div style={{ fontWeight: 700, fontSize: "11px" }}>
                EUR {payAmount !== null ? new Intl.NumberFormat("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payAmount) : ""}
              </div>
            </div>

            {/* IBAN platitelja stub */}
            <div style={{ borderBottom: `1px solid ${OG}`, padding: "5px 7px", minHeight: "46px" }}>
              <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "5px" }}>IBAN (račun) platitelja ili Platitelja:</div>
              <div style={{ borderBottom: `1px solid ${OG}`, minHeight: "16px" }}></div>
            </div>

            {/* Model i poziv platitelja stub */}
            <div style={{ borderBottom: `1px solid ${OG}`, padding: "5px 7px", minHeight: "30px" }}>
              <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "5px" }}>Model i poziv na broj platitelja:</div>
              <div style={{ borderBottom: `1px solid ${OG}`, minHeight: "14px" }}></div>
            </div>

            {/* IBAN primatelja stub */}
            <div style={{ borderBottom: `1px solid ${OG}`, padding: "5px 7px", minHeight: "36px", background: "#fff8f2" }}>
              <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>IBAN (račun) primatelja:</div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "8px", wordBreak: "break-all", letterSpacing: "0.5px" }}>{PAYEE_IBAN}</div>
            </div>

            {/* Model i poziv primatelja stub */}
            <div style={{ borderBottom: `1px solid ${OG}`, padding: "5px 7px", minHeight: "30px" }}>
              <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Model i poziv na broj primatelja:</div>
              <div style={{ fontFamily: "monospace", fontSize: "9px" }}>{PAYEE_MODEL} / {reference}</div>
            </div>

            {/* Opis plaćanja stub */}
            <div style={{ borderBottom: `1px solid ${OG}`, padding: "5px 7px", flex: 1 }}>
              <div style={{ color: OG, fontSize: "8px", fontWeight: 700, marginBottom: "4px" }}>Opis plaćanja:</div>
              <div style={{ fontSize: "9px" }}>{PAYEE_DESCRIPTION}</div>
            </div>

            {/* Ovjera */}
            <div style={{ padding: "5px 7px", minHeight: "110px" }}>
              <div style={{ color: OG, fontSize: "8px", fontWeight: 700 }}>Ovjera</div>
            </div>

          </div>
        </div>

        {/* Bottom label */}
        <div style={{ fontSize: "8px", color: OG, fontWeight: 700, marginTop: "3px" }}>Obr. HUB 3A →</div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .qr-grid { grid-template-columns: 1fr !important; }
        }
        @media print {
          .no-print { display: none !important; }
          .qr-grid { grid-template-columns: 1fr 1fr !important; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "6px", paddingTop: "4px" }}>
      <div style={{ color: "#888", fontSize: "10px", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontWeight: 600, fontFamily: mono ? "monospace" : "inherit" }}>{value}</div>
    </div>
  );
}

export default function NoticePage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>Loading…</div>}>
      <NoticeContent />
    </Suspense>
  );
}
