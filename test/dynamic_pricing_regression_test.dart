import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Dynamic pricing save payload uses only valid floor column names',
      () async {
    final file = File(
      'lib/features/intelligence/screens/dynamic_pricing_screen.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('base_floor_monthly_price'),
      isFalse,
      reason:
          'base_floor_monthly_price is an invalid column name and must never be referenced.',
    );
  });

  test('Stripe checkout link generation includes cache buster', () async {
    final file = File(
      'lib/features/intelligence/screens/dynamic_pricing_screen.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('timestamp: timestamp') ||
          content.contains("DateTime.now().millisecondsSinceEpoch.toString()"),
      isTrue,
      reason:
          'Stripe link generation must pass a timestamp cache-buster to avoid stale sessions/URLs.',
    );
  });

  test('Dynamic pricing save invalidates download location cache', () async {
    final file = File(
      'lib/features/intelligence/screens/dynamic_pricing_screen.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('ref.invalidate(selectedDownloadLocationProvider);'),
      isTrue,
      reason:
          'Saving pricing mode must invalidate Download Assets location cache so QR mode reflects the latest setting immediately.',
    );
  });

  test('Instructions location fetch avoids misspelled mode column', () async {
    final file = File('lib/screens/instructions_screen.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
        'verification_metadata, enforcement_pricing_mode, enforcmetn_pricing_mode',
      ),
      isFalse,
      reason:
          'Instructions DB fetch must not request misspelled columns that may not exist, or mode refresh can silently fail.',
    );
  });

  test('Checkout pricing applies floor and ceiling for QR default pricing',
      () async {
    final file = File('supabase/functions/create-checkout/index.ts');
    final content = await file.readAsString();

    expect(
      content.contains('rate_per_hour_floor,rate_per_hour_ceiling') &&
          content.contains('base_price_daily_floor,base_price_daily_ceiling') &&
          content.contains('if (floor > 0 && euro < floor) euro = floor;') &&
          content
              .contains('if (ceiling > 0 && euro > ceiling) euro = ceiling;'),
      isTrue,
      reason:
          'QR fallback pricing in create-checkout must respect min (floor) and max (ceiling) so it matches Stripe link pricing behavior.',
    );
  });

  test('Download sign QR passes clamped price in checkout URL', () async {
    final file = File('lib/screens/instructions_screen.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
              'final signPrice = _resolveSignPrice(selected, signType);') &&
          content.contains('price: signPrice,') &&
          content.contains('rate_per_hour_floor') &&
          content.contains('base_price_daily_floor') &&
          content.contains('rate_per_hour_ceiling') &&
          content.contains('base_price_daily_ceiling'),
      isTrue,
      reason:
          'Download sign QR must include floor/ceiling clamped amount so scanned checkout matches Stripe link pricing.',
    );
  });

  test('Daily enforcement mode uses 24x hourly fine before daily value',
      () async {
    final file = File(
      'lib/features/enforcement/repositories/enforcement_repository.dart',
    );
    final content = await file.readAsString();
    final dailyBlockStart = content.indexOf('if (mode == \'daily\') {');
    final hourlyDailyCalcIndex =
        content.indexOf('if (stripeHourly > 0) return stripeHourly * 24;');
    final dailyUnitFallbackIndex =
        content.indexOf('if (stripeDaily > 0) return stripeDaily;');

    expect(
      content.contains('if (mode == \'daily\')') &&
          hourlyDailyCalcIndex > dailyBlockStart &&
          dailyUnitFallbackIndex > hourlyDailyCalcIndex,
      isTrue,
      reason:
          'Case fines in daily pricing mode must calculate a full day from hourly rate (24h) before any daily fallback.',
    );
  });

  test('Enforcement fine mode resolves from column typo and metadata fallback',
      () async {
    final file = File(
      'lib/features/enforcement/repositories/enforcement_repository.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('row[\'enforcmetn_pricing_mode\']') &&
          content.contains('metadata?[\'enforcement_pricing_mode\']') &&
          content.contains('metadata?[\'enforcmetn_pricing_mode\']') &&
          content.contains('enforcement_pricing_mode, enforcmetn_pricing_mode'),
      isTrue,
      reason:
          'Quick Ticket mode must still resolve as daily even if DB has legacy typo column or metadata-only mode, otherwise fines fall back to 1-hour value.',
    );
  });

  test('Hourly enforcement mode uses daily ticket amount before hourly value',
      () async {
    final file = File(
      'lib/features/enforcement/repositories/enforcement_repository.dart',
    );
    final content = await file.readAsString();
    final hourlyBranchPattern = RegExp(
      r'\}\s+else\s+\{\s+if \(stripeDaily > 0\) return stripeDaily;\s+if \(stripeHourly > 0\) return stripeHourly \* 24;',
      multiLine: true,
    );

    expect(
      hourlyBranchPattern.hasMatch(content),
      isTrue,
      reason:
          'When enforcement mode is hourly, ticket amount must use current daily ticket amount first, not raw 1-hour rate.',
    );
  });

  test('Enforcement ticket pricing uses Stripe-style clamp inputs', () async {
    final file = File(
      'lib/features/enforcement/repositories/enforcement_repository.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('base_price_daily_ceiling') &&
          content.contains('rate_per_hour_ceiling') &&
          content.contains('_resolveStripeUnitPrice('),
      isTrue,
      reason:
          'Cases pricing must use the same clamp inputs and calculation shape as Stripe link pricing source of truth.',
    );
  });
}
