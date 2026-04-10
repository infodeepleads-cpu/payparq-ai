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

const PAYPARQ_FAVICON_DATA_URI =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E%3Ccircle%20cx='32'%20cy='32'%20r='32'%20fill='%23ffffff'/%3E%3Ccircle%20cx='32'%20cy='32'%20r='28.5'%20fill='%23000000'/%3E%3Cpath%20d='M24%2018h10.5c7%200%2011.5%204.2%2011.5%2010.3%200%206.2-4.5%2010.7-11.5%2010.7H30V46h-6V18zm6%205v11h4.2c3.7%200%205.8-2.1%205.8-5.5%200-3.4-2.1-5.5-5.8-5.5H30z'%20fill='%23ffffff'/%3E%3C/svg%3E";

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
    icon: PAYPARQ_FAVICON_DATA_URI,
    shortcut: PAYPARQ_FAVICON_DATA_URI,
    apple: PAYPARQ_FAVICON_DATA_URI,
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
