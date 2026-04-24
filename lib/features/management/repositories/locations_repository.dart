import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:typed_data';

class LocationsRepository {
  final SupabaseClient _client;

  LocationsRepository(this._client);

  Future<void> updateVerificationMetadata(
      String id, Map<String, dynamic> metadata) async {
    await _client
        .from('locations')
        .update({'verification_metadata': metadata}).eq('id', id);
  }

  Future<void> updateCapacity(String id, int capacity) async {
    await _client.from('locations').update({
      'capacity': capacity,
      'total_spots': capacity,
    }).eq('id', id);
  }

  Future<void> updateLocationDetails({
    required String id,
    required String name,
    required String? address,
    required double latitude,
    required double longitude,
    required int capacity,
  }) async {
    await _client.from('locations').update({
      'name': name.trim(),
      'address': (address ?? '').trim(),
      'latitude': latitude,
      'longitude': longitude,
      'capacity': capacity,
      'total_spots': capacity,
    }).eq('id', id);
  }

  Future<void> relocateVerifiedLocation({
    required String id,
    required String name,
    required String? address,
    required double latitude,
    required double longitude,
    required int capacity,
    required Map<String, dynamic> currentMetadata,
    required String? movedBy,
    required double oldLat,
    required double oldLng,
    required String? reason,
  }) async {
    final newMeta = Map<String, dynamic>.from(currentMetadata);
    newMeta['hub_enabled'] = false;
    await _client.from('locations').update({
      'name': name.trim(),
      'address': (address ?? '').trim(),
      'latitude': latitude,
      'longitude': longitude,
      'capacity': capacity,
      'total_spots': capacity,
      'verification_status': 'pending',
      'verification_metadata': newMeta,
    }).eq('id', id);
    try {
      await _client.from('location_move_log').insert({
        'location_id': id,
        if (movedBy != null) 'moved_by': movedBy,
        'old_lat': oldLat,
        'old_lng': oldLng,
        'new_lat': latitude,
        'new_lng': longitude,
        'reason': reason,
        'affected_sessions': <dynamic>[],
      });
    } catch (_) {}
  }

  Future<void> updateVerificationPhotos(
      String id, List<String> photoUrls) async {
    await _client
        .from('locations')
        .update({'verification_photos': photoUrls}).eq('id', id);
  }

  Future<void> uploadVerificationFile({
    required String fileName,
    required Uint8List bytes,
    required String mimeType,
  }) async {
    await _client.storage.from('location-verification').uploadBinary(
          fileName,
          bytes,
          fileOptions: FileOptions(contentType: mimeType, upsert: true),
        );
  }

  String getVerificationPublicUrl(String fileName) {
    return _client.storage.from('location-verification').getPublicUrl(fileName);
  }

  Future<void> updateServiceFlags(
      String id, {required bool valetEnabled, required bool shuttleEnabled}) async {
    await _client.from('locations').update({
      'valet_enabled': valetEnabled,
      'shuttle_enabled': shuttleEnabled,
    }).eq('id', id);
  }

  Future<void> updateAddonsConfig(String id, Map<String, dynamic> config) async {
    await _client.from('locations').update({'addons_config': config}).eq('id', id);
  }

  Future<Map<String, dynamic>> createLocation({
    required String name,
    required String address,
    required double latitude,
    required double longitude,
    required int capacity,
    required String? ownerId,
  }) async {
    final resolvedOwnerId =
        (ownerId ?? Supabase.instance.client.auth.currentUser?.id)?.trim();
    if (resolvedOwnerId == null || resolvedOwnerId.isEmpty) {
      throw Exception('Missing owner id for location creation.');
    }
    final normalizedCapacity = capacity < 1 ? 1 : capacity;
    final generatedDisplayId =
        (DateTime.now().millisecondsSinceEpoch % 90000) + 10000;
    final normalizedName = name.trim();
    final normalizedAddress = address.trim();
    final slugSeed = normalizedName.isEmpty
        ? generatedDisplayId.toString()
        : normalizedName
            .toLowerCase()
            .replaceAll(RegExp(r'[^a-z0-9\s-]'), '')
            .replaceAll(RegExp(r'\s+'), '-');
    final response = await _client
        .from('locations')
        .insert({
          'name': normalizedName,
          'address': normalizedAddress,
          'latitude': latitude,
          'longitude': longitude,
          'capacity': normalizedCapacity,
          'total_spots': normalizedCapacity,
          'occupancy': 0,
          'owner_id': resolvedOwnerId,
          'display_id': generatedDisplayId.toString(),
          'verification_status': 'unverified',
          'verification_metadata': {
            'hub_enabled': false,
            'hub_slug': slugSeed,
          },
          'canonical_slug': '$slugSeed-$generatedDisplayId',
          'base_price_hourly': 5,
          'base_price_daily': 20,
          'base_price_monthly': 150,
          'dynamic_pricing_enabled': false,
          'dynamic_pricing_ratio': 100,
          'surcharge_enabled': false,
          'surcharge_multiplier': 1,
          'autopilot_enabled': false,
          'rate_per_hour_ceiling': 0,
          'base_price_daily_ceiling': 0,
          'base_price_monthly_ceiling': 0,
          'is_run_by_payparq': false,
          'comm_payparq_enforcement': 0.5,
          'comm_admin_photo_enforcement': 0.25,
          'comm_admin_flyer_payment': 0.15,
          'comm_regular_payment': 0.15,
        })
        .select()
        .maybeSingle();
    if (response == null) {
      throw Exception('Failed to create location record.');
    }
    return Map<String, dynamic>.from(response);
  }
}
