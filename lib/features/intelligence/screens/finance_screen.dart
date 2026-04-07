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
  String? _selectedCountryCode;
  bool _refreshProfileOnResume = false;
  Map<String, dynamic>? _lastProfile;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
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

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final isHr = ref.watch(localeIsCroatianProvider);
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
                    : (isConnected
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

  // Removed finance metric cards per instruction
}
