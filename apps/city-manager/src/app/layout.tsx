import "../styles/globals.css";
import type { Metadata } from "next";
import { PwaProvider } from "../components/PwaProvider";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

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
      </head>
      <body className="min-h-screen antialiased font-sans bg-background text-text-primary">
        <PwaProvider />
        <div className="flex flex-col h-screen bg-background">
          <Header />
          <div className="flex flex-1 overflow-hidden relative">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
