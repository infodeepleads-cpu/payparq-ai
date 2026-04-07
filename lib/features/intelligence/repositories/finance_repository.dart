import 'package:supabase_flutter/supabase_flutter.dart';

class FinanceRepository {
  final SupabaseClient _client;

  FinanceRepository(this._client);

  Future<String> createConnectAccount({String? country}) async {
    final body = country == null || country.isEmpty ? null : {'country': country};
    final response =
        await _client.functions.invoke('create-connect-account', body: body);
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
    final response = await _client.functions.invoke('get-stripe-dashboard-link');
    if (response.status != 200) {
      final error = response.data is Map ? response.data['error'] : null;
      throw Exception('Failed to get dashboard link: ${error ?? 'Unknown error'}');
    }
    final url = response.data['url'];
    if (url == null) {
      throw Exception('No dashboard URL returned');
    }
    return url.toString();
  }
}
