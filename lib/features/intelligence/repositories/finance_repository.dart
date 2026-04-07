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

  Future<String> _invokeStripeUrlFunction({
    required String functionName,
    required String operationLabel,
    Map<String, dynamic>? body,
  }) async {
    try {
      final response = await _invokeWithSessionRecovery(
        functionName,
        body: body,
      );
      final primaryPayload = _normalizePayload(response.data);
      final primaryStatusOk = response.status >= 200 && response.status < 300;
      final primaryUrl = primaryPayload['url'];
      if (primaryStatusOk && primaryUrl != null) {
        return primaryUrl.toString();
      }

      final shouldForceFallback = !primaryStatusOk ||
          primaryUrl == null ||
          _isJwtAuthError(status: response.status, payload: primaryPayload);
      if (!shouldForceFallback) {
        throw Exception('No URL returned');
      }

      final fallback = await _invokeFunctionOverHttp(
        functionName,
        body: body,
        forceRefreshToken: true,
      );
      final fallbackPayload = _normalizePayload(fallback.data);
      final fallbackStatusOk =
          fallback.statusCode >= 200 && fallback.statusCode < 300;
      final fallbackUrl = fallbackPayload['url'];
      if (fallbackStatusOk && fallbackUrl != null) {
        return fallbackUrl.toString();
      }

      final primaryError = _extractPayloadError(primaryPayload);
      final fallbackError = _extractPayloadError(fallbackPayload);
      throw Exception(
        'Failed to $operationLabel: ${fallbackError ?? primaryError ?? 'Unknown error'}',
      );
    } catch (error) {
      if (!_isAuthOrInvokeError(error)) {
        rethrow;
      }
      final fallback = await _invokeFunctionOverHttp(
        functionName,
        body: body,
        forceRefreshToken: true,
      );
      final fallbackPayload = _normalizePayload(fallback.data);
      final fallbackStatusOk =
          fallback.statusCode >= 200 && fallback.statusCode < 300;
      final fallbackUrl = fallbackPayload['url'];
      if (fallbackStatusOk && fallbackUrl != null) {
        return fallbackUrl.toString();
      }
      final fallbackError = _extractPayloadError(fallbackPayload);
      throw Exception(
        'Failed to $operationLabel: ${fallbackError ?? error.toString()}',
      );
    }
  }

  Future<FunctionResponse> _invokeWithSessionRecovery(
    String functionName, {
    Map<String, dynamic>? body,
  }) async {
    FunctionResponse first;
    try {
      first = await _client.functions.invoke(functionName, body: body);
    } catch (e) {
      final text = e.toString().toLowerCase();
      final isJwtFailure = text.contains('401') ||
          text.contains('invalid jwt') ||
          text.contains('jwt') ||
          text.contains('token') ||
          text.contains('unauthorized');
      if (!isJwtFailure) rethrow;
      await _refreshSessionIfPossible();
      return _client.functions.invoke(functionName, body: body);
    }

    if (!_isJwtAuthResponse(first)) {
      return first;
    }

    await _refreshSessionIfPossible();
    return _client.functions.invoke(functionName, body: body);
  }

  bool _isJwtAuthResponse(FunctionResponse response) {
    if (response.status != 401) return false;
    final raw = response.data;
    if (raw is! Map) {
      return raw.toString().toLowerCase().contains('jwt') ||
          raw.toString().toLowerCase().contains('unauthorized');
    }
    final text = [
      raw['error'],
      raw['message'],
      raw['msg'],
      raw.toString(),
    ].join(' ').toLowerCase();
    return text.contains('invalid jwt') ||
        text.contains('jwt') ||
        text.contains('token') ||
        text.contains('unauthorized');
  }

  Future<void> _refreshSessionIfPossible() async {
    final session = _client.auth.currentSession;
    if (session == null) return;
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

  Future<_HttpFunctionResponse> _invokeFunctionOverHttp(
    String functionName, {
    Map<String, dynamic>? body,
    bool forceRefreshToken = false,
  }) async {
    final token =
        await _resolveValidAccessToken(forceRefresh: forceRefreshToken);
    if (token == null || token.isEmpty) {
      return const _HttpFunctionResponse(
        statusCode: 401,
        data: {'error': 'Unauthorized'},
      );
    }
    final url = Uri.parse('${_resolveFunctionsBaseUrl()}/$functionName');
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'apikey': AppConfig.supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body ?? const <String, dynamic>{}),
    );
    dynamic decoded;
    final raw = response.body;
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
        body: body,
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

  bool _isJwtAuthError({
    required int status,
    required dynamic payload,
  }) {
    if (status != 401) return false;
    final text = [
      payload is Map ? payload['error'] : null,
      payload is Map ? payload['message'] : null,
      payload is Map ? payload['msg'] : null,
      payload?.toString(),
    ].join(' ').toLowerCase();
    return text.contains('invalid jwt') ||
        text.contains('jwt') ||
        text.contains('token') ||
        text.contains('unauthorized');
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

class _HttpFunctionResponse {
  final int statusCode;
  final dynamic data;

  const _HttpFunctionResponse({
    required this.statusCode,
    required this.data,
  });
}
