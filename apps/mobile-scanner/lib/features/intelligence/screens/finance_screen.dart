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

class _FinanceScreenState extends ConsumerState<FinanceScreen> {
  bool _isConnecting = false;
  bool _isLoadingDashboard = false;

  Future<void> _handleStripeConnect() async {
    setState(() => _isConnecting = true);

    await AsyncActionHandler.run<void>(
      context: context,
      action: () async {
        final url = await ref.read(financeControllerProvider).createConnectAccount();
        if (await canLaunchUrl(Uri.parse(url))) {
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
    if (mounted) setState(() => _isConnecting = false);
  }

  Future<void> _handleOpenDashboard() async {
    setState(() => _isLoadingDashboard = true);

    await AsyncActionHandler.run<void>(
      context: context,
      action: () async {
        final url = await ref.read(financeControllerProvider).getDashboardLink();
        if (await canLaunchUrl(Uri.parse(url))) {
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
    if (mounted) setState(() => _isLoadingDashboard = false);
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final isHr = ref.watch(localeIsCroatianProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: profileAsync.when(
        data: (profile) {
          final bool isConnected =
              profile?['stripe_onboarding_complete'] ?? false;
          final String? accountId = profile?['stripe_account_id'];

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
                _buildStripeStatusCard(isConnected, accountId),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) =>
            Center(child: Text(Lang.sel(isHr, 'Error: $e', 'Greška: $e'))),
      ),
    );
  }

  Widget _buildStripeStatusCard(bool isConnected, String? accountId) {
    final isHr = ref.watch(localeIsCroatianProvider);
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
                        isConnected
                            ? Lang.sel(isHr, 'CONNECTED', 'POVEZANO')
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
                  isConnected
                      ? Lang.sel(
                          isHr,
                          'Your account is ready to receive payouts.',
                          'Vaš račun je spreman za primanje isplata.')
                      : Lang.sel(
                          isHr,
                          'Connect your Stripe Express account to start receiving automated payouts.',
                          'Povežite svoj Stripe Express račun za automatske isplate.'),
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isConnected
                      ? Lang.sel(
                          isHr,
                          'All parking revenue (minus commissions) is automatically transferred to your IBAN.',
                          'Sav prihod od parkiranja (minus provizije) automatski se prenosi na vaš IBAN.')
                      : Lang.sel(
                          isHr,
                          'Onboarding takes less than 2 minutes via Stripe\'s secure platform.',
                          'Uključivanje traje manje od 2 minute putem sigurnog Stripe sustava.'),
                  style: GoogleFonts.inter(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 14,
                  ),
                ),
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
                            isConnected
                                ? Lang.sel(isHr, 'OPEN DASHBOARD',
                                    'OTVORI NADZORNU PLOČU')
                                : Lang.sel(
                                    isHr, 'CONNECT STRIPE', 'POVEŽI STRIPE'),
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
