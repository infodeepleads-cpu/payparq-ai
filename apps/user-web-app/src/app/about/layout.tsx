import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Payparq | Smart Parking & Urban Mobility Platform",
  description:
    "Learn about Payparq — the software-only platform building frictionless parking, access control, and urban mobility for drivers, operators, and cities.",
  alternates: { canonical: "https://www.payparq.com/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
