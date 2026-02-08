import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:printing/printing.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../utils/permit_pdf.dart';
import '../../../logic/providers/locale_provider.dart';

class PassDetailScreen extends ConsumerWidget {
  final Map<String, dynamic> permit;

  const PassDetailScreen({super.key, required this.permit});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    // Calculate fields
    final String type = permit['type'] ?? 'pass';
    final String plate = permit['plate'] ?? 'UNKNOWN';
    final String locationId = permit['location_id'] ?? 'N/A';
    final double price = (permit['price'] as num?)?.toDouble() ?? 0.00;
    final String contactName = (permit['contact_name'] ?? '').toString();
    final String contactPhone = (permit['contact_phone'] ?? '').toString();
    final String contactEmail = (permit['contact_email'] ?? '').toString();

    final DateTime? startTime =
        DateTime.tryParse((permit['start_time'] ?? '').toString());
    final DateTime? endTime =
        DateTime.tryParse((permit['end_time'] ?? '').toString());

    // Logic: If duration is predetermined (e.g. Pass/Sub), use that.
    // If it was LPR based (not fully implemented yet), we'd diff entry/exit.
    // Here we just diff start/end as per current logic.
    final Duration? duration = (startTime != null && endTime != null)
        ? endTime.difference(startTime)
        : null;
    final String durationString = type == 'subscription'
        ? (duration != null
            ? '${(duration.inDays / 30).toStringAsFixed(1)} Months'
            : '—')
        : (duration != null ? '${duration.inHours} Hours' : '—');

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(Lang.sel(isCroatian, 'Permit Details', 'Detalji dozvole'),
            style: GoogleFonts.inter(
                color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isDesktop = constraints.maxWidth >= 1100;
          return SingleChildScrollView(
            padding: EdgeInsets.all(isDesktop ? 48.0 : 16.0),
            child: Column(
              children: [
            // Card Container
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 24,
                    offset: const Offset(0, 12),
                  ),
                ],
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

                  Wrap(
                    spacing: 64,
                    runSpacing: 32,
                    children: [
                      _buildDetailItem(
                          Lang.sel(isCroatian, 'Location ID', 'ID lokacije'),
                          locationId,
                          Icons.map),
                      _buildDetailItem(
                          Lang.sel(isCroatian, 'Name', 'Ime'),
                          contactName.isNotEmpty ? contactName : '—',
                          Icons.person),
                      _buildDetailItem(
                          Lang.sel(isCroatian, 'Phone', 'Telefon'),
                          contactPhone.isNotEmpty ? contactPhone : '—',
                          Icons.phone),
                      _buildDetailItem(
                          Lang.sel(isCroatian, 'Email', 'Email'),
                          contactEmail.isNotEmpty ? contactEmail : '—',
                          Icons.email_outlined),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 64,
                    runSpacing: 32,
                    children: [
                      _buildDetailItem(
                          Lang.sel(isCroatian, 'Entry Time', 'Vrijeme ulaza'),
                          startTime != null ? _formatDate(startTime) : '—',
                          Icons.login),
                      _buildDetailItem(
                          Lang.sel(isCroatian, 'Exit Time', 'Vrijeme izlaza'),
                          endTime != null ? _formatDate(endTime) : '—',
                          Icons.logout),
                      _buildDetailItem(
                          Lang.sel(isCroatian, 'Duration', 'Trajanje'),
                          durationString,
                          Icons.timer),
                      _buildDetailItem(
                          Lang.sel(isCroatian, 'Price', 'Cijena'),
                          '€${price.toStringAsFixed(2)}',
                          Icons.attach_money),
                    ],
                  ),

                  const SizedBox(height: 24),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: () async {
                          final bytes = await buildPermitPdf(permit);
                          if (!context.mounted) return;
                          await Printing.sharePdf(
                            bytes: bytes,
                            filename: 'permit_${permit['id']}.pdf',
                          );
                        },
                        icon: const Icon(Icons.picture_as_pdf),
                        label:
                            Text(Lang.sel(isCroatian, 'Generate PDF', 'Generiraj PDF')),
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
                          try {
                            final bytes = await buildPermitPdf(permit);
                            final contactEmail = (permit['contact_email'] ?? '')
                                .toString()
                                .trim();
                            if (kIsWeb) {
                              final subject =
                                  Uri.encodeComponent(Lang.sel(
                                      isCroatian,
                                      'Your Parking Permit',
                                      'Vaša dozvola za parkiranje'));
                              final plateVal = (permit['plate'] ?? 'UNKNOWN')
                                  .toString()
                                  .toUpperCase();
                              final body = Uri.encodeComponent(
                                  Lang.sel(
                                      isCroatian,
                                      'Dear Pass Holder,\n\nYour permit for plate $plateVal is ready.\nPlease attach the generated PDF to this email.\n\nThank you.',
                                      'Poštovani korisniče dozvole,\n\nVaša dozvola za registraciju $plateVal je spremna.\nMolimo priložite generirani PDF uz ovu e-poštu.\n\nHvala.'));
                              final mailto =
                                  'mailto:${contactEmail.isNotEmpty ? contactEmail : ''}?subject=$subject&body=$body';
                              final uri = Uri.parse(mailto);
                              if (await canLaunchUrl(uri)) {
                                await launchUrl(uri);
                              } else {
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                      content: Text(Lang.sel(isCroatian,
                                          'Unable to open email client',
                                          'Nije moguće otvoriti email klijent'))),
                                );
                              }
                            } else {
                              await Printing.sharePdf(
                                bytes: bytes,
                                filename: 'permit_${permit['id']}.pdf',
                              );
                            }
                          } catch (e) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content: Text(Lang.sel(isCroatian, 'Error: $e',
                                      'Greška: $e'))),
                            );
                          }
                        },
                        icon: const Icon(Icons.email_outlined),
                        label: Text(Lang.sel(
                            isCroatian, 'Email PDF to Holder', 'Pošalji PDF nositelju')),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.black,
                          side: const BorderSide(color: AppTheme.border),
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
          );
        },
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
}
