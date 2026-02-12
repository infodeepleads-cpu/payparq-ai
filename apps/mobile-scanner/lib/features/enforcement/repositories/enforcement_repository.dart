import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';

class EnforcementRepository {
  final SupabaseClient _client;

  EnforcementRepository(this._client);

  Future<void> deleteViolation(String id) async {
    await _client.from('violations').delete().eq('id', id);
  }

  Future<void> insertViolation(Map<String, dynamic> data) async {
    await _client.from('violations').insert(data);
  }

  Future<void> uploadEvidence(Uint8List bytes, String path) async {
    await _client.storage.from('evidence').uploadBinary(
          path,
          bytes,
          fileOptions: const FileOptions(contentType: 'image/jpeg'),
        );
  }

  Future<String?> getEvidenceUrl(String path) async {
    try {
      return await _client.storage.from('evidence').createSignedUrl(path, 3600);
    } catch (_) {
      return _client.storage.from('evidence').getPublicUrl(path);
    }
  }

  Future<double> getDailyBasePrice(String locationId) async {
    final rows = await _client
        .from('locations')
        .select('base_price_daily')
        .eq('id', locationId)
        .limit(1);
    if (rows.isNotEmpty) {
      final v = rows.first['base_price_daily'];
      if (v != null) {
        return (v is num)
            ? v.toDouble()
            : double.tryParse(v.toString()) ?? 50.0;
      }
    }
    return 50.0;
  }
}
