import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments | Payparq",
  description:
    "Manage and review your Payparq parking payments, receipts, and billing history.",
  alternates: { canonical: "https://www.payparq.com/payments" },
};

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
