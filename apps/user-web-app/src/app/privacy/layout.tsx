import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Payparq",
  description: "Read the Payparq Privacy Policy to understand how we collect, use, and protect your data.",
  alternates: { canonical: "https://www.payparq.com/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
