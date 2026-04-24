import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Payparq Works | Frictionless Parking Technology",
  description:
    "Discover how Payparq uses Mobile LPR, AI Computer Vision, and automation to make parking effortless for drivers and operators.",
  alternates: { canonical: "https://www.payparq.com/discover-how" },
};

export default function DiscoverHowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
