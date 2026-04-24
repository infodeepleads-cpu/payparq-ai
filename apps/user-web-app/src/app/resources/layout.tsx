import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources | Payparq",
  description:
    "Access Payparq resources — guides, documentation, case studies, and tools for operators and partners.",
  alternates: { canonical: "https://www.payparq.com/resources" },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
