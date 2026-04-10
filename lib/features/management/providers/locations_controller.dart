import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
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

  ({String ext, String mimeType}) _resolveImageFormat(
      XFile image, Uint8List bytes) {
    String? sanitizeExt(String? value) {
      if (value == null) return null;
      final v = value.trim().toLowerCase();
      if (v.isEmpty) return null;
      if (v == 'jpg') return 'jpeg';
      if ([
        'jpeg',
        'png',
        'webp',
        'heic',
        'heif',
        'avif',
      ].contains(v)) {
        return v;
      }
      return null;
    }

    String? extFromMime(String? mime) {
      if (mime == null || mime.isEmpty) return null;
      final normalized = mime.toLowerCase();
      if (normalized == 'image/jpg') return 'jpeg';
      if (normalized == 'image/jpeg') return 'jpeg';
      if (normalized == 'image/png') return 'png';
      if (normalized == 'image/webp') return 'webp';
      if (normalized == 'image/heic') return 'heic';
      if (normalized == 'image/heif') return 'heif';
      if (normalized == 'image/avif') return 'avif';
      return null;
    }

    String? extFromPathOrName(String source) {
      final dot = source.lastIndexOf('.');
      if (dot < 0 || dot + 1 >= source.length) return null;
      return sanitizeExt(source.substring(dot + 1));
    }

    String? extFromBytes(Uint8List data) {
      if (data.length >= 12 &&
          data[0] == 0xFF &&
          data[1] == 0xD8 &&
          data[2] == 0xFF) {
        return 'jpeg';
      }
      if (data.length >= 8 &&
          data[0] == 0x89 &&
          data[1] == 0x50 &&
          data[2] == 0x4E &&
          data[3] == 0x47) {
        return 'png';
      }
      if (data.length >= 12 &&
          data[0] == 0x52 &&
          data[1] == 0x49 &&
          data[2] == 0x46 &&
          data[3] == 0x46 &&
          data[8] == 0x57 &&
          data[9] == 0x45 &&
          data[10] == 0x42 &&
          data[11] == 0x50) {
        return 'webp';
      }
      if (data.length >= 16 &&
          data[4] == 0x66 &&
          data[5] == 0x74 &&
          data[6] == 0x79 &&
          data[7] == 0x70) {
        final brand = String.fromCharCodes(data.sublist(8, 12)).toLowerCase();
        if (brand == 'avif') return 'avif';
        if (brand == 'heic' ||
            brand == 'heix' ||
            brand == 'hevc' ||
            brand == 'hevx') {
          return 'heic';
        }
        if (brand == 'mif1' || brand == 'msf1') return 'heif';
      }
      return null;
    }

    final ext = extFromMime(image.mimeType) ??
        extFromPathOrName(image.name) ??
        extFromPathOrName(image.path) ??
        extFromBytes(bytes) ??
        'jpeg';

    final mimeType = ext == 'jpeg' ? 'image/jpeg' : 'image/$ext';
    return (ext: ext, mimeType: mimeType);
  }

  Future<void> deleteLocation(String id, String displayId) async {
    try {
      if (_ref.read(selectedLocationIdProvider) == displayId) {
        _ref.read(selectedLocationIdProvider.notifier).state = null;
        final userId = Supabase.instance.client.auth.currentUser?.id;
        await persistSelectedLocationPreference(
          userId: userId,
          displayId: null,
          uuid: null,
        );
        _ref.invalidate(selectedLocationUuidProvider);
        _ref.invalidate(selectedEffectiveLocationUuidProvider);
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

  Future<void> updateLocationDetails({
    required String id,
    required String name,
    required String? address,
    required double latitude,
    required double longitude,
    required int capacity,
    bool invalidateStream = true,
  }) async {
    try {
      await _repo.updateLocationDetails(
        id: id,
        name: name,
        address: address,
        latitude: latitude,
        longitude: longitude,
        capacity: capacity,
      );
      if (invalidateStream) {
        _ref.invalidate(locationsStreamProvider);
      }
    } catch (e) {
      throw AppError('Update failed: $e', cause: e);
    }
  }

  Future<void> updateVerificationPhotos({
    required String id,
    required List<String> photoUrls,
    bool invalidateStream = true,
  }) async {
    try {
      await _repo.updateVerificationPhotos(id, photoUrls);
      if (invalidateStream) {
        _ref.invalidate(locationsStreamProvider);
      }
    } catch (e) {
      throw AppError('Update photos failed: $e', cause: e);
    }
  }

  Future<List<String>> uploadVerificationPhotos({
    required String locationId,
    required List<XFile> images,
    void Function(int current, int total)? onProgress,
  }) async {
    try {
      final uploadedUrls = <String>[];
      final total = images.length;
      for (var i = 0; i < images.length; i++) {
        final image = images[i];
        onProgress?.call(i + 1, total);
        final bytes = await image.readAsBytes();
        final format = _resolveImageFormat(image, bytes);
        final fileExt = format.ext;
        final mimeType = format.mimeType;
        final fileName =
            '${locationId}_${DateTime.now().millisecondsSinceEpoch}_${i}_edit.$fileExt';
        await _repo.uploadVerificationFile(
          fileName: fileName,
          bytes: bytes,
          mimeType: mimeType,
        );
        uploadedUrls.add(_repo.getVerificationPublicUrl(fileName));
      }
      onProgress?.call(total, total);
      return Future.value(uploadedUrls).timeout(const Duration(seconds: 90));
    } catch (e) {
      throw AppError('Upload photos failed: $e', cause: e);
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
    final userId = Supabase.instance.client.auth.currentUser?.id;
    await persistSelectedLocationPreference(
      userId: userId,
      displayId: newDisplayId,
      uuid: newLocId,
    );
    // tiny delay to let the dialog pop before streams rebuild
    await Future.delayed(const Duration(milliseconds: 50));
    _ref.invalidate(selectedLocationUuidProvider);
    _ref.invalidate(selectedEffectiveLocationUuidProvider);
    _ref.invalidate(locationsStreamProvider);
    _ref.invalidate(availableLocationsProvider);
    return newDisplayId;
  }
}
