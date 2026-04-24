import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Payparq Experience | Effortless Parking for Drivers",
  description:
    "See how Payparq delivers a seamless, contactless parking experience — from arrival to departure, with no apps or tickets required.",
  alternates: { canonical: "https://www.payparq.com/experience" },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
