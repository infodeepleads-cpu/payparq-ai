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
    final selection = await ref.read(activeLocationSelectionProvider.future);
    return LocationResolution(
      displayId: selection.displayId,
      uuid: selection.isValidated ? selection.uuid : null,
      fallbackId: null,
    );
  }

  static Future<LocationResolution> resolveFromRef(Ref ref) async {
    final selection = await ref.read(activeLocationSelectionProvider.future);
    return LocationResolution(
      displayId: selection.displayId,
      uuid: selection.isValidated ? selection.uuid : null,
      fallbackId: null,
    );
  }
}
