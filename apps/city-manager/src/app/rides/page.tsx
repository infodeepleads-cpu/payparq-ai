"use client";

import RideHailingWidget from "../../components/RideHailingWidget";

export default function RidesPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <div className="flex-1 max-w-2xl mx-auto w-full border-x border-gray-50 shadow-sm">
        <RideHailingWidget />
      </div>
    </div>
  );
}
