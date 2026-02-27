"use client";

import { Suspense } from "react";
import RideHailingWidget from "../../components/RideHailingWidget";

export default function RidesPage() {
  return (
    <div className="h-full w-full bg-white overflow-hidden">
      <div className="h-full max-w-2xl mx-auto w-full border-x border-black/5 shadow-sm">
        <Suspense fallback={<div className="w-full h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" /></div>}>
          <RideHailingWidget />
        </Suspense>
      </div>
    </div>
  );
}
