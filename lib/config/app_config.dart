import 'package:flutter/foundation.dart';

class AppConfig {
  static const _rawUrl = String.fromEnvironment('SUPABASE_URL',
      defaultValue: 'https://iafjygownkhedereaoxw.supabase.co');
  static const _rawAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY',
      defaultValue:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZmp5Z293bmtoZWRlcmVhb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDA3ODgsImV4cCI6MjA4MzcxNjc4OH0.O4fylsFOmrxwZj9MeASIypOxJdQROLjTwUq8KZewFfg');

  static String get supabaseUrl =>
      _rawUrl.trim().replaceAll('"', '').replaceAll("'", "");
  static String get supabaseAnonKey =>
      _rawAnonKey.trim().replaceAll('"', '').replaceAll("'", "");

  static const supabaseFunctionsBaseUrl =
      String.fromEnvironment('SUPABASE_FUNCTIONS_URL', defaultValue: '');
  static const env = String.fromEnvironment('ENV', defaultValue: 'dev');
  static const productionGuard =
      String.fromEnvironment('PROD_GUARD', defaultValue: '0');
  static const _rawRedirectUrl =
      String.fromEnvironment('SUPABASE_REDIRECT_URL', defaultValue: '');
  static const _webSignOutStartupFlag = String.fromEnvironment(
      'FORCE_WEB_SIGNOUT_ON_STARTUP',
      defaultValue: '0');
  static const _rawApkDownloadUrl = String.fromEnvironment('APK_DOWNLOAD_URL',
      defaultValue:
          'https://github.com/kzamic-prog/payparq.ai/releases/download/apk-latest/app-release.apk');
  static String get apkDownloadUrl =>
      _rawApkDownloadUrl.trim().replaceAll('"', '').replaceAll("'", "");

  static String get buildDate {
    const fromEnv = String.fromEnvironment('BUILD_DATE',
        defaultValue: '2026-03-09 20:30:00 (DEV)');
    return fromEnv;
  }

  static bool _isLocalHost(String host) {
    final value = host.toLowerCase();
    return value == 'localhost' || value == '127.0.0.1';
  }

  static String _webResetPath(Uri base) {
    final portPart = base.hasPort ? ':${base.port}' : '';
    return '${base.scheme}://${base.host}$portPart/reset-password';
  }

  static String get supabaseRedirectUrl {
    final configured =
        _rawRedirectUrl.trim().replaceAll('"', '').replaceAll("'", "");
    if (kIsWeb) {
      final base = Uri.base;
      if (base.hasScheme && base.host.isNotEmpty) {
        if (configured.isNotEmpty) {
          final configuredUri = Uri.tryParse(configured);
          if (configuredUri != null &&
              configuredUri.hasScheme &&
              configuredUri.host.isNotEmpty) {
            final configuredIsLocal = _isLocalHost(configuredUri.host);
            final currentIsLocal = _isLocalHost(base.host);
            if (configuredIsLocal == currentIsLocal) {
              return configured;
            }
          }
        }
        return _webResetPath(base);
      }
      return 'http://localhost:8080/reset-password';
    }
    if (configured.isNotEmpty) {
      return configured;
    }
    return 'io.supabase.flutter://reset-callback/';
  }

  static bool get forceWebSignOutOnStartup =>
      _webSignOutStartupFlag.trim() != '0';

  static const zeroPriceSetupLink =
      String.fromEnvironment('ZERO_PRICE_SETUP_LINK', defaultValue: '');

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
    String? displayId,
    required String type,
    String? timestamp,
    double? price,
    bool allowPromotionCodes = false,
    String? promotionCodeLabel,
    String? permitId,
    String? checkIn,
    String? checkOut,
    String? flow,
  }) {
    final t = timestamp ?? DateTime.now().millisecondsSinceEpoch.toString();
    final base = supabaseFunctionsBaseUrl.isNotEmpty
        ? supabaseFunctionsBaseUrl
        : '$supabaseUrl/functions/v1';
    final queryParams = <String, String>{
      'location_id': locationId,
      if (displayId != null && displayId.isNotEmpty) 'display_id': displayId,
      'type': type,
      't': t,
      if (permitId != null) 'permit_id': permitId,
      if (checkIn != null && checkIn.isNotEmpty) 'check_in': checkIn,
      if (checkOut != null && checkOut.isNotEmpty) 'check_out': checkOut,
      if (flow != null && flow.isNotEmpty) 'flow': flow,
    };
    if (price != null) {
      final normalized = price < 0 ? 0.0 : price;
      queryParams['price'] = normalized.toStringAsFixed(2);
      queryParams['amount'] = normalized.toStringAsFixed(2);
      queryParams['amount_cents'] = (normalized * 100).round().toString();
    }
    if (allowPromotionCodes) {
      queryParams['allow_promotion_codes'] = '1';
    }
    final trimmedLabel = promotionCodeLabel?.trim() ?? '';
    if (trimmedLabel.isNotEmpty) {
      queryParams['promotion_code_label'] = trimmedLabel;
    }
    return Uri.parse('$base/create-checkout')
        .replace(queryParameters: queryParams)
        .toString();
  }

  static String createZeroPriceUrl({
    required String locationId,
    String? displayId,
    required String type,
    String? timestamp,
  }) {
    return createCheckoutUrl(
      locationId: locationId,
      displayId: displayId,
      type: type,
      timestamp: timestamp,
      price: 0,
    );
  }
}
