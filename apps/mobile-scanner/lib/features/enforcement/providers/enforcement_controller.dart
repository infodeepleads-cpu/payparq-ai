import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../logic/providers/dashboard_providers.dart';
import '../../management/repositories/parking_repository.dart';
import '../repositories/enforcement_repository.dart';
import '../../../services/app_error.dart';

final enforcementRepositoryProvider = Provider<EnforcementRepository>((ref) {
  return EnforcementRepository(Supabase.instance.client);
});

final enforcementControllerProvider = Provider<EnforcementController>((ref) {
  final repo = ref.watch(enforcementRepositoryProvider);
  return EnforcementController(ref, repo);
});

class EnforcementController {
  final Ref _ref;
  final EnforcementRepository _repo;

  EnforcementController(this._ref, this._repo);

  Future<void> deleteViolation(String id) async {
    try {
      await _repo.deleteViolation(id);
      _ref.invalidate(violationsStreamProvider);
    } catch (e) {
      throw AppError('Delete failed: $e', cause: e);
    }
  }

  Future<void> issueQuickAction({
    required String plate,
    required bool isWarning,
    required String locationUuid,
    required Uint8List bytes,
    required bool isLprScan,
    String? issuerRole,
  }) async {
    final fileName = '${DateTime.now().millisecondsSinceEpoch}_$plate.jpg';
    final issuedAt = DateTime.now().toIso8601String();
    try {
      final uuidRegex = RegExp(
          r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
          caseSensitive: false);
      String normalizedUuid = locationUuid;
      if (!uuidRegex.hasMatch(locationUuid.toLowerCase())) {
        final res = await Supabase.instance.client
            .from('locations')
            .select('id')
            .eq('display_id', locationUuid)
            .maybeSingle();
        final id = res?['id']?.toString();
        if (id != null && id.isNotEmpty) {
          normalizedUuid = id;
        }
      }
      final dailyPrice =
          isWarning ? 0.0 : await _repo.getDailyBasePrice(normalizedUuid);
      final record = {
        'plate': plate,
        'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
        'fine_amount': isWarning ? 0.00 : dailyPrice,
        'status': isWarning ? 'warning' : 'issued',
        'issued_at': issuedAt,
        'evidence_r2_url': fileName,
        'location_id': normalizedUuid,
        'is_lpr_scan': isLprScan,
        if (issuerRole != null) 'issuer_role': issuerRole,
      };

      _ref.read(optimisticViolationsProvider.notifier).update((state) => [
            record,
            ...state,
          ]);

      await Future.wait([
        _repo.uploadEvidence(bytes, fileName),
        _repo.insertViolation(record),
      ]).timeout(const Duration(seconds: 25));

      _ref.invalidate(violationsStreamProvider);
      _ref.read(optimisticViolationsProvider.notifier).update((state) => state
          .where((v) =>
              (v['plate'] ?? '') != plate ||
              (v['evidence_r2_url'] ?? '') != fileName)
          .toList());
    } catch (e) {
      _ref.read(optimisticViolationsProvider.notifier).update((state) => state
          .where((v) =>
              (v['plate'] ?? '') != plate ||
              (v['evidence_r2_url'] ?? '') != fileName)
          .toList());
      throw AppError('Issue failed: $e', cause: e);
    }
  }

  Future<void> createCase({
    required String plate,
    required String violationType,
    required String locationUuid,
    required Uint8List bytes,
    required String issuerRole,
  }) async {
    final fileName = '${DateTime.now().millisecondsSinceEpoch}_$plate.jpg';
    final issuedAt = DateTime.now().toIso8601String();
    final uuidRegex = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    String normalizedUuid = locationUuid;
    if (!uuidRegex.hasMatch(locationUuid.toLowerCase())) {
      final res = await Supabase.instance.client
          .from('locations')
          .select('id')
          .eq('display_id', locationUuid)
          .maybeSingle();
      final id = res?['id']?.toString();
      if (id != null && id.isNotEmpty) {
        normalizedUuid = id;
      }
    }
    final record = {
      'plate': plate,
      'violation_type': violationType,
      'fine_amount': 50.00,
      'status': 'issued',
      'location_id': normalizedUuid,
      'evidence_r2_url': fileName,
      'issued_at': issuedAt,
      'issuer_role': issuerRole,
    };
    try {
      _ref.read(optimisticViolationsProvider.notifier).update((state) => [
            record,
            ...state,
          ]);
      await Future.wait([
        _repo.uploadEvidence(bytes, fileName),
        _repo.insertViolation(record),
      ]).timeout(const Duration(seconds: 25));
      _ref.invalidate(violationsStreamProvider);
      _ref.read(optimisticViolationsProvider.notifier).update((state) => state
          .where((v) =>
              (v['plate'] ?? '') != plate ||
              (v['evidence_r2_url'] ?? '') != fileName)
          .toList());
    } catch (e) {
      _ref.read(optimisticViolationsProvider.notifier).update((state) => state
          .where((v) =>
              (v['plate'] ?? '') != plate ||
              (v['evidence_r2_url'] ?? '') != fileName)
          .toList());
      throw AppError('Case upload failed: $e', cause: e);
    }
  }

  Future<String?> getEvidenceUrl(String path) async {
    return _repo.getEvidenceUrl(path);
  }
}
