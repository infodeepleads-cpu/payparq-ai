import 'dart:async';
import 'dart:typed_data';
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
  return repo.streamPendingVerifications();
});

final verificationControllerProvider = Provider<VerificationController>((ref) {
  final repo = ref.watch(verificationRepositoryProvider);
  return VerificationController(repo);
});

class VerificationController {
  final VerificationRepository _repo;

  VerificationController(this._repo);

  ({String ext, String mimeType}) _resolveImageFormat(
      XFile image, Uint8List bytes) {
    String? sanitizeExt(String? value) {
      if (value == null) return null;
      final v = value.trim().toLowerCase();
      if (v.isEmpty) return null;
      if (v == 'jpg') return 'jpeg';
      if ([
        'jpeg',
        'png',
        'webp',
        'heic',
        'heif',
        'avif',
      ].contains(v)) {
        return v;
      }
      return null;
    }

    String? extFromMime(String? mime) {
      if (mime == null || mime.isEmpty) return null;
      final normalized = mime.toLowerCase();
      if (normalized == 'image/jpg') return 'jpeg';
      if (normalized == 'image/jpeg') return 'jpeg';
      if (normalized == 'image/png') return 'png';
      if (normalized == 'image/webp') return 'webp';
      if (normalized == 'image/heic') return 'heic';
      if (normalized == 'image/heif') return 'heif';
      if (normalized == 'image/avif') return 'avif';
      return null;
    }

    String? extFromPathOrName(String source) {
      final dot = source.lastIndexOf('.');
      if (dot < 0 || dot + 1 >= source.length) return null;
      return sanitizeExt(source.substring(dot + 1));
    }

    String? extFromBytes(Uint8List data) {
      if (data.length >= 12 &&
          data[0] == 0xFF &&
          data[1] == 0xD8 &&
          data[2] == 0xFF) {
        return 'jpeg';
      }
      if (data.length >= 8 &&
          data[0] == 0x89 &&
          data[1] == 0x50 &&
          data[2] == 0x4E &&
          data[3] == 0x47) {
        return 'png';
      }
      if (data.length >= 12 &&
          data[0] == 0x52 &&
          data[1] == 0x49 &&
          data[2] == 0x46 &&
          data[3] == 0x46 &&
          data[8] == 0x57 &&
          data[9] == 0x45 &&
          data[10] == 0x42 &&
          data[11] == 0x50) {
        return 'webp';
      }
      if (data.length >= 16 &&
          data[4] == 0x66 &&
          data[5] == 0x74 &&
          data[6] == 0x79 &&
          data[7] == 0x70) {
        final brand = String.fromCharCodes(data.sublist(8, 12)).toLowerCase();
        if (brand == 'avif') return 'avif';
        if (brand == 'heic' ||
            brand == 'heix' ||
            brand == 'hevc' ||
            brand == 'hevx') {
          return 'heic';
        }
        if (brand == 'mif1' || brand == 'msf1') return 'heif';
      }
      return null;
    }

    final ext = extFromMime(image.mimeType) ??
        extFromPathOrName(image.name) ??
        extFromPathOrName(image.path) ??
        extFromBytes(bytes) ??
        'jpeg';

    final mimeType = ext == 'jpeg' ? 'image/jpeg' : 'image/$ext';
    return (ext: ext, mimeType: mimeType);
  }

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
      final uploadedUrls = <String>[];
      for (var i = 0; i < images.length; i++) {
        final image = images[i];
        final bytes = await image.readAsBytes();
        final format = _resolveImageFormat(image, bytes);
        final fileExt = format.ext;
        final mimeType = format.mimeType;
        final fileName =
            '${locationId}_${DateTime.now().millisecondsSinceEpoch}_$i.$fileExt';
        await _repo
            .uploadVerificationFile(
              fileName: fileName,
              bytes: bytes,
              mimeType: mimeType,
            )
            .timeout(const Duration(seconds: 90));
        uploadedUrls.add(_repo.getVerificationPublicUrl(fileName));
      }
      await _repo.updateVerificationStatus(locationId, {
        'verification_status': 'pending',
        'verification_photos': uploadedUrls,
        'verification_submitted_at': DateTime.now().toIso8601String(),
      }).timeout(const Duration(seconds: 20));
    } on TimeoutException {
      throw const AppError(
        'Upload timed out. Please retry with a stronger connection or smaller photos.',
      );
    } on StorageException catch (e) {
      throw AppError(
        'Verification upload failed: ${e.message}',
        cause: e,
      );
    } catch (e) {
      throw AppError('Verification upload failed: $e', cause: e);
    }
  }
}
