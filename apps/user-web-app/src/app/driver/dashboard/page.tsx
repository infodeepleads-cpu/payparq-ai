'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { setupRealtimeListeners } from '@/lib/push-notifications-v2';

interface RideRequest {
  id: string;
  lot_id: string;
  lot_name?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
  driver_id?: string;
  customer_email?: string;
}

interface DriverPerformance {
  driver_id: string;
  accepted_count: number;
  declined_count: number;
  completed_count: number;
  accept_rate: number;
  total_score: number;
  last_updated: string;
}

interface Lot {
  id: string;
  name: string;
  display_id: string;
}

export default function DriverDashboard() {
  const [pendingRides, setPendingRides] = useState<RideRequest[]>([]);
  const [acceptedRides, setAcceptedRides] = useState<RideRequest[]>([]);
  const [performance, setPerformance] = useState<DriverPerformance | null>(null);
  const [lots, setLots] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingRideId, setProcessingRideId] = useState<string | null>(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch all lots for reference
      const { data: lotsData } = await supabase
        .from('locations')
        .select('id, name');

      if (lotsData) {
        const lotMap = lotsData.reduce((acc, lot) => {
          acc[lot.id] = lot.name;
          return acc;
        }, {} as Record<string, string>);
        setLots(lotMap);
      }

      // Fetch driver's pending rides
      fetchPendingRides(user.id);

      // Fetch driver's accepted rides
      fetchAcceptedRides(user.id);

      // Fetch driver performance
      fetchPerformance(user.id);

      // Subscribe to ride_requests changes for this driver
      const rideSubscription = supabase
        .channel(`driver_rides:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ride_requests',
            filter: `driver_id=eq.${user.id}`,
          },
          () => {
            fetchAcceptedRides(user.id);
            fetchPerformance(user.id);
          }
        )
        .subscribe();

      setLoading(false);

      return () => {
        rideSubscription.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      setLoading(false);
    }
  };

  const fetchPendingRides = async (driverId: string) => {
    try {
      const { data } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const enriched = data.map(ride => ({
          ...ride,
          lot_name: lots[ride.lot_id] || ride.lot_id,
        }));
        setPendingRides(enriched);
      }
    } catch (error) {
      console.error('Failed to fetch pending rides:', error);
    }
  };

  const fetchAcceptedRides = async (driverId: string) => {
    try {
      const { data } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['accepted', 'completed'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const enriched = data.map(ride => ({
          ...ride,
          lot_name: lots[ride.lot_id] || ride.lot_id,
        }));
        setAcceptedRides(enriched);
      }
    } catch (error) {
      console.error('Failed to fetch accepted rides:', error);
    }
  };

  const fetchPerformance = async (driverId: string) => {
    try {
      const { data } = await supabase
        .from('driver_performance')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (data) {
        setPerformance(data);
      }
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!userId) return;

    setProcessingRideId(rideId);
    try {
      const response = await fetch('/api/rides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride_id: rideId,
          driver_id: userId,
          action: 'accept',
        }),
      });

      if (!response.ok) throw new Error('Failed to accept ride');

      // Refresh data
      await Promise.all([
        fetchPendingRides(userId),
        fetchAcceptedRides(userId),
        fetchPerformance(userId),
      ]);
    } catch (error) {
      console.error('Failed to accept ride:', error);
    } finally {
      setProcessingRideId(null);
    }
  };

  const declineRide = async (rideId: string) => {
    if (!userId) return;

    setProcessingRideId(rideId);
    try {
      const response = await fetch('/api/rides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride_id: rideId,
          driver_id: userId,
          action: 'decline',
        }),
      });

      if (!response.ok) throw new Error('Failed to decline ride');

      // Refresh data
      await Promise.all([
        fetchPendingRides(userId),
        fetchPerformance(userId),
      ]);
    } catch (error) {
      console.error('Failed to decline ride:', error);
    } finally {
      setProcessingRideId(null);
    }
  };

  const completeRide = async (rideId: string) => {
    if (!userId) return;

    setProcessingRideId(rideId);
    try {
      const response = await fetch('/api/rides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride_id: rideId,
          action: 'complete',
        }),
      });

      if (!response.ok) throw new Error('Failed to complete ride');

      // Refresh data
      await Promise.all([
        fetchAcceptedRides(userId),
        fetchPerformance(userId),
      ]);
    } catch (error) {
      console.error('Failed to complete ride:', error);
    } finally {
      setProcessingRideId(null);
    }
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">🚕 Driver Dashboard</h1>

        {/* Performance Metrics */}
        {performance && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Accept Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {performance.accept_rate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Rides Accepted</p>
              <p className="text-2xl font-bold text-green-600">{performance.accepted_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600">{performance.completed_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Score</p>
              <p className="text-2xl font-bold text-purple-600">{performance.total_score}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8">
          {/* Pending Rides */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-6">
              <h2 className="text-xl font-bold">
                📍 Available Rides ({pendingRides.length})
              </h2>
              <p className="text-sm text-gray-600">Tap to accept</p>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {pendingRides.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending rides available</p>
              ) : (
                pendingRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="border rounded-lg p-4 hover:shadow-md transition bg-blue-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">{ride.lot_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ride.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                        NEW
                      </span>
                    </div>
                    {ride.customer_email && (
                      <p className="text-xs text-gray-600 mb-3">{ride.customer_email}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRide(ride.id)}
                        disabled={processingRideId === ride.id}
                        className="flex-1 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:bg-gray-400"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => declineRide(ride.id)}
                        disabled={processingRideId === ride.id}
                        className="flex-1 bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 disabled:bg-gray-400"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Accepted Rides */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b p-6">
              <h2 className="text-xl font-bold">
                🚗 My Rides ({acceptedRides.length})
              </h2>
              <p className="text-sm text-gray-600">Your accepted rides</p>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {acceptedRides.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active rides</p>
              ) : (
                acceptedRides.map((ride) => (
                  <div
                    key={ride.id}
                    className={`border rounded-lg p-4 ${
                      ride.status === 'completed'
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">{ride.lot_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ride.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          ride.status === 'completed'
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-green-200 text-green-800'
                        }`}
                      >
                        {ride.status.toUpperCase()}
                      </span>
                    </div>
                    {ride.customer_email && (
                      <p className="text-xs text-gray-600 mb-3">{ride.customer_email}</p>
                    )}
                    {ride.status === 'accepted' && (
                      <button
                        onClick={() => completeRide(ride.id)}
                        disabled={processingRideId === ride.id}
                        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        ✓ Complete Ride
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
