import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:typed_data';

class VerificationRepository {
  final SupabaseClient _client;

  VerificationRepository(this._client);

  Stream<List<Map<String, dynamic>>> streamPendingVerifications() {
    return _client
        .from('locations')
        .stream(primaryKey: ['id'])
        .or('verification_status.eq.pending,verification_status.eq.registration_interest')
        .order('verification_submitted_at', ascending: false);
  }

  Future<List<Map<String, dynamic>>> fetchPendingVerifications() async {
    final data = await _client
        .from('locations')
        .select(
            'id, name, display_id, verification_status, verification_photos, verification_submitted_at, is_run_by_payparq')
        .or('verification_status.eq.pending,verification_status.eq.registration_interest')
        .order('verification_submitted_at', ascending: false);
    return (data as List)
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<void> updateVerificationStatus(
    String locationId,
    Map<String, dynamic> updates,
  ) async {
    await _client.from('locations').update(updates).eq('id', locationId);
  }

  Future<void> uploadVerificationFile({
    required String fileName,
    required Uint8List bytes,
    required String mimeType,
  }) async {
    await _client.storage.from('location-verification').uploadBinary(
          fileName,
          bytes,
          fileOptions: FileOptions(contentType: mimeType, upsert: true),
        );
  }

  String getVerificationPublicUrl(String fileName) {
    return _client.storage.from('location-verification').getPublicUrl(fileName);
  }
}
