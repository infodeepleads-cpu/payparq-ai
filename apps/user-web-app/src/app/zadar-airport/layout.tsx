import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parking at Zadar Airport | Affordable Rates | Payparq',
  description:
    'Book parking at Zadar Airport (ZAD). Find secure, affordable parking spots with instant confirmation. Compare rates and reserve your spot now on Payparq.',
  alternates: { canonical: 'https://www.payparq.com/zadar-airport' },
  openGraph: {
    title: 'Parking at Zadar Airport | Payparq',
    description:
      'Book parking at Zadar Airport with 100+ available spots. Affordable rates, secure locations, instant confirmation.',
    url: 'https://www.payparq.com/zadar-airport',
    type: 'website',
    siteName: 'Payparq',
    images: [
      {
        url: 'https://www.payparq.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Parking at Zadar Airport',
      },
    ],
  },
  twitter: {
    title: 'Parking at Zadar Airport | Payparq',
    description: 'Book parking at Zadar Airport - secure, affordable, instant confirmation',
    card: 'summary_large_image',
  },
};

export default function ZadarAirportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
