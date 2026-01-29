import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../theme.dart';
import '../../../../logic/providers/auth_providers.dart';

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

    try {
      final response = await Supabase.instance.client.functions
          .invoke('create-connect-account');

      if (response.status != 200) {
        throw 'Failed to create connect account: ${response.data['error'] ?? 'Unknown error'}';
      }

      final url = response.data['url'];
      if (url == null) throw 'No onboarding URL returned';

      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      } else {
        throw 'Could not launch onboarding URL';
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isConnecting = false);
    }
  }

  Future<void> _handleOpenDashboard() async {
    setState(() => _isLoadingDashboard = true);

    try {
      final response = await Supabase.instance.client.functions
          .invoke('get-stripe-dashboard-link');

      if (response.status != 200) {
        throw 'Failed to get dashboard link: ${response.data['error'] ?? 'Unknown error'}';
      }

      final url = response.data['url'];
      if (url == null) throw 'No dashboard URL returned';

      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      } else {
        throw 'Could not launch dashboard URL';
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingDashboard = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);

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
                // Header
                Text(
                  'Finance',
                  style: GoogleFonts.inter(
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Manage your payouts, commissions, and Stripe connection.',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 48),

                // Stripe Connection Status Card
                _buildStripeStatusCard(isConnected, accountId),

                const SizedBox(height: 48),

                // Financial Metrics
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 4,
                  crossAxisSpacing: 24,
                  mainAxisSpacing: 24,
                  childAspectRatio: 1.6,
                  children: [
                    _buildFinanceMetricCard(
                      'PENDING BALANCE',
                      '€0.00',
                      Icons.timer_outlined,
                      'Funds being processed by Stripe',
                    ),
                    _buildFinanceMetricCard(
                      'AVAILABLE BALANCE',
                      '€0.00',
                      Icons.account_balance_wallet_outlined,
                      'Funds ready for payout to IBAN',
                    ),
                    _buildFinanceMetricCard(
                      'LAST PAYOUT',
                      '€0.00',
                      Icons.payments_outlined,
                      'Most recent transfer to your bank',
                    ),
                    _buildFinanceMetricCard(
                      'COMMISSION PAID',
                      '€0.00',
                      Icons.receipt_long_outlined,
                      'Total platform fees collected',
                    ),
                  ],
                ),

                const SizedBox(height: 48),

                // Placeholder for Earnings History
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'EARNINGS HISTORY',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          Text(
                            'Last 30 Days',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 100),
                      const Icon(Icons.bar_chart,
                          size: 64, color: Color(0xFFF0F0F0)),
                      const SizedBox(height: 16),
                      Text(
                        'Detailed history will appear here once payouts begin.',
                        style: GoogleFonts.inter(color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildStripeStatusCard(bool isConnected, String? accountId) {
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
                        isConnected ? 'CONNECTED' : 'ACTION REQUIRED',
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
                      ? 'Your account is ready to receive payouts.'
                      : 'Connect your Stripe Express account to start receiving automated payouts.',
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
                      ? 'All parking revenue (minus commissions) is automatically transferred to your IBAN.'
                      : 'Onboarding takes less than 2 minutes via Stripe\'s secure platform.',
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
                            isConnected ? 'OPEN DASHBOARD' : 'CONNECT STRIPE',
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
                      'Update Details',
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

  Widget _buildFinanceMetricCard(
      String title, String value, IconData icon, String tooltip) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Icon(icon, color: Colors.white, size: 18),
              ),
              Tooltip(
                message: tooltip,
                child:
                    Icon(Icons.info_outline, color: Colors.grey[300], size: 16),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
