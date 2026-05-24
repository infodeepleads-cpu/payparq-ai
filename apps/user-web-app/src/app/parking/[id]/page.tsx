'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ParkingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.push(`/search?hubId=${encodeURIComponent(id)}`);
    }
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg text-black/60">Učitavanje...</p>
      </div>
    </div>
  );
}
