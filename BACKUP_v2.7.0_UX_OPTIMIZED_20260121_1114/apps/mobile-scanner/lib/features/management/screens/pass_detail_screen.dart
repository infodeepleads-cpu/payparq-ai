import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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

    final String stripeLink = permit['stripe_payment_url'] ?? 'Not generated';

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

                  const SizedBox(height: 48),

                  // Stripe Section
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.link, color: Colors.black),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Payment Link',
                                  style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14)),
                              Text(stripeLink,
                                  style: GoogleFonts.inter(
                                      color: AppTheme.textSecondary,
                                      fontSize: 12)),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () {},
                          icon: const Icon(Icons.copy_all,
                              size: 20, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
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
}
