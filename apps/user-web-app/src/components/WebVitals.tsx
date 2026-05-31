'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

export function WebVitals() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_ID) return;

    onCLS((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value * 1000),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });

    onINP((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });

    onFCP((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });

    onLCP((metric) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    });

    onTTFB((metric) => {
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
