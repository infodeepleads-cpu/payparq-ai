import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payparq for Businesses | Parking Management Solutions",
  description:
    "Payparq gives parking operators and property managers a software-only platform to automate access, monetise spaces, and gain real-time visibility.",
  alternates: { canonical: "https://www.payparq.com/business" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
