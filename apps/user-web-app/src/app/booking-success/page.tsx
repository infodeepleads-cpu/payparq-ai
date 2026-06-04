'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, MapPin, Clock } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyCheckout = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // In production, verify the session with your backend
        // For now, just show success
        setLoading(false);
      } catch (err) {
        console.error('Error verifying checkout:', err);
        setLoading(false);
      }
    };

    verifyCheckout();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#5F3DFC] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Processing your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="hidden md:block">
        <SiteHeader />
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>

          <p className="text-gray-600 mb-8">
            Your parking space has been reserved. A confirmation email has been sent to your registered email address.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#5F3DFC] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Booking Time</p>
                <p className="text-sm text-gray-600">
                  Your parking is reserved for 3 hours from the start time
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#5F3DFC] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">What's Next?</p>
                <p className="text-sm text-gray-600">
                  Visit the parking location and scan the QR code on arrival to activate your booking
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/search"
              className="block w-full px-6 py-3 bg-[#5F3DFC] text-white font-semibold rounded-lg hover:bg-[#4330c4] transition-colors"
            >
              Find More Parking
            </Link>
            <Link
              href="/"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-8">
            Session ID: {sessionId ? sessionId.slice(0, 20) + '...' : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
