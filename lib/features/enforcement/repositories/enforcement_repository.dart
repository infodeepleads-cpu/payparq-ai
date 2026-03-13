import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';

class EnforcementRepository {
  final SupabaseClient _client;

  EnforcementRepository(this._client);

  String? _extractMissingColumnName(Object error) {
    final text = error.toString();
    final quoted = RegExp(r'column "([^"]+)"').firstMatch(text);
    if (quoted != null) return quoted.group(1);
    final plain = RegExp(r"column '([^']+)'").firstMatch(text);
    if (plain != null) return plain.group(1);
    final postgrestTheColumn =
        RegExp(r"the '([^']+)' column", caseSensitive: false).firstMatch(text);
    if (postgrestTheColumn != null) return postgrestTheColumn.group(1);
    final unquoted =
        RegExp(r'column ([a-zA-Z0-9_]+)').firstMatch(text.toLowerCase());
    if (unquoted != null) return unquoted.group(1);
    return null;
  }

  bool _isMissingPricingModeColumnError(Object error) {
    final text = error.toString().toLowerCase();
    if (text.contains('enforcement_pricing_mode')) return true;
    if (text.contains('enforcmetn') && text.contains('pricing')) return true;
    if (text.contains('42703') &&
        text.contains('pricing') &&
        text.contains('mode')) {
      return true;
    }
    final missing = _extractMissingColumnName(error);
    return missing == 'enforcement_pricing_mode';
  }

  bool _isMissingLegacyPricingModeColumnError(Object error) {
    final text = error.toString().toLowerCase();
    if (text.contains('enforcmetn_pricing_mode')) return true;
    final missing = _extractMissingColumnName(error);
    return missing == 'enforcmetn_pricing_mode';
  }

  String _resolveEnforcementPricingMode(Map<String, dynamic> row) {
    final metadataRaw = row['verification_metadata'];
    final metadata =
        metadataRaw is Map ? Map<String, dynamic>.from(metadataRaw) : null;
    final mode = (row['enforcement_pricing_mode'] ??
            row['enforcmetn_pricing_mode'] ??
            metadata?['enforcement_pricing_mode'] ??
            metadata?['enforcmetn_pricing_mode'] ??
            'hourly')
        .toString()
        .toLowerCase();
    return mode == 'daily' ? 'daily' : 'hourly';
  }

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
    final baseSelect =
        'base_price_daily_floor, base_price_daily, rate_per_hour_floor, rate_per_hour, verification_metadata';
    List<dynamic> rows = const [];
    try {
      rows = await _client
          .from('locations')
          .select(
              '$baseSelect, enforcement_pricing_mode, enforcmetn_pricing_mode')
          .eq('id', locationId)
          .limit(1);
    } catch (error) {
      if (!_isMissingPricingModeColumnError(error)) rethrow;
      try {
        rows = await _client
            .from('locations')
            .select('$baseSelect, enforcmetn_pricing_mode')
            .eq('id', locationId)
            .limit(1);
      } catch (legacyError) {
        if (!_isMissingLegacyPricingModeColumnError(legacyError)) rethrow;
        rows = await _client
            .from('locations')
            .select(baseSelect)
            .eq('id', locationId)
            .limit(1);
      }
    }
    if (rows.isNotEmpty) {
      final row = rows.first;
      final dailyFloor = _toDouble(row['base_price_daily_floor']);
      final dailyBase = _toDouble(row['base_price_daily']);
      final hourlyFloor = _toDouble(row['rate_per_hour_floor']);
      final hourlyBase = _toDouble(row['rate_per_hour']);
      final dailyUnit = dailyFloor > 0 ? dailyFloor : dailyBase;
      final hourlyUnit = hourlyFloor > 0 ? hourlyFloor : hourlyBase;
      final mode = _resolveEnforcementPricingMode(row);
      if (mode == 'daily') {
        if (hourlyUnit > 0) return hourlyUnit * 24;
        if (dailyUnit > 0) return dailyUnit;
      } else {
        if (dailyUnit > 0) return dailyUnit;
        if (hourlyUnit > 0) return hourlyUnit * 24;
      }
      if (dailyUnit > 0) return dailyUnit;
      if (hourlyUnit > 0) return hourlyUnit;
    }
    return 20.0;
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0.0;
  }
}
