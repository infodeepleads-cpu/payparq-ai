import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme.dart';
import '../logic/providers/locale_provider.dart';
import '../logic/providers/auth_providers.dart';
import '../config/app_config.dart';
import '../utils/web_download_helper.dart';

final selectedDownloadLocationProvider =
    FutureProvider<Map<String, dynamic>?>((ref) async {
  final locations = ref.watch(availableLocationsProvider).value ?? const [];
  final selectedDisplayId = ref.watch(selectedLocationIdProvider);
  Map<String, dynamic>? selected;
  if (selectedDisplayId != null && selectedDisplayId.isNotEmpty) {
    for (final loc in locations) {
      if ((loc['display_id'] ?? '').toString() == selectedDisplayId) {
        selected = loc;
        break;
      }
    }
  }
  selected ??= locations.isNotEmpty ? locations.first : null;

  final selectedId = (selected?['id'] ?? '').toString();
  final lookupDisplayId =
      selectedDisplayId != null && selectedDisplayId.isNotEmpty
          ? selectedDisplayId
          : (selected?['display_id'] ?? '').toString();

  Map<String, dynamic>? dbSelected;
  Future<Map<String, dynamic>?> fetchDbLocation({
    required String column,
    required String value,
  }) async {
    if (value.isEmpty) return null;
    final client = Supabase.instance.client;
    try {
      final withMode = await client
          .from('locations')
          .select(
              'id, display_id, name, verification_metadata, enforcement_pricing_mode')
          .eq(column, value)
          .maybeSingle();
      if (withMode != null) {
        return Map<String, dynamic>.from(withMode);
      }
    } catch (_) {}
    try {
      final basic = await client
          .from('locations')
          .select('id, display_id, name, verification_metadata')
          .eq(column, value)
          .maybeSingle();
      if (basic != null) {
        return Map<String, dynamic>.from(basic);
      }
    } catch (_) {}
    try {
      final basicByDisplay = await client
          .from('locations')
          .select('id, display_id, name, verification_metadata')
          .eq('display_id', value)
          .maybeSingle();
      if (basicByDisplay != null) {
        return Map<String, dynamic>.from(basicByDisplay);
      }
    } catch (_) {}
    if (column != 'id') {
      return null;
    }
    final basicById = await client
        .from('locations')
        .select('id, display_id, name, verification_metadata')
        .eq('id', value)
        .maybeSingle();
    if (basicById != null) {
      return Map<String, dynamic>.from(basicById);
    }
    return null;
  }

  try {
    if (selectedId.isNotEmpty) {
      dbSelected = await fetchDbLocation(column: 'id', value: selectedId);
    }
    if (dbSelected == null && lookupDisplayId.isNotEmpty) {
      dbSelected = await fetchDbLocation(
        column: 'display_id',
        value: lookupDisplayId,
      );
    }
  } catch (_) {}

  if (dbSelected != null) {
    return {
      ...?selected,
      ...dbSelected,
    };
  }
  if (selected != null) {
    return {
      ...selected,
      if (lookupDisplayId.isNotEmpty) 'display_id': lookupDisplayId,
    };
  }
  if (lookupDisplayId.isNotEmpty) {
    return {
      'display_id': lookupDisplayId,
      'name': 'Lot $lookupDisplayId',
    };
  }
  return null;
});

class InstructionsScreen extends ConsumerStatefulWidget {
  const InstructionsScreen({super.key});

  @override
  ConsumerState<InstructionsScreen> createState() => _InstructionsScreenState();
}

class _InstructionsScreenState extends ConsumerState<InstructionsScreen> {
  final GlobalKey _instructionsSignKey = GlobalKey();
  final GlobalKey _instructionsTicketKey = GlobalKey();

  String _resolvePricingMode(Map<String, dynamic> source) {
    final metadataRaw = source['verification_metadata'];
    final metadata =
        metadataRaw is Map ? Map<String, dynamic>.from(metadataRaw) : null;
    final mode = (source['enforcement_pricing_mode'] ??
            source['enforcmetn_pricing_mode'] ??
            metadata?['enforcement_pricing_mode'] ??
            metadata?['enforcmetn_pricing_mode'] ??
            'hourly')
        .toString()
        .toLowerCase();
    return mode == 'daily' ? 'daily' : 'hourly';
  }

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

  Future<void> _downloadBoundary({
    required GlobalKey key,
    required String filenamePrefix,
    required String locationLabel,
    required String successMessage,
  }) async {
    try {
      final boundary =
          key.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return;
      final ratio = kIsWeb ? (View.of(context).devicePixelRatio * 2) : 6.0;
      final image = await boundary.toImage(pixelRatio: ratio);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return;
      final bytes = byteData.buffer.asUint8List();
      if (kIsWeb) {
        downloadFileWeb(bytes, '${filenamePrefix}_$locationLabel.png');
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(successMessage)),
        );
      }
    } catch (_) {}
  }

  Widget _buildExactSignContent({
    required bool isCroatian,
    required String locationName,
    required String displayId,
    required String stripeUrl,
  }) {
    return Container(
      width: 400,
      height: 600,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/sign_template_v2.png',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stack) => Container(
                color: Colors.white,
                child: Image.asset(
                  'assets/images/your_photo.png',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stack) =>
                      const SizedBox.shrink(),
                ),
              ),
            ),
          ),
          Positioned(
            top: 48,
            left: 0,
            right: 0,
            height: 56,
            child: Center(
              child: Text(
                locationName.toUpperCase(),
                style: GoogleFonts.montserrat(
                  color: Colors.black,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.8,
                ),
              ),
            ),
          ),
          Align(
            alignment: const Alignment(0, 0.24),
            child: Transform.translate(
              offset: const Offset(0, 12),
              child: SizedBox(
                width: 180,
                height: 180,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    QrImageView(
                      data: stripeUrl,
                      version: QrVersions.auto,
                      size: 120.0,
                      eyeStyle: const QrEyeStyle(
                        eyeShape: QrEyeShape.square,
                        color: Colors.black,
                      ),
                      dataModuleStyle: const QrDataModuleStyle(
                        dataModuleShape: QrDataModuleShape.square,
                        color: Colors.black,
                      ),
                    ),
                    Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'P',
                        style: GoogleFonts.montserrat(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Padding(
                padding: const EdgeInsets.only(left: 52, bottom: 16),
                child: Text(
                  displayId,
                  style: GoogleFonts.inter(
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExactTicketContent({
    required bool isCroatian,
    required String displayId,
    required String ticketUrl,
  }) {
    return Container(
      width: 400,
      height: 600,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 96,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
              ),
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                Lang.sel(isCroatian, 'Daily Ticket', 'Dnevna karta'),
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          Positioned(
            top: 120,
            left: 24,
            right: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black, width: 1.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text(
                        Lang.sel(
                          isCroatian,
                          'Scan to Cases',
                          'Skenirajte za Cases',
                        ),
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          color: Colors.black,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      QrImageView(
                        data: ticketUrl,
                        version: QrVersions.auto,
                        size: 160.0,
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: Colors.black,
                        ),
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.square,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            Lang.sel(
                              isCroatian,
                              'Terms&Help ',
                              'Uvjeti&Pomoć ',
                            ),
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.black,
                            ),
                          ),
                          const SizedBox(width: 4),
                          SizedBox(
                            width: 16,
                            height: 16,
                            child: Image.asset(
                              'assets/images/whatsapp.jpg',
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Transform.translate(
                            offset: Offset(isCroatian ? -5.0 : 0.0, 0.0),
                            child: Text(
                              '+385981974035  ID $displayId',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                                letterSpacing: isCroatian ? -0.1 : 0.0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 24,
            child: Text(
              Lang.sel(
                isCroatian,
                'payparq.ai\nThis invoice is privately issued. Parking invoices are issued on private property. For help or to dispute, contact support via the payparq.ai support number.',
                'payparq.ai\nOva faktura je privatno izdana. Parkirne fakture izdaju se na privatnom posjedu. Za pomoć ili prigovor, kontaktirajte podršku putem broja payparq.ai.',
              ),
              style: GoogleFonts.inter(
                fontSize: 11,
                color: Colors.black54,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDownloadAssets(bool isCroatian) {
    final selectedAsync = ref.watch(selectedDownloadLocationProvider);
    final selected = selectedAsync.value;
    if (selectedAsync.isLoading && selected == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    if (selected == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Text(
          Lang.sel(isCroatian, 'Select a location first.',
              'Prvo odaberite lokaciju.'),
          style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
        ),
      );
    }

    final locationId = (selected['id'] ?? '').toString();
    final displayId = (selected['display_id'] ?? selected['id']).toString();
    final signType = _resolvePricingMode(selected);
    final signUrl = AppConfig.createCheckoutUrl(
      locationId: locationId,
      displayId: displayId,
      type: signType,
    );
    const ticketUrl = 'https://www.payparq.com/cases';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            Lang.sel(isCroatian, 'Download Assets', 'Preuzmi materijale'),
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              SizedBox(
                width: 420,
                child: Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: FittedBox(
                        fit: BoxFit.contain,
                        child: RepaintBoundary(
                          key: _instructionsSignKey,
                          child: _buildExactSignContent(
                            isCroatian: isCroatian,
                            locationName: (selected['name'] ?? '').toString(),
                            displayId: displayId,
                            stripeUrl: signUrl,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _downloadBoundary(
                          key: _instructionsSignKey,
                          filenamePrefix: 'parking_sign',
                          locationLabel: displayId,
                          successMessage: Lang.sel(
                            isCroatian,
                            'Sign downloaded.',
                            'Znak je preuzet.',
                          ),
                        ),
                        icon: const Icon(Icons.download),
                        label: Text(
                          Lang.sel(isCroatian, 'Download Sign', 'Preuzmi znak'),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: 420,
                child: Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: FittedBox(
                        fit: BoxFit.contain,
                        child: RepaintBoundary(
                          key: _instructionsTicketKey,
                          child: _buildExactTicketContent(
                            isCroatian: isCroatian,
                            displayId: displayId,
                            ticketUrl: ticketUrl,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _downloadBoundary(
                          key: _instructionsTicketKey,
                          filenamePrefix: 'daily_ticket',
                          locationLabel: displayId,
                          successMessage: Lang.sel(
                            isCroatian,
                            'Ticket downloaded.',
                            'Karta je preuzeta.',
                          ),
                        ),
                        icon: const Icon(Icons.download),
                        label: Text(
                          Lang.sel(
                              isCroatian, 'Download Ticket', 'Preuzmi kartu'),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.black.withValues(alpha: 0.1)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isCroatian
                        ? 'Pravila podjele prihoda'
                        : 'Revenue Split Rules',
                    style: GoogleFonts.inter(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    isCroatian
                        ? 'Safe Parking: upravitelj 90%, platforma 10% od zajedničkog prihoda.'
                        : 'Safe Parking: manager 90%, platform 10% of shared revenue.',
                    style:
                        GoogleFonts.inter(color: Colors.black87, fontSize: 14),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isCroatian
                        ? 'Hub (Run by Payparq): upravitelj 50%, platforma 50% od zajedničkog prihoda.'
                        : 'Hub (Run by Payparq): manager 50%, platform 50% of shared revenue.',
                    style:
                        GoogleFonts.inter(color: Colors.black87, fontSize: 14),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isCroatian
                        ? 'Ista enforcement politika za oba modela: 25% platforma, 25% admin, 25% upravitelj, zadnjih 25% dobiva račun koji je učitao dokaz (ili izdavatelj dnevnog QR ticketa nakon plaćanja).'
                        : 'Same enforcement policy for both models: 25% platform, 25% admin, 25% manager, final 25% goes to the account that uploaded winning evidence (or paid daily-ticket QR issuer).',
                    style:
                        GoogleFonts.inter(color: Colors.black87, fontSize: 14),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _buildDownloadAssets(isCroatian),
          ],
        ),
      ),
    );
  }
}
