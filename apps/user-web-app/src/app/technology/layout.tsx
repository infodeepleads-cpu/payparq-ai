import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payparq Technology | LPR, AI Vision & Parking Automation",
  description:
    "Payparq's technology stack: Mobile LPR, AI Computer Vision, cloud-native infrastructure, and real-time data processing for smart parking.",
  alternates: { canonical: "https://www.payparq.com/technology" },
};

export default function TechnologyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
