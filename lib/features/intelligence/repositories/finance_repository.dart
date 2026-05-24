import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../config/app_config.dart';

class FinanceRepository {
  final SupabaseClient _client;

  FinanceRepository(this._client);

  Future<String> createConnectAccount({String? country}) async {
    final body =
        country == null || country.isEmpty ? null : {'country': country};
    return _invokeStripeUrlFunction(
      functionName: 'create-connect-account',
      body: body,
      operationLabel: 'create connect account',
    );
  }

  Future<String> getDashboardLink() async {
    return _invokeStripeUrlFunction(
      functionName: 'get-stripe-dashboard-link',
      operationLabel: 'get dashboard link',
    );
  }

  Future<String> sendManualPayout({
    required String recipientId,
    required String role,
    required int amountCents,
    String? weekLabel,
    String? note,
  }) async {
    final token = await _resolveValidAccessToken(forceRefresh: false);
    if (token == null || token.isEmpty) {
      throw Exception('Sign in again to send payouts.');
    }
    final baseUrl = AppConfig.webAppBaseUrl;
    final uri = Uri.parse('$baseUrl/api/admin/payouts/manual');
    final body = <String, dynamic>{
      'recipientId': recipientId,
      'role': role,
      'amountCents': amountCents,
      'weekLabel': (weekLabel ?? '').trim(),
      'note': (note ?? '').trim(),
    };
    final response = await http.post(
      uri,
      headers: <String, String>{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );
    final payload = _normalizePayload(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = _extractPayloadError(payload) ?? 'Unable to send payout.';
      throw Exception(error);
    }
    final ok = payload['ok'] == true;
    if (!ok) {
      final error = _extractPayloadError(payload) ?? 'Unable to send payout.';
      throw Exception(error);
    }
    final transferId = payload['transferId']?.toString().trim() ?? '';
    return transferId;
  }

  Future<String> _invokeStripeUrlFunction({
    required String functionName,
    required String operationLabel,
    Map<String, dynamic>? body,
  }) async {
    final response = await _invokeWithSessionRecovery(
      functionName,
      body: body,
      maxRetries: 3,
    );
    final payload = _normalizePayload(response.data);
    final statusOk = response.status >= 200 && response.status < 300;
    final url = payload['url'];
    if (statusOk && url != null) {
      return url.toString();
    }
    final error = _extractPayloadError(payload);
    throw Exception(
      'Failed to $operationLabel: ${error ?? 'Unknown error'}',
    );
  }

  Future<FunctionResponse> _invokeWithSessionRecovery(
    String functionName, {
    Map<String, dynamic>? body,
    int maxRetries = 3,
  }) async {
    FunctionResponse? lastResponse;
    Object? lastError;
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        final token = await _resolveValidAccessToken(
          forceRefresh: attempt > 1,
        );
        final headers = <String, String>{};
        if (token != null && token.isNotEmpty) {
          headers['Authorization'] = 'Bearer $token';
        }
        final response = await _client.functions.invoke(
          functionName,
          body: body,
          headers: headers.isEmpty ? null : headers,
        );
        lastResponse = response;
        if (!_isJwtAuthResponse(response)) {
          return response;
        }
      } catch (e) {
        if (!_isAuthOrInvokeError(e)) rethrow;
        lastError = e;
      }
      if (attempt < maxRetries) {
        await _refreshSessionIfPossible();
      }
    }
    if (lastResponse != null) {
      return lastResponse;
    }
    if (lastError != null) {
      final text = lastError.toString().toLowerCase();
      if (text.contains('invalid jwt') ||
          text.contains('jwt') ||
          text.contains('unauthorized') ||
          text.contains('401')) {
        throw Exception('Invalid JWT');
      }
      throw lastError;
    }
    throw Exception('Function invoke failed');
  }

  bool _isJwtAuthResponse(FunctionResponse response) {
    if (response.status != 401) return false;
    final raw = response.data;
    final parsed = _normalizePayload(raw);
    final text = [
      parsed['error'],
      parsed['message'],
      parsed['msg'],
      raw.toString(),
    ].join(' ').toLowerCase();
    return text.contains('invalid jwt') ||
        text.contains('jwt') ||
        text.contains('token') ||
        text.contains('unauthorized');
  }

  Future<void> _refreshSessionIfPossible() async {
    try {
      await _client.auth.refreshSession();
    } catch (_) {}
  }

  Future<String?> _resolveValidAccessToken({bool forceRefresh = false}) async {
    Session? current = _client.auth.currentSession;
    if (current == null || forceRefresh) {
      await _refreshSessionIfPossible();
      current = _client.auth.currentSession;
    }
    if (current == null) return null;
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final expiresAt = current.expiresAt ?? 0;
    final expiresSoon = expiresAt <= (now + 60);
    if (expiresSoon) {
      await _refreshSessionIfPossible();
    }
    return _client.auth.currentSession?.accessToken;
  }

  Future<List<Map<String, dynamic>>> loadOwnerLedger() async {
    final token = await _resolveValidAccessToken(forceRefresh: false);
    if (token == null || token.isEmpty) throw Exception('Sign in required.');
    final baseUrl = AppConfig.webAppBaseUrl;
    final uri = Uri.parse('$baseUrl/api/admin/owner-ledger');
    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer $token'},
    );
    final payload = _normalizePayload(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractPayloadError(payload) ?? 'Failed to load ledger.');
    }
    final list = payload['owners'];
    if (list is List) {
      return (list as List).cast<Map<String, dynamic>>().map((owner) {
        final entries = owner['entries'] as List?;
        return {
          ...owner as Map<String, dynamic>,
          'entries': entries ?? [],
        };
      }).toList();
    }
    return [];
  }

  Future<void> allocateOwnerPayout({
    required String ownerId,
    required int ownerAmountCents,
    required int payparqAmountCents,
    String? notes,
  }) async {
    final token = await _resolveValidAccessToken(forceRefresh: false);
    if (token == null || token.isEmpty) throw Exception('Sign in required.');
    final baseUrl = AppConfig.webAppBaseUrl;
    final uri = Uri.parse('$baseUrl/api/payouts/allocate');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
      body: jsonEncode({
        'owner_id': ownerId,
        'owner_amount_cents': ownerAmountCents,
        'payparq_amount_cents': payparqAmountCents,
        'notes': notes ?? '',
      }),
    );
    final payload = _normalizePayload(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractPayloadError(payload) ?? 'Payout failed.');
    }
  }

  Map<String, dynamic> _normalizePayload(dynamic payload) {
    if (payload is Map<String, dynamic>) return payload;
    if (payload is Map) return Map<String, dynamic>.from(payload);
    if (payload is String) {
      try {
        final decoded = jsonDecode(payload);
        if (decoded is Map<String, dynamic>) return decoded;
        if (decoded is Map) return Map<String, dynamic>.from(decoded);
      } catch (_) {
        return {'message': payload};
      }
    }
    return {};
  }

  String? _extractPayloadError(Map<String, dynamic> payload) {
    final value = payload['error'] ?? payload['message'] ?? payload['msg'];
    final text = value?.toString().trim();
    if (text == null || text.isEmpty) return null;
    return text;
  }

  bool _isAuthOrInvokeError(Object error) {
    final text = error.toString().toLowerCase();
    return text.contains('401') ||
        text.contains('invalid jwt') ||
        text.contains('jwt') ||
        text.contains('token') ||
        text.contains('unauthorized') ||
        text.contains('function exception') ||
        text.contains('reason phrase') ||
        text.contains('failed to fetch') ||
        text.contains('clientexception') ||
        text.contains('networkerror');
  }
}
