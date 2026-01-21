
import 'package:supabase_flutter/supabase_flutter.dart' hide Provider;
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Repository for handling all parking-related data interactions with Supabase.
/// This abstracts the data layer from the UI, following Clean Architecture principles.
class ParkingRepository {
  final SupabaseClient _client;

  ParkingRepository(this._client);

  /// Streams list of parking permits (users/subscriptions).
  Stream<List<Map<String, dynamic>>> getPermitsStream() {
    return _client
        .from('parking_permits')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .handleError((error) {
          print('Error in permits stream: $error');
        });
  }

  /// Streams list of active parking sessions (scan/pay).
  Stream<List<Map<String, dynamic>>> getSessionsStream() {
    return _client
        .from('parking_sessions')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .handleError((error) {
          print('Error in sessions stream: $error');
        });
  }

  /// Streams location data (occupancy, settings).
  Stream<List<Map<String, dynamic>>> getLocationsStream() {
    return _client
        .from('locations')
        .stream(primaryKey: ['id'])
        .order('updated_at', ascending: false)
        .handleError((error) {
          print('Error in locations stream: $error');
        });
  }

  /// Deletes a parking permit.
  Future<void> deletePermit(String id) async {
    await _client.from('parking_permits').delete().eq('id', id);
  }

  /// Deletes a staff member (app_user).
  Future<void> deleteStaff(String id) async {
    await _client.from('app_users').delete().eq('id', id);
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
final permitsStreamProvider = StreamProvider((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  return repo.getPermitsStream();
});

final sessionsStreamProvider = StreamProvider((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  return repo.getSessionsStream();
});

final locationsStreamProvider = StreamProvider((ref) {
  final repo = ref.watch(parkingRepositoryProvider);
  return repo.getLocationsStream();
});
