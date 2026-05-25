import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../../../../logic/providers/auth_providers.dart';
import '../../../../logic/providers/locale_provider.dart';
import '../providers/finance_controller.dart';
import '../../../../services/error_mapper.dart';
import '../../../../utils/role_labels.dart';

class FinanceScreen extends ConsumerStatefulWidget {
  const FinanceScreen({super.key});

  @override
  ConsumerState<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends ConsumerState<FinanceScreen>
    with WidgetsBindingObserver {
  bool _isSubmittingManualPayout = false;
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

  // Owner ledger payout state
  List<Map<String, dynamic>> _ownerLedger = [];
  bool _isLoadingLedger = false;
  String? _ledgerError;
  final Map<String, bool> _payoutSubmitting = {};
  final Map<String, bool> _expandedOwners = {};
  final Map<String, TextEditingController> _percentageControllers = {};
  final Map<String, double> _calculatedAmounts = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadOwnerLedger());
  }

  @override
  void dispose() {
    _manualRecipientIdController.dispose();
    _manualAmountController.dispose();
    _manualWeekLabelController.dispose();
    _manualNoteController.dispose();
    for (final c in _percentageControllers.values) {
      c.dispose();
    }
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

  Future<void> _loadOwnerLedger() async {
    setState(() { _isLoadingLedger = true; _ledgerError = null; });
    try {
      final owners = await ref.read(financeControllerProvider).loadOwnerLedger();
      if (!mounted) return;
      setState(() {
        _ownerLedger = owners;
        _ledgerError = null;
      });
    } catch (e) {
      if (mounted) setState(() => _ledgerError = e.toString());
    } finally {
      if (mounted) setState(() => _isLoadingLedger = false);
    }
  }

  Future<void> _handleAllocatePayout(String ownerId, double ownerAmount) async {
    setState(() { _payoutSubmitting[ownerId] = true; });
    try {
      await ref.read(financeControllerProvider).allocateOwnerPayout(
        ownerId: ownerId,
        ownerAmountCents: (ownerAmount * 100).round(),
        payparqAmountCents: 0,
      );
      if (!mounted) return;
      await _loadOwnerLedger();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Marked as paid ✓')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _payoutSubmitting[ownerId] = false);
    }
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
    final availableLocationsAsync = ref.watch(availableLocationsProvider);
    final selectedLocationUuidAsync =
        ref.watch(selectedEffectiveLocationUuidProvider);
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
                final bool canSendRolePayouts = userRole == 'super_admin';
                final availableLocations =
                    availableLocationsAsync.value ?? const [];
                final selectedLocationUuid = selectedLocationUuidAsync.value;
                final activeLocation = availableLocations
                    .cast<Map<String, dynamic>>()
                    .firstWhere(
                      (location) =>
                          (location['id'] ?? '').toString() ==
                          selectedLocationUuid,
                      orElse: () => availableLocations.isNotEmpty
                          ? Map<String, dynamic>.from(availableLocations.first)
                          : <String, dynamic>{},
                    );

                return SingleChildScrollView(
                  padding: const EdgeInsets.all(48),
                  child: canSendRolePayouts ? _buildOwnerPayoutsCard() : const SizedBox.shrink(),
                );
              },
            ),
    );
  }

  Widget _buildOwnerEarningsCard() {
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            Lang.sel(isHr, 'Your Earnings', 'Vaša zarada'),
            style: GoogleFonts.inter(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            Lang.sel(isHr,
              'Manage your bank account and view payout history in Members.',
              'Upravljajte svojom bankovnom računom i pogledajte historiju isplata u Članovima.'),
            style: GoogleFonts.inter(
              color: Colors.white.withValues(alpha: 0.6),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      Lang.sel(isHr, 'Pending', 'U tijeku'),
                      style: GoogleFonts.inter(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '€0.00',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      Lang.sel(isHr, 'Total Earned', 'Ukupno zaradio'),
                      style: GoogleFonts.inter(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '€0.00',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: Text(
              Lang.sel(isHr, 'Go to Members → Payouts', 'Idi na Članove → Isplate'),
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOwnerPayoutsCard() {
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
          Row(
            children: [
              Expanded(
                child: Text(
                  Lang.sel(isHr, 'Owner Ledger', 'Knjiga vlasnika'),
                  style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.black),
                ),
              ),
              ElevatedButton.icon(
                onPressed: _isLoadingLedger ? null : _loadOwnerLedger,
                icon: _isLoadingLedger
                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                    : const Icon(Icons.refresh, size: 16),
                label: Text(Lang.sel(isHr, 'Refresh', 'Osvježi'),
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
              ),
            ],
          ),
          if (_ledgerError != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
              child: Text(_ledgerError!, style: GoogleFonts.inter(fontSize: 12, color: Colors.red.shade700)),
            ),
          ],
          if (_ownerLedger.isEmpty && !_isLoadingLedger) ...[
            const SizedBox(height: 16),
            Text(
              Lang.sel(isHr, 'No pending payouts.', 'Nema pending isplata.'),
              style: GoogleFonts.inter(fontSize: 13, color: Colors.black45),
            ),
          ],
          if (_ownerLedger.isNotEmpty) ...[
            const SizedBox(height: 16),
            ..._ownerLedger.map((owner) {
              final id = owner['owner_id'] as String;
              final email = owner['email'] as String? ?? id;
              final holder = owner['bank_account_holder'] as String? ?? '';
              final bankConfigured = owner['bank_configured'] == true;
              final ownerReserved = (owner['owner_reserved_cents'] as int? ?? 0) / 100;
              final payparqReserved = (owner['payparq_reserved_cents'] as int? ?? 0) / 100;
              final entries = (owner['entries'] as List?) ?? [];
              final isExpanded = _expandedOwners[id] == true;
              final isSubmitting = _payoutSubmitting[id] == true;

              if (!_percentageControllers.containsKey(id)) {
                _percentageControllers[id] = TextEditingController(text: '100');
              }

              return Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.02),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GestureDetector(
                          onTap: () => setState(() => _expandedOwners[id] = !isExpanded),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(holder.isNotEmpty ? holder : email,
                                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                                    if (holder.isNotEmpty) Text(email, style: GoogleFonts.inter(fontSize: 11, color: Colors.black45)),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('€${(ownerReserved + payparqReserved).toStringAsFixed(2)}',
                                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                                  Text('To pay: €${ownerReserved.toStringAsFixed(2)}',
                                      style: GoogleFonts.inter(fontSize: 11, color: Colors.green.shade700, fontWeight: FontWeight.w600)),
                                ],
                              ),
                              const SizedBox(width: 12),
                              Icon(isExpanded ? Icons.expand_less : Icons.expand_more),
                            ],
                          ),
                        ),
                        if (isExpanded) ...[
                          const SizedBox(height: 16),
                          Text('Lots:', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          ...entries.map((entry) {
                            final locName = (entry['location_name'] as String?) ?? 'Unknown';
                            final entryOwnerCents = (entry['owner_reserved_cents'] as int?) ?? 0;
                            final entryPayparqCents = (entry['payparq_reserved_cents'] as int?) ?? 0;
                            final entryTotal = entryOwnerCents + entryPayparqCents;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(locName, style: GoogleFonts.inter(fontSize: 11)),
                                  ),
                                  Text('€${(entryTotal / 100).toStringAsFixed(2)}',
                                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
                                  const SizedBox(width: 8),
                                  Text('(Owner: €${(entryOwnerCents / 100).toStringAsFixed(2)})',
                                      style: GoogleFonts.inter(fontSize: 10, color: Colors.black45)),
                                ],
                              ),
                            );
                          }),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Pay percentage:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 6),
                                    SizedBox(
                                      width: 120,
                                      child: TextField(
                                        controller: _percentageControllers[id],
                                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                        onChanged: (val) => setState(() {}),
                                        decoration: InputDecoration(
                                          suffix: Text('%', style: GoogleFonts.inter(fontSize: 12)),
                                          border: const OutlineInputBorder(),
                                          isDense: true,
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text('Amount:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 6),
                                    Text(
                                      '€${_calculatePayoutAmount(id, ownerReserved).toStringAsFixed(2)}',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.green.shade700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: (isSubmitting || !bankConfigured) ? null : () => _showPayoutDialog(owner),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: bankConfigured ? const Color(0xFF34D399) : Colors.grey,
                                foregroundColor: Colors.black,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                elevation: 0,
                              ),
                              child: isSubmitting
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                    )
                                  : Text(
                                      bankConfigured
                                          ? Lang.sel(isHr, 'Confirm & Pay', 'Potvrdi i Plati')
                                          : Lang.sel(isHr, 'Bank details missing', 'Nedostaju bankovni podaci'),
                                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
                                    ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              );
            }),
          ],
        ],
      ),
    );
  }

  double _calculatePayoutAmount(String ownerId, double fullAmount) {
    final percentage = double.tryParse(_percentageControllers[ownerId]?.text ?? '100') ?? 100;
    return (fullAmount * percentage) / 100;
  }

  void _showPayoutDialog(Map<String, dynamic> owner) {
    final id = owner['owner_id'] as String;
    final name = (owner['bank_account_holder'] as String? ?? owner['email'] as String? ?? id);
    final iban = (owner['bank_iban'] as String?) ?? '';
    final ownerReserved = (owner['owner_reserved_cents'] as int? ?? 0) / 100;
    final payoutAmount = _calculatePayoutAmount(id, ownerReserved);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Mark as Paid'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$name', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
            Text('IBAN: $iban', style: GoogleFonts.inter(fontSize: 11, color: Colors.black45)),
            const SizedBox(height: 12),
            Text('Transfer amount:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
            Text('€${payoutAmount.toStringAsFixed(2)}',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.green.shade700)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Transfer €${payoutAmount.toStringAsFixed(2)} from PayParq bank account to this IBAN, then confirm below.',
                style: GoogleFonts.inter(fontSize: 11, color: Colors.blue.shade900),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _handleAllocatePayout(id, payoutAmount);
            },
            child: const Text('Mark as Paid'),
          ),
        ],
      ),
    );
  }

  Widget _buildSplitPolicyCard({
    required Map<String, dynamic>? activeLocation,
  }) {
    final isHr = ref.watch(localeIsCroatianProvider);
    final metadata = Map<String, dynamic>.from(
        activeLocation?['verification_metadata'] ?? {});
    final isHubLot = metadata['hub_enabled'] == true;
    final activeModeLabel = isHubLot
        ? Lang.sel(isHr, 'Hub lot', 'Hub lot')
        : Lang.sel(isHr, 'Regular lot', 'Regularni lot');
    final activeModeDescription = isHubLot
        ? Lang.sel(
            isHr,
            'Hub mode deducts expenses and tax first, then applies the current PayParq detailed split matrix to the remainder.',
            'Hub način prvo oduzima troškove i porez, a zatim na preostali iznos primjenjuje trenutnu detaljnu PayParq matricu podjele.',
          )
        : Lang.sel(
            isHr,
            'Regular mode deducts expenses and tax first, then applies a 10% platform split to the remainder. Daily checkout uses a minimum fee floor of €0.99 per booked day when 10% of the remainder would be lower.',
            'Regularni način prvo oduzima troškove i porez, a zatim na preostali iznos primjenjuje 10% platformsku podjelu. Dnevni checkout koristi minimalnu naknadu od €0.99 po rezerviranom danu kada bi 10% preostalog iznosa bilo niže.',
          );
    final hubRows = <MapEntry<String, String>>[
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
    final regularRows = <MapEntry<String, String>>[
      MapEntry(
        Lang.sel(isHr, 'All payments', 'Sve uplate'),
        Lang.sel(isHr, '90% lot partner · 10% platform',
            '90% partner parkirališta · 10% platforma'),
      ),
      MapEntry(
        Lang.sel(isHr, 'Daily checkout floor', 'Minimalna dnevna naknada'),
        Lang.sel(
          isHr,
          'If 10% of the distributable remainder is below €0.99 per booked day, the platform fee becomes quantity × €0.99.',
          'Ako je 10% preostalog raspodjeljivog iznosa manje od €0.99 po rezerviranom danu, platformska naknada postaje količina × €0.99.',
        ),
      ),
      MapEntry(
        Lang.sel(isHr, 'Calculation order', 'Redoslijed izračuna'),
        Lang.sel(
          isHr,
          'Expenses + tax are deducted first, then the regular split is applied to the remainder.',
          'Prvo se oduzimaju troškovi i porez, a zatim se regularna podjela primjenjuje na preostali iznos.',
        ),
      ),
      MapEntry(
        Lang.sel(isHr, 'Buyer price', 'Cijena za kupca'),
        Lang.sel(
          isHr,
          'Buyer total stays unchanged. The minimum applies only against the lot owner payout.',
          'Ukupan iznos za kupca ostaje isti. Minimum se primjenjuje samo na isplatu vlasniku lota.',
        ),
      ),
    ];
    final rows = isHubLot ? hubRows : regularRows;
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
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Lang.sel(isHr, 'Active payout mode', 'Aktivni način isplate'),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  activeModeLabel,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  activeModeDescription,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.black.withValues(alpha: 0.72),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            Lang.sel(
              isHr,
              'Active split payout policy for all lots. Payouts processed via owner bank details.',
              'Aktivna pravila za podjelu isplata za sve lotove. Isplate se obrađuju preko podataka банke vlasnika.',
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
            Lang.sel(isHr, 'National Manager Payouts',
                'Isplate nacionalnog menadžera'),
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
              'Send manual payouts to agent and city manager connected accounts.',
              'Pošaljite ručne isplate na Stripe račune agenta i gradskog menadžera.',
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
                      child:
                          Text(productRoleLabel('officer', isCroatian: isHr)),
                    ),
                    DropdownMenuItem(
                      value: 'admin',
                      child: Text(productRoleLabel('admin', isCroatian: isHr)),
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
                    'Lot Partner finances are paid immediately through Stripe Connect destination splits on each payment.',
                    'Financije partnera parkirališta isplaćuju se odmah kroz Stripe Connect podjelu na svakoj uplati.',
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
