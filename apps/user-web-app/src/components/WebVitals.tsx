'use client';

import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function WebVitals() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_ID) return;

    // Track Core Web Vitals
    getCLS((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value * 1000),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });

    getFID((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });

    getFCP((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });

    getLCP((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });

    getTTFB((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });
  }, []);

  return null;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
