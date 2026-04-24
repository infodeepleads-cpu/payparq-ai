import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers at Payparq | Join Our Team",
  description:
    "Join the team building the future of urban mobility. Explore open roles at Payparq.",
  alternates: { canonical: "https://www.payparq.com/careers" },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
