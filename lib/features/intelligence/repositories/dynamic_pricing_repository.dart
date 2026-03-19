import 'package:supabase_flutter/supabase_flutter.dart';

class DynamicPricingRepository {
  final SupabaseClient _client;

  DynamicPricingRepository(this._client);

  String? _extractMissingColumnName(Object error) {
    final text = error.toString();
    final quoted = RegExp(r'column "([^"]+)"').firstMatch(text);
    if (quoted != null) return quoted.group(1);
    final plain = RegExp(r"column '([^']+)'").firstMatch(text);
    if (plain != null) return plain.group(1);
    final postgrestTheColumn =
        RegExp(r"the '([^']+)' column", caseSensitive: false).firstMatch(text);
    if (postgrestTheColumn != null) return postgrestTheColumn.group(1);
    final genericQuoted = RegExp(r"'([a-zA-Z0-9_]+)'").allMatches(text);
    for (final match in genericQuoted) {
      final token = match.group(1);
      if (token != null &&
          token != 'locations' &&
          token != 'public' &&
          token.contains('_')) {
        return token;
      }
    }
    return null;
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
    } else if (role == 'manager') {
      if (locationId != null && locationId.isNotEmpty) {
        query = query.or('id.eq.$locationId,display_id.eq.$locationId');
      } else {
        return [];
      }
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
    for (var attempt = 0; attempt < 6; attempt++) {
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
    final rows = await _client.from('locations').select().eq('id', id).limit(1);
    if (rows.isNotEmpty) {
      return Map<String, dynamic>.from(rows.first);
    }
    return null;
  }
}
