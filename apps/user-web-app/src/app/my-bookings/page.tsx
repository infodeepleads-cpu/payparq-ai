'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader } from '@/components/SiteHeader';
import { MapPin, Clock, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  locationId: string;
  locationName: string;
  address: string;
  startDate: string;
  startTime: string;
  duration: number;
  totalCost: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  bookingTime: string;
}

export default function MyBookingsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingFilter, setUpcomingFilter] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // User not logged in
          return;
        }

        // Query parking sessions
        const { data: sessions, error } = await supabase
          .from('parking_sessions')
          .select(
            'id, location_id, booking_time, checkout_time, duration, total_cost, status'
          )
          .eq('user_id', user.id)
          .order('checkout_time', { ascending: false });

        if (error) throw error;

        if (sessions) {
          // Fetch location details for each session
          const bookingsData = await Promise.all(
            sessions.map(async (session: any) => {
              const { data: location } = await supabase
                .from('locations')
                .select('name, address')
                .eq('id', session.location_id)
                .single();

              const checkoutTime = new Date(session.checkout_time);
              const startDate = checkoutTime.toISOString().split('T')[0];
              const startTime = checkoutTime.toTimeString().split(':').slice(0, 2).join(':');

              return {
                id: session.id,
                locationId: session.location_id,
                locationName: location?.name || 'Unknown Location',
                address: location?.address || '',
                startDate,
                startTime,
                duration: session.duration,
                totalCost: session.total_cost,
                status: session.status,
                bookingTime: session.booking_time,
              };
            })
          );

          setBookings(bookingsData);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const checkoutTime = new Date(booking.startDate + 'T' + booking.startTime);
    const isUpcoming = checkoutTime > new Date();
    return upcomingFilter ? isUpcoming : !isUpcoming;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#5F3DFC] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-600">View your parking reservations</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setUpcomingFilter(true)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                upcomingFilter
                  ? 'border-[#5F3DFC] text-[#5F3DFC]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setUpcomingFilter(false)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                !upcomingFilter
                  ? 'border-[#5F3DFC] text-[#5F3DFC]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Past
            </button>
          </div>

          {/* Bookings list */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                {upcomingFilter ? 'No upcoming bookings' : 'No past bookings'}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {upcomingFilter
                  ? 'Start exploring parking spaces to make your first booking'
                  : ''}
              </p>
              {upcomingFilter && (
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#5F3DFC] text-white font-semibold rounded-lg hover:bg-[#4330c4] transition-colors"
                >
                  Find Parking
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.locationName}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        {booking.address}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Date</p>
                      <p className="font-semibold text-gray-900">{booking.startDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Time</p>
                      <p className="font-semibold text-gray-900">{booking.startTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="font-semibold text-gray-900">{booking.duration} hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total</p>
                      <p className="font-semibold text-gray-900">
                        ${booking.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
