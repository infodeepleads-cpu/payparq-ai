import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PwaProvider } from "../components/PwaProvider";
import Sidebar from "../components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "payparq.ai",
  description: "Monitor all parking activity and lot occupancy."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body className={`min-h-screen antialiased ${inter.variable} font-sans bg-background text-text-primary`}>
        <PwaProvider />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden bg-white relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
