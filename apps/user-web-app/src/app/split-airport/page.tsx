'use client';

import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { ArrowRight, Check, Star, Phone } from 'lucide-react';

export default function SplitAirportPage() {
  const router = useRouter();

  const handleBookNow = () => {
    router.push('/search?location=split-airport');
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Book Your Parking Spot at Split Airport</h1>
          <p className="text-xl text-blue-100 mb-8">Guaranteed spot. Instant booking. 24/7 support.</p>
          <button
            onClick={handleBookNow}
            className="bg-white text-blue-600 font-bold py-4 px-8 rounded-lg text-lg hover:bg-gray-100 transition inline-flex items-center gap-2"
          >
            Book Now
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose PayParq?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Check className="text-green-500 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-bold mb-2">Guaranteed Parking Spot</h3>
              <p className="text-gray-600">Your space is reserved. No searching, no disappointment.</p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Check className="text-green-500 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-bold mb-2">Book in 2 Minutes</h3>
              <p className="text-gray-600">Fast, simple booking process. Instant confirmation.</p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Check className="text-green-500 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-bold mb-2">Save Up to 70%</h3>
              <p className="text-gray-600">Cheaper than airport parking. Quality guaranteed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Trusted by Travelers</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Trust Item 1 */}
            <div>
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={24} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-2">5,000+ Happy Travelers</p>
              <p className="text-sm text-gray-500">"Best parking solution in Split!"</p>
            </div>

            {/* Trust Item 2 */}
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-4">365</div>
              <p className="text-gray-600 mb-2">Days of Customer Support</p>
              <p className="text-sm text-gray-500">Available 24/7 when you need us</p>
            </div>

            {/* Trust Item 3 */}
            <div>
              <div className="text-4xl font-bold text-green-600 mb-4">100%</div>
              <p className="text-gray-600 mb-2">Satisfaction Guaranteed</p>
              <p className="text-sm text-gray-500">Free cancellation up to booking time</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-lg">1</div>
              <div>
                <h3 className="font-bold text-lg">Enter Your Dates</h3>
                <p className="text-gray-600">Tell us when you need parking at Split Airport</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-lg">2</div>
              <div>
                <h3 className="font-bold text-lg">Browse Options</h3>
                <p className="text-gray-600">See available parking spots with prices and features</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-lg">3</div>
              <div>
                <h3 className="font-bold text-lg">Book Instantly</h3>
                <p className="text-gray-600">Confirm your spot and receive instant confirmation</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-lg">4</div>
              <div>
                <h3 className="font-bold text-lg">Show Your Pass</h3>
                <p className="text-gray-600">Display your parking pass at the entrance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Spot?</h2>
          <p className="text-xl text-blue-100 mb-8">Save up to 70% on parking at Split Airport</p>
          <button
            onClick={handleBookNow}
            className="bg-white text-blue-600 font-bold py-4 px-8 rounded-lg text-lg hover:bg-gray-100 transition inline-flex items-center gap-2"
          >
            Book Now
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-4 bg-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-6">Need help? We're here for you 24/7</p>
          <div className="flex justify-center items-center gap-2 text-blue-600 font-bold">
            <Phone size={20} />
            <span>+385 1 234 5678</span>
          </div>
        </div>
      </section>
    </div>
  );
}
