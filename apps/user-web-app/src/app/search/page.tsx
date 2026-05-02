'use client';

import { useState, useEffect } from 'react';
import { SearchPage } from '@/components/SearchPage';

export default function FindParkingPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return <SearchPage />;
}
