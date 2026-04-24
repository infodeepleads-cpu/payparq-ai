import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | Payparq Help Centre",
  description:
    "Get help with Payparq — find answers, contact support, and resolve issues with your parking account.",
  alternates: { canonical: "https://www.payparq.com/support" },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
