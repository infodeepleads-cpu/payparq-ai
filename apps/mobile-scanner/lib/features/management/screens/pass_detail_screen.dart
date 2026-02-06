import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:printing/printing.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:pdf/pdf.dart' as pdf;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:typed_data';
import '../../../../theme.dart';

class PassDetailScreen extends StatelessWidget {
  final Map<String, dynamic> permit;

  const PassDetailScreen({super.key, required this.permit});

  @override
  Widget build(BuildContext context) {
    // Calculate fields
    final String type = permit['type'] ?? 'pass';
    final String plate = permit['plate'] ?? 'UNKNOWN';
    final String locationId = permit['location_id'] ?? 'N/A';
    final double price = (permit['price'] as num?)?.toDouble() ?? 0.00;
    final int? dailyDuration = permit['daily_duration_hours'];

    final DateTime startTime = DateTime.parse(permit['start_time']);
    final DateTime endTime = DateTime.parse(permit['end_time']);

    // Logic: If duration is predetermined (e.g. Pass/Sub), use that.
    // If it was LPR based (not fully implemented yet), we'd diff entry/exit.
    // Here we just diff start/end as per current logic.
    final Duration duration = endTime.difference(startTime);
    final String durationString = type == 'subscription'
        ? '${(duration.inDays / 30).toStringAsFixed(1)} Months'
        : '${duration.inHours} Hours';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Permit Details',
            style: GoogleFonts.inter(
                color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Padding(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          children: [
            // Card Container
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: Plate & Type
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plate.toUpperCase(),
                            style: GoogleFonts.inter(
                              fontSize: 40,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                              letterSpacing: -1,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            type.toUpperCase(),
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: const BoxDecoration(
                          color: Colors.black,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          type == 'subscription'
                              ? Icons.loop
                              : Icons.confirmation_number,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 64, color: AppTheme.border),

                  // Grid of Details
                  Wrap(
                    spacing: 64,
                    runSpacing: 32,
                    children: [
                      _buildDetailItem('Location ID', locationId, Icons.map),
                      _buildDetailItem(
                          'Entry Time', _formatDate(startTime), Icons.login),
                      _buildDetailItem(
                          'Exit Time', _formatDate(endTime), Icons.logout),
                      _buildDetailItem('Duration', durationString, Icons.timer),
                      if (dailyDuration != null)
                        _buildDetailItem('Daily Limit', '$dailyDuration Hours',
                            Icons.timelapse),
                      _buildDetailItem('Price', '€${price.toStringAsFixed(2)}',
                          Icons.attach_money),
                    ],
                  ),

                  const SizedBox(height: 24),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: () async {
                          final bytes = await _buildPermitPdf();
                          if (!context.mounted) return;
                          await Printing.sharePdf(
                            bytes: bytes,
                            filename: 'permit_${permit['id']}.pdf',
                          );
                        },
                        icon: const Icon(Icons.picture_as_pdf),
                        label: const Text('Generate PDF'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 12),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final email =
                              (permit['contact_email'] ?? '').toString().trim();
                          if (email.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content:
                                      Text('No email on file for this permit')),
                            );
                            return;
                          }
                          try {
                            final bytes = await _buildPermitPdf();
                            final fileName = 'permit_${permit['id']}.pdf';
                            final storage = Supabase.instance.client.storage
                                .from('evidence');
                            await storage.uploadBinary(
                              fileName,
                              bytes,
                              fileOptions: const FileOptions(
                                contentType: 'application/pdf',
                                upsert: true,
                              ),
                            );
                            final signedUrl = await storage.createSignedUrl(
                                fileName, 60 * 60);
                            final subject =
                                Uri.encodeComponent('Your Parking Permit');
                            final plateVal = (permit['plate'] ?? 'UNKNOWN')
                                .toString()
                                .toUpperCase();
                            final body = Uri.encodeComponent(
                                'Dear Pass Holder,\n\nYour permit for plate $plateVal is ready.\nDownload your PDF here:\n$signedUrl\n\nThank you.');
                            final uri = Uri.parse(
                                'mailto:$email?subject=$subject&body=$body');
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri);
                            } else {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Unable to open email client')),
                              );
                            }
                          } catch (e) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error: $e')),
                            );
                          }
                        },
                        icon: const Icon(Icons.email_outlined),
                        label: const Text('Email PDF to Holder'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 12),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 48),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return SizedBox(
      width: 180,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.grey[400]),
              const SizedBox(width: 8),
              Text(
                label.toUpperCase(),
                style: GoogleFonts.inter(
                  color: AppTheme.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.inter(
              color: Colors.black,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return "${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}";
  }

  Future<Uint8List> _buildPermitPdf() async {
    final doc = pw.Document();
    final startTime = DateTime.parse(permit['start_time']);
    final endTime = DateTime.parse(permit['end_time']);
    final type = (permit['type'] ?? 'pass').toString();
    final plate = (permit['plate'] ?? 'UNKNOWN').toString().toUpperCase();
    final locationId = (permit['location_id'] ?? 'N/A').toString();
    final price = ((permit['price'] as num?)?.toDouble() ?? 0.0);
    final duration = endTime.difference(startTime);
    final durationString = type == 'subscription'
        ? '${(duration.inDays / 30).toStringAsFixed(1)} Months'
        : '${duration.inHours} Hours';
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
                      child: _pdfDetail('Entry Time',
                          "${startTime.day}/${startTime.month}/${startTime.year} ${startTime.hour}:${startTime.minute.toString().padLeft(2, '0')}"),
                    ),
                    pw.SizedBox(width: 16),
                    pw.Expanded(
                      child: _pdfDetail('Exit Time',
                          "${endTime.day}/${endTime.month}/${endTime.year} ${endTime.hour}:${endTime.minute.toString().padLeft(2, '0')}"),
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
                            'Price', '€${price.toStringAsFixed(2)}')),
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
}
