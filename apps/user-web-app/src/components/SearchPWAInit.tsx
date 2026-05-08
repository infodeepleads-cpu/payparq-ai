'use client';

import { useServiceWorkerRegistration } from '@/hooks/useServiceWorkerRegistration';

export function SearchPWAInit() {
  useServiceWorkerRegistration('/search');
  return null;
}
