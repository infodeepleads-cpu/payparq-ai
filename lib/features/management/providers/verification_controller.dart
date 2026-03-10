import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import '../repositories/verification_repository.dart';
import '../../../services/app_error.dart';

final verificationRepositoryProvider = Provider<VerificationRepository>((ref) {
  return VerificationRepository(Supabase.instance.client);
});

final pendingVerificationsProvider =
    StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repo = ref.watch(verificationRepositoryProvider);
  return (() async* {
    List<Map<String, dynamic>> last = const [];
    try {
      last = await repo.fetchPendingVerifications();
      yield last;
    } catch (_) {}
    while (true) {
      await Future.delayed(const Duration(seconds: 3));
      try {
        final fresh = await repo.fetchPendingVerifications();
        last = fresh;
        yield fresh;
      } catch (_) {
        if (last.isNotEmpty) {
          yield last;
        }
      }
    }
  })();
});

final verificationControllerProvider = Provider<VerificationController>((ref) {
  final repo = ref.watch(verificationRepositoryProvider);
  return VerificationController(repo);
});

class VerificationController {
  final VerificationRepository _repo;

  VerificationController(this._repo);

  Future<void> updateStatus(
    String locationId,
    String status, {
    bool? isRunByPayparq,
    String? reviewerId,
  }) async {
    try {
      final currentReviewer =
          reviewerId ?? Supabase.instance.client.auth.currentUser?.id;
      final updates = <String, dynamic>{
        'verification_status': status,
        'verification_reviewed_at': DateTime.now().toIso8601String(),
        'verification_reviewed_by': currentReviewer,
      };
      if (isRunByPayparq != null) {
        updates['is_run_by_payparq'] = isRunByPayparq;
      }
      await _repo.updateVerificationStatus(locationId, updates);
    } catch (e) {
      throw AppError('Update failed: $e', cause: e);
    }
  }

  Future<void> submitVerification({
    required String locationId,
    required List<XFile> images,
  }) async {
    try {
      final List<Future<String>> uploadFutures = [];
      for (var i = 0; i < images.length; i++) {
        final image = images[i];
        uploadFutures.add(() async {
          final bytes = await image.readAsBytes();
          String fileExt = 'jpg';
          if (image.name.contains('.')) {
            fileExt = image.name.split('.').last.toLowerCase();
          } else if (image.path.contains('.')) {
            fileExt = image.path.split('.').last.toLowerCase();
          }
          if (!['jpg', 'jpeg', 'png', 'webp'].contains(fileExt)) {
            fileExt = 'jpg';
          }
          final mimeType = fileExt == 'jpg' || fileExt == 'jpeg'
              ? 'image/jpeg'
              : 'image/$fileExt';
          final fileName =
              '${locationId}_${DateTime.now().millisecondsSinceEpoch}_$i.$fileExt';
          await _repo.uploadVerificationFile(
            fileName: fileName,
            bytes: bytes,
            mimeType: mimeType,
          );
          return _repo.getVerificationPublicUrl(fileName);
        }());
      }
      final uploadedUrls =
          await Future.wait(uploadFutures).timeout(const Duration(seconds: 40));
      await _repo.updateVerificationStatus(locationId, {
        'verification_status': 'pending',
        'verification_photos': uploadedUrls,
        'verification_submitted_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      throw AppError('Verification upload failed: $e', cause: e);
    }
  }
}
