import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../logic/providers/auth_providers.dart';
import '../repositories/locations_repository.dart';
import '../repositories/parking_repository.dart';
import '../../../services/app_error.dart';

final locationsRepositoryProvider = Provider<LocationsRepository>((ref) {
  return LocationsRepository(Supabase.instance.client);
});

final locationsControllerProvider = Provider<LocationsController>((ref) {
  final repo = ref.watch(locationsRepositoryProvider);
  return LocationsController(ref, repo);
});

class LocationsController {
  final Ref _ref;
  final LocationsRepository _repo;

  LocationsController(this._ref, this._repo);

  Future<void> deleteLocation(String id, String displayId) async {
    try {
      if (_ref.read(selectedLocationIdProvider) == displayId) {
        _ref.read(selectedLocationIdProvider.notifier).state = null;
      }
      await _ref.read(parkingRepositoryProvider).deleteLocation(id);
      _ref.invalidate(availableLocationsProvider);
    } catch (e) {
      throw AppError('Delete failed: $e', cause: e);
    }
  }

  Future<String> updateHubDesignation(
      Map<String, dynamic> loc, bool enabled) async {
    final id = loc['id'].toString();
    final Map<String, dynamic> meta =
        (loc['verification_metadata'] ?? {}) as Map<String, dynamic>;
    final Map<String, dynamic> newMeta = Map<String, dynamic>.from(meta);
    newMeta['hub_enabled'] = enabled;
    final displayId = (loc['display_id'] ?? '').toString();
    final name = (loc['name'] ?? '').toString().toLowerCase();
    final safeName = name
        .replaceAll(RegExp(r'[^a-z0-9\\s-]'), '')
        .replaceAll(RegExp(r'\\s+'), '-');
    final slug = (safeName.isNotEmpty ? safeName : displayId).toLowerCase();
    newMeta['hub_slug'] = slug;
    await _repo.updateVerificationMetadata(id, newMeta);
    _ref.invalidate(locationsStreamProvider);
    return slug;
  }

  Future<void> updateCapacity(String id, int capacity) async {
    try {
      await _repo.updateCapacity(id, capacity);
      _ref.invalidate(locationsStreamProvider);
    } catch (e) {
      throw AppError('Update failed: $e', cause: e);
    }
  }

  Future<String> createLocation({
    required String name,
    required String address,
    required double latitude,
    required double longitude,
    required int capacity,
    required String? ownerId,
  }) async {
    final response = await _repo.createLocation(
      name: name,
      address: address,
      latitude: latitude,
      longitude: longitude,
      capacity: capacity,
      ownerId: ownerId,
    );
    final newLocId = response['id']?.toString();
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    if (newLocId != null && currentUserId != null) {
      try {
        await Supabase.instance.client.from('officer_assignments').insert({
          'officer_id': currentUserId,
          'location_id': newLocId,
          'assigned_by': currentUserId,
        });
      } catch (_) {}
    }
    final newDisplayId = response['display_id']?.toString();
    if (newDisplayId == null || newDisplayId.isEmpty) {
      throw const AppError('Location created without display ID');
    }
    _ref.read(selectedLocationIdProvider.notifier).state = newDisplayId;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_location_display_id', newDisplayId);
    // tiny delay to let the dialog pop before streams rebuild
    await Future.delayed(const Duration(milliseconds: 50));
    _ref.invalidate(selectedLocationUuidProvider);
    _ref.invalidate(selectedEffectiveLocationUuidProvider);
    _ref.invalidate(locationsStreamProvider);
    _ref.invalidate(availableLocationsProvider);
    return newDisplayId;
  }
}
