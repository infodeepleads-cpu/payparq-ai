import "../styles/globals.css";
import type { Metadata } from "next";
import { PwaProvider } from "../components/PwaProvider";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MachineIo from "../components/MachineIo";
import ResizableLayout from "../components/ResizableLayout";

export const metadata: Metadata = {
  title: "machine.io",
  description: "Chat-only AI manager. Write notes. Get actions and drafts.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    interactiveWidget: "resizes-content"
  },
  themeColor: "#ffffff",
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
        <div className="flex flex-col h-full w-full bg-background overflow-hidden pt-[60px]">
          <Header />
          <div className="flex flex-1 overflow-hidden relative w-full">
            <Sidebar />
            <ResizableLayout rightPanel={<MachineIo />}>
              {children}
            </ResizableLayout>
          </div>
        </div>
      </body>
    </html>
  );
}
