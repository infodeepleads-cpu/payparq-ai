import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { PwaProvider } from "../components/PwaProvider";
import ClientLayout from "../components/ClientLayout";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "machine.io",
  description: "Chat-only AI manager. Write notes. Get actions and drafts.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "machine.io",
  },
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-[100dvh] fixed inset-0 overflow-hidden overscroll-none touch-none antialiased font-sans bg-background text-text-primary">
        <PwaProvider />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
