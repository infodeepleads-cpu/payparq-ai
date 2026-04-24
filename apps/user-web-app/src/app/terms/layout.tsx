import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Payparq",
  description: "Read the Payparq Terms and Conditions governing use of our platform and services.",
  alternates: { canonical: "https://www.payparq.com/terms" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
