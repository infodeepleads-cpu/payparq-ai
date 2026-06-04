import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parking at Zagreb Airport | Affordable Rates | Payparq',
  description:
    'Book parking at Zagreb Airport (ZAG). Find secure, affordable parking spots with instant confirmation. Compare rates and reserve your spot now on Payparq.',
  canonical: 'https://www.payparq.com/zagreb-airport',
  openGraph: {
    title: 'Parking at Zagreb Airport | Payparq',
    description:
      'Book parking at Zagreb Airport with 100+ available spots. Affordable rates, secure locations, instant confirmation.',
    url: 'https://www.payparq.com/zagreb-airport',
    type: 'website',
    siteName: 'Payparq',
    images: [
      {
        url: 'https://www.payparq.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Parking at Zagreb Airport',
      },
    ],
  },
  twitter: {
    title: 'Parking at Zagreb Airport | Payparq',
    description: 'Book parking at Zagreb Airport - secure, affordable, instant confirmation',
    card: 'summary_large_image',
  },
};

export default function ZagrebAirportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
