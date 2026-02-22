"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MachineIo from "./MachineIo";
import ResizableLayout from "./ResizableLayout";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) {
    return <main className="h-full w-full bg-white">{children}</main>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden pt-[60px]">
      <Header />
      <div className="flex flex-1 overflow-hidden relative w-full">
        <Sidebar />
        <ResizableLayout rightPanel={<MachineIo />}>
          {children}
        </ResizableLayout>
      </div>
    </div>
  );
}
