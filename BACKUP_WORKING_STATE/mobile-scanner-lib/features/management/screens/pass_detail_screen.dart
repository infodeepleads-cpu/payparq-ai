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
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: Text('Permit Details', style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.w600)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Card Container
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
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
                            plate,
                            style: GoogleFonts.inter(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          Text(
                            type.toUpperCase(),
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: Colors.grey[500],
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          type == 'subscription' ? Icons.loop : Icons.confirmation_number,
                          color: AppTheme.primary,
                          size: 32,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 48),
                  
                  // Grid of Details
                  Wrap(
                    spacing: 40,
                    runSpacing: 24,
                    children: [
                      _buildDetailItem('Location ID', locationId, Icons.map),
                      _buildDetailItem('Entry Time', _formatDate(startTime), Icons.login),
                      _buildDetailItem('Exit Time', _formatDate(endTime), Icons.logout),
                      _buildDetailItem('Duration', durationString, Icons.timer),
                      if (dailyDuration != null)
                        _buildDetailItem('Daily Limit', '$dailyDuration Hours', Icons.timelapse),
                      _buildDetailItem('Price', '\$${price.toStringAsFixed(2)}', Icons.attach_money),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Stripe Section
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.link, color: Colors.blue),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Stripe Payment Link', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                              Text(stripeLink, style: GoogleFonts.inter(color: Colors.blue, fontSize: 12)),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            // TODO: Copy to clipboard or launch URL
                          },
                          icon: const Icon(Icons.copy, size: 18),
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
      width: 150,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.grey[400]),
              const SizedBox(width: 8),
              Text(
                label,
                style: GoogleFonts.inter(
                  color: Colors.grey[500],
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.inter(
              color: Colors.black,
              fontSize: 16,
              fontWeight: FontWeight.w600,
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
