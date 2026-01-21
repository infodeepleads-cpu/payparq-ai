'use client';

import { useEffect } from 'react';

export default function PayRedirectPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get('loc') || '';
    let plate = localStorage.getItem('plate_number') || '';
    if (!plate) {
      plate = prompt('Enter plate number') || '';
      if (plate) localStorage.setItem('plate_number', plate.toUpperCase());
    }
    const redirect = async () => {
      const url = `/api/stripe/checkout?loc=${encodeURIComponent(loc)}&plate=${encodeURIComponent(plate)}`;
      window.location.href = url;
    };
    redirect();
  }, []);
  return null;
}
