import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme.dart';

class InstructionsScreen extends StatelessWidget {
  const InstructionsScreen({super.key});

  Widget _buildStepTitle(String number, String title) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            number,
            style: GoogleFonts.inter(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Colors.black,
          ),
        ),
      ],
    );
  }

  Widget _bullet(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 44, top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle_outline,
              color: Colors.black54, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Instructions',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Lot Activation Guide',
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Follow these steps to activate and go live with your parking lot.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 1. Set Location
            _buildStepTitle('1', 'Set Location'),
            _bullet(
                'Go to the lot, add it in the app, and pin the GPS entrance and click Register Lot.'),
            const SizedBox(height: 20),

            // 2. Verify Identity
            _buildStepTitle('2', 'Verify Identity'),
            _bullet(
                'Connect Stripe Connect. Payments will be collected immediately, but funds stay "on hold" until the lot is fully verified.'),
            const SizedBox(height: 20),

            // 3. Physical Signage
            _buildStepTitle('3', 'Physical Signage'),
            _bullet(
                'Download the sticker/sign PDF. You can choose depending on your lot will you use Smart Sign or Smart Sticker.'),
            _bullet('Smart Stickers: Use A4 or A5 minimum.'),
            _bullet(
                'Smart Signs: Minimum A3 size. Use 3mm Dibond for durability.'),
            const SizedBox(height: 20),

            // 4. Quality Evidence
            _buildStepTitle('4', 'Quality Evidence'),
            _bullet(
                'Upload 3-5 photos (Entrance, Exit, Parking Stalls, Signage Location). If photos fail, record a 30-second walkthrough video or schedule a call.'),
            const SizedBox(height: 20),

            // 5. Go Live
            _buildStepTitle('5', 'Go Live'),
            _bullet(
                'Once verified, your funds are released if any. Tickets and warnings issued before verification are saved as drafts; they only become "active" and enforceable once the lot is Live.'),
            const SizedBox(height: 32),

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: AppTheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Tip: Ensure your Stripe Connect onboarding is completed to enable automatic payouts.',
                      style: GoogleFonts.inter(
                          color: Colors.black87, fontSize: 14),
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
}
