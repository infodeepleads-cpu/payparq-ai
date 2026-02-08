import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:payparq_scanner/features/management/utils/permit_pdf.dart';

void main() {
  test('Permit PDF generation produces non-empty bytes', () async {
    final samplePermit = {
      'id': 'test123',
      'type': 'guest',
      'plate': 'MA679XX',
      'location_id': 'MA679CN',
      'price': 20,
      'start_time': DateTime(2026, 2, 7, 8, 0).toIso8601String(),
      'end_time': DateTime(2026, 2, 7, 18, 0).toIso8601String(),
    };
    final Uint8List bytes = await buildPermitPdf(samplePermit);
    expect(bytes.isNotEmpty, true);
  });
}
