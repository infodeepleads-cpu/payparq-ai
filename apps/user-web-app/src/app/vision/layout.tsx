import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Vision | Payparq — The Future of Urban Mobility",
  description:
    "Payparq's vision: a connected, data-driven future where every parking space is a smart asset and every journey begins and ends seamlessly.",
  alternates: { canonical: "https://www.payparq.com/vision" },
};

export default function VisionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
