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

  double _toPositiveNumber(dynamic value, double fallback) {
    final parsed = _toDouble(value);
    if (parsed < 0) return fallback;
    return parsed;
  }

  double _resolveStripeUnitPrice({
    required double base,
    required double floor,
    required double ceiling,
    required double fallback,
  }) {
    var euro = base < 0 ? fallback : base;
    if (floor > 0 && euro < floor) euro = floor;
    if (ceiling > 0 && euro > ceiling) euro = ceiling;
    if (euro < 0) return 0;
    return euro;
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
        'base_price_daily, base_price_daily_floor, base_price_daily_ceiling, rate_per_hour, rate_per_hour_floor, rate_per_hour_ceiling, verification_metadata';
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
      final dailyBase = _toPositiveNumber(row['base_price_daily'], 20);
      final dailyFloor = _toPositiveNumber(row['base_price_daily_floor'], 0);
      final dailyCeiling =
          _toPositiveNumber(row['base_price_daily_ceiling'], 0);
      final hourlyBase = _toPositiveNumber(row['rate_per_hour'], 5);
      final hourlyFloor = _toPositiveNumber(row['rate_per_hour_floor'], 0);
      final hourlyCeiling = _toPositiveNumber(row['rate_per_hour_ceiling'], 0);
      final stripeDaily = _resolveStripeUnitPrice(
        base: dailyBase,
        floor: dailyFloor,
        ceiling: dailyCeiling,
        fallback: 20,
      );
      final stripeHourly = _resolveStripeUnitPrice(
        base: hourlyBase,
        floor: hourlyFloor,
        ceiling: hourlyCeiling,
        fallback: 5,
      );
      final mode = _resolveEnforcementPricingMode(row);
      if (mode == 'daily') {
        if (stripeHourly > 0) return stripeHourly * 24;
        if (stripeDaily > 0) return stripeDaily;
      } else {
        if (stripeDaily > 0) return stripeDaily;
        if (stripeHourly > 0) return stripeHourly * 24;
      }
      if (stripeDaily > 0) return stripeDaily;
      if (stripeHourly > 0) return stripeHourly;
    }
    return 20.0;
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0.0;
  }
}
