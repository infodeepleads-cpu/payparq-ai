'use client';

import { useRouter } from 'next/navigation';
import { ListYourLotPanel } from '@/components/ListYourLotPanel';

export default function ListYourParkingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/members')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Members
        </button>
        <h1 className="text-2xl font-bold text-gray-900">List Your Parking</h1>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Full-screen content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <ListYourLotPanel isFullScreen={true} />
        </div>
      </div>
    </div>
  );
}
