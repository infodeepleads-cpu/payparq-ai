import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_providers.dart';

class LocationResolution {
  final String? displayId;
  final String? uuid;
  final String? fallbackId;

  const LocationResolution({
    required this.displayId,
    required this.uuid,
    required this.fallbackId,
  });

  bool get hasSelection =>
      displayId != null || uuid != null || fallbackId != null;

  String? get effectiveDisplayId => displayId ?? fallbackId;
}

class LocationResolver {
  static Future<LocationResolution> resolve(WidgetRef ref) async {
    return _resolve(
      displayId: ref.read(selectedLocationIdProvider),
      profile: ref.read(userProfileProvider).value,
      fallback: ref.read(userLocationIdProvider),
      uuidFuture: ref.read(selectedLocationUuidProvider.future),
    );
  }

  static Future<LocationResolution> resolveFromRef(Ref ref) async {
    return _resolve(
      displayId: ref.read(selectedLocationIdProvider),
      profile: ref.read(userProfileProvider).value,
      fallback: ref.read(userLocationIdProvider),
      uuidFuture: ref.read(selectedLocationUuidProvider.future),
    );
  }

  static Future<LocationResolution> _resolve({
    required String? displayId,
    required Map<String, dynamic>? profile,
    required String? fallback,
    required Future<String?> uuidFuture,
  }) async {
    final fallbackId = fallback ?? profile?['location_id']?.toString();
    final uuid = displayId != null ? await uuidFuture : null;
    return LocationResolution(
      displayId: displayId,
      uuid: uuid,
      fallbackId: fallbackId,
    );
  }
}
