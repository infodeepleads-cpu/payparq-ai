export const dynamic = "force-dynamic";

function esc(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function streamForPage(title: string, bullets: string[]) {
  const lines: string[] = [];
  lines.push("BT");
  lines.push("/F1 24 Tf");
  lines.push("72 740 Td");
  lines.push(`(${esc(title)}) Tj`);
  lines.push("/F1 13 Tf");
  let y = 700;
  for (const b of bullets) {
    lines.push(`72 ${y} Td`);
    lines.push(`(${esc(b)}) Tj`);
    y -= 20;
  }
  lines.push("ET");
  const content = lines.join("\n") + "\n";
  const stream = `<< /Length ${content.length} >>\nstream\n${content}endstream\n`;
  return stream;
}

function buildPdf(slides: Array<{ title: string; bullets: string[] }>) {
  const objects: string[] = [];
  const pageCount = slides.length;
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  const rootId = 1;
  const pagesId = 2;
  let nextId = 3;
  for (let i = 0; i < pageCount; i++) {
    pageIds.push(nextId++);
  }
  for (let i = 0; i < pageCount; i++) {
    contentIds.push(nextId++);
  }
  const fontId = nextId++;
  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  const pagesObj = `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\n`;
  const rootObj = `<< /Type /Catalog /Pages ${pagesId} 0 R >>\n`;
  objects.push(rootObj);
  objects.push(pagesObj);
  for (let i = 0; i < pageCount; i++) {
    const pageObj = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Contents ${contentIds[i]} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\n`;
    objects.push(pageObj);
  }
  for (let i = 0; i < pageCount; i++) {
    const s = slides[i];
    const content = streamForPage(s.title, s.bullets);
    objects.push(content);
  }
  const fontObj = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n`;
  objects.push(fontObj);
  const header = "%PDF-1.4\n";
  let offset = header.length;
  const offsets: number[] = [0];
  let body = "";
  for (let i = 0; i < objects.length; i++) {
    const objId = i + 1;
    const objStr = `${objId} 0 obj\n${objects[i]}endobj\n`;
    offsets.push(offset);
    body += objStr;
    offset += objStr.length;
  }
  const xrefCount = objects.length + 1;
  let xref = `xref\n0 ${xrefCount}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    const n = offsets[i];
    const padded = n.toString().padStart(10, "0");
    xref += `${padded} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${xrefCount} /Root ${rootId} 0 R >>\n`;
  const startxref = `startxref\n${offset}\n%%EOF\n`;
  const pdfString = header + body + xref + trailer + startxref;
  return new TextEncoder().encode(pdfString);
}

function slidesData(): Array<{ title: string; bullets: string[] }> {
  return [
    {
      title: "Slide 1 — Title / Branding",
      bullets: [
        "Safe Parking Platform (PayParq System)",
        "A Universal Digital Infrastructure for Frictionless Access",
        "Parking Lots • Open Properties • Secured Facilities • Campuses • Events",
        "Secure · Compliant · Invisible to End Users",
      ],
    },
    {
      title: "Slide 2 — Core System Pillars",
      bullets: [
        "Security (Enterprise-Grade)",
        "Encrypted data at rest and in transit",
        "Role-based access control and permissions",
        "Full audit trails for all system events",
        "Stability & Scalability",
        "Cloud-native architecture • 24/7 availability",
        "Scalable from single locations to multi-site portfolios",
        "Compliance & Privacy",
        "GDPR-ready • Clear data ownership • Consent and retention management",
        "Privacy-by-default architecture",
        "Frictionless Access",
        "One-time registration • LPR recall • Automatic entry/exit without physical barriers",
      ],
    },
    {
      title: "Slide 3 — Infrastructure & Technology",
      bullets: [
        "Cloud Infrastructure (Google Firebase)",
        "Globally distributed, highly available data storage",
        "Compliant with the highest industry security standards",
        "User Account Management",
        "Mirroring or replacement of existing user databases",
        "Seamless onboarding with zero operational downtime",
        "Privacy & GDPR",
        "License plates treated as personal data",
        "Strict storage, processing, and retention protocols",
        "Full transparency toward end users",
        "Multi-Channel Access",
        "LPR / ANPR • QR Codes • NFC / Bluetooth • Geofencing • Manual identification",
      ],
    },
    {
      title: "Slide 4 — Data as a Strategic Asset",
      bullets: [
        "Occupancy and dwell time",
        "Peak usage patterns",
        "Repeat visit frequency and loyalty",
        "Revenue and monetization opportunities",
        "Real-time analytics for operational decision-making",
        "Transforming parking from physical infrastructure into software and data",
      ],
    },
    {
      title: "Slide 5 — Key Security Scenarios",
      bullets: [
        "Threat prevention and early detection",
        "Criminal and suspicious activity monitoring",
        "Unauthorized vehicle identification",
        "Improper parking and behavioral incidents",
        "Guest and customer dispute resolution",
        "Proactive monitoring, automated alerts, and audit-ready records",
      ],
    },
    {
      title: "Slide 6 — Frictionless Access & Monetization",
      bullets: [
        "One-time registration or tap-to-start access",
        "Automated data capture: time, GPS location, license plate, user name, WhatsApp",
        "Automated billing and overstay detection",
        "Self-service payments powered by Stripe",
        "Applicable to: Open lots • Controlled zones • Hotels • Residential complexes",
      ],
    },
    {
      title: "Slide 7 — User-Centric Communication",
      bullets: [
        "WhatsApp as the primary communication channel",
        "Higher open rates than SMS or email",
        "Optimized for tourists and international users",
        "Meta security protocols",
        "Proven mass adoption of chat-based payments",
        "No apps • No kiosks • No queues",
      ],
    },
    {
      title: "Slide 8 — Proof of Concept / Reference Models",
      bullets: [
        "Metropolis (Global Benchmark)",
        "Largest parking operator globally within 8 years",
        "Estimated valuation: ~$5B • Total funding: $1.6B",
        "Fully camera-based system, no tickets, no gates",
        "Outcome: Parking becomes software and data",
        "Dubai RTA (Government Proof)",
        "WhatsApp-based payments • No apps, no machines",
        "Zero-friction user experience",
        "Outcome: Mass adoption of contactless access and payments",
        "Park&Taxi / PayParq",
        "A hybrid of both models • Flexible across all parking asset types",
      ],
    },
    {
      title: "Slide 9 — Market Models",
      bullets: [
        "Metropolis Model",
        "Advanced LPR / ANPR • Fully automated • Built for mass-scale deployment",
        "Dubai (Mahoub) Model",
        "Chat-based payments • Speed, simplicity, and compliance",
        "PayParq (Park&Taxi)",
        "Industrial-scale operations • Proven user adoption",
        "Conclusion: Enterprise-grade operations + consumer trust = PayParq readiness",
      ],
    },
    {
      title: "Slide 10 — Marketing & Operational Capabilities",
      bullets: [
        "“Your parking, your rules”",
        "Full customization of access logic, pricing, and enforcement",
        "Occupancy-driven revenue optimization",
        "Data-driven marketing and user retention",
        "Fast onboarding of new and existing members",
      ],
    },
    {
      title: "Slide 11 — Why PayParq Wins",
      bullets: [
        "Hardware-agnostic",
        "Supports multiple access and identification methods",
        "Natively designed for open lots",
        "GDPR compliance embedded at the architectural level",
        "Scalable from a single asset to an entire city",
        "We turn infrastructure into intelligent software",
      ],
    },
    {
      title: "Slide 12 — Vision",
      bullets: [
        "Access becomes invisible",
        "Assets self-manage",
        "Infrastructure becomes intelligent",
        "The evolution of parking: from hardware to software and data",
      ],
    },
    {
      title: "Slide 13 — PayParq by the Numbers",
      bullets: [
        "300 partners in the ecosystem",
        "40 active locations under management",
        "Creator of the Park&Taxi model",
        "7 million views with strong organic and viral reach",
        "PayParq turns parking into data",
      ],
    },
    {
      title: "Slide 14 — Karlo Žamić, Founder",
      bullets: [
        "Serial Entrepreneur & Operator",
        "Founded and scaled 7 successful companies",
        "Built a 12-room hotel annex in 2.5 months",
        "Led operations across parking, hospitality, retail, and construction",
        "Focused on frictionless systems, operational excellence, and digital platforms",
        "Vision: Transform access and urban mobility into smart, seamless infrastructure",
      ],
    },
  ];
}

export async function GET() {
  const bytes = buildPdf(slidesData());
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="PayParq_Overview.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
