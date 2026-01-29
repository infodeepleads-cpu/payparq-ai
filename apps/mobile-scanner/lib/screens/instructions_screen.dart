import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme.dart';
import '../logic/providers/locale_provider.dart';

class InstructionsScreen extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final isCroatian = ref.watch(localeIsCroatianProvider);

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          isCroatian ? 'Upute' : 'Instructions',
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
                    isCroatian
                        ? 'Vodič za aktivaciju parkirališta'
                        : 'Lot Activation Guide',
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isCroatian
                        ? 'Slijedite ove korake kako biste aktivirali i pustili u rad svoje parkiralište.'
                        : 'Follow these steps to activate and go live with your parking lot.',
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
            _buildStepTitle(
                '1', isCroatian ? 'Postavite lokaciju' : 'Set Location'),
            _bullet(isCroatian
                ? 'Otiđite na parkiralište, dodajte ga u aplikaciju, označite GPS ulaz i kliknite Registriraj parkiralište.'
                : 'Go to the lot, add it in the app, and pin the GPS entrance and click Register Lot.'),
            const SizedBox(height: 20),

            // 2. Verify Identity
            _buildStepTitle(
                '2', isCroatian ? 'Potvrdite identitet' : 'Verify Identity'),
            _bullet(isCroatian
                ? 'Povežite Stripe Connect. Naplate će započeti odmah, ali sredstva ostaju na čekanju dok se parkiralište u potpunosti ne verificira.'
                : 'Connect Stripe Connect. Payments will be collected immediately, but funds stay "on hold" until the lot is fully verified.'),
            const SizedBox(height: 20),

            // 3. Physical Signage
            _buildStepTitle(
                '3', isCroatian ? 'Fizička signalizacija' : 'Physical Signage'),
            _bullet(isCroatian
                ? 'Preuzmite PDF naljepnice/znaka. Možete odabrati hoćete li koristiti Pametni znak ili Pametnu naljepnicu, ovisno o vašem parkiralištu.'
                : 'Download the sticker/sign PDF. You can choose depending on your lot will you use Smart Sign or Smart Sticker.'),
            _bullet(isCroatian
                ? 'Pametne naljepnice: Koristite minimalno A4 ili A5 format.'
                : 'Smart Stickers: Use A4 or A5 minimum.'),
            _bullet(isCroatian
                ? 'Pametni znakovi: Minimalno A3 format. Koristite 3mm Dibond za dugovječnost.'
                : 'Smart Signs: Minimum A3 size. Use 3mm Dibond for durability.'),
            const SizedBox(height: 20),

            // 4. Quality Evidence
            _buildStepTitle(
                '4', isCroatian ? 'Dokazi kvalitete' : 'Quality Evidence'),
            _bullet(isCroatian
                ? 'Prenesite 3-5 fotografija (ulaz, izlaz, parkirna mjesta, lokacija signalizacije). Ako fotografije ne uspiju, snimite video obilaska od 30 sekundi ili zakažite poziv.'
                : 'Upload 3-5 photos (Entrance, Exit, Parking Stalls, Signage Location). If photos fail, record a 30-second walkthrough video or schedule a call.'),
            const SizedBox(height: 20),

            // 5. Go Live
            _buildStepTitle('5', isCroatian ? 'Kreni uživo' : 'Go Live'),
            _bullet(isCroatian
                ? 'Nakon verifikacije, vaša sredstva se oslobađaju. Kazne i upozorenja izdana prije verifikacije spremaju se kao skice; postaju aktivna i izvršiva tek kada parkiralište krene uživo.'
                : 'Once verified, your funds are released if any. Tickets and warnings issued before verification are saved as drafts; they only become "active" and enforceable once the lot is Live.'),
            const SizedBox(height: 32),

            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border:
                    Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: AppTheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      isCroatian
                          ? 'Savjet: Provjerite je li Stripe Connect registracija dovršena kako biste omogućili automatske isplate.'
                          : 'Tip: Ensure your Stripe Connect onboarding is completed to enable automatic payouts.',
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
