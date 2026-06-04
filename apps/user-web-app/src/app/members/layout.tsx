import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payparq Members | Parking Loyalty & Subscriptions",
  description:
    "Join Payparq Members for exclusive parking benefits, loyalty rewards, and monthly parking subscriptions.",
  alternates: { canonical: "https://www.payparq.com/members" },
  manifest: "/manifest-members.json",
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
