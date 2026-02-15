import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:typed_data';

class VerificationRepository {
  final SupabaseClient _client;

  VerificationRepository(this._client);

  Stream<List<Map<String, dynamic>>> streamPendingVerifications() {
    return _client
        .from('locations')
        .stream(primaryKey: ['id'])
        .eq('verification_status', 'pending')
        .order('verification_submitted_at', ascending: false);
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
