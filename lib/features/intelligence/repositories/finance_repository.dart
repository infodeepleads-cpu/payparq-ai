import 'package:supabase_flutter/supabase_flutter.dart';

class FinanceRepository {
  final SupabaseClient _client;

  FinanceRepository(this._client);

  Future<String> createConnectAccount({String? country}) async {
    final body =
        country == null || country.isEmpty ? null : {'country': country};
    final response = await _invokeWithSessionRecovery(
      'create-connect-account',
      body: body,
    );
    if (response.status != 200) {
      final error = response.data is Map ? response.data['error'] : null;
      throw Exception(
          'Failed to create connect account: ${error ?? 'Unknown error'}');
    }
    final url = response.data['url'];
    if (url == null) {
      throw Exception('No onboarding URL returned');
    }
    return url.toString();
  }

  Future<String> getDashboardLink() async {
    final response =
        await _invokeWithSessionRecovery('get-stripe-dashboard-link');
    if (response.status != 200) {
      final error = response.data is Map ? response.data['error'] : null;
      throw Exception(
          'Failed to get dashboard link: ${error ?? 'Unknown error'}');
    }
    final url = response.data['url'];
    if (url == null) {
      throw Exception('No dashboard URL returned');
    }
    return url.toString();
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
    await _client.auth.refreshSession();
  }
}
