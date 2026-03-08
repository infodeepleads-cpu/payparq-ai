import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';

class PassesRepository {
  final SupabaseClient _client;

  PassesRepository(this._client);

  Future<Map<String, dynamic>> createPermit(Map<String, dynamic> data) async {
    debugPrint('createPermit location_id=${data['location_id']}');
    final res = await _client
        .from('parking_permits')
        .insert(data)
        .select()
        .single();
    return res;
  }
}
