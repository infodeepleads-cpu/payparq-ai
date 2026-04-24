import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payparq Platform Overview | Smart Parking Solutions",
  description:
    "Get a complete overview of the Payparq platform — from driver experience to operator dashboards and city-wide mobility data.",
  alternates: { canonical: "https://www.payparq.com/overview" },
};

export default function OverviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
