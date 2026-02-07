import 'dart:typed_data';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart' as pdf;

Future<Uint8List> buildPermitPdf(Map<String, dynamic> permit) async {
  final doc = pw.Document();
  final startTime = DateTime.tryParse((permit['start_time'] ?? '').toString());
  final endTime = DateTime.tryParse((permit['end_time'] ?? '').toString());
  final type = (permit['type'] ?? 'pass').toString();
  final plate = (permit['plate'] ?? 'UNKNOWN').toString().toUpperCase();
  final locationId = (permit['location_id'] ?? 'N/A').toString();
  final price = ((permit['price'] as num?)?.toDouble() ?? 0.0);
  final duration = (startTime != null && endTime != null)
      ? endTime.difference(startTime)
      : null;
  final durationString = type == 'subscription'
      ? (duration != null
          ? '${(duration.inDays / 30).toStringAsFixed(1)} Months'
          : '—')
      : (duration != null ? '${duration.inHours} Hours' : '—');

  doc.addPage(
    pw.Page(
      build: (context) {
        return pw.Container(
          padding: const pw.EdgeInsets.all(24),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        plate,
                        style: pw.TextStyle(
                          fontSize: 28,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        type.toUpperCase(),
                        style: pw.TextStyle(fontSize: 10),
                      ),
                    ],
                  ),
                  pw.Container(
                    padding: const pw.EdgeInsets.all(10),
                    decoration: pw.BoxDecoration(
                      color: pdf.PdfColors.black,
                      shape: pw.BoxShape.circle,
                    ),
                    child: pw.Text(
                      type == 'subscription' ? 'S' : 'P',
                      style: pw.TextStyle(
                        color: pdf.PdfColors.white,
                        fontSize: 16,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 16),
              pw.Divider(),
              pw.SizedBox(height: 16),
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Expanded(
                    child: _pdfDetail('Location ID', locationId),
                  ),
                  pw.SizedBox(width: 16),
                  pw.Expanded(
                    child: _pdfDetail(
                        'Entry Time',
                        startTime != null
                            ? "${startTime.day}/${startTime.month}/${startTime.year} ${startTime.hour}:${startTime.minute.toString().padLeft(2, '0')}"
                            : '—'),
                  ),
                  pw.SizedBox(width: 16),
                  pw.Expanded(
                    child: _pdfDetail(
                        'Exit Time',
                        endTime != null
                            ? "${endTime.day}/${endTime.month}/${endTime.year} ${endTime.hour}:${endTime.minute.toString().padLeft(2, '0')}"
                            : '—'),
                  ),
                ],
              ),
              pw.SizedBox(height: 12),
              pw.Row(
                children: [
                  pw.Expanded(child: _pdfDetail('Duration', durationString)),
                  pw.SizedBox(width: 16),
                  pw.Expanded(
                      child: _pdfDetail(
                          'Price', 'EUR ${price.toStringAsFixed(2)}')),
                ],
              ),
              pw.SizedBox(height: 24),
              pw.Text(
                'This document confirms temporary parking access as per the details above.',
                style: pw.TextStyle(fontSize: 10),
              ),
            ],
          ),
        );
      },
    ),
  );
  return Uint8List.fromList(await doc.save());
}

pw.Widget _pdfDetail(String label, String value) {
  return pw.Container(
    padding: const pw.EdgeInsets.all(8),
    decoration: pw.BoxDecoration(
      border: pw.Border.all(color: pdf.PdfColor.fromInt(0xFFDDDDDD)),
      borderRadius: pw.BorderRadius.circular(6),
    ),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          label.toUpperCase(),
          style: pw.TextStyle(fontSize: 9),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          value,
          style: pw.TextStyle(
            fontSize: 14,
            fontWeight: pw.FontWeight.bold,
          ),
        ),
      ],
    ),
  );
}
