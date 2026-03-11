import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../config/app_config.dart';

class StaffRepository {
  final SupabaseClient _client;

  StaffRepository(this._client);

  Future<Map<String, dynamic>> createOfficer({
    required String email,
    required String name,
    required String role,
    String? locationId,
    List<String>? locationIds,
  }) async {
    final Map<String, dynamic> body = {
      'email': email,
      'name': name,
      'role': role,
    };
    final normalizedLocationIds = (locationIds ?? const <String>[])
        .map((id) => id.trim())
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();
    if (normalizedLocationIds.isNotEmpty) {
      body['location_ids'] = normalizedLocationIds;
      body['location_id'] = normalizedLocationIds.first;
    }
    if (locationId != null && locationId.isNotEmpty) {
      body['location_id'] = locationId;
    }
    final functionNames = ['create-officer'];
    dynamic lastError;

    for (final functionName in functionNames) {
      try {
        final response = await _invokeWithSessionRecovery(
          functionName: functionName,
          body: body,
        );
        final status = response.status;
        if (status < 200 || status >= 300) {
          var parsedError = _extractErrorMessage(response.data);
          if (_isJwtAuthError(status: status, payload: response.data)) {
            final fallbackResponse = await _invokeFunctionOverHttp(
              functionName,
              body,
              forceRefreshToken: true,
            );
            if (fallbackResponse.statusCode >= 200 &&
                fallbackResponse.statusCode < 300) {
              final parsedData = _normalizeResponseData(fallbackResponse.data);
              if (parsedData.isNotEmpty) {
                return parsedData;
              }
            }
            parsedError = _extractErrorMessage(fallbackResponse.data);
          }
          if (_shouldTryFallbackFunction(
              status: status, errorMessage: parsedError)) {
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
        if (_isFetchErrorMessage(msg)) {
          try {
            final fallbackResponse =
                await _invokeFunctionOverHttp(functionName, body);
            if (fallbackResponse.statusCode >= 200 &&
                fallbackResponse.statusCode < 300) {
              final parsedData = _normalizeResponseData(fallbackResponse.data);
              if (parsedData.isNotEmpty) {
                return parsedData;
              }
            }
            final parsedError = _extractErrorMessage(fallbackResponse.data);
            if (_shouldTryFallbackFunction(
                status: fallbackResponse.statusCode,
                errorMessage: parsedError)) {
              lastError = parsedError;
              continue;
            }
            throw Exception(parsedError);
          } catch (httpError) {
            lastError = httpError;
          }
        }
        final isMissingFunction = msg.contains('404') ||
            msg.contains('not found') ||
            msg.contains('does not exist') ||
            msg.contains('failed to fetch');
        final isPermissionError = msg.contains('403') ||
            msg.contains('401') ||
            msg.contains('permission') ||
            msg.contains('forbidden') ||
            msg.contains('not allowed');
        final canTryFallback = isMissingFunction || isPermissionError;
        if (!canTryFallback || functionName == functionNames.last) {
          rethrow;
        }
      }
    }

    throw Exception('Staff creation failed: $lastError');
  }

  Future<_HttpFunctionResponse> _invokeFunctionOverHttp(
      String functionName, Map<String, dynamic> body,
      {bool forceRefreshToken = false}) async {
    final baseUrl = _resolveFunctionsBaseUrl();
    final uri = Uri.parse('$baseUrl/$functionName');
    final token =
        await _resolveValidAccessToken(forceRefresh: forceRefreshToken);
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'apikey': AppConfig.supabaseAnonKey,
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    final response = await http.post(
      uri,
      headers: headers,
      body: jsonEncode(body),
    );
    final raw = response.body.trim();
    dynamic decoded;
    if (raw.isEmpty) {
      decoded = {};
    } else {
      try {
        decoded = jsonDecode(raw);
      } catch (_) {
        decoded = {'message': raw};
      }
    }
    if (!forceRefreshToken &&
        _isJwtAuthError(status: response.statusCode, payload: decoded)) {
      return _invokeFunctionOverHttp(
        functionName,
        body,
        forceRefreshToken: true,
      );
    }
    return _HttpFunctionResponse(
        statusCode: response.statusCode, data: decoded);
  }

  String _resolveFunctionsBaseUrl() {
    final explicitBase = AppConfig.supabaseFunctionsBaseUrl
        .trim()
        .replaceAll('"', '')
        .replaceAll("'", '');
    final base = explicitBase.isNotEmpty
        ? explicitBase
        : '${AppConfig.supabaseUrl}/functions/v1';
    return base.endsWith('/') ? base.substring(0, base.length - 1) : base;
  }

  bool _isFetchErrorMessage(String message) {
    return message.contains('failed to fetch') ||
        message.contains('clientexception') ||
        message.contains('xmlhttprequest error') ||
        message.contains('networkerror') ||
        message.contains('cors');
  }

  Future<FunctionResponse> _invokeWithSessionRecovery({
    required String functionName,
    required Map<String, dynamic> body,
  }) async {
    final first = await _client.functions.invoke(functionName, body: body);
    if (first.status != 401 &&
        !_isInvalidJwtStatusOrPayload(first.status, first.data)) {
      return first;
    }
    await _refreshSessionIfPossible();
    return _client.functions.invoke(functionName, body: body);
  }

  Future<void> _refreshSessionIfPossible() async {
    final hasSession = _client.auth.currentSession != null;
    if (!hasSession) return;
    try {
      await _client.auth.refreshSession();
    } catch (_) {}
  }

  Future<String?> _resolveValidAccessToken({bool forceRefresh = false}) async {
    final current = _client.auth.currentSession;
    if (current == null) return null;
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final expiresAt = current.expiresAt ?? 0;
    final expiresSoon = expiresAt <= (now + 60);
    if (forceRefresh || expiresSoon) {
      await _refreshSessionIfPossible();
    }
    return _client.auth.currentSession?.accessToken;
  }

  bool _isInvalidJwtStatusOrPayload(int status, dynamic data) {
    if (status != 401) return false;
    final payload = _normalizeResponseData(data);
    final text = [
      payload['message'],
      payload['error'],
      payload['msg'],
      data?.toString(),
    ].join(' ').toLowerCase();
    return text.contains('invalid jwt') ||
        text.contains('jwt') ||
        text.contains('token');
  }

  bool _isJwtAuthError({
    required int status,
    required dynamic payload,
  }) {
    if (status != 401) return false;
    final parsed = _normalizeResponseData(payload);
    final text = [
      parsed['error'],
      parsed['message'],
      parsed['msg'],
      payload?.toString(),
    ].join(' ').toLowerCase();
    return text.contains('invalid jwt') ||
        text.contains('jwt') ||
        text.contains('token') ||
        text.contains('unauthorized');
  }

  Future<void> insertAssignments(List<Map<String, dynamic>> assignments) async {
    if (assignments.isEmpty) return;
    await _client.from('officer_assignments').insert(assignments);
  }

  Future<Map<String, dynamic>?> findProfileByEmail(String email) async {
    final normalized = email.trim().toLowerCase();
    if (normalized.isEmpty) return null;
    final data = await _client
        .from('profiles')
        .select('id,email,role,location_id,full_name')
        .ilike('email', normalized)
        .limit(1);
    final rows = List<Map<String, dynamic>>.from(data as List);
    if (rows.isEmpty) return null;
    return rows.first;
  }

  Future<void> updateProfile(String id, Map<String, dynamic> values) async {
    await _client.from('profiles').update(values).eq('id', id);
  }

  Future<void> replaceAssignments({
    required String officerId,
    required List<String> locationIds,
    String? assignedBy,
  }) async {
    await _client
        .from('officer_assignments')
        .delete()
        .eq('officer_id', officerId);
    if (locationIds.isEmpty) return;
    final rows = locationIds
        .where((id) => id.trim().isNotEmpty)
        .map((id) => {
              'officer_id': officerId,
              'location_id': id,
              'assigned_by': assignedBy,
            })
        .toList();
    if (rows.isEmpty) return;
    await _client.from('officer_assignments').insert(rows);
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

  bool _shouldTryFallbackFunction({
    required int status,
    required String errorMessage,
  }) {
    if (status == 404 || status == 401 || status == 403) {
      return true;
    }
    final msg = errorMessage.toLowerCase();
    return msg.contains('permission') ||
        msg.contains('forbidden') ||
        msg.contains('not allowed') ||
        msg.contains('not found') ||
        msg.contains('failed to fetch');
  }
}

class _HttpFunctionResponse {
  final int statusCode;
  final dynamic data;

  const _HttpFunctionResponse({
    required this.statusCode,
    required this.data,
  });
}
