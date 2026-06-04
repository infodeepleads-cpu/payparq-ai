import type { Metadata } from 'next';
import { CITIES } from '@/data/cities';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = CITIES[slug];

  if (!city) {
    return {
      title: 'City Not Found | Payparq',
      description: 'The city you are looking for could not be found.',
    };
  }

  const title = `Parking in ${city.name} | Affordable & Safe | Payparq`;
  const description = `Find parking in ${city.name}. Book parking spots at ${city.name} with Payparq - affordable rates, secure locations, instant confirmation. Reserve your spot now!`;
  const url = `https://www.payparq.com/city/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Payparq',
      images: [
        {
          url: 'https://www.payparq.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `Parking in ${city.name}`,
        },
      ],
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function CityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
