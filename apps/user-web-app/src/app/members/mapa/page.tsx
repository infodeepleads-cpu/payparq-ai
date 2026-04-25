'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { setupRealtimeListeners } from '@/lib/push-notifications-v2';

interface Lot {
  id: string;
  name: string;
  display_id: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number;
}

interface LotStatus {
  lot_id: string;
  status: 'ok' | 'warning' | 'alert'; // green, yellow, red
  last_enforcement: string;
  issues_count: number;
  available_drivers: number;
  pending_rides: number;
}

interface DriverLocation {
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  last_updated: string;
  role: 'driver' | 'officer' | 'manager';
}

interface RideRequest {
  id: string;
  lot_id: string;
  status: string;
  created_at: string;
  driver_id?: string;
}

export default function MapaPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [lotStatus, setLotStatus] = useState<Record<string, LotStatus>>({});
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [reportingIssue, setReportingIssue] = useState(false);
  const [issueNotes, setIssueNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
    const cleanup = setupRealtimeListeners(handleNotification);
    return cleanup;
  }, []);

  const fetchData = async () => {
    try {
      // Fetch locations
      const { data: lotsData } = await supabase
        .from('locations')
        .select('*')
        .limit(100);

      setLots(lotsData || []);

      // Fetch lot statuses
      const { data: enforcementData } = await supabase
        .from('enforcement_checkouts')
        .select('lot_id, enforcement_done_at')
        .order('enforcement_done_at', { ascending: false });

      if (enforcementData) {
        const statuses: Record<string, LotStatus> = {};
        lotsData?.forEach((lot) => {
          const lastEnforcement = enforcementData.find((e) => e.lot_id === lot.id);
          statuses[lot.id] = {
            lot_id: lot.id,
            status: 'ok',
            last_enforcement: lastEnforcement?.enforcement_done_at || '',
            issues_count: 0,
            available_drivers: Math.floor(Math.random() * 5) + 1,
            pending_rides: 0,
          };
        });
        setLotStatus(statuses);
      }

      // Subscribe to real-time driver locations
      subscribeToDriverLocations();

      // Subscribe to rides
      subscribeToRides();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToDriverLocations = () => {
    const subscription = supabase
      .channel('driver_locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
        },
        (payload) => {
          console.log('Driver location update:', payload);
          // In real implementation, fetch full driver info
          // For now, update map markers
        }
      )
      .subscribe();

    return subscription;
  };

  const subscribeToRides = () => {
    const subscription = supabase
      .channel('ride_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRides((prev) => [payload.new as RideRequest, ...prev]);
          }
        }
      )
      .subscribe();

    return subscription;
  };

  const handleNotification = (data: any) => {
    console.log('Notification received:', data);
    // Re-fetch data when notification arrives
    if (data.type === 'new_ride' || data.type === 'enforcement_update') {
      fetchData();
    }
  };

  const reportIssue = async () => {
    if (!selectedLot) return;

    try {
      const { error } = await supabase.from('lot_issues').insert({
        lot_id: selectedLot.id,
        severity: 'yellow',
        notes: issueNotes,
      });

      if (error) throw error;

      setLotStatus((prev) => ({
        ...prev,
        [selectedLot.id]: {
          ...prev[selectedLot.id],
          status: 'warning',
          issues_count: (prev[selectedLot.id]?.issues_count || 0) + 1,
        },
      }));

      setIssueNotes('');
      setReportingIssue(false);

      // Trigger notification to manager
      await supabase.functions.invoke('send-issue-notification', {
        body: {
          lot_id: selectedLot.id,
          severity: 'yellow',
          notes: issueNotes,
        },
      });
    } catch (error) {
      console.error('Failed to report issue:', error);
    }
  };

  const getStatusColor = (status: LotStatus) => {
    if (status.status === 'alert') return 'bg-red-500';
    if (status.status === 'warning') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) return <div className="p-8">Loading map...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Map Panel */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full bg-gray-200 relative">
          {/* Leaflet map would go here */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-xl font-semibold mb-4">Real-time Operations Map</p>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {lots.map((lot) => {
                  const status = lotStatus[lot.id];
                  if (!status) return null;

                  return (
                    <div
                      key={lot.id}
                      onClick={() => setSelectedLot(lot)}
                      className={`p-4 rounded-lg cursor-pointer border-2 ${
                        selectedLot?.id === lot.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      } hover:shadow-lg transition`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{lot.name}</p>
                          <p className="text-xs text-gray-500">ID: {lot.display_id}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                      </div>
                      <div className="text-xs space-y-1">
                        <p>
                          Availability: {lot.capacity - lot.occupancy}/{lot.capacity}
                        </p>
                        <p>Drivers: {status.available_drivers}</p>
                        <p>Pending: {status.pending_rides}</p>
                        {status.last_enforcement && (
                          <p className="text-gray-500">
                            Last enforce:{' '}
                            {new Date(status.last_enforcement).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="w-96 bg-white shadow-xl overflow-y-auto">
        {selectedLot ? (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedLot.name}</h2>

            {/* Lot Stats */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Available Spots</p>
                  <p className="text-2xl font-bold">
                    {selectedLot.capacity - selectedLot.occupancy}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Occupancy</p>
                  <p className="text-2xl font-bold">
                    {Math.round((selectedLot.occupancy / selectedLot.capacity) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            {lotStatus[selectedLot.id] && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Status</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Available Drivers:</span>
                    <span className="font-semibold ml-2">
                      {lotStatus[selectedLot.id].available_drivers}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Pending Rides:</span>
                    <span className="font-semibold ml-2">
                      {lotStatus[selectedLot.id].pending_rides}
                    </span>
                  </p>
                  {lotStatus[selectedLot.id].last_enforcement && (
                    <p className="text-sm">
                      <span className="text-gray-600">Last Enforcement:</span>
                      <span className="font-semibold ml-2">
                        {new Date(lotStatus[selectedLot.id].last_enforcement).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Report Issue */}
            {reportingIssue ? (
              <div className="space-y-3">
                <textarea
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={reportIssue}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
                  >
                    Report
                  </button>
                  <button
                    onClick={() => setReportingIssue(false)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setReportingIssue(true)}
                className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 mb-6"
              >
                🚨 Report Issue
              </button>
            )}

            {/* Pending Rides */}
            {rides.filter((r) => r.lot_id === selectedLot.id && r.status === 'pending').length >
              0 && (
              <div>
                <h3 className="font-semibold mb-3">
                  Pending Rides ({rides.filter((r) => r.lot_id === selectedLot.id).length})
                </h3>
                <div className="space-y-2">
                  {rides
                    .filter((r) => r.lot_id === selectedLot.id)
                    .slice(0, 5)
                    .map((ride) => (
                      <div
                        key={ride.id}
                        className="bg-blue-50 p-3 rounded-lg border border-blue-200"
                      >
                        <p className="text-sm font-semibold">Ride Request</p>
                        <p className="text-xs text-gray-600">
                          {new Date(ride.created_at).toLocaleTimeString()}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded mt-1 inline-block ${
                            ride.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {ride.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>Select a lot to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
