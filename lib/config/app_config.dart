import 'package:flutter/foundation.dart';

class AppConfig {
  static const _rawUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static const _rawAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

  static String get supabaseUrl => _rawUrl.trim();
  static String get supabaseAnonKey => _rawAnonKey.trim();

  static const supabaseFunctionsBaseUrl =
      String.fromEnvironment('SUPABASE_FUNCTIONS_URL', defaultValue: '');
  static const buildDate =
      String.fromEnvironment('BUILD_DATE', defaultValue: '');
  static const env = String.fromEnvironment('ENV', defaultValue: 'dev');
  static const productionGuard =
      String.fromEnvironment('PROD_GUARD', defaultValue: '0');
  static const supabaseRedirectUrl = String.fromEnvironment(
      'SUPABASE_REDIRECT_URL',
      defaultValue: 'https://mobile-scanner-flax-static.vercel.app');

  static void validate() {
    if (supabaseUrl.isEmpty) {
      throw Exception('SUPABASE_URL is missing');
    }
    if (supabaseAnonKey.isEmpty) {
      throw Exception('SUPABASE_ANON_KEY is missing');
    }
    if (!supabaseUrl.startsWith('https://')) {
      throw Exception('SUPABASE_URL must start with https://');
    }
    if (supabaseAnonKey.length < 200) {
      throw Exception(
          'SUPABASE_ANON_KEY appears truncated. Length: ${supabaseAnonKey.length}');
    }
    debugPrint('Supabase URL: $supabaseUrl');
    debugPrint('Supabase Key length: ${supabaseAnonKey.length}');
    debugPrint('Supabase Key prefix: ${supabaseAnonKey.substring(0, 15)}...');
  }

  static void logSupabaseAnonKey() {
    final len = supabaseAnonKey.length;
    final prefix =
        len > 0 ? supabaseAnonKey.substring(0, len < 15 ? len : 15) : '';
    debugPrint('Supabase Key length: $len');
    debugPrint('Supabase Key prefix: $prefix...');
  }

  static String createCheckoutUrl({
    required String locationId,
    required String type,
    String? timestamp,
  }) {
    final t = timestamp ?? DateTime.now().millisecondsSinceEpoch.toString();
    final base = supabaseFunctionsBaseUrl.isNotEmpty
        ? supabaseFunctionsBaseUrl
        : (supabaseUrl.isNotEmpty ? '$supabaseUrl/functions/v1' : '');
    return '$base/create-checkout?location_id=$locationId&type=$type&t=$t';
  }
}
