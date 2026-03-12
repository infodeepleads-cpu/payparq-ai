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

  Future<double> getEnforcementFineAmount(String locationId) async {
    final rows = await _client
        .from('locations')
        .select(
            'base_price_daily_floor, rate_per_hour_floor, rate_per_hour, enforcement_pricing_mode')
        .eq('id', locationId)
        .limit(1);
    if (rows.isNotEmpty) {
      final row = rows.first;
      final dailyFloor = _toDouble(row['base_price_daily_floor']);
      final hourlyFloor = _toDouble(row['rate_per_hour_floor']);
      final hourlyBase = _toDouble(row['rate_per_hour']);
      final mode = (row['enforcement_pricing_mode'] ?? 'hourly')
          .toString()
          .toLowerCase();
      if (mode == 'daily') {
        final hourly = hourlyFloor > 0 ? hourlyFloor : hourlyBase;
        if (hourly > 0) {
          return hourly * 24;
        }
      } else {
        if (dailyFloor > 0) {
          return dailyFloor;
        }
      }
    }
    return 20.0;
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0.0;
  }
}
