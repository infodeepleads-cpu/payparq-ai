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
}
