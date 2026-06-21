import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parking at Split Airport | Affordable Rates | Payparq',
  description:
    'Book parking at Split Airport (SPU). Find secure, affordable parking spots with instant confirmation. Compare rates and reserve your spot now on Payparq.',
  alternates: { canonical: 'https://www.payparq.com/city/split-airport' },
  openGraph: {
    title: 'Parking at Split Airport | Payparq',
    description:
      'Book parking at Split Airport with 100+ available spots. Affordable rates, secure locations, instant confirmation.',
    url: 'https://www.payparq.com/split-airport',
    type: 'website',
    siteName: 'Payparq',
    images: [
      {
        url: 'https://www.payparq.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Parking at Split Airport',
      },
    ],
  },
  twitter: {
    title: 'Parking at Split Airport | Payparq',
    description: 'Book parking at Split Airport - secure, affordable, instant confirmation',
    card: 'summary_large_image',
  },
};

export default function SplitAirportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
