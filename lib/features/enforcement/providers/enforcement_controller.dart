import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../logic/providers/dashboard_providers.dart';
import '../../../logic/providers/auth_providers.dart';
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

final isSubmittingCaseProvider = StateProvider<bool>((ref) => false);

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
      String displayId = locationUuid;
      if (uuidRegex.hasMatch(normalizedUuid.toLowerCase())) {
        final locsAsync = _ref.read(availableLocationsProvider);
        if (locsAsync.hasValue) {
          for (final l in (locsAsync.value ?? [])) {
            final id = (l['id'] ?? '').toString();
            if (id == normalizedUuid) {
              displayId = (l['display_id'] ?? '').toString();
              break;
            }
          }
        }
      }
      final dailyPrice =
          isWarning ? 0.0 : await _repo.getEnforcementFineAmount(normalizedUuid);
      final dbRecord = {
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
      final uiRecord = {
        ...dbRecord,
        'location_display_id': displayId,
      };

      _ref.read(optimisticViolationsProvider.notifier).update((state) => [
            uiRecord,
            ...state,
          ]);

      await Future.wait([
        _repo.uploadEvidence(bytes, fileName),
        _repo.insertViolation(dbRecord),
      ]).timeout(const Duration(seconds: 25));

      _ref.invalidate(violationsStreamProvider);
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
    if (_ref.read(isSubmittingCaseProvider)) return;
    _ref.read(isSubmittingCaseProvider.notifier).state = true;
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
    String displayId = locationUuid;
    if (uuidRegex.hasMatch(normalizedUuid.toLowerCase())) {
      final locsAsync = _ref.read(availableLocationsProvider);
      if (locsAsync.hasValue) {
        for (final l in (locsAsync.value ?? [])) {
          final id = (l['id'] ?? '').toString();
          if (id == normalizedUuid) {
            displayId = (l['display_id'] ?? '').toString();
            break;
          }
        }
      }
    }
    final dailyPrice = await _repo.getEnforcementFineAmount(normalizedUuid);
    final dbRecord = {
      'plate': plate,
      'violation_type': violationType,
      'fine_amount': dailyPrice,
      'status': 'issued',
      'location_id': normalizedUuid,
      'evidence_r2_url': fileName,
      'issued_at': issuedAt,
      'issuer_role': issuerRole,
    };
    final uiRecord = {
      ...dbRecord,
      'location_display_id': displayId,
    };
    try {
      // optimistic insert with dedupe by unique key (plate + filename)
      _ref.read(optimisticViolationsProvider.notifier).update((state) {
        final key = '${plate}_$fileName';
        final filtered = state
            .where((v) =>
                '${v['plate'] ?? ''}_${v['evidence_r2_url'] ?? ''}' != key)
            .toList();
        return [uiRecord, ...filtered];
      });
      await Future.wait([
        _repo.uploadEvidence(bytes, fileName),
        _repo.insertViolation(dbRecord),
      ]).timeout(const Duration(seconds: 25));
      _ref.invalidate(violationsStreamProvider);
    } catch (e) {
      _ref.read(optimisticViolationsProvider.notifier).update((state) => state
          .where((v) =>
              (v['plate'] ?? '') != plate ||
              (v['evidence_r2_url'] ?? '') != fileName)
          .toList());
      throw AppError('Case upload failed: $e', cause: e);
    } finally {
      _ref.read(isSubmittingCaseProvider.notifier).state = false;
    }
  }

  Future<String?> getEvidenceUrl(String path) async {
    return _repo.getEvidenceUrl(path);
  }
}
