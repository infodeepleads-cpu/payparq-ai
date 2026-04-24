import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal | Payparq",
  description: "Legal information, policies, and compliance documentation for Payparq.",
  alternates: { canonical: "https://www.payparq.com/legal" },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
