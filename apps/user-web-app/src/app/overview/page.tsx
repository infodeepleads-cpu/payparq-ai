"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Section = { title: string; bullets: string[] };
type HeroSlide = { kind: "hero"; title: string; subtitle: string; bullets: string[] };
type SectionsSlide = { kind: "sections"; heading: string; sections: Section[]; note?: string };
type ListSlide = { kind: "list"; heading: string; bullets: string[]; note?: string };
type Slide = HeroSlide | SectionsSlide | ListSlide;

function isHero(s: Slide): s is HeroSlide {
  return s.kind === "hero";
}
function isSections(s: Slide): s is SectionsSlide {
  return s.kind === "sections";
}
function isList(s: Slide): s is ListSlide {
  return s.kind === "list";
}

function useSlides(): Slide[] {
  return useMemo(
    () => [
      {
        kind: "hero",
        title: "Safe Parking Platform",
        subtitle: "A Universal Digital Infrastructure for Frictionless Access",
        bullets: [
          "Parking Lots • Open Properties • Secured Facilities • Campuses • Events",
          "Secure · Compliant · Invisible to End Users",
        ],
      },
      {
        kind: "sections",
        heading: "Core System Pillars",
        sections: [
          {
            title: "Security (Enterprise-Grade)",
            bullets: [
              "Encrypted data at rest and in transit",
              "Role-based access control and permissions",
              "Full audit trails for all system events",
            ],
          },
          {
            title: "Stability & Scalability",
            bullets: [
              "Cloud-native architecture",
              "24/7 availability",
              "Scalable from single locations to multi-site portfolios",
            ],
          },
          {
            title: "Compliance & Privacy",
            bullets: [
              "GDPR-ready by design",
              "Clear data ownership",
              "Consent and retention management",
              "Privacy-by-default architecture",
            ],
          },
          {
            title: "Frictionless Access",
            bullets: [
              "One-time registration",
              "License plate recognition and recall",
              "Automatic entry and exit without physical barriers",
            ],
          },
        ],
      },
      {
        kind: "sections",
        heading: "Infrastructure & Technology",
        sections: [
          {
            title: "Cloud Infrastructure",
            bullets: [
              "Globally distributed, highly available data storage",
              "Compliant with the highest industry security standards",
            ],
          },
          {
            title: "User Account Management",
            bullets: [
              "Mirroring or replacement of existing user databases",
              "Seamless onboarding with zero operational downtime",
            ],
          },
          {
            title: "Privacy & GDPR",
            bullets: [
              "License plates treated as personal data",
              "Strict storage, processing, and retention protocols",
              "Full transparency toward end users",
            ],
          },
          {
            title: "Multi-Channel Access",
            bullets: [
              "LPR / ANPR (License Plate Recognition)",
              "QR Codes",
              "NFC / Bluetooth",
              "Geofencing",
              "Manual identification (fallback option)",
            ],
          },
        ],
      },
      {
        kind: "list",
        heading: "Data as a Strategic Asset",
        bullets: [
          "Occupancy and dwell time",
          "Peak usage patterns",
          "Repeat visit frequency and loyalty",
          "Revenue and monetization opportunities",
          "Real-time analytics for operational decision-making",
        ],
        note: "Transforming parking from physical infrastructure into software and data",
      },
      {
        kind: "list",
        heading: "Key Security Scenarios",
        bullets: [
          "Threat prevention and early detection",
          "Criminal and suspicious activity monitoring",
          "Unauthorized vehicle identification",
          "Improper parking and behavioral incidents",
          "Guest and customer dispute resolution",
        ],
        note: "Proactive monitoring, automated alerts, and audit-ready records",
      },
      {
        kind: "list",
        heading: "Frictionless Access & Monetization",
        bullets: [
          "One-time registration or tap-to-start access",
          "Automated data capture: time, GPS location, license plate, user name, WhatsApp contact",
          "Automated billing and overstay detection",
          "Self-service payments powered by Stripe",
          "Applicable to: Open lots • Controlled zones • Hotels • Residential complexes",
        ],
      },
      {
        kind: "list",
        heading: "User-Centric Communication",
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
        kind: "sections",
        heading: "Proof of Concept / Reference Models",
        sections: [
          {
            title: "Metropolis (Global Benchmark)",
            bullets: [
              "Largest parking operator globally within 8 years",
              "Estimated valuation: ~$5B",
              "Total funding: $1.6B",
              "Fully camera-based system, no tickets, no gates",
              "Outcome: Parking becomes software and data",
            ],
          },
          {
            title: "Dubai RTA (Government Proof)",
            bullets: [
              "WhatsApp-based payments",
              "No apps, no machines",
              "Zero-friction user experience",
              "Outcome: Mass adoption of contactless access and payments",
            ],
          },
        ],
      },
      {
        kind: "sections",
        heading: "Market Models",
        sections: [
          {
            title: "Metropolis Model",
            bullets: [
              "Advanced LPR / ANPR",
              "Fully automated",
              "Built for mass-scale deployment",
            ],
          },
          {
            title: "Dubai (Mahoub) Model",
            bullets: ["Chat-based payments", "Speed, simplicity, and compliance"],
          },
          {
            title: "PayParq (Park&Taxi)",
            bullets: ["Industrial-scale operations", "Proven user adoption"],
          },
        ],
        note: "Enterprise-grade operations + consumer trust = PayParq readiness",
      },
      {
        kind: "list",
        heading: "Marketing & Operational Capabilities",
        bullets: [
          "“Your parking, your rules”",
          "Full customization of access logic, pricing, and enforcement",
          "Occupancy-driven revenue optimization",
          "Data-driven marketing and user retention",
          "Fast onboarding of new and existing members",
        ],
      },
      {
        kind: "list",
        heading: "Why PayParq Wins",
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
        kind: "list",
        heading: "Vision",
        bullets: [
          "Access becomes invisible",
          "Assets self-manage",
          "Infrastructure becomes intelligent",
          "The evolution of parking: from hardware to software and data",
        ],
      },
      {
        kind: "list",
        heading: "PayParq by the Numbers",
        bullets: [
          "300 partners in the ecosystem",
          "40 active locations under management",
          "Creator of the Park&Taxi model",
          "7 million views with strong organic and viral reach",
          "PayParq turns parking into data",
        ],
      },
      {
        kind: "list",
        heading: "Karlo Žamić, Founder",
        bullets: [
          "Serial Entrepreneur & Operator",
          "Founded and scaled 7 successful companies",
          "Built multiple construction projects in record time",
          "Led high-performance operations across parking, hospitality, retail, and construction",
          "Focused on frictionless systems, operational excellence, and digital platforms",
          "Vision: To transform access, parking, and urban mobility into smart, seamless, and profitable infrastructure",
        ],
      },
    ],
    []
  );
}

export default function Overview() {
  const slides = useSlides();
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  return (
    <div className="min-h-screen bg-[#05020A] text-white">
      <div className="fixed inset-x-0 top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="text-[11px] uppercase tracking-[0.22em] text-white/70 hover:text-white">
            PayParq
          </Link>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-white/70">
              {index + 1} / {total}
            </span>
            <Link
              href="/contact"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-gray-100"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      <div className="h-screen flex items-center justify-center px-6 md:px-12">
        <div className="w-full max-w-6xl">
          {isHero(slides[index]) && (
            <div className="grid gap-6">
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
                {slides[index].title}
              </h1>
              <p className="text-base md:text-xl text-white/85">
                {slides[index].subtitle}
              </p>
              <div className="grid gap-3 text-sm md:text-base text-white/80">
                {slides[index].bullets.map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-[3px] h-[6px] w-[6px] rounded-full bg-white/70" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSections(slides[index]) && (
            <div className="grid gap-8">
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">
                {slides[index].heading}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {slides[index].sections.map((s: Section, si: number) => (
                  <div key={si} className="rounded-2xl border border-white/15 bg-white/5 p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/70 mb-2">
                      {s.title}
                    </p>
                    <div className="grid gap-2 text-sm md:text-base text-white/85">
                      {s.bullets.map((b, bi) => (
                        <div key={bi} className="flex items-start gap-3">
                          <span className="mt-[3px] h-[6px] w-[6px] rounded-full bg-white/70" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {slides[index].note && (
                <p className="text-sm md:text-base text-white/75">
                  {slides[index].note}
                </p>
              )}
            </div>
          )}

          {isList(slides[index]) && (
            <div className="grid gap-6">
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">
                {slides[index].heading}
              </h2>
              <div className="grid gap-2 text-sm md:text-base text-white/85">
                {slides[index].bullets.map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-[3px] h-[6px] w-[6px] rounded-full bg-white/70" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              {slides[index].note && (
                <p className="text-sm md:text-base text-white/75">
                  {slides[index].note}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-y-0 left-0 w-16 flex items-center justify-center">
        <button
          aria-label="Previous"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-2 text-sm hover:bg-white/20"
        >
          ‹
        </button>
      </div>
      <div className="fixed inset-y-0 right-0 w-16 flex items-center justify-center">
        <button
          aria-label="Next"
          onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
          className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-2 text-sm hover:bg-white/20"
        >
          ›
        </button>
      </div>

      <button
        aria-label="Next"
        onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
        className="fixed bottom-6 right-6 rounded-full bg-white text-black font-semibold px-5 py-3 shadow-lg hover:bg-gray-100"
      >
        Continue
      </button>
    </div>
  );
}
