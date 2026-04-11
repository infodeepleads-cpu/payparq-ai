import 'package:supabase_flutter/supabase_flutter.dart';

class DynamicPricingRepository {
  final SupabaseClient _client;

  DynamicPricingRepository(this._client);

  String _normalizeRole(String? rawRole) {
    final role = (rawRole ?? '')
        .toString()
        .trim()
        .toLowerCase()
        .replaceAll('-', '_')
        .replaceAll(' ', '_');
    if (role == 'superadmin' || role.startsWith('super_admin')) {
      return 'super_admin';
    }
    if (role.startsWith('admin')) return 'admin';
    if (role.startsWith('manager')) return 'manager';
    if (role.startsWith('officer')) return 'officer';
    return 'officer';
  }

  String _buildLocationOrFilter(Iterable<String> identifiers) {
    final clauses = <String>{};
    for (final raw in identifiers) {
      final value = raw.trim();
      if (value.isEmpty) continue;
      clauses.add('id.eq.$value');
      clauses.add('display_id.eq.$value');
    }
    return clauses.join(',');
  }

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

  Map<String, dynamic>? _firstUpdatedRow(dynamic rows) {
    if (rows is List && rows.isNotEmpty) {
      final first = rows.first;
      if (first is Map<String, dynamic>) return first;
      if (first is Map) return Map<String, dynamic>.from(first);
    }
    if (rows is Map<String, dynamic>) return rows;
    if (rows is Map) return Map<String, dynamic>.from(rows);
    return null;
  }

  Future<bool> _updateByIdOrDisplayId({
    required String id,
    required String? displayId,
    required Map<String, dynamic> data,
  }) async {
    final resByIdRows =
        await _client.from('locations').update(data).eq('id', id).select('id');
    final resById = _firstUpdatedRow(resByIdRows);
    if (resById != null) return true;
    if (displayId == null || displayId.isEmpty) {
      await _client.from('locations').update(data).eq('id', id);
      return true;
    }
    final resByDisplayRows = await _client
        .from('locations')
        .update(data)
        .eq('display_id', displayId)
        .select('id');
    final resByDisplay = _firstUpdatedRow(resByDisplayRows);
    if (resByDisplay != null) return true;
    await _client.from('locations').update(data).eq('id', id);
    await _client.from('locations').update(data).eq('display_id', displayId);
    return true;
  }

  Future<List<Map<String, dynamic>>> fetchLocations({
    required String role,
    required String? locationId,
    required String userId,
  }) async {
    final normalizedRole = _normalizeRole(role);
    var query = _client.from('locations').select();
    if (normalizedRole == 'super_admin') {
    } else if (normalizedRole == 'admin') {
      final ownedRows =
          await _client.from('locations').select('id').eq('owner_id', userId);
      final assignmentRows = await _client
          .from('officer_assignments')
          .select('location_id')
          .eq('officer_id', userId);
      final allowedIds = <String>{
        if (locationId != null && locationId.isNotEmpty) locationId,
        ...ownedRows
            .map((row) => (row['id'] ?? '').toString())
            .where((id) => id.isNotEmpty),
        ...assignmentRows
            .map((row) => (row['location_id'] ?? '').toString())
            .where((id) => id.isNotEmpty),
      }.toList();
      if (allowedIds.isEmpty) {
        return [];
      }
      query = query.or(_buildLocationOrFilter(allowedIds));
    } else if (normalizedRole == 'manager') {
      if (locationId != null && locationId.isNotEmpty) {
        query = query.or(_buildLocationOrFilter([locationId]));
      } else {
        return [];
      }
    } else {
      if (locationId != null) {
        query = query.or(_buildLocationOrFilter([locationId]));
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
        if (updated) return;
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
