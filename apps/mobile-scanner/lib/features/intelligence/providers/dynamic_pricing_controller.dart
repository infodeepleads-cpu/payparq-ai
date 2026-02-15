import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../repositories/dynamic_pricing_repository.dart';
import '../../../services/app_error.dart';

final dynamicPricingRepositoryProvider =
    Provider<DynamicPricingRepository>((ref) {
  return DynamicPricingRepository(Supabase.instance.client);
});

final dynamicPricingControllerProvider =
    Provider<DynamicPricingController>((ref) {
  final repo = ref.watch(dynamicPricingRepositoryProvider);
  return DynamicPricingController(repo);
});

class DynamicPricingController {
  final DynamicPricingRepository _repo;

  DynamicPricingController(this._repo);

  Future<List<Map<String, dynamic>>> fetchLocations({
    required Map<String, dynamic> profile,
    required String userId,
  }) async {
    try {
      return await _repo.fetchLocations(
        role: profile['role']?.toString() ?? '',
        locationId: profile['location_id']?.toString(),
        userId: userId,
      );
    } catch (e) {
      throw AppError('Failed to load locations: $e', cause: e);
    }
  }

  Future<Map<String, dynamic>?> updatePricing({
    required Map<String, dynamic> pricePayload,
    required Map<String, dynamic> flagsPayload,
    required String targetId,
    required String? displayId,
  }) async {
    try {
      final merged = <String, dynamic>{}
        ..addAll(pricePayload)
        ..addAll(flagsPayload);
      await _repo.updateLocationByIdOrDisplayId(
        id: targetId,
        displayId: displayId,
        data: merged,
      );
      return await _repo.readLocationById(targetId);
    } catch (e) {
      throw AppError('Price update failed: $e', cause: e);
    }
  }
}
