import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:qr_flutter/qr_flutter.dart';
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

      debugPrint('🔍 FETCHING LOCATIONS FOR ID: ${profile['location_id']}');

      final data = await supabase
          .from('locations')
          .select()
          .eq('display_id', profile['location_id']);

      final List<Map<String, dynamic>> newLocations =
          List<Map<String, dynamic>>.from(data);

      debugPrint('✅ RECEIVED ${newLocations.length} LOCATIONS');
      for (var loc in newLocations) {
        debugPrint('📍 ID: ${loc['id']} | NAME: ${loc['name']}');
      }

      setState(() {
        _locations = newLocations;
        if (_locations.isNotEmpty) {
          if (_selectedLocation != null) {
            final existingId = _selectedLocation!['id'].toString();
            final stillExists =
                _locations.indexWhere((l) => l['id'].toString() == existingId);
            if (stillExists != -1) {
              debugPrint('🔄 RESTORING SELECTION: $existingId');
              _selectLocation(_locations[stillExists]);
            } else {
              debugPrint('⚠️ PREVIOUS ID $existingId NOT FOUND, PICKING FIRST');
              _selectLocation(_locations.first);
            }
          } else {
            debugPrint('🆕 INITIAL SELECTION: ${_locations.first['id']}');
            _selectLocation(_locations.first);
          }
        }
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('❌ FETCH ERROR: $e');
      setState(() => _isLoading = false);
    }
  }

  void _selectLocation(Map<String, dynamic> location) {
    // 1. Extract raw values
    double dynamicRatio = (location['dynamic_pricing_ratio'] ?? 1.0).toDouble();
    double surchargeMultiplier =
        (location['surcharge_multiplier'] ?? 1.0).toDouble();

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
      _selectedLocation = location;
      // Strip any non-numeric characters just in case
      _hourlyController.text = (location['rate_per_hour'] ?? 0.0).toString();
      _dailyController.text = (location['base_price_daily'] ?? 0.0).toString();
      _monthlyController.text =
          (location['base_price_monthly'] ?? 0.0).toString();

      _dynamicEnabled = location['dynamic_pricing_enabled'] ?? false;
      _surchargeEnabled = location['surcharge_enabled'] ?? false;
      _autopilotEnabled = location['autopilot_enabled'] ?? false;

      _dynamicRatio = dynamicRatio;
      _surchargeMultiplier = surchargeMultiplier;
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
    final locationId = _selectedLocation!['id'];

    // Add timestamp cache-buster to prevent browser from returning old Stripe sessions
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final baseUrl =
        'https://iafjygownkhedereaoxw.supabase.co/functions/v1/create-checkout';
    final url =
        Uri.parse('$baseUrl?location_id=$locationId&type=$type&t=$timestamp');

    debugPrint('Opening Checkout: $url');

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open Stripe link')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Dynamic Pricing Engine',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            Text(
                'v1.1.1 - ID: ${_selectedLocation?['id']?.toString().substring(0, 8) ?? 'None'}',
                style: GoogleFonts.inter(fontSize: 10, color: Colors.grey)),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchLocations();
            },
            icon: const Icon(Icons.refresh),
            tooltip: 'Force Sync',
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: TextButton.icon(
              onPressed: _saveSettings,
              icon: const Icon(Icons.save),
              label: const Text('Save Changes'),
              style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF2563EB)),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Master AutoPilot Control
            _buildMasterControl(),
            const SizedBox(height: 24),

            // Location Selector
            _buildSectionHeader('Target Location'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<Map<String, dynamic>>(
                  value: _selectedLocation,
                  isExpanded: true,
                  items: _locations.map((loc) {
                    return DropdownMenuItem(
                        value: loc,
                        child: Text(loc['name'] ?? 'Unnamed Location'));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) _selectLocation(val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Base Pricing
            _buildSectionHeader('Standard Base Rates'),
            Row(
              children: [
                Expanded(
                    child: _buildPriceInput(
                        'Hourly', _hourlyController, Icons.timer)),
                const SizedBox(width: 16),
                Expanded(
                    child: _buildPriceInput(
                        'Daily', _dailyController, Icons.today)),
                const SizedBox(width: 16),
                Expanded(
                    child: _buildPriceInput(
                        'Monthly', _monthlyController, Icons.calendar_month)),
              ],
            ),
            const SizedBox(height: 32),

            // Dynamic Adjustment
            _buildSectionHeader('Price Adjustment Benchmarks'),
            _buildControlCard(
              title: 'Demand Sensitivity Ratio',
              subtitle: 'Base adjustment benchmark (0% - 200%)',
              enabled: _dynamicEnabled,
              onToggle: (val) => setState(() => _dynamicEnabled = val),
              child: Column(
                children: [
                  Slider(
                    value: _dynamicRatio,
                    min: 0.0,
                    max: 2.0,
                    divisions: 20,
                    label: '${(_dynamicRatio * 100).toInt()}%',
                    activeColor: const Color(0xFF2563EB),
                    onChanged: (_dynamicEnabled && !_autopilotEnabled)
                        ? (val) => setState(() => _dynamicRatio = val)
                        : null,
                  ),
                  Text(
                    'Manual Benchmark: ${(_dynamicRatio * 100).toInt()}%',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF2563EB)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Surcharge Adjustment
            _buildSectionHeader('Congestion Surcharge Adjustment'),
            _buildControlCard(
              title: 'Peak Surcharge Multiplier',
              subtitle: 'Premium adjustment for high-traffic events (1x - 10x)',
              enabled: _surchargeEnabled,
              onToggle: (val) => setState(() => _surchargeEnabled = val),
              child: Column(
                children: [
                  Slider(
                    value: _surchargeMultiplier,
                    min: 1.0,
                    max: 10.0,
                    divisions: 18,
                    label: '${_surchargeMultiplier}x',
                    activeColor: Colors.orange,
                    onChanged: (_surchargeEnabled && !_autopilotEnabled)
                        ? (val) => setState(() => _surchargeMultiplier = val)
                        : null,
                  ),
                  Text(
                    'Manual Benchmark: ${_surchargeMultiplier}x',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold, color: Colors.orange),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Checkout & QR Section
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionHeader('Payment Entry Points'),
                      _buildStripeButton(
                          'Generate Hourly Link', 'hourly', Colors.blue),
                      _buildStripeButton(
                          'Generate Daily Link', 'daily', Colors.indigo),
                      _buildStripeButton('Generate Monthly Link', 'monthly',
                          Colors.deepPurple),
                    ],
                  ),
                ),
                const SizedBox(width: 32),
                Expanded(
                  flex: 1,
                  child: Column(
                    children: [
                      _buildSectionHeader('Terminal QR'),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey[200]!),
                        ),
                        child: _selectedLocation != null
                            ? QrImageView(
                                data:
                                    'https://iafjygownkhedereaoxw.supabase.co/functions/v1/create-checkout?location_id=${_selectedLocation!['id']}&type=hourly',
                                version: QrVersions.auto,
                                size: 200.0,
                              )
                            : const Text('Select a location'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMasterControl() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
            colors: [Color(0xFF1E3A8A), Color(0xFF2563EB)]),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.blue.withOpacity(0.2),
              blurRadius: 10,
              offset: const Offset(0, 4))
        ],
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
                      fontSize: 18,
                      fontWeight: FontWeight.bold)),
              Text('Seasonal & Time-based algorithmic adjustments',
                  style:
                      GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
            ],
          ),
          Switch(
            value: _autopilotEnabled,
            onChanged: (val) => setState(() => _autopilotEnabled = val),
            activeColor: Colors.greenAccent,
            inactiveTrackColor: Colors.white24,
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
              Switch(
                  value: enabled,
                  onChanged: onToggle,
                  activeColor: const Color(0xFF2563EB)),
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }

  Widget _buildStripeButton(String label, String type, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: ElevatedButton(
        onPressed: () => _generateStripeLink(type),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.payment, size: 20),
            const SizedBox(width: 12),
            Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
