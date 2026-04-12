import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../theme.dart';
import '../../../../logic/providers/auth_providers.dart';
import '../../../../logic/providers/locale_provider.dart';
import '../providers/finance_controller.dart';
import '../../../../services/error_mapper.dart';
import '../../../../utils/async_action_handler.dart';

class FinanceScreen extends ConsumerStatefulWidget {
  const FinanceScreen({super.key});

  @override
  ConsumerState<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends ConsumerState<FinanceScreen>
    with WidgetsBindingObserver {
  bool _isConnecting = false;
  bool _isLoadingDashboard = false;
  bool _isSubmittingManualPayout = false;
  String? _selectedCountryCode;
  String _manualPayoutRole = 'officer';
  bool _refreshProfileOnResume = false;
  String? _manualPayoutError;
  String? _manualPayoutSuccess;
  Map<String, dynamic>? _lastProfile;
  final TextEditingController _manualRecipientIdController =
      TextEditingController();
  final TextEditingController _manualAmountController = TextEditingController();
  final TextEditingController _manualWeekLabelController =
      TextEditingController();
  final TextEditingController _manualNoteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    _manualRecipientIdController.dispose();
    _manualAmountController.dispose();
    _manualWeekLabelController.dispose();
    _manualNoteController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _refreshProfileOnResume) {
      _refreshProfileOnResume = false;
      ref.invalidate(userProfileProvider);
    }
  }

  String? _normalizeCountryCode(dynamic raw) {
    if (raw == null) return null;
    final value = raw.toString().trim().toUpperCase();
    if (RegExp(r'^[A-Z]{2}$').hasMatch(value)) {
      return value;
    }
    return null;
  }

  String _resolveConnectCountry(Map<String, dynamic>? profile) {
    final fromProfile = _normalizeCountryCode(profile?['stripe_country']) ??
        _normalizeCountryCode(profile?['country_code']) ??
        _normalizeCountryCode(profile?['country']) ??
        _normalizeCountryCode(profile?['billing_country']) ??
        _normalizeCountryCode(profile?['legal_country']);
    if (fromProfile != null) return fromProfile;
    final localeCountry =
        _normalizeCountryCode(Localizations.localeOf(context).countryCode);
    if (localeCountry != null) return localeCountry;
    return 'HR';
  }

  String _effectiveConnectCountry(Map<String, dynamic>? profile) {
    return _normalizeCountryCode(_selectedCountryCode) ??
        _resolveConnectCountry(profile);
  }

  Future<void> _pickStripeCountry(Map<String, dynamic>? profile) async {
    final isHr = ref.read(localeIsCroatianProvider);
    final controller = TextEditingController(
      text: _effectiveConnectCountry(profile),
    );
    final selected = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          Lang.sel(isHr, 'Stripe Country', 'Stripe država'),
        ),
        content: TextField(
          controller: controller,
          textCapitalization: TextCapitalization.characters,
          maxLength: 2,
          autofocus: true,
          decoration: InputDecoration(
            labelText: Lang.sel(isHr, 'Country Code', 'Kod države'),
            hintText: 'US',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(Lang.sel(isHr, 'Cancel', 'Odustani')),
          ),
          ElevatedButton(
            onPressed: () {
              final code = _normalizeCountryCode(controller.text);
              if (code == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      Lang.sel(
                        isHr,
                        'Use a valid 2-letter country code.',
                        'Unesite ispravan dvoslovni kod države.',
                      ),
                    ),
                  ),
                );
                return;
              }
              Navigator.of(context).pop(code);
            },
            child: Text(Lang.sel(isHr, 'Save', 'Spremi')),
          ),
        ],
      ),
    );
    if (!mounted || selected == null) return;
    setState(() => _selectedCountryCode = selected);
  }

  Future<void> _handleStripeConnect() async {
    setState(() => _isConnecting = true);
    final profile = ref.read(userProfileProvider).value;
    final country = _effectiveConnectCountry(profile);

    await AsyncActionHandler.run<void>(
      context: context,
      action: () async {
        final url = await ref
            .read(financeControllerProvider)
            .createConnectAccount(country: country);
        if (await canLaunchUrl(Uri.parse(url))) {
          _refreshProfileOnResume = true;
          await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        } else {
          throw Exception('Could not launch onboarding URL');
        }
      },
      errorBuilder: ErrorMapper.message,
      onError: (_) {
        if (mounted) setState(() => _isConnecting = false);
      },
    );
    ref.invalidate(userProfileProvider);
    if (mounted) setState(() => _isConnecting = false);
  }

  Future<void> _handleOpenDashboard() async {
    setState(() => _isLoadingDashboard = true);

    await AsyncActionHandler.run<void>(
      context: context,
      action: () async {
        final url =
            await ref.read(financeControllerProvider).getDashboardLink();
        if (await canLaunchUrl(Uri.parse(url))) {
          _refreshProfileOnResume = true;
          await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        } else {
          throw Exception('Could not launch dashboard URL');
        }
      },
      errorBuilder: ErrorMapper.message,
      onError: (_) {
        if (mounted) setState(() => _isLoadingDashboard = false);
      },
    );
    ref.invalidate(userProfileProvider);
    if (mounted) setState(() => _isLoadingDashboard = false);
  }

  Future<void> _handleManualPayoutSubmit() async {
    final isHr = ref.read(localeIsCroatianProvider);
    final recipientId = _manualRecipientIdController.text.trim();
    if (recipientId.isEmpty) {
      setState(() {
        _manualPayoutError = Lang.sel(
          isHr,
          'Enter recipient profile ID.',
          'Unesite ID profila primatelja.',
        );
        _manualPayoutSuccess = null;
      });
      return;
    }
    final parsedAmount = double.tryParse(
      _manualAmountController.text.trim().replaceAll(',', '.'),
    );
    if (parsedAmount == null || parsedAmount <= 0) {
      setState(() {
        _manualPayoutError = Lang.sel(
          isHr,
          'Enter a valid amount in EUR.',
          'Unesite ispravan iznos u EUR.',
        );
        _manualPayoutSuccess = null;
      });
      return;
    }
    final amountCents = (parsedAmount * 100).round();
    if (amountCents <= 0) {
      setState(() {
        _manualPayoutError = Lang.sel(
          isHr,
          'Amount must be greater than zero.',
          'Iznos mora biti veći od nule.',
        );
        _manualPayoutSuccess = null;
      });
      return;
    }
    setState(() {
      _isSubmittingManualPayout = true;
      _manualPayoutError = null;
      _manualPayoutSuccess = null;
    });
    try {
      final transferId =
          await ref.read(financeControllerProvider).sendManualPayout(
                recipientId: recipientId,
                role: _manualPayoutRole,
                amountCents: amountCents,
                weekLabel: _manualWeekLabelController.text.trim(),
                note: _manualNoteController.text.trim(),
              );
      if (!mounted) return;
      setState(() {
        _manualPayoutSuccess = transferId.isEmpty
            ? Lang.sel(isHr, 'Payout sent successfully.',
                'Isplata je uspješno poslana.')
            : Lang.sel(
                isHr,
                'Payout sent successfully. Transfer: $transferId',
                'Isplata je uspješno poslana. Prijenos: $transferId',
              );
        _manualAmountController.clear();
        _manualNoteController.clear();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _manualPayoutError = ErrorMapper.message(e);
        _manualPayoutSuccess = null;
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmittingManualPayout = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final isHr = ref.watch(localeIsCroatianProvider);
    final userRole = ref.watch(userRoleProvider);
    final profile = profileAsync.value;
    if (profile != null) {
      _lastProfile = profile;
    }
    final resolvedProfile = profile ?? _lastProfile;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: (resolvedProfile == null && profileAsync.isLoading)
          ? const Center(child: CircularProgressIndicator())
          : Builder(
              builder: (_) {
                final String accountId =
                    (resolvedProfile?['stripe_account_id'] ?? '')
                        .toString()
                        .trim();
                final bool hasStripeAccount = accountId.isNotEmpty;
                final bool onboardingComplete =
                    resolvedProfile?['stripe_onboarding_complete'] == true;
                final bool isConnected = hasStripeAccount || onboardingComplete;
                final bool needsOnboarding =
                    hasStripeAccount && !onboardingComplete;
                final bool canSendRolePayouts = userRole == 'super_admin';

                return SingleChildScrollView(
                  padding: const EdgeInsets.all(48),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        Lang.sel(isHr, 'Finance', 'Financije'),
                        style: GoogleFonts.inter(
                          fontSize: 40,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                          letterSpacing: -1,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        Lang.sel(
                            isHr,
                            'Manage your payouts, commissions, and Stripe connection.',
                            'Upravljajte isplatama, provizijama i Stripe povezivanjem.'),
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 32),
                      _buildStripeStatusCard(
                        isConnected: isConnected,
                        onboardingComplete: onboardingComplete,
                        needsOnboarding: needsOnboarding,
                        accountId: hasStripeAccount ? accountId : null,
                        profile: resolvedProfile,
                      ),
                      if (canSendRolePayouts) ...[
                        const SizedBox(height: 20),
                        _buildManualPayoutCard(),
                      ],
                      const SizedBox(height: 20),
                      _buildSplitPolicyCard(
                        onboardingComplete: onboardingComplete,
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Widget _buildStripeStatusCard({
    required bool isConnected,
    required bool onboardingComplete,
    required bool needsOnboarding,
    required String? accountId,
    required Map<String, dynamic>? profile,
  }) {
    final isHr = ref.watch(localeIsCroatianProvider);
    final selectedCountry = _effectiveConnectCountry(profile);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isConnected ? Colors.green : Colors.orange,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        onboardingComplete
                            ? Lang.sel(isHr, 'CONNECTED', 'POVEZANO')
                            : isConnected
                                ? Lang.sel(isHr, 'SETUP IN PROGRESS',
                                    'POSTAVLJANJE U TIJEKU')
                                : Lang.sel(
                                    isHr, 'ACTION REQUIRED', 'POTREBNA AKCIJA'),
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    if (accountId != null)
                      Text(
                        'ID: $accountId',
                        style: GoogleFonts.inter(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  onboardingComplete
                      ? Lang.sel(
                          isHr,
                          'Your account is ready to receive payouts.',
                          'Vaš račun je spreman za primanje isplata.')
                      : (needsOnboarding
                          ? Lang.sel(
                              isHr,
                              'Finish Stripe onboarding to enable payouts and full account access.',
                              'Dovršite Stripe uključivanje za isplate i puni pristup računu.')
                          : Lang.sel(
                              isHr,
                              'Connect your Stripe Express account to start receiving automated payouts.',
                              'Povežite svoj Stripe Express račun za automatske isplate.')),
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  onboardingComplete
                      ? Lang.sel(
                          isHr,
                          'All parking revenue (minus commissions) is automatically transferred to your IBAN.',
                          'Sav prihod od parkiranja (minus provizije) automatski se prenosi na vaš IBAN.')
                      : (needsOnboarding
                          ? Lang.sel(
                              isHr,
                              'You can reopen onboarding at any time to complete pending Stripe requirements.',
                              'Uključivanje možete ponovno otvoriti u bilo kojem trenutku za dovršavanje Stripe zahtjeva.')
                          : Lang.sel(
                              isHr,
                              'Onboarding takes less than 2 minutes via Stripe\'s secure platform.',
                              'Uključivanje traje manje od 2 minute putem sigurnog Stripe sustava.')),
                  style: GoogleFonts.inter(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 14,
                  ),
                ),
                if (!onboardingComplete) ...[
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Text(
                        '${Lang.sel(isHr, 'Country', 'Država')}: $selectedCountry',
                        style: GoogleFonts.inter(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 10),
                      TextButton(
                        onPressed: () => _pickStripeCountry(profile),
                        child: Text(
                          Lang.sel(isHr, 'Change', 'Promijeni'),
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 48),
          Column(
            children: [
              ElevatedButton(
                onPressed: (_isConnecting || _isLoadingDashboard)
                    ? null
                    : (onboardingComplete
                        ? _handleOpenDashboard
                        : _handleStripeConnect),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: (_isConnecting || _isLoadingDashboard)
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.black),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(isConnected ? Icons.dashboard : Icons.add_link),
                          const SizedBox(width: 12),
                          Text(
                            onboardingComplete
                                ? Lang.sel(isHr, 'OPEN DASHBOARD',
                                    'OTVORI NADZORNU PLOČU')
                                : (needsOnboarding
                                    ? Lang.sel(isHr, 'COMPLETE ONBOARDING',
                                        'DOVRŠI UKLJUČIVANJE')
                                    : Lang.sel(isHr, 'CONNECT STRIPE',
                                        'POVEŽI STRIPE')),
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
              ),
              if (isConnected)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: TextButton(
                    onPressed: () {}, // Future: Update IBAN/Identity
                    child: Text(
                      Lang.sel(isHr, 'Update Details', 'Ažuriraj podatke'),
                      style: GoogleFonts.inter(
                        color: Colors.white.withValues(alpha: 0.6),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSplitPolicyCard({
    required bool onboardingComplete,
  }) {
    final isHr = ref.watch(localeIsCroatianProvider);
    final rows = <MapEntry<String, String>>[
      MapEntry(
        Lang.sel(isHr, 'Hourly / Daily / Reservation',
            'Satno / Dnevno / Rezervacija'),
        Lang.sel(
            isHr, '50% owner · 50% platform', '50% vlasnik · 50% platforma'),
      ),
      MapEntry(
        Lang.sel(isHr, 'Monthly', 'Mjesečno'),
        Lang.sel(
            isHr, '90% owner · 10% platform', '90% vlasnik · 10% platforma'),
      ),
      MapEntry(
        Lang.sel(isHr, 'Park & Taxi', 'Park & Taxi'),
        Lang.sel(
          isHr,
          'Park now + Park&Taxi reservation: split base is 50% of daily ticket value; rides are excluded from split.',
          'Park now + Park&Taxi rezervacija: baza za podjelu je 50% vrijednosti dnevne karte; vožnje su isključene iz podjele.',
        ),
      ),
      MapEntry(
        Lang.sel(isHr, 'Cases', 'Slučajevi'),
        Lang.sel(
          isHr,
          'Fixed owner payout per case; remaining amount stays on platform.',
          'Fiksna isplata vlasniku po slučaju; preostali iznos ostaje platformi.',
        ),
      ),
      MapEntry(
        Lang.sel(isHr, 'Calculation order', 'Redoslijed izračuna'),
        Lang.sel(
          isHr,
          'Expenses + tax are deducted first, then the split is applied.',
          'Prvo se oduzimaju troškovi i porez, zatim se primjenjuje podjela.',
        ),
      ),
    ];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            Lang.sel(isHr, 'Split Payout Policy', 'Pravila podjele isplate'),
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            onboardingComplete
                ? Lang.sel(
                    isHr,
                    'Active for Stripe-connected lots. Non-onboarded lots fall back to platform-only collection.',
                    'Aktivno za lotove povezane na Stripe. Lotovi bez dovršenog uključivanja koriste naplatu samo na platformu.',
                  )
                : Lang.sel(
                    isHr,
                    'Connect Stripe to activate automated owner/platform split payouts.',
                    'Povežite Stripe za aktivaciju automatske podjele isplata između vlasnika i platforme.',
                  ),
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ...rows.map(
            (row) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 4,
                    child: Text(
                      row.key,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 6,
                    child: Text(
                      row.value,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.black.withValues(alpha: 0.75),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManualPayoutCard() {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            Lang.sel(isHr, 'Super Admin Payouts', 'Isplate super admina'),
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            Lang.sel(
              isHr,
              'Send manual payouts to officer and admin connected accounts.',
              'Pošaljite ručne isplate na Stripe račune officera i admina.',
            ),
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              SizedBox(
                width: 320,
                child: TextField(
                  controller: _manualRecipientIdController,
                  decoration: InputDecoration(
                    labelText: Lang.sel(
                        isHr, 'Recipient profile ID', 'ID profila primatelja'),
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
              SizedBox(
                width: 220,
                child: DropdownButtonFormField<String>(
                  initialValue: _manualPayoutRole,
                  items: [
                    DropdownMenuItem(
                      value: 'officer',
                      child: Text(Lang.sel(isHr, 'Officer', 'Officer')),
                    ),
                    DropdownMenuItem(
                      value: 'admin',
                      child: Text(Lang.sel(isHr, 'Admin', 'Admin')),
                    ),
                  ],
                  onChanged: _isSubmittingManualPayout
                      ? null
                      : (value) {
                          if (value == null) return;
                          setState(() => _manualPayoutRole = value);
                        },
                  decoration: InputDecoration(
                    labelText: Lang.sel(isHr, 'Role', 'Uloga'),
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
              SizedBox(
                width: 220,
                child: TextField(
                  controller: _manualAmountController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: Lang.sel(isHr, 'Amount EUR', 'Iznos EUR'),
                    hintText: '120.50',
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
              SizedBox(
                width: 260,
                child: TextField(
                  controller: _manualWeekLabelController,
                  decoration: InputDecoration(
                    labelText: Lang.sel(isHr, 'Week label', 'Tjedna oznaka'),
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _manualNoteController,
            decoration: InputDecoration(
              labelText: Lang.sel(isHr, 'Note', 'Napomena'),
              border: const OutlineInputBorder(),
            ),
          ),
          if (_manualPayoutError != null && _manualPayoutError!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              _manualPayoutError!,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: Colors.red.shade700,
              ),
            ),
          ],
          if (_manualPayoutSuccess != null &&
              _manualPayoutSuccess!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              _manualPayoutSuccess!,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: Colors.green.shade700,
              ),
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Text(
                  Lang.sel(
                    isHr,
                    'Manager finances are paid immediately through Stripe Connect destination splits on each payment.',
                    'Manager financije se isplaćuju odmah kroz Stripe Connect podjelu na svakoj uplati.',
                  ),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.black.withValues(alpha: 0.65),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _isSubmittingManualPayout
                    ? null
                    : _handleManualPayoutSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF34D399),
                  foregroundColor: Colors.black,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                child: _isSubmittingManualPayout
                    ? SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.black.withValues(alpha: 0.8),
                        ),
                      )
                    : Text(
                        Lang.sel(isHr, 'Send Payout', 'Pošalji isplatu'),
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
