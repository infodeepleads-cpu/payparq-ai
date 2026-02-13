import 'package:supabase_flutter/supabase_flutter.dart';

class LocationsRepository {
  final SupabaseClient _client;

  LocationsRepository(this._client);

  Future<void> updateVerificationMetadata(
      String id, Map<String, dynamic> metadata) async {
    await _client
        .from('locations')
        .update({'verification_metadata': metadata})
        .eq('id', id);
  }

  Future<void> updateCapacity(String id, int capacity) async {
    await _client.from('locations').update({
      'capacity': capacity,
      'total_spots': capacity,
    }).eq('id', id);
  }

  Future<Map<String, dynamic>> createLocation({
    required String name,
    required String address,
    required double latitude,
    required double longitude,
    required int capacity,
    required String? ownerId,
  }) async {
    final response = await _client
        .from('locations')
        .insert({
          'name': name,
          'address': address,
          'latitude': latitude,
          'longitude': longitude,
          'capacity': capacity,
          'total_spots': capacity,
          'owner_id': ownerId ?? Supabase.instance.client.auth.currentUser?.id,
        })
        .select()
        .maybeSingle();
    if (response == null) {
      throw Exception('Failed to create location record.');
    }
    return Map<String, dynamic>.from(response);
  }
}
