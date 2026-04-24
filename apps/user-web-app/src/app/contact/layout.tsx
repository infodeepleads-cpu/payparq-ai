import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Payparq | Get in Touch",
  description:
    "Have a question or want to partner with Payparq? Reach out to our team.",
  alternates: { canonical: "https://www.payparq.com/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
