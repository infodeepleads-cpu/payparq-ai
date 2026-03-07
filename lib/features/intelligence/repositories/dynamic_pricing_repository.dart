import 'package:supabase_flutter/supabase_flutter.dart';

class DynamicPricingRepository {
  final SupabaseClient _client;

  DynamicPricingRepository(this._client);

  String? _extractMissingColumnName(Object error) {
    final text = error.toString();
    final quoted = RegExp(r'column "([^"]+)"').firstMatch(text);
    if (quoted != null) return quoted.group(1);
    final plain = RegExp(r"column '([^']+)'").firstMatch(text);
    return plain?.group(1);
  }

  Future<Map<String, dynamic>?> _updateByIdOrDisplayId({
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
    if (resById != null) return resById;
    if (displayId == null || displayId.isEmpty) return null;
    return await _client
        .from('locations')
        .update(data)
        .eq('display_id', displayId)
        .select('id')
        .maybeSingle();
  }

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
    final payload = Map<String, dynamic>.from(data);
    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        final updated = await _updateByIdOrDisplayId(
          id: id,
          displayId: displayId,
          data: payload,
        );
        if (updated != null) return;
        break;
      } catch (error) {
        final missingColumn = _extractMissingColumnName(error);
        if (missingColumn == null || !payload.containsKey(missingColumn)) {
          rethrow;
        }
        payload.remove(missingColumn);
        if (payload.isEmpty) {
          throw Exception('No valid pricing fields remained for update.');
        }
      }
    }
    if (displayId != null && displayId.isNotEmpty) {
      throw Exception('Failed to update location pricing for $displayId');
    }
    throw Exception('Failed to update location pricing for $id');
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
