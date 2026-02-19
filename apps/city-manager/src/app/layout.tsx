import "../styles/globals.css";
import type { Metadata } from "next";
import { PwaProvider } from "../components/PwaProvider";
import Sidebar from "../components/Sidebar";

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
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <header className="px-4 py-3 border-b border-border bg-surface">
              <div className="text-sm font-semibold text-primary">machine.io</div>
            </header>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
