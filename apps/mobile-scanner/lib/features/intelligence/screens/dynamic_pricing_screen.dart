import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/foundation.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../theme.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../logic/providers/auth_providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:payparq_scanner/utils/web_download_helper.dart';
import '../../../logic/providers/locale_provider.dart';

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

  // Ceiling Controllers
  final TextEditingController _hourlyCeilingController =
      TextEditingController();
  final TextEditingController _dailyCeilingController = TextEditingController();
  final TextEditingController _monthlyCeilingController =
      TextEditingController();

  // Minimum/Floor Controllers
  final TextEditingController _hourlyFloorController = TextEditingController();
  final TextEditingController _dailyFloorController = TextEditingController();
  final TextEditingController _monthlyFloorController = TextEditingController();

  final GlobalKey _signKey = GlobalKey();
  final GlobalKey _noticeKey = GlobalKey();

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
      if (mounted) {
        setState(() {
          _isLoading = true;
        });
      }

      final profile = await ref.read(userProfileProvider.future);

      if (profile == null) {
        if (mounted) {
          setState(() {
            _locations = [];
            _selectedLocation = null;
            _isLoading = false;
          });
        }
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
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
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

      final hourlyCeiling = (loc['rate_per_hour_ceiling'] ?? 0.0).toString();
      final dailyCeiling = (loc['base_price_daily_ceiling'] ?? 0.0).toString();
      final monthlyCeiling =
          (loc['base_price_monthly_ceiling'] ?? 0.0).toString();
      final hourlyFloor = (loc['rate_per_hour_floor'] ?? 0.0).toString();
      final dailyFloor =
          ((loc['minimum_daily_price'] ?? loc['base_price_daily_floor']) ?? 0.0)
              .toString();
      final monthlyFloor =
          (loc['base_price_monthly_floor'] ?? 0.0).toString();

      _hourlyController.text = hourly;
      _dailyController.text = daily;
      _monthlyController.text = monthly;

      _hourlyCeilingController.text = hourlyCeiling;
      _dailyCeilingController.text = dailyCeiling;
      _monthlyCeilingController.text = monthlyCeiling;
      _hourlyFloorController.text = hourlyFloor;
      _dailyFloorController.text = dailyFloor;
      _monthlyFloorController.text = monthlyFloor;

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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('Error: Selected Location ID not found in database!'),
              backgroundColor: Colors.red),
        );
      }
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

    final String rawHourlyCeiling =
        _hourlyCeilingController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newHourlyCeiling = double.tryParse(rawHourlyCeiling) ?? 0.0;

    final String rawDailyCeiling =
        _dailyCeilingController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newDailyCeiling = double.tryParse(rawDailyCeiling) ?? 0.0;

    final String rawMonthlyCeiling =
        _monthlyCeilingController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newMonthlyCeiling = double.tryParse(rawMonthlyCeiling) ?? 0.0;

    final String rawHourlyFloor =
        _hourlyFloorController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newHourlyFloor = double.tryParse(rawHourlyFloor) ?? 0.0;
    final String rawDailyFloor =
        _dailyFloorController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newDailyFloor = double.tryParse(rawDailyFloor) ?? 0.0;
    final double? newDailyMinimum =
        rawDailyFloor.isEmpty ? null : double.tryParse(rawDailyFloor);
    final String rawMonthlyFloor =
        _monthlyFloorController.text.replaceAll(RegExp(r'[^\d.]'), '');
    final double newMonthlyFloor = double.tryParse(rawMonthlyFloor) ?? 0.0;

    setState(() => _isLoading = true);

    try {
      final pricePayload = {
        'rate_per_hour': newHourly,
        'base_price_daily': newDaily,
        'base_price_monthly': newMonthly,
        'rate_per_hour_ceiling': newHourlyCeiling,
        'base_price_daily_ceiling': newDailyCeiling,
        'base_price_monthly_ceiling': newMonthlyCeiling,
        'rate_per_hour_floor': newHourlyFloor,
        'base_price_daily_floor': newDailyFloor,
        'base_price_monthly_floor': newMonthlyFloor,
        'minimum_daily_price': newDailyFloor,
      };
      final flagsPayload = {
        'dynamic_pricing_enabled': _dynamicEnabled,
        'surcharge_enabled': _surchargeEnabled,
        'autopilot_enabled': _autopilotEnabled,
        'dynamic_pricing_ratio': _dynamicRatio,
        'surcharge_multiplier': _surchargeMultiplier,
      };

      debugPrint('🚨 ATTEMPTING PRICE SAVE TO ID: $targetId');
      debugPrint('🔎 Parsed minimum_daily_price: $newDailyMinimum');
      debugPrint('📦 PRICE PAYLOAD: $pricePayload');

      try {
        await supabase
            .from('locations')
            .update(pricePayload)
            .eq('id', targetId);
      } catch (e1) {
        debugPrint('⚠️ ID update failed: $e1');
        final displayId = _selectedLocation!['display_id']?.toString();
        if (displayId != null && displayId.isNotEmpty) {
          try {
            await supabase
                .from('locations')
                .update(pricePayload)
                .eq('display_id', displayId);
          } catch (e2) {
            debugPrint('🔥 Both ID and DisplayID updates failed: $e2');
            throw 'Price update failed: $e2';
          }
        } else {
          throw 'Price update failed: $e1';
        }
      }

      try {
        await supabase
            .from('locations')
            .update(flagsPayload)
            .eq('id', targetId);
      } catch (e1) {
        debugPrint('⚠️ Flags ID update failed: $e1');
        final displayId = _selectedLocation!['display_id']?.toString();
        if (displayId != null && displayId.isNotEmpty) {
          try {
            await supabase
                .from('locations')
                .update(flagsPayload)
                .eq('display_id', displayId);
          } catch (e2) {
            debugPrint('🔥 Both Flags ID and DisplayID updates failed: $e2');
            throw 'Flags update failed: $e2';
          }
        } else {
          throw 'Flags update failed: $e1';
        }
      }

      try {
        final verify = await supabase
            .from('locations')
            .select('minimum_daily_price')
            .eq('id', targetId)
            .limit(1);
        debugPrint(
            '✅ minimum_daily_price after save: ${verify.isNotEmpty ? verify.first['minimum_daily_price'] : 'n/a'}');
      } catch (e) {
        debugPrint('⚠️ Verification read failed: $e');
      }

      setState(() {
        final index =
            _locations.indexWhere((l) => l['id'].toString() == targetId);
        final Map<String, dynamic> data =
            Map<String, dynamic>.from(_selectedLocation ?? <String, dynamic>{});
        data.addAll(pricePayload);
        data.addAll(flagsPayload);
        if (index != -1) {
          _locations[index] = data;
        }
        _selectedLocation = data;

        _hourlyController.text = (data['rate_per_hour'] ?? 0.0).toString();
        _dailyController.text = (data['base_price_daily'] ?? 0.0).toString();
        _monthlyController.text =
            (data['base_price_monthly'] ?? 0.0).toString();
        _hourlyCeilingController.text =
            (data['rate_per_hour_ceiling'] ?? 0.0).toString();
        _dailyCeilingController.text =
            (data['base_price_daily_ceiling'] ?? 0.0).toString();
        _monthlyCeilingController.text =
            (data['base_price_monthly_ceiling'] ?? 0.0).toString();
        _hourlyFloorController.text =
            (data['rate_per_hour_floor'] ?? 0.0).toString();
        _dailyFloorController.text =
            ((data['minimum_daily_price'] ?? data['base_price_daily_floor']) ??
                    0.0)
                .toString();
        _monthlyFloorController.text =
            (data['base_price_monthly_floor'] ?? 0.0).toString();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(Lang.sel(ref.read(localeIsCroatianProvider),
                'Price saved', 'Cijena je spremljena')),
            backgroundColor: Colors.black,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      final errorStr = e.toString();
      debugPrint('🔥 CRITICAL SAVE ERROR: $errorStr');

      if (mounted) {
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
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _generateStripeLink(String type) async {
    if (_selectedLocation == null) return;
    // Use the 5-digit display_id for the user-facing Stripe link
    final locationId =
        (_selectedLocation!['display_id'] ?? _selectedLocation!['id'])
            .toString();

    // Add timestamp cache-buster to prevent browser from returning old Stripe sessions
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    const baseUrl =
        'https://iafjygownkhedereaoxw.supabase.co/functions/v1/create-checkout';
    final url =
        Uri.parse('$baseUrl?location_id=$locationId&type=$type&t=$timestamp');

    debugPrint('Opening Checkout: $url');

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(Lang.sel(
                  ref.read(localeIsCroatianProvider),
                  'Payment link generated!',
                  'Link za plaćanje je generiran!'))),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(Lang.sel(
                ref.read(localeIsCroatianProvider),
                'Could not open Stripe link',
                'Nije moguće otvoriti Stripe link'))));
      }
    }
  }

  Widget _buildMasterControl() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white54, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                  Lang.sel(ref.watch(localeIsCroatianProvider),
                      'Smart AutoPilot', 'Pametni AutoPilot'),
                  style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                  Lang.sel(
                      ref.watch(localeIsCroatianProvider),
                      'Seasonal & Time-based algorithmic adjustments',
                      'Sezonska i vremenski temeljena algoritamska podešavanja'),
                  style:
                      GoogleFonts.inter(color: Colors.white70, fontSize: 13)),
            ],
          ),
          Switch.adaptive(
            value: _autopilotEnabled,
            onChanged: (val) => setState(() => _autopilotEnabled = val),
            activeThumbColor: Colors.white,
            activeTrackColor: Colors.white70,
            inactiveTrackColor: Colors.white38,
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
              Text(
                  Lang.sel(
                      ref.watch(localeIsCroatianProvider),
                      label,
                      {
                            'Base Hourly Price': 'Osnovna cijena po satu',
                            'Base Daily Price': 'Osnovna dnevna cijena',
                          }[label] ??
                          label),
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
              ? const Color(0xFF2563EB).withValues(alpha: 0.3)
              : Colors.grey[200]!,
        ),
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
                  Text(
                      Lang.sel(
                          ref.watch(localeIsCroatianProvider),
                          title,
                          {
                                'Hourly Pricing': 'Cijene po satu',
                                'Daily Pricing': 'Dnevne cijene',
                                'Monthly Subscriptions': 'Mjesečne pretplate',
                                'Seasonal Multiplier': 'Sezonski multiplikator',
                              }[title] ??
                              title),
                      style: GoogleFonts.inter(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(
                      Lang.sel(
                          ref.watch(localeIsCroatianProvider),
                          subtitle,
                          {
                                'Adjust base prices and enable real-time updates.':
                                    'Prilagodite osnovne cijene i omogućite ažuriranja u stvarnom vremenu.',
                                'Configure daily rates and ticket formatting.':
                                    'Konfigurirajte dnevne cijene i formatiranje karata.',
                                'Offer monthly subscriptions for frequent users.':
                                    'Ponudite mjesečne pretplate za redovite korisnike.',
                                'Scale prices based on season and time of day.':
                                    'Mijenjajte cijene prema sezoni i dobu dana.',
                              }[subtitle] ??
                              subtitle),
                      style: GoogleFonts.inter(
                          fontSize: 12, color: Colors.grey[600])),
                ],
              ),
              Switch.adaptive(
                value: enabled,
                onChanged: onToggle,
                activeThumbColor: Colors.black,
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
      height: 60,
      child: ElevatedButton(
        onPressed: () => _generateStripeLink(type),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
          side: const BorderSide(color: AppTheme.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
        child: Text(
          Lang.sel(
              ref.watch(localeIsCroatianProvider),
              label.toUpperCase(),
              {
                    'GENERATE HOURLY LINK': 'GENERIRAJ LINK ZA SAT',
                    'GENERATE DAILY LINK': 'GENERIRAJ LINK ZA DAN',
                    'GENERATE MONTHLY LINK': 'GENERIRAJ LINK ZA MJESEC',
                  }[label.toUpperCase()] ??
                  label.toUpperCase()),
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  String _baseCheckoutUrl(String type) {
    if (_selectedLocation == null) return '';
    final locationId =
        (_selectedLocation!['display_id'] ?? _selectedLocation!['id'])
            .toString();
    return 'https://iafjygownkhedereaoxw.supabase.co/functions/v1/create-checkout?location_id=$locationId&type=$type';
  }

  Widget _buildStripeLinksSection() {
    return Container(
      width: 400,
      height: 600,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.link, color: Colors.black),
              const SizedBox(width: 8),
              Text(
                Lang.sel(ref.watch(localeIsCroatianProvider), 'Stripe Links',
                    'Stripe linkovi'),
                style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.black),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: _buildStripeButton(
                Lang.sel(ref.watch(localeIsCroatianProvider),
                    'Generate Hourly Link', 'Generiraj link za sat'),
                'hourly',
                Colors.black),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: _buildStripeButton(
                Lang.sel(ref.watch(localeIsCroatianProvider),
                    'Generate Daily Link', 'Generiraj link za dan'),
                'daily',
                Colors.black),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: _buildStripeButton(
                Lang.sel(ref.watch(localeIsCroatianProvider),
                    'Generate Monthly Link', 'Generiraj link za mjesec'),
                'monthly',
                Colors.black),
          ),
        ],
      ),
    );
  }

  Future<void> _downloadSign() async {
    try {
      final boundary =
          _signKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 6.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      final pngBytes = byteData!.buffer.asUint8List();
      if (kIsWeb) {
        final fileName =
            'parking_sign_${(_selectedLocation?['display_id'] ?? _selectedLocation?['id']).toString()}.png';
        downloadFileWeb(pngBytes, fileName);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(Lang.sel(
                    ref.read(localeIsCroatianProvider),
                    'Download supported on Web only.',
                    'Preuzimanje je podržano samo na webu.'))),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(Lang.sel(
                  ref.read(localeIsCroatianProvider),
                  'Error generating sign: $e',
                  'Greška pri generiranju znaka: $e'))),
        );
      }
    }
  }

  Future<void> _downloadNotice() async {
    try {
      final boundary = _noticeKey.currentContext!.findRenderObject()
          as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 6.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      final pngBytes = byteData!.buffer.asUint8List();
      if (kIsWeb) {
        final fileName =
            'daily_ticket_${(_selectedLocation?['display_id'] ?? _selectedLocation?['id']).toString()}.png';
        downloadFileWeb(pngBytes, fileName);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(Lang.sel(
                    ref.read(localeIsCroatianProvider),
                    'Download supported on Web only.',
                    'Preuzimanje je podržano samo na webu.'))),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(Lang.sel(
                  ref.read(localeIsCroatianProvider),
                  'Error generating notice: $e',
                  'Greška pri generiranju obavijesti: $e'))),
        );
      }
    }
  }

  Widget _buildSignColumn(String displayId, String stripeUrl) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          Lang.sel(isCroatian, 'Your Parking Sign', 'Vaša parkirna oznaka'),
          style: GoogleFonts.inter(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        LayoutBuilder(builder: (context, constraints) {
          final double scale =
              constraints.maxWidth < 400 ? constraints.maxWidth / 400 : 1.0;
          if (scale < 1.0) {
            return Transform.scale(
              scale: scale,
              alignment: Alignment.topCenter,
              child: _buildSignContent(displayId, stripeUrl),
            );
          }
          return _buildSignContent(displayId, stripeUrl);
        }),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: _downloadSign,
          icon: const Icon(Icons.download),
          label: Text(Lang.sel(isCroatian, 'Download Sign', 'Preuzmi znak')),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
        ),
      ],
    );
  }

  Widget _buildParkingNoticeColumn(String displayId, String stripeUrl) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          Lang.sel(isCroatian, 'Daily Ticket', 'Dnevna karta'),
          style: GoogleFonts.inter(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        RepaintBoundary(
          key: _noticeKey,
          child: Container(
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
                              Lang.sel(isCroatian, 'Scan to Stripe',
                                  'Skenirajte za Stripe'),
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                color: Colors.black,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 12),
                            QrImageView(
                              data: stripeUrl,
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
                                  Lang.sel(isCroatian, 'Terms&Help ',
                                      'Uvjeti&Pomoć '),
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
                        'payparq.ai\nOva faktura je privatno izdana. Parkirne fakture izdaju se na privatnom posjedu. Za pomoć ili prigovor, kontaktirajte podršku putem broja payparq.ai.'),
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.black54,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: _downloadNotice,
          icon: const Icon(Icons.download),
          label: Text(Lang.sel(isCroatian, 'Download Ticket', 'Preuzmi kartu')),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
        ),
      ],
    );
  }

  Widget _buildSignContent(String displayId, String stripeUrl) {
    return RepaintBoundary(
      key: _signKey,
      child: Container(
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
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.image_not_supported,
                          color: Colors.grey, size: 48),
                      const SizedBox(height: 8),
                      Text(
                        Lang.sel(ref.watch(localeIsCroatianProvider),
                            'Template not found', 'Predložak nije pronađen'),
                        style:
                            GoogleFonts.inter(color: Colors.grey, fontSize: 12),
                      ),
                      Text(
                        Lang.sel(
                            ref.watch(localeIsCroatianProvider),
                            'assets/images/your_photo.png',
                            'assets/images/your_photo.png'),
                        style:
                            GoogleFonts.inter(color: Colors.grey, fontSize: 10),
                      ),
                    ],
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
                  (_selectedLocation?['name'] ?? '').toString().toUpperCase(),
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
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Padding(
                  padding: const EdgeInsets.only(left: 52, bottom: 40),
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
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isCroatian = ref.watch(localeIsCroatianProvider);
    // Watch the global selection and trigger a re-fetch if it changes
    ref.listen(selectedLocationIdProvider, (previous, next) {
      if (next != null && next != previous) {
        _fetchLocations();
      }
    });

    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(48.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      Lang.sel(isCroatian, 'Dynamic Pricing',
                          'Dinamičko određivanje cijena'),
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
                          isCroatian,
                          'v1.1.2 • Seasonal & algorithmic price adjustments.',
                          'v1.1.2 • Sezonska i algoritamska podešavanja cijena.'),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
                SizedBox(
                  height: 44,
                  child: ElevatedButton.icon(
                    onPressed: _saveSettings,
                    icon: const Icon(Icons.save_outlined, size: 18),
                    label: Text(Lang.sel(
                        isCroatian, 'Save Changes', 'Spremi promjene')),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 48),

            // Master AutoPilot Control
            _buildMasterControl(),
            const SizedBox(height: 48),

            // Base Pricing
            _buildSectionHeader(Lang.sel(isCroatian, 'Standard Base Rates',
                'Standardne osnovne cijene')),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                    child: _buildPriceInput(
                        Lang.sel(isCroatian, 'Hourly Rate', 'Cijena po satu'),
                        _hourlyController,
                        Icons.timer_outlined)),
                const SizedBox(width: 24),
                Expanded(
                    child: _buildPriceInput(
                        Lang.sel(isCroatian, 'Daily Rate', 'Dnevna cijena'),
                        _dailyController,
                        Icons.today_outlined)),
                const SizedBox(width: 24),
                Expanded(
                    child: _buildPriceInput(
                        Lang.sel(isCroatian, 'Monthly Rate', 'Mjesečna cijena'),
                        _monthlyController,
                        Icons.calendar_month_outlined)),
              ],
            ),
            const SizedBox(height: 32),

            // Ceiling Pricing (Only if AutoPilot is ON)
            if (_autopilotEnabled) ...[
              _buildSectionHeader(Lang.sel(
                  isCroatian,
                  'Smart AutoPilot Constraints',
                  'Ograničenja pametnog AutoPilota')),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                      child: _buildPriceInput(
                          Lang.sel(isCroatian, 'Hourly Minimum',
                              'Minimalno po satu'),
                          _hourlyFloorController,
                          Icons.timer_outlined)),
                  const SizedBox(width: 24),
                  Expanded(
                      child: _buildPriceInput(
                          Lang.sel(
                              isCroatian, 'Daily Minimum', 'Minimalno po danu'),
                          _dailyFloorController,
                          Icons.today_outlined)),
                  const SizedBox(width: 24),
                  Expanded(
                      child: _buildPriceInput(
                          Lang.sel(isCroatian, 'Monthly Minimum',
                              'Minimalno mjesečno'),
                          _monthlyFloorController,
                          Icons.calendar_month_outlined)),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                      child: _buildPriceInput(
                          Lang.sel(isCroatian, 'Hourly Ceiling',
                              'Maksimalno po satu'),
                          _hourlyCeilingController,
                          Icons.timer_outlined)),
                  const SizedBox(width: 24),
                  Expanded(
                      child: _buildPriceInput(
                          Lang.sel(isCroatian, 'Daily Ceiling',
                              'Maksimalno po danu'),
                          _dailyCeilingController,
                          Icons.today_outlined)),
                  const SizedBox(width: 24),
                  Expanded(
                      child: _buildPriceInput(
                          Lang.sel(isCroatian, 'Monthly Ceiling',
                              'Maksimalno mjesečno'),
                          _monthlyCeilingController,
                          Icons.calendar_month_outlined)),
                ],
              ),
              const SizedBox(height: 48),
            ] else
              const SizedBox(height: 48),

            // Dynamic Adjustment
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionHeader(Lang.sel(isCroatian,
                          'Demand Sensitivity', 'Osjetljivost potražnje')),
                      const SizedBox(height: 16),
                      _buildControlCard(
                        title: Lang.sel(
                            isCroatian, 'Demand Ratio', 'Omjer potražnje'),
                        subtitle: Lang.sel(
                            isCroatian,
                            'Adjustment benchmark (0% - 200%)',
                            'Referentna vrijednost prilagodbe (0% - 200%)'),
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
                              thumbColor: Colors.black,
                              activeColor: Colors.black,
                              inactiveColor: AppTheme.surface,
                              onChanged: (_dynamicEnabled && !_autopilotEnabled)
                                  ? (val) => setState(() => _dynamicRatio = val)
                                  : null,
                            ),
                            Text(
                              Lang.sel(
                                  isCroatian,
                                  'Manual Benchmark: ${(_dynamicRatio * 100).toInt()}%',
                                  'Ručna referentna vrijednost: ${(_dynamicRatio * 100).toInt()}%'),
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
                      _buildSectionHeader(Lang.sel(isCroatian,
                          'Congestion Surcharge', 'Dodatak zbog gužve')),
                      const SizedBox(height: 16),
                      _buildControlCard(
                        title: Lang.sel(isCroatian, 'Surcharge Multiplier',
                            'Multiplikator dodatka'),
                        subtitle: Lang.sel(
                            isCroatian,
                            'Peak-traffic premium (1x - 10x)',
                            'Dodatak u vršnom prometu (1x - 10x)'),
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
                              thumbColor: Colors.black,
                              inactiveColor: AppTheme.surface,
                              onChanged: (_surchargeEnabled &&
                                      !_autopilotEnabled)
                                  ? (val) =>
                                      setState(() => _surchargeMultiplier = val)
                                  : null,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              Lang.sel(
                                  isCroatian,
                                  'Manual Benchmark: ${_surchargeMultiplier}x',
                                  'Ručna referentna vrijednost: ${_surchargeMultiplier}x'),
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

            _buildSectionHeader(Lang.sel(isCroatian, 'Payment Terminal Assets',
                'Resursi platnog terminala')),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: _selectedLocation != null
                        ? _buildSignColumn(
                            (_selectedLocation!['display_id'] ??
                                    _selectedLocation!['id'])
                                .toString(),
                            _baseCheckoutUrl('daily'),
                          )
                        : Container(
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Text(Lang.sel(isCroatian,
                                'Select a location', 'Odaberite lokaciju')),
                          ),
                  ),
                ),
                const SizedBox(width: 24),
                Align(
                  alignment: Alignment.topCenter,
                  child: _buildStripeLinksSection(),
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: _selectedLocation != null
                        ? _buildParkingNoticeColumn(
                            (_selectedLocation!['display_id'] ??
                                    _selectedLocation!['id'])
                                .toString(),
                            _baseCheckoutUrl('daily'),
                          )
                        : Container(
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Text(Lang.sel(isCroatian,
                                'Select a location', 'Odaberite lokaciju')),
                          ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
