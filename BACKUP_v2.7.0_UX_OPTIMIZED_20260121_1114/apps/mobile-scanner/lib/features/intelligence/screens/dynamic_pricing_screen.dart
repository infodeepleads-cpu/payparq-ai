import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../theme.dart';
import '../../../widgets/pulsating_loading_screen.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../logic/providers/auth_providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DynamicPricingScreen extends ConsumerStatefulWidget {
  const DynamicPricingScreen({super.key});

  @override
  ConsumerState<DynamicPricingScreen> createState() =>
      _DynamicPricingScreenState();
}

class _DynamicPricingScreenState extends ConsumerState<DynamicPricingScreen> {
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _locations = [];
  Map<String, dynamic>? _selectedLocation;
  bool _isLoading = true;

  // Controllers for pricing
  final TextEditingController _hourlyController = TextEditingController();
  final TextEditingController _dailyController = TextEditingController();
  final TextEditingController _monthlyController = TextEditingController();

  // Dynamic Pricing state
  bool _dynamicEnabled = false;
  bool _surchargeEnabled = false;
  bool _autopilotEnabled = false;
  double _dynamicRatio = 1.0; // 100% default
  double _surchargeMultiplier = 1.0; // 100% default

  @override
  void initState() {
    super.initState();
    _fetchLocations();
  }

  Future<void> _fetchLocations() async {
    try {
      final profileAsync = ref.read(userProfileProvider);
      final profile = profileAsync.value;

      if (profile == null) {
        if (profileAsync.hasError)
          throw Exception('Profile Error: ${profileAsync.error}');
        return;
      }

      final user = supabase.auth.currentUser;
      if (user == null) return;

      final isSuperAdmin = profile['role'] == 'super_admin';
      final isAdmin = profile['role'] == 'admin';

      debugPrint(
          '🔍 FETCHING LOCATIONS. ROLE: ${profile['role']} | ID: ${profile['location_id']}');

      var query = supabase.from('locations').select();

      // If not super admin, filter accordingly
      if (isSuperAdmin) {
        // Super admin sees all
      } else if (isAdmin) {
        // Admin sees all locations they own
        query = query.eq('owner_id', user.id);
      } else {
        // Others (Officers) see their assigned location
        if (profile['location_id'] != null) {
          query = query.eq('display_id', profile['location_id']);
        }
      }

      final data = await query;
      final List<Map<String, dynamic>> newLocations =
          List<Map<String, dynamic>>.from(data);

      debugPrint('✅ RECEIVED ${newLocations.length} LOCATIONS');

      if (mounted) {
        setState(() {
          _locations = newLocations;
          if (_locations.isNotEmpty) {
            // Priority: Use the globally selected location from MasterScaffold
            final globalSelectedId = ref.read(selectedLocationIdProvider);
            if (globalSelectedId != null) {
              final globalIndex = _locations.indexWhere(
                  (l) => l['display_id'].toString() == globalSelectedId);
              if (globalIndex != -1) {
                _selectLocation(_locations[globalIndex]);
              } else {
                _selectLocation(_locations.first);
              }
            } else {
              _selectLocation(_locations.first);
            }
          } else {
            _selectedLocation = null;
            _hourlyController.clear();
            _dailyController.clear();
            _monthlyController.clear();
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('❌ FETCH ERROR: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _selectLocation(Map<String, dynamic> loc) {
    // 1. Extract raw values
    double dynamicRatio = (loc['dynamic_pricing_ratio'] ?? 1.0).toDouble();
    double surchargeMultiplier =
        (loc['surcharge_multiplier'] ?? 1.0).toDouble();

    // 2. Fix 10000% bug aggressively:
    // If the value is > 2, it's definitely stored as a whole percentage (e.g. 100)
    // instead of a ratio (e.g. 1.0). We must convert it for the Slider (0.0-2.0).
    if (dynamicRatio > 2.0) {
      dynamicRatio = dynamicRatio / 100.0;
    }

    // Similarly for surcharge multiplier if it was saved as percentage
    if (surchargeMultiplier > 10.0) {
      surchargeMultiplier = surchargeMultiplier / 100.0;
    }

    // 3. Auto-correct stale benchmarks (99% -> 100%, 89% -> 90%)
    if ((dynamicRatio * 100).round() == 99) dynamicRatio = 1.0;
    if ((dynamicRatio * 100).round() == 89) dynamicRatio = 0.9;

    // 4. Ensure values are within Slider bounds
    dynamicRatio = dynamicRatio.clamp(0.0, 2.0);
    surchargeMultiplier = surchargeMultiplier.clamp(1.0, 10.0);

    setState(() {
      _selectedLocation = loc;

      // Robust price parsing
      final hourly = (loc['rate_per_hour'] ?? 0.0).toString();
      final daily = (loc['base_price_daily'] ?? 0.0).toString();
      final monthly = (loc['base_price_monthly'] ?? 0.0).toString();

      _hourlyController.text = hourly;
      _dailyController.text = daily;
      _monthlyController.text = monthly;

      _dynamicEnabled = loc['dynamic_pricing_enabled'] ?? false;
      _surchargeEnabled = loc['surcharge_enabled'] ?? false;
      _autopilotEnabled = loc['autopilot_enabled'] ?? false;

      _dynamicRatio = dynamicRatio;
      _surchargeMultiplier = surchargeMultiplier;

      debugPrint(
          '📍 SELECTED: ${loc['name']} | H: $hourly | D: $daily | M: $monthly');
    });
  }

  Future<void> _saveSettings() async {
    if (_selectedLocation == null) {
      debugPrint('❌ NO LOCATION SELECTED TO SAVE');
      return;
    }

    final String targetId = _selectedLocation!['id'].toString();

    // Verification step: Check if targetId exists in current _locations list
    final availableIds = _locations.map((l) => l['id'].toString()).toList();
    debugPrint('🧪 VERIFYING ID $targetId AGAINST AVAILABLE: $availableIds');

    if (!availableIds.contains(targetId)) {
      debugPrint(
          '🚨 CRITICAL ERROR: TARGET ID $targetId NOT IN AVAILABLE LIST');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Error: Selected Location ID not found in database!'),
            backgroundColor: Colors.red),
      );
      return;
    }

    // Capture user input before starting the save
    final String rawHourly =
        _hourlyController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newHourly = double.tryParse(rawHourly) ?? 0.0;

    final String rawDaily =
        _dailyController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newDaily = double.tryParse(rawDaily) ?? 0.0;

    final String rawMonthly =
        _monthlyController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newMonthly = double.tryParse(rawMonthly) ?? 0.0;

    setState(() => _isLoading = true);

    try {
      final updatePayload = {
        'rate_per_hour': newHourly,
        'base_price_daily': newDaily,
        'base_price_monthly': newMonthly,
        'dynamic_pricing_enabled': _dynamicEnabled,
        'surcharge_enabled': _surchargeEnabled,
        'autopilot_enabled': _autopilotEnabled,
        'dynamic_pricing_ratio': _dynamicRatio,
        'surcharge_multiplier': _surchargeMultiplier,
      };

      debugPrint('🚨 ATTEMPTING SAVE TO ID: $targetId');
      debugPrint('📦 PAYLOAD: $updatePayload');

      // 1. Perform update and FORCE it to return the row so we know if it worked
      final response = await supabase
          .from('locations')
          .update(updatePayload)
          .eq('id', targetId)
          .select();

      debugPrint('📡 SERVER RESPONSE: $response');

      if (response != null && response.isNotEmpty) {
        final updatedData = response.first;
        debugPrint('✅ SUCCESS! RETURNED ID: ${updatedData['id']}');

        setState(() {
          final index =
              _locations.indexWhere((l) => l['id'].toString() == targetId);
          if (index != -1) {
            _locations[index] = updatedData;
          }
          _selectedLocation = updatedData;

          // Force text controllers to the new saved values
          _hourlyController.text =
              (updatedData['rate_per_hour'] ?? 0.0).toString();
          _dailyController.text =
              (updatedData['base_price_daily'] ?? 0.0).toString();
          _monthlyController.text =
              (updatedData['base_price_monthly'] ?? 0.0).toString();
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ SAVED! New Price: $newHourly'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
      } else {
        debugPrint('❌ NO ROWS UPDATED! SERVER RETURNED EMPTY RESPONSE.');
        throw Exception(
            'Update failed: Location $targetId not found or update blocked.');
      }
    } catch (e) {
      final errorStr = e.toString();
      debugPrint('🔥 CRITICAL SAVE ERROR: $errorStr');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ SAVE FAILED: $errorStr'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 10),
          action: SnackBarAction(
              label: 'RETRY',
              onPressed: _saveSettings,
              textColor: Colors.white),
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _generateStripeLink(String type) async {
    if (_selectedLocation == null) return;
    // Use the 5-digit display_id for the user-facing Stripe link
    final locationId =
        _selectedLocation!['display_id'] ?? _selectedLocation!['id'];

    // Add timestamp cache-buster to prevent browser from returning old Stripe sessions
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final baseUrl =
        'https://iafjygownkhedereaoxw.supabase.co/functions/v1/create-checkout';
    final url =
        Uri.parse('$baseUrl?location_id=$locationId&type=$type&t=$timestamp');

    debugPrint('Opening Checkout: $url');

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment link generated!')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open Stripe link')));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch the global selection and trigger a re-fetch if it changes
    ref.listen(selectedLocationIdProvider, (previous, next) {
      if (next != null && next != previous) {
        _fetchLocations();
      }
    });

    if (_isLoading) {
      return const PulsatingLoadingScreen();
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dynamic Pricing',
              style: GoogleFonts.inter(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Colors.black,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'v1.1.2 • Seasonal & algorithmic price adjustments.',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 48),

            // Master AutoPilot Control
            _buildMasterControl(),
            const SizedBox(height: 48),

            // Base Pricing
            _buildSectionHeader('Standard Base Rates'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                    child: _buildPriceInput('Hourly Rate', _hourlyController,
                        Icons.timer_outlined)),
                const SizedBox(width: 24),
                Expanded(
                    child: _buildPriceInput(
                        'Daily Rate', _dailyController, Icons.today_outlined)),
                const SizedBox(width: 24),
                Expanded(
                    child: _buildPriceInput('Monthly Rate', _monthlyController,
                        Icons.calendar_month_outlined)),
              ],
            ),
            const SizedBox(height: 48),

            // Dynamic Adjustment
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionHeader('Demand Sensitivity'),
                      const SizedBox(height: 16),
                      _buildControlCard(
                        title: 'Demand Ratio',
                        subtitle: 'Adjustment benchmark (0% - 200%)',
                        enabled: _dynamicEnabled,
                        onToggle: (val) =>
                            setState(() => _dynamicEnabled = val),
                        child: Column(
                          children: [
                            Slider(
                              value: _dynamicRatio,
                              min: 0.0,
                              max: 2.0,
                              divisions: 20,
                              label: '${(_dynamicRatio * 100).toInt()}%',
                              activeColor: Colors.black,
                              inactiveColor: AppTheme.surface,
                              onChanged: (_dynamicEnabled && !_autopilotEnabled)
                                  ? (val) => setState(() => _dynamicRatio = val)
                                  : null,
                            ),
                            Text(
                              'Manual Benchmark: ${(_dynamicRatio * 100).toInt()}%',
                              style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                  fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 32),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionHeader('Congestion Surcharge'),
                      const SizedBox(height: 16),
                      _buildControlCard(
                        title: 'Surcharge Multiplier',
                        subtitle: 'Peak-traffic premium (1x - 10x)',
                        enabled: _surchargeEnabled,
                        onToggle: (val) =>
                            setState(() => _surchargeEnabled = val),
                        child: Column(
                          children: [
                            Slider(
                              value: _surchargeMultiplier,
                              min: 1.0,
                              max: 10.0,
                              divisions: 18,
                              label: '${_surchargeMultiplier}x',
                              activeColor: Colors.black,
                              inactiveColor: AppTheme.surface,
                              onChanged: (_surchargeEnabled &&
                                      !_autopilotEnabled)
                                  ? (val) =>
                                      setState(() => _surchargeMultiplier = val)
                                  : null,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Manual Benchmark: ${_surchargeMultiplier}x',
                              style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                  fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 48),

            // Entry Points
            _buildSectionHeader('Payment Terminal Assets'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      _buildStripeButton(
                          'Generate Hourly Link', 'hourly', Colors.black),
                      const SizedBox(height: 12),
                      _buildStripeButton(
                          'Generate Daily Link', 'daily', Colors.black),
                      const SizedBox(height: 12),
                      _buildStripeButton(
                          'Generate Monthly Link', 'monthly', Colors.black),
                    ],
                  ),
                ),
                const SizedBox(width: 48),
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    children: [
                      Text('TERMINAL QR',
                          style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                              letterSpacing: 1.2)),
                      const SizedBox(height: 16),
                      if (_selectedLocation != null)
                        QrImageView(
                          data:
                              'https://iafjygownkhedereaoxw.supabase.co/functions/v1/create-checkout?location_id=${_selectedLocation!['id']}&type=hourly',
                          version: QrVersions.auto,
                          size: 160.0,
                        )
                      else
                        const Text('Select a location'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 64),
            Center(
              child: SizedBox(
                width: 200,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _saveSettings,
                  icon: const Icon(Icons.save_outlined),
                  label: const Text('Save Changes'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMasterControl() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.black, // Changed to Pure Black
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Smart AutoPilot',
                  style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('Seasonal & Time-based algorithmic adjustments',
                  style:
                      GoogleFonts.inter(color: Colors.white70, fontSize: 13)),
            ],
          ),
          Switch.adaptive(
            value: _autopilotEnabled,
            onChanged: (val) => setState(() => _autopilotEnabled = val),
            activeColor: Colors.white,
            activeTrackColor: Colors.black,
            inactiveTrackColor: Colors.white10,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.grey[600],
            letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildPriceInput(
      String label, TextEditingController controller, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.grey),
              const SizedBox(width: 8),
              Text(label,
                  style:
                      GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
            ],
          ),
          TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
            decoration: const InputDecoration(
                border: InputBorder.none, prefixText: '€'),
          ),
        ],
      ),
    );
  }

  Widget _buildControlCard({
    required String title,
    required String subtitle,
    required bool enabled,
    required Function(bool) onToggle,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: enabled
                ? const Color(0xFF2563EB).withOpacity(0.3)
                : Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: GoogleFonts.inter(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(subtitle,
                      style: GoogleFonts.inter(
                          fontSize: 12, color: Colors.grey[600])),
                ],
              ),
              Switch.adaptive(
                value: enabled,
                onChanged: onToggle,
                activeColor: Colors.black,
              ),
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }

  Widget _buildStripeButton(String label, String type, Color color) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton.icon(
        onPressed: () => _generateStripeLink(type),
        icon: const Icon(Icons.payment_outlined, size: 18),
        label: Text(label),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
          side: const BorderSide(color: AppTheme.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
      ),
    );
  }
}
