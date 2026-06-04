import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Parking | PayParq - Book Secure Parking Spaces',
  description:
    'Search and book verified parking spaces in your area. Compare prices, ratings, and amenities. Easy booking with instant confirmation.',
  keywords: [
    'find parking',
    'parking spaces',
    'book parking',
    'parking near me',
    'secure parking',
    'garage parking',
    'valet parking',
    'parking reservations',
  ],
  alternates: {
    canonical: 'https://www.payparq.com/search',
    languages: {
      'hr': 'https://www.payparq.com/search',
      'en': 'https://www.payparq.com/en/search',
    },
  },
  openGraph: {
    title: 'Find Parking | PayParq',
    description: 'Search and book verified parking spaces in your area',
    type: 'website',
    url: 'https://www.payparq.com/search',
  },
  manifest: '/manifest-search.json',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
