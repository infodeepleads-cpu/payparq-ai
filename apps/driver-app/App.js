import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { supabase } from './supabase';

export default function App() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [rides, setRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);

  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

  useEffect(() => {
    const setupLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'Allow location to receive rides.');
        return;
      }

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        async pos => {
          const { latitude, longitude } = pos.coords;
          setLocation([longitude, latitude]);
          if (isOnline) {
            await updateDriverLocation(latitude, longitude);
          }
        }
      );
    };

    setupLocation();
  }, [isOnline]);

  useEffect(() => {
    const channel = supabase
      .channel('public:rides')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rides', filter: 'status=eq.requested' },
        payload => {
          setRides(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateDriverLocation = async (lat, lng) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return;

    await supabase.from('drivers').upsert({
      id: data.user.id,
      last_location: `POINT(${lng} ${lat})`,
      is_online: true,
      updated_at: new Date().toISOString(),
    });
  };

  const acceptRide = async ride => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return;

    const result = await supabase
      .from('rides')
      .update({ driver_id: data.user.id, status: 'accepted' })
      .eq('id', ride.id)
      .select()
      .single();

    if (!result.error) {
      setCurrentRide(result.data);
      setRides([]);
    }
  };

  const centerCoordinate = location || [15.98, 45.81];

  return (
    <SafeAreaView style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera zoomLevel={14} centerCoordinate={centerCoordinate} />
        {location && (
          <Mapbox.PointAnnotation id="me" coordinate={location}>
            <View style={styles.userMarker} />
          </Mapbox.PointAnnotation>
        )}
      </Mapbox.MapView>

      <View style={styles.overlay}>
        <TouchableOpacity
          style={[styles.onlineBtn, isOnline ? styles.btnOnline : styles.btnOffline]}
          onPress={() => setIsOnline(prev => !prev)}
        >
          <Text style={styles.btnText}>{isOnline ? 'ONLINE' : 'GO ONLINE'}</Text>
        </TouchableOpacity>

        {rides.length > 0 && !currentRide && (
          <View style={styles.requestCard}>
            <Text style={styles.requestTitle}>New Ride Request</Text>
            <Text style={styles.price}>{rides[0].estimated_price} EUR</Text>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRide(rides[0])}>
              <Text style={styles.acceptText}>ACCEPT</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentRide && (
          <View style={styles.requestCard}>
            <Text style={styles.requestTitle}>Ongoing Ride</Text>
            <Text style={styles.price}>{currentRide.pickup_address}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  userMarker: {
    height: 20,
    width: 20,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  onlineBtn: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
  },
  btnOffline: { backgroundColor: '#333' },
  btnOnline: { backgroundColor: '#4CAF50' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  requestCard: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  requestTitle: { fontWeight: 'bold', fontSize: 18 },
  price: { fontSize: 24, fontWeight: '900', marginVertical: 10 },
  acceptBtn: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 15,
  },
  acceptText: { color: '#fff', fontWeight: 'bold' },
});
