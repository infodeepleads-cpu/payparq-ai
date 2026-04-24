import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Smart Parking Solutions | Payparq",
  description:
    "Payparq powers frictionless smart parking — no barriers, no tickets, no apps. LPR-based automated parking for modern facilities.",
  alternates: { canonical: "https://www.payparq.com/parking" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
