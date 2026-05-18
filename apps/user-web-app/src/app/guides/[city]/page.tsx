'use client';

import { useEffect, useState } from 'react';
import { MapPin, DollarSign, Shield, Users } from 'lucide-react';

interface CityGuideData {
  city: string;
  country: string;
  description: string;
  tips: string[];
  averagePrice: number;
}

const cityData: Record<string, CityGuideData> = {
  'zagreb': {
    city: 'Zagreb',
    country: 'Croatia',
    description: 'The capital of Croatia with rich history, vibrant culture, and growing parking infrastructure.',
    tips: [
      'Peak hours are 8-10 AM and 4-6 PM on weekdays',
      'City center parking can be expensive - consider garages',
      'Public transportation is cheaper than parking in some areas',
      'Many locations offer monthly discounts',
    ],
    averagePrice: 2.5,
  },
  'split': {
    city: 'Split',
    country: 'Croatia',
    description: 'Coastal city known for its beaches and Dalmatian charm. Summer season sees higher parking demand.',
    tips: [
      'Tourism peaks June-August with higher parking rates',
      'Beach areas are crowded - arrive early or use parking apps',
      'Long-term parking offers better rates',
      'Street parking fills up quickly in summer',
    ],
    averagePrice: 3.0,
  },
  'rijeka': {
    city: 'Rijeka',
    country: 'Croatia',
    description: 'Major port city with modern parking facilities and competitive rates.',
    tips: [
      'Port area has dedicated parking for visitors',
      'City center parking is moderate',
      'Winter parking is more affordable',
    ],
    averagePrice: 2.0,
  },
  'vienna': {
    city: 'Vienna',
    country: 'Austria',
    description: 'Austria\'s capital with excellent parking infrastructure and public transport.',
    tips: [
      'Consider public transport - parking is expensive',
      'District permits required for residential parking',
      'Garages are more convenient than street parking',
    ],
    averagePrice: 3.5,
  },
  'ljubljana': {
    city: 'Ljubljana',
    country: 'Slovenia',
    description: 'Small but charming capital with good parking facilities and walkable center.',
    tips: [
      'City is compact and very walkable',
      'Parking outside center is cheaper',
      'Bike lanes are extensive',
    ],
    averagePrice: 1.8,
  },
  'belgrade': {
    city: 'Belgrade',
    country: 'Serbia',
    description: 'Dynamic capital with growing parking infrastructure and affordable rates.',
    tips: [
      'Parking is very affordable compared to EU cities',
      'City center parking can be complicated',
      'New garages opening regularly',
    ],
    averagePrice: 1.2,
  },
};

export default function CityGuidePage({ params }: { params: Promise<{ city: string }> }) {
  const [city, setCity] = useState<string>('');
  const [data, setData] = useState<CityGuideData | null>(null);

  useEffect(() => {
    params.then(({ city: cityParam }) => {
      const normalizedCity = cityParam.toLowerCase();
      setCity(normalizedCity);
      setData(cityData[normalizedCity] || null);
    });
  }, [params]);

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen">City guide not found</div>;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.payparq.com';

  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'Guide',
    name: `${data.city} Parking Guide`,
    description: data.description,
    author: {
      '@type': 'Organization',
      name: 'Payparq',
    },
    datePublished: new Date().toISOString().split('T')[0],
    mainEntity: {
      '@type': 'City',
      name: data.city,
      areaServed: data.country,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">{data.city} Parking Guide</h1>
            <p className="text-xl opacity-90">{data.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Average Hourly Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{data.averagePrice}€</p>
                </div>
                <DollarSign size={32} className="text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">City</p>
                  <p className="text-2xl font-bold text-indigo-600">{data.city}</p>
                </div>
                <MapPin size={32} className="text-indigo-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Country</p>
                  <p className="text-2xl font-bold text-purple-600">{data.country}</p>
                </div>
                <Shield size={32} className="text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Parking Tips</p>
                  <p className="text-2xl font-bold text-green-600">{data.tips.length}</p>
                </div>
                <Users size={32} className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Parking Tips</h2>
            <div className="space-y-4">
              {data.tips.map((tip, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-gray-700 pt-1">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Find Parking in {data.city}</h3>
            <p className="mb-6">Book safe, secure parking with Payparq today</p>
            <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition">
              View Parking Locations
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
