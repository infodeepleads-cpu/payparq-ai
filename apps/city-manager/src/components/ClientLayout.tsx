"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MachineIo from "./MachineIo";
import ResizableLayout from "./ResizableLayout";
import DailyRecap from "./DailyRecap";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) {
    return <main className="h-full w-full bg-white">{children}</main>;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden pt-[calc(60px+env(safe-area-inset-top))] relative">
        <Sidebar />
        <main className="flex-1 flex flex-col pl-[60px] h-full overflow-hidden w-full relative">
          <ResizableLayout rightPanel={<MachineIo />}>
            {children}
          </ResizableLayout>
        </main>
      </div>
      <DailyRecap />
    </div>
  );
}
