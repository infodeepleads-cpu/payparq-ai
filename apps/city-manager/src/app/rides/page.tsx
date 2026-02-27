"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RideHailingWidget from "../../components/RideHailingWidget";

export default function RidesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hasDest =
      !!searchParams.get("dest_lat") ||
      !!searchParams.get("dest1_lat") ||
      !!searchParams.get("dest2_lat") ||
      !!searchParams.get("dest3_lat");

    if (!hasDest) {
      const params = new URLSearchParams();
      const pLat = searchParams.get("pickup_lat");
      const pLng = searchParams.get("pickup_lng");
      const pName = searchParams.get("pickup_name");
      if (pLat && pLng) {
        params.set("pickup_lat", pLat);
        params.set("pickup_lng", pLng);
      }
      if (pName) params.set("pickup_name", pName);
      router.replace(params.toString() ? `/map?${params.toString()}` : "/map");
    }
  }, [router, searchParams]);

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
