import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';

class StaffRepository {
  final SupabaseClient _client;

  StaffRepository(this._client);

  Future<Map<String, dynamic>> createOfficer({
    required String email,
    required String name,
    required String role,
    String? locationId,
  }) async {
    final Map<String, dynamic> body = {
      'email': email,
      'name': name,
      'role': role,
    };
    if (locationId != null && locationId.isNotEmpty) {
      body['location_id'] = locationId;
    }
    final functionNames = ['create-officer', 'create-staff'];
    dynamic lastError;

    for (final functionName in functionNames) {
      try {
        final response = await _client.functions.invoke(functionName, body: body);
        final status = response.status;
        if (status < 200 || status >= 300) {
          final parsedError = _extractErrorMessage(response.data);
          if (status == 404) {
            lastError = parsedError;
            continue;
          }
          throw Exception(parsedError);
        }
        final parsedData = _normalizeResponseData(response.data);
        if (parsedData.isEmpty) {
          throw Exception('Staff creation failed.');
        }
        return parsedData;
      } catch (e) {
        lastError = e;
        final msg = e.toString().toLowerCase();
        final isMissingFunction = msg.contains('404') ||
            msg.contains('not found') ||
            msg.contains('does not exist') ||
            msg.contains('failed to fetch');
        if (!isMissingFunction || functionName == functionNames.last) {
          rethrow;
        }
      }
    }

    throw Exception('Staff creation failed: $lastError');
  }

  Future<void> insertAssignments(List<Map<String, dynamic>> assignments) async {
    if (assignments.isEmpty) return;
    await _client.from('officer_assignments').insert(assignments);
  }

  Future<void> deleteStaff(String id) async {
    await _client.functions.invoke('delete-staff', body: {'userId': id});
  }

  Map<String, dynamic> _normalizeResponseData(dynamic rawData) {
    if (rawData is Map<String, dynamic>) return rawData;
    if (rawData is Map) return Map<String, dynamic>.from(rawData);
    if (rawData is String) {
      try {
        final decoded = jsonDecode(rawData);
        if (decoded is Map<String, dynamic>) return decoded;
        if (decoded is Map) return Map<String, dynamic>.from(decoded);
      } catch (_) {
        return {};
      }
    }
    return {};
  }

  String _extractErrorMessage(dynamic rawData) {
    final parsed = _normalizeResponseData(rawData);
    if (parsed.isEmpty) return 'Staff creation failed.';
    final dynamic message =
        parsed['error'] ?? parsed['message'] ?? parsed['msg'];
    return message?.toString() ?? 'Staff creation failed.';
  }
}
