import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security | Payparq",
  description:
    "Learn how Payparq protects driver data, payment information, and platform integrity with enterprise-grade security.",
  alternates: { canonical: "https://www.payparq.com/security" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
