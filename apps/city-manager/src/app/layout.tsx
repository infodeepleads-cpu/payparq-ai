import "../styles/globals.css";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PwaProvider } from "../components/PwaProvider";
import ClientLayout from "../components/ClientLayout";
import { LanguageProvider } from "@/contexts/LanguageContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "machine.io",
  description: "Chat-only AI manager. Write notes. Get actions and drafts.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "machine.io",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico?v=pp_static_v4", type: "image/x-icon", sizes: "any" },
      { url: "/icon-192.png?v=pp_static_v4", type: "image/png", sizes: "192x192" },
      { url: "/favicon.svg?v=pp_static_v4", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico?v=pp_static_v4"],
    apple: [{ url: "/icon-192.png?v=pp_static_v4", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.className} antialiased`}>
        <LanguageProvider>
          <PwaProvider />
          <Suspense fallback={null}>
            <ClientLayout>{children}</ClientLayout>
          </Suspense>
        </LanguageProvider>
      </body>
    </html>
  );
}
