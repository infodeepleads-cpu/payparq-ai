import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payparq Product | Parking & Mobility Platform Features",
  description:
    "Explore the full Payparq product suite — Mobile LPR, AI Computer Vision, access control, payments, and real-time analytics.",
  alternates: { canonical: "https://www.payparq.com/product" },
};

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
