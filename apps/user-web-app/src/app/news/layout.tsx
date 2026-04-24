import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payparq News & Blog | Parking & Urban Mobility Insights",
  description:
    "Stay up to date with the latest news, product updates, and parking industry insights from the Payparq team.",
  alternates: { canonical: "https://www.payparq.com/news" },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
