import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart' hide Provider;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../logic/providers/auth_providers.dart';

/// Repository for handling all parking-related data interactions with Supabase.
/// This abstracts the data layer from the UI, following Clean Architecture principles.
class ParkingRepository {
  final SupabaseClient _client;

  ParkingRepository(this._client);

  /// Streams list of parking permits (users/subscriptions).
  Stream<List<Map<String, dynamic>>> getPermitsStream({String? locationId}) {
    if (locationId != null) {
      return _client
          .from('parking_permits')
          .stream(primaryKey: ['id'])
          .eq('location_id', locationId)
          .order('created_at', ascending: false);
    }
    return _client
        .from('parking_permits')
        .stream(primaryKey: ['id']).order('created_at', ascending: false);
  }

  /// Streams list of active parking sessions (scan/pay).
  Stream<List<Map<String, dynamic>>> getSessionsStream({String? locationId}) {
    if (locationId != null) {
      return _client
          .from('parking_sessions')
          .stream(primaryKey: ['id'])
          .eq('location_id', locationId)
          .order('created_at', ascending: false);
    }
    return _client
        .from('parking_sessions')
        .stream(primaryKey: ['id']).order('created_at', ascending: false);
  }

  /// Streams location data (occupancy, settings).
  Stream<List<Map<String, dynamic>>> getLocationsStream(
      {String? locationId, String? ownerId}) {
    if (ownerId != null) {
      return _client
          .from('locations')
          .stream(primaryKey: ['id'])
          .eq('owner_id', ownerId)
          .order('updated_at', ascending: false);
    } else if (locationId != null) {
      return _client
          .from('locations')
          .stream(primaryKey: ['id'])
          .eq('display_id', locationId)
          .order('updated_at', ascending: false);
    }

    return _client
        .from('locations')
        .stream(primaryKey: ['id']).order('updated_at', ascending: false);
  }

  /// Streams list of enforcement violations (cases).
  Stream<List<Map<String, dynamic>>> getViolationsStream({String? locationId}) {
    if (locationId != null) {
      return _client
          .from('violations')
          .stream(primaryKey: ['id'])
          .eq('location_id', locationId)
          .order('issued_at', ascending: false);
    }
    return _client
        .from('violations')
        .stream(primaryKey: ['id']).order('issued_at', ascending: false);
  }

  /// Streams list of staff (profiles).
  Stream<List<Map<String, dynamic>>> getStaffStream(
      {String? locationId, bool isSuperAdmin = false}) {
    // We rely on RLS to filter what the user can see.
    // Owners see staff for their lots, Managers see staff for assigned lots.
    if (locationId != null) {
      return _client
          .from('profiles')
          .stream(primaryKey: ['id'])
          .eq('location_id', locationId)
          .order('created_at', ascending: false);
    }

    return _client
        .from('profiles')
        .stream(primaryKey: ['id']).order('created_at', ascending: false);
  }

  /// Deletes a parking permit.
  Future<void> deletePermit(String id) async {
    await _client.from('parking_permits').delete().eq('id', id);
  }

  /// Deletes a staff member (Auth + Profile).
  Future<void> deleteStaff(String id) async {
    // We must use an Edge Function to delete from Auth as well
    await _client.functions.invoke('delete-staff', body: {'userId': id});
  }

  /// Deletes a location.
  Future<void> deleteLocation(String id) async {
    await _client.from('locations').delete().eq('id', id);
  }
}

/// Provider for the ParkingRepository.
/// UI widgets should watch this provider to access repository methods.
final parkingRepositoryProvider = Provider<ParkingRepository>((ref) {
  return ParkingRepository(Supabase.instance.client);
});

/// Stream Providers for easier consumption in UI
final permitsStreamProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  if (profile == null) return Stream.value([]);

  final selectedId = ref.watch(selectedLocationIdProvider);
  if (selectedId == null) return Stream.value([]);

  return repo.getPermitsStream(locationId: selectedId);
});

final sessionsStreamProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  if (profile == null) return Stream.value([]);

  final selectedId = ref.watch(selectedLocationIdProvider);
  if (selectedId == null) return Stream.value([]);

  return repo.getSessionsStream(locationId: selectedId);
});

final staffStreamProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  if (profile == null) return Stream.value([]);

  final selectedId = ref.watch(selectedLocationIdProvider);
  final isSuperAdmin = profile['role'] == 'super_admin';

  return repo.getStaffStream(
      locationId: selectedId, isSuperAdmin: isSuperAdmin);
});

final locationsStreamProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  if (profile == null) return Stream.value([]);

  final selectedId = ref.watch(selectedLocationIdProvider);
  final isSuperAdmin = profile['role'] == 'super_admin';
  final isAdmin = profile['role'] == 'admin';

  Stream<List<Map<String, dynamic>>> getBaseStream() {
    // Locations stream is special: it might need to show all for the selector
    if (isSuperAdmin) return repo.getLocationsStream();
    if (isAdmin) return repo.getLocationsStream(ownerId: profile['id']);
    return repo.getLocationsStream(
        locationId: selectedId ?? profile['location_id']);
  }

  final controller = StreamController<List<Map<String, dynamic>>>();
  void fetch() async {
    try {
      final data = await getBaseStream().first;
      if (!controller.isClosed) controller.add(data);
    } catch (e) {
      if (!controller.isClosed) controller.add([]);
    }
  }

  fetch();
  final sub = getBaseStream().listen((d) {
    if (!controller.isClosed) controller.add(d);
  });
  ref.onDispose(() {
    sub.cancel();
    controller.close();
  });
  return controller.stream;
});

final violationsStreamProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  final profile = ref.watch(userProfileProvider).value;
  if (profile == null) return Stream.value([]);

  final selectedId = ref.watch(selectedLocationIdProvider);
  if (selectedId == null) return Stream.value([]);

  // Use a simple stream directly from the client for maximum reliability on web
  return repo.getViolationsStream(locationId: selectedId);
});
