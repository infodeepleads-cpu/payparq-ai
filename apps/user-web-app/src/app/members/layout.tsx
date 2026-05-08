import type { Metadata } from "next";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { MembersPWAInit } from "@/components/MembersPWAInit";

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
      <MembersPWAInit />
      {children}
      <PWAInstallPrompt storageKey="pwa_dismissed_members" appName="Payparq Host" themeColor="#5F3DFC" />
    </>
  );
}
