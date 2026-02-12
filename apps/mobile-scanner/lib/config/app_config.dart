class AppConfig {
  static const supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static const supabaseAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');
  static const supabaseFunctionsBaseUrl =
      String.fromEnvironment('SUPABASE_FUNCTIONS_URL', defaultValue: '');
  static const buildDate =
      String.fromEnvironment('BUILD_DATE', defaultValue: '');
  static const env = String.fromEnvironment('ENV', defaultValue: 'dev');
  static const productionGuard =
      String.fromEnvironment('PROD_GUARD', defaultValue: '0');

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
