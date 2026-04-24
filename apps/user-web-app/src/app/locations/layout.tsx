import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payparq Parking Locations | Find & Pay for Parking",
  description:
    "Browse all Payparq-enabled parking locations. Find parking near you and pay seamlessly.",
  alternates: { canonical: "https://www.payparq.com/locations" },
};

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
