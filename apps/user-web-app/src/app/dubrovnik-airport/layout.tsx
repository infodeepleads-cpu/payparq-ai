import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parking at Dubrovnik Airport | Affordable Rates | Payparq',
  description:
    'Book parking at Dubrovnik Airport (DBV). Find secure, affordable parking spots with instant confirmation. Compare rates and reserve your spot now on Payparq.',
  canonical: 'https://www.payparq.com/dubrovnik-airport',
  openGraph: {
    title: 'Parking at Dubrovnik Airport | Payparq',
    description:
      'Book parking at Dubrovnik Airport with 100+ available spots. Affordable rates, secure locations, instant confirmation.',
    url: 'https://www.payparq.com/dubrovnik-airport',
    type: 'website',
    siteName: 'Payparq',
    images: [
      {
        url: 'https://www.payparq.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Parking at Dubrovnik Airport',
      },
    ],
  },
  twitter: {
    title: 'Parking at Dubrovnik Airport | Payparq',
    description: 'Book parking at Dubrovnik Airport - secure, affordable, instant confirmation',
    card: 'summary_large_image',
  },
};

export default function DubrovnikAirportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
