import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';

class PassesRepository {
  final SupabaseClient _client;

  PassesRepository(this._client);

  Future<Map<String, dynamic>> createPermit(Map<String, dynamic> data) async {
    final payload = Map<String, dynamic>.from(data);
    debugPrint('createPermit location_id=${payload['location_id']}');
    final removedColumns = <String>{};
    while (true) {
      try {
        final res = await _client
            .from('parking_permits')
            .insert(payload)
            .select()
            .single();
        return res;
      } catch (e) {
        final errorText = e.toString();
        final match = RegExp(
          r"find(?: the)? '?([a-zA-Z0-9_]+)'? column of '?parking_permits'?",
          caseSensitive: false,
        ).firstMatch(errorText);
        final missingColumn = match?.group(1);
        if (missingColumn == null ||
            missingColumn.isEmpty ||
            !payload.containsKey(missingColumn) ||
            removedColumns.contains(missingColumn)) {
          rethrow;
        }
        removedColumns.add(missingColumn);
        payload.remove(missingColumn);
        debugPrint('createPermit retry without column=$missingColumn');
      }
    }
  }
}
