import 'package:supabase_flutter/supabase_flutter.dart';

class DynamicPricingRepository {
  final SupabaseClient _client;

  DynamicPricingRepository(this._client);

  Future<List<Map<String, dynamic>>> fetchLocations({
    required String role,
    required String? locationId,
    required String userId,
  }) async {
    var query = _client.from('locations').select();
    if (role == 'super_admin') {
    } else if (role == 'admin') {
      query = query.eq('owner_id', userId);
    } else {
      if (locationId != null) {
        query = query.eq('display_id', locationId);
      } else {
        return [];
      }
    }
    final data = await query;
    return List<Map<String, dynamic>>.from(data);
  }

  Future<void> updateLocationByIdOrDisplayId({
    required String id,
    required String? displayId,
    required Map<String, dynamic> data,
  }) async {
    final resById = await _client
        .from('locations')
        .update(data)
        .eq('id', id)
        .select('id')
        .maybeSingle();
    if (resById == null && displayId != null && displayId.isNotEmpty) {
      await _client
          .from('locations')
          .update(data)
          .eq('display_id', displayId)
          .select('id')
          .maybeSingle();
    }
  }

  Future<Map<String, dynamic>?> readLocationById(String id) async {
    final rows = await _client
        .from('locations')
        .select('base_price_daily_floor')
        .eq('id', id)
        .limit(1);
    if (rows.isNotEmpty) {
      return Map<String, dynamic>.from(rows.first);
    }
    return null;
  }
}
