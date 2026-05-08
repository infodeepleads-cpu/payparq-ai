'use client';

import { useServiceWorkerRegistration } from '@/hooks/useServiceWorkerRegistration';

export function MembersPWAInit() {
  useServiceWorkerRegistration('/members');
  return null;
}
