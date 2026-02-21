import "../styles/globals.css";
import type { Metadata } from "next";
import { PwaProvider } from "../components/PwaProvider";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MachineIo from "../components/MachineIo";
import ResizableLayout from "../components/ResizableLayout";

export const metadata: Metadata = {
  title: "machine.io",
  description: "Chat-only AI manager. Write notes. Get actions and drafts."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
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
