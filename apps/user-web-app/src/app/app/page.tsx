'use client';

import dynamic from 'next/dynamic';

const SearchPage = dynamic(() => import('@/components/SearchPage').then(mod => ({ default: mod.SearchPage })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#5F3DFC] rounded-full animate-spin mx-auto mb-4" /></div></div>
});

export default function AppHome() {
  return <SearchPage />;
}
