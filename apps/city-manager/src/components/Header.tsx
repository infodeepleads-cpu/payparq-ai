"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 w-full border-b border-black bg-sidebar shrink-0 z-[999] overflow-visible flex flex-col">
      <div className="w-full h-[40px] grid grid-cols-[auto_1fr_auto] items-center px-4 relative">
        <div className="flex items-center min-w-[60px]">
          <Link href="/" className="text-2xl font-bold text-[#5A45E8] tracking-tight hover:opacity-80 transition-opacity no-underline shrink-0">
            parq
          </Link>
        </div>

        <div />

        <div className="flex items-center justify-end min-w-[60px]">
          <Link href="/profile" className="text-[13px] font-semibold text-black/60 hover:text-black transition-colors no-underline truncate max-w-[80px]">
            pension.zamic
          </Link>
        </div>
      </div>
    </header>
  );
}
