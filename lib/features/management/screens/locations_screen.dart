import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../theme.dart';
import '../../../widgets/admin_data_card.dart';
import '../repositories/parking_repository.dart';
import '../../../widgets/lot_location_picker.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../logic/providers/auth_providers.dart';
import 'verification_upload_screen.dart';
import '../../../logic/providers/locale_provider.dart';
import '../../../widgets/skeleton_loader.dart';
import '../widgets/locations_header.dart';
import '../../../utils/list_search_filter.dart';
import '../../../utils/async_action_handler.dart';
import '../../../widgets/confirm_delete_dialog.dart';
import '../providers/locations_controller.dart';
import '../../../services/error_mapper.dart';
import '../../../config/app_config.dart';

class LocationsScreen extends ConsumerStatefulWidget {
  const LocationsScreen({super.key});

  @override
  ConsumerState<LocationsScreen> createState() => _LocationsScreenState();
}

class _LocationsScreenState extends ConsumerState<LocationsScreen> {
  static const String _supportWhatsappDisplay = '+385 91 5963139';
  static const String _supportWhatsappNumber = '385915963139';
  String _searchQuery = '';
  Timer? _searchDebounce;
  final Set<String> _optimisticDeletedIds = {};
  final ScrollController _scrollController = ScrollController();
  int _visibleCount = 20;
  final Map<String, Map<String, dynamic>> _locOverrides = {};
  String _pendingMoveReason = '';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent - 200) {
        if (!mounted) return;
        setState(() {
          _visibleCount += 20;
        });
      }
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final locationsAsync = ref.watch(locationsStreamProvider);
    final isCroatian = ref.watch(localeIsCroatianProvider);

    return profileAsync.when(
      loading: () => Scaffold(
        backgroundColor: AppTheme.background,
        body: Padding(
          padding: const EdgeInsets.all(48.0),
          child: _buildSkeletonList(),
        ),
      ),
      error: (err, stack) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text(Lang.sel(isCroatian, 'Failed to load profile: $err',
                  'Neuspjelo učitavanje profila: $err')),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(userProfileProvider),
                child: Text(Lang.sel(isCroatian, 'Retry', 'Pokušaj ponovo')),
              ),
            ],
          ),
        ),
      ),
      data: (profile) {
        final locationId =
            ref.watch(selectedLocationIdProvider) ?? profile?['location_id'];
        final roleRaw = (profile?['role'] ?? '').toString().toLowerCase();
        final roleNorm = roleRaw.replaceAll('-', '_').replaceAll(' ', '_');
        final isSuperAdmin =
            roleNorm == 'super_admin' || roleNorm == 'superadmin';
        final isAdmin = roleNorm == 'admin';

        return Scaffold(
          backgroundColor: AppTheme.background,
          body: Padding(
            padding: const EdgeInsets.all(48.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LocationsHeader(
                  isSuperAdmin: isSuperAdmin,
                  isAdmin: isAdmin,
                  locationId: locationId,
                  onAddLocation: () => _showAddLocationDialog(
                      context, locationId, profile?['id']?.toString()),
                  onSearchChanged: (val) {
                    _searchDebounce?.cancel();
                    _searchDebounce = Timer(
                      const Duration(milliseconds: 250),
                      () {
                        if (!mounted) return;
                        setState(() {
                          _searchQuery = val.trim().toLowerCase();
                          _visibleCount = 20;
                        });
                      },
                    );
                  },
                ),
                const SizedBox(height: 24),

                // List
                Expanded(
                  child: locationsAsync.when(
                    loading: () => _buildSkeletonList(),
                    error: (err, stack) => Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.warning_amber_rounded,
                              color: Colors.orange, size: 48),
                          const SizedBox(height: 16),
                          Text(Lang.sel(
                              isCroatian,
                              'Database access restricted or error occurred.',
                              'Pristup bazi ograničen ili je došlo do pogreške.')),
                          const SizedBox(height: 8),
                          Text(err.toString(),
                              style: const TextStyle(
                                  fontSize: 10, color: Colors.grey),
                              textAlign: TextAlign.center),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () =>
                                ref.refresh(locationsStreamProvider),
                            child: Text(Lang.sel(
                                isCroatian, 'Refresh Data', 'Osvježi podatke')),
                          ),
                        ],
                      ),
                    ),
                    data: (locations) {
                      if (locations.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.location_on_outlined,
                                  size: 64, color: Colors.grey[200]),
                              const SizedBox(height: 16),
                              Text(
                                  Lang.sel(isCroatian, 'No locations found.',
                                      'Nije pronađena nijedna lokacija.'),
                                  style: TextStyle(color: Colors.grey[400])),
                            ],
                          ),
                        );
                      }

                      final mergedLocations = locations.map((loc) {
                        final id = loc['id']?.toString() ?? '';
                        final override = _locOverrides[id];
                        return override != null ? {...loc, ...override} : loc;
                      }).toList();

                      final filtered = ListSearchFilter.filter(
                        items: mergedLocations,
                        query: _searchQuery,
                        fields: (loc) => [
                          loc['name']?.toString(),
                          loc['display_id']?.toString(),
                        ],
                      ).where((loc) {
                        final id = loc['id']?.toString();
                        if (id == null) return true;
                        return !_optimisticDeletedIds.contains(id);
                      }).toList();

                      final visibleCount = _visibleCount > filtered.length
                          ? filtered.length
                          : _visibleCount;
                      return ListView.builder(
                        controller: _scrollController,
                        itemCount: visibleCount,
                        itemBuilder: (context, index) {
                          var loc = filtered[index];
                          final override =
                              _locOverrides[loc['id']?.toString() ?? ''];
                          if (override != null) {
                            loc = {...loc, ...override};
                          }
                          final name = loc['name'] ??
                              Lang.sel(isCroatian, 'Unnamed Lot',
                                  'Neimenovano parkiralište');
                          final displayId = loc['display_id'] ?? 'N/A';
                          final id = loc['id'].toString();
                          final Map<String, dynamic> meta =
                              (loc['verification_metadata'] ?? {})
                                  as Map<String, dynamic>;
                          final bool isHub = meta['hub_enabled'] == true;

                          return AdminDataCard(
                            leading: SizedBox(
                              width: 160,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.black,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  displayId.toUpperCase(),
                                  style: GoogleFonts.inter(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ),
                            ),
                            mainContent: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Colors.black,
                                  ),
                                ),
                                Text(
                                  isHub
                                      ? Lang.sel(isCroatian, 'Active Hub',
                                          'Aktivni hub')
                                      : Lang.sel(isCroatian, 'Active Lot',
                                          'Aktivni lot'),
                                  style: GoogleFonts.inter(
                                    color: AppTheme.textSecondary,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ConstrainedBox(
                                  constraints:
                                      const BoxConstraints(maxWidth: 160),
                                  child: _buildVerificationBadge(
                                      loc, isAdmin, isSuperAdmin),
                                ),
                                const SizedBox(width: 12),
                                ElevatedButton(
                                  onPressed: () => _showLocationDetail(
                                      loc, isSuperAdmin, isAdmin),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.black,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 24,
                                      vertical: 12,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                  child: Text(
                                      Lang.sel(isCroatian, 'View', 'Pogledaj')),
                                ),
                                const SizedBox(width: 12),
                                IconButton(
                                  icon: const Icon(
                                    Icons.delete_outline,
                                    color: Colors.black,
                                  ),
                                  onPressed: () =>
                                      _confirmDelete(id, displayId),
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSkeletonList() {
    return ListView.builder(
      itemCount: 8,
      itemBuilder: (context, index) {
        return AdminDataCard(
          leading: SkeletonLoader(width: 160, height: 48),
          mainContent: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonLoader(width: 220, height: 14),
              const SizedBox(height: 8),
              SkeletonLoader(width: 160, height: 12),
            ],
          ),
          trailing: SkeletonLoader(width: 90, height: 32),
        );
      },
    );
  }

  Widget _buildVerificationBadge(
      Map<String, dynamic> loc, bool isAdmin, bool isSuperAdmin) {
    final isHr = ref.read(localeIsCroatianProvider);
    final rawStatus = loc['verification_status'] ?? 'unverified';
    final status =
        rawStatus == 'video_required' ? 'contact_required' : rawStatus;

    Color badgeColor;
    String label;
    bool showAction = false;
    IconData icon;

    final canManageVerification = isAdmin || isSuperAdmin;

    switch (status) {
      case 'verified':
        badgeColor = Colors.green[400]!;
        label = Lang.sel(isHr, 'VERIFIED', 'VERIFICIRANO');
        icon = Icons.verified;
        break;
      case 'pending':
        badgeColor = Colors.orange[400]!;
        label = Lang.sel(isHr, 'PENDING', 'NA ČEKANJU');
        icon = Icons.hourglass_bottom;
        break;
      case 'call_scheduled':
        badgeColor = const Color(0xFFFF9500);
        label = Lang.sel(isHr, 'ACTION REQUIRED', 'POTREBNA AKCIJA');
        icon = Icons.warning_amber_outlined;
        showAction = true;
        break;
      case 'contact_required':
        badgeColor = const Color(0xFFFF9500);
        label = Lang.sel(isHr, 'ACTION REQUIRED', 'POTREBNA AKCIJA');
        icon = Icons.warning_amber_outlined;
        showAction = true;
        break;
      case 'rejected':
        badgeColor = const Color(0xFFFF3B30);
        label = Lang.sel(isHr, 'REJECTED', 'ODBIJENO');
        icon = Icons.error_outline;
        showAction = canManageVerification;
        break;
      case 'unverified':
      default:
        badgeColor = AppTheme.sidebarBackground;
        label = Lang.sel(isHr, 'SETUP REQUIRED', 'KONFIGURIRAJ');
        icon = Icons.info_outline;
        showAction = canManageVerification;
    }

    final bool fixedWidthRequired = status == 'contact_required' ||
        status == 'call_scheduled' ||
        status == 'unverified';
    final bool isSetupRequired = status == 'unverified';

    return InkWell(
      onTap: showAction
          ? () async {
              if (status == 'contact_required') {
                _showCallDialog(loc);
              } else if (status == 'unverified' ||
                  status == 'pending' ||
                  status == 'rejected') {
                final result = await Navigator.push<bool>(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        VerificationUploadScreen(location: loc),
                  ),
                );
                if (result == true && mounted) {
                  setState(() {
                    _locOverrides[loc['id'].toString()] = {
                      'verification_status': 'pending',
                      'verification_submitted_at':
                          DateTime.now().toIso8601String(),
                    };
                  });
                  ref.invalidate(locationsStreamProvider);
                }
              }
            }
          : null,
      child: Container(
        constraints: BoxConstraints(
          minWidth: (status == 'verified' ||
                  status == 'pending' ||
                  status == 'rejected')
              ? 0
              : (fixedWidthRequired ? (isSetupRequired ? 148 : 160) : 140),
          maxWidth: isSetupRequired ? 148 : 160,
        ),
        padding: EdgeInsets.symmetric(
          horizontal: (status == 'pending' || status == 'rejected') ? 10 : 12,
          vertical: (status == 'pending' || status == 'rejected') ? 5 : 6,
        ),
        decoration: BoxDecoration(
          color: badgeColor,
          borderRadius: BorderRadius.circular(20),
        ),
        child: (fixedWidthRequired && (isHr && status == 'unverified'))
            ? Row(
                mainAxisSize: MainAxisSize.max,
                children: [
                  Icon(icon, size: 14, color: Colors.white),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      label,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      softWrap: false,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Opacity(
                    opacity: 0.0,
                    child: Icon(icon, size: 14, color: Colors.white),
                  ),
                ],
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 14, color: Colors.white),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      softWrap: false,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildAddonRow({
    required String label,
    required bool enabled,
    required TextEditingController priceCtrl,
    required void Function(bool) onToggle,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Switch(value: enabled, activeThumbColor: Colors.black, onChanged: onToggle),
            Expanded(child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87))),
          ],
        ),
        if (enabled)
          TextField(
            controller: priceCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: 'Cijena',
              suffixText: '€',
              filled: true,
              fillColor: AppTheme.surface,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            ),
          ),
      ],
    );
  }

  Map<String, dynamic> _buildAddonsConfig({
    required bool valetOn, required String valetPrice,
    required bool evOn, required String evPrice,
    required bool washOn, required String washBasic, required String washPremium,
    required bool fuelOn, required String fuelDiesel, required String fuelBenzin,
    required bool shuttleOn, required String shuttlePrice,
    required double pickupLat, required double pickupLng, required String pickupLabel,
    required String phoneSms, required String lotZone,
  }) {
    return {
      if (valetOn) 'valet': {
        'enabled': true,
        'price_cents': ((double.tryParse(valetPrice) ?? 5.0) * 100).round(),
        if (lotZone.trim().isNotEmpty) 'lot_zone': lotZone.trim(),
      },
      if (evOn) 'ev_charging': {'enabled': true, 'price_cents': ((double.tryParse(evPrice) ?? 20.0) * 100).round()},
      if (washOn) 'car_wash': {'enabled': true, 'options': [
        {'id': 'basic', 'label': 'Basic', 'price_cents': ((double.tryParse(washBasic) ?? 15.0) * 100).round()},
        {'id': 'premium', 'label': 'Premium', 'price_cents': ((double.tryParse(washPremium) ?? 30.0) * 100).round()},
      ]},
      if (fuelOn) 'fuel': {'enabled': true, 'options': [
        {'id': 'diesel', 'label': 'Diesel', 'price_cents': ((double.tryParse(fuelDiesel) ?? 60.0) * 100).round()},
        {'id': 'benzin', 'label': 'Benzin', 'price_cents': ((double.tryParse(fuelBenzin) ?? 55.0) * 100).round()},
      ]},
      if (shuttleOn) 'shuttle': {'enabled': true, 'price_cents': ((double.tryParse(shuttlePrice) ?? 2.0) * 100).round()},
      if (pickupLat != 0.0 || pickupLng != 0.0) 'pickup_point': {
        'lat': pickupLat,
        'lng': pickupLng,
        if (pickupLabel.trim().isNotEmpty) 'label': pickupLabel.trim(),
      },
      if (phoneSms.trim().isNotEmpty) 'phone_sms': phoneSms.trim(),
    };
  }

  void _confirmDelete(String id, String displayId) {
    final isHr = ref.read(localeIsCroatianProvider);
    AsyncActionHandler.run<void>(
      context: context,
      action: () async {
        final confirm = await showConfirmDeleteDialog(
          context: context,
          title: Lang.sel(isHr, 'Delete Location', 'Obriši lokaciju'),
          message: Lang.sel(
              isHr,
              'Are you sure you want to delete this location?',
              'Jeste li sigurni da želite obrisati ovu lokaciju?'),
          confirmLabel: Lang.sel(isHr, 'Delete', 'Obriši'),
          cancelLabel: Lang.sel(isHr, 'Cancel', 'Odustani'),
        );
        if (confirm != true) return;
        setState(() {
          _optimisticDeletedIds.add(id);
        });
        await ref
            .read(locationsControllerProvider)
            .deleteLocation(id, displayId);
      },
      errorBuilder: ErrorMapper.message,
      onError: (_) {
        if (!mounted) return;
        setState(() {
          _optimisticDeletedIds.remove(id);
        });
      },
    );
  }

  String _buildHubLocationUrl(Map<String, dynamic> loc) {
    final String? canonicalSlug = loc['canonical_slug']?.toString();
    if (canonicalSlug != null && canonicalSlug.trim().isNotEmpty) {
      return 'https://www.payparq.com/locations/${canonicalSlug.trim()}';
    }
    // Fallback: build from name + display_id (mirrors DB canonical_slug format)
    final String displayId = (loc['display_id'] ?? '').toString();
    final String name = (loc['name'] ?? '')
        .toString()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9\s-]'), '')
        .replaceAll(RegExp(r'\s+'), '-');
    final String slug = name.isNotEmpty ? '$name-$displayId' : displayId.toLowerCase();
    return 'https://www.payparq.com/locations/$slug';
  }

  Future<void> _toggleHub(Map<String, dynamic> loc, bool enabled) async {
    final messenger = ScaffoldMessenger.of(context);
    final Map<String, dynamic> meta =
        Map<String, dynamic>.from(loc['verification_metadata'] as Map? ?? {});
    final bool previous = meta['hub_enabled'] == true;
    try {
      await ref
          .read(locationsControllerProvider)
          .updateHubDesignation(loc, enabled);
      if (enabled) {
        final url = _buildHubLocationUrl(loc);
        try {
          await launchUrl(Uri.parse(url));
        } catch (_) {}
      }
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(Lang.sel(
              ref.read(localeIsCroatianProvider),
              enabled
                  ? 'Marked as PayParq hub'
                  : 'Removed PayParq hub designation',
              enabled
                  ? 'Označeno kao PayParq hub'
                  : 'Uklonjena oznaka PayParq hub')),
          backgroundColor: enabled ? Colors.green : Colors.orange,
        ),
      );
    } catch (e) {
      meta['hub_enabled'] = previous;
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(Lang.sel(
              ref.read(localeIsCroatianProvider),
              'Error: ${ErrorMapper.message(e)}',
              'Greška: ${ErrorMapper.message(e)}')),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String _resolveSettlementModel(Map<String, dynamic> metadata) {
    final raw = (metadata['settlement_model'] ?? 'agentic')
        .toString()
        .trim()
        .toLowerCase();
    return raw == 'company' ? 'company' : 'agentic';
  }

  Future<void> _toggleSettlementModel(
      Map<String, dynamic> loc, String settlementModel) async {
    final messenger = ScaffoldMessenger.of(context);
    final Map<String, dynamic> meta =
        Map<String, dynamic>.from(loc['verification_metadata'] as Map? ?? {});
    final String previous = _resolveSettlementModel(meta);
    try {
      await ref
          .read(locationsControllerProvider)
          .updateSettlementModel(loc, settlementModel);
      if (!mounted) return;
      final enabledCompany = settlementModel == 'company';
      messenger.showSnackBar(
        SnackBar(
          content: Text(Lang.sel(
              ref.read(localeIsCroatianProvider),
              enabledCompany
                  ? 'Settlement set to Company (VAT-first)'
                  : 'Settlement set to Agentic (current split)',
              enabledCompany
                  ? 'Model poravnanja postavljen na Company (PDV prvo)'
                  : 'Model poravnanja postavljen na Agentic (trenutni split)')),
          backgroundColor: Colors.black,
        ),
      );
    } catch (e) {
      meta['settlement_model'] = previous;
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(Lang.sel(
              ref.read(localeIsCroatianProvider),
              'Error: ${ErrorMapper.message(e)}',
              'Greška: ${ErrorMapper.message(e)}')),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showCallDialog(Map<String, dynamic> loc) async {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(Lang.sel(ref.watch(localeIsCroatianProvider),
              'Contact for verification', 'Kontakt za verifikaciju')),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
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
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.green[500],
                            borderRadius: BorderRadius.circular(16),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.chat,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              Lang.sel(ref.watch(localeIsCroatianProvider),
                                  'WhatsApp Support', 'WhatsApp podrška'),
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _supportWhatsappDisplay,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: Colors.grey[700],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      Lang.sel(
                          ref.watch(localeIsCroatianProvider),
                          'Send message to support for verification.',
                          'Pošaljite poruku podršci za verifikaciju.'),
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green[500],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: () async {
                          final uri = Uri.parse(
                              'https://wa.me/$_supportWhatsappNumber?text=${Uri.encodeComponent('Hi, I need help with lot verification.')}');
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri,
                                mode: LaunchMode.externalApplication);
                          }
                        },
                        child: Text(
                          Lang.sel(ref.watch(localeIsCroatianProvider),
                              'Send message', 'Pošalji poruku'),
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(Lang.sel(
                  ref.watch(localeIsCroatianProvider), 'Close', 'Zatvori')),
            ),
          ],
        );
      },
    );
  }

  void _showLocationDetail(
      Map<String, dynamic> loc, bool isSuperAdmin, bool isAdmin) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        final displayId = (loc['display_id'] ?? 'N/A').toString();
        final String idStr = loc['id'].toString();
        final Map<String, dynamic>? override = _locOverrides[idStr];
        final effectiveLoc = override != null ? {...loc, ...override} : loc;
        final nameCtrl = TextEditingController(
            text: (effectiveLoc['name'] ?? 'Unnamed Lot').toString());
        final addressCtrl = TextEditingController(
            text: (effectiveLoc['address'] ?? '').toString());
        final capacity = (effectiveLoc['capacity'] ?? 0) is int
            ? effectiveLoc['capacity'] as int
            : int.tryParse((effectiveLoc['capacity'] ?? '0').toString()) ?? 0;
        final capacityCtrl = TextEditingController(text: '$capacity');
        int currentCapacity = capacity;
        String currentName = (effectiveLoc['name'] ?? 'Unnamed Lot').toString();
        bool saving = false;
        String? uploadStatusText;
        int lastProgressUiUpdateMs = 0;
        bool showLocationPicker = false;
        final ImagePicker picker = ImagePicker();
        final Map<String, Uint8List> localPhotoPreviewBytes = {};
        final List<String> originalPhotoUrls =
            ((effectiveLoc['verification_photos'] as List?) ?? const [])
                .map((e) => e.toString())
                .where((e) => e.trim().isNotEmpty)
                .toList();
        final List<String> editablePhotoUrls =
            List<String>.from(originalPhotoUrls);
        final List<XFile> newlySelectedPhotos = [];
        final Map<String, dynamic> meta =
            Map<String, dynamic>.from(loc['verification_metadata'] as Map? ?? {});
        final bool isHub = meta['hub_enabled'] == true;
        final bool isAgenticSettlement =
            _resolveSettlementModel(meta) == 'agentic';
        bool valetEnabled = effectiveLoc['valet_enabled'] == true;
        bool shuttleEnabled = effectiveLoc['shuttle_enabled'] == true;
        final Map<String, dynamic> addonsRaw =
            (effectiveLoc['addons_config'] ?? {}) as Map<String, dynamic>;
        final Map<String, dynamic> addonsConfig = Map<String, dynamic>.from(addonsRaw);
        // Price controllers for add-ons
        num _centsToEur(num? cents, num fallbackCents) =>
            ((cents ?? fallbackCents) / 100);
        final valetPriceCtrl = TextEditingController(
            text: _centsToEur((addonsConfig['valet'] as Map?)?['price_cents'] as num?, 500).toStringAsFixed(2));
        final evPriceCtrl = TextEditingController(
            text: _centsToEur((addonsConfig['ev_charging'] as Map?)?['price_cents'] as num?, 2000).toStringAsFixed(2));
        final washBasicCtrl = TextEditingController(
            text: _centsToEur((((addonsConfig['car_wash'] as Map?)?['options'] as List?)?.firstWhere(
                (o) => (o as Map)['id'] == 'basic', orElse: () => <String, dynamic>{})
                as Map?)?['price_cents'] as num?, 1500).toStringAsFixed(2));
        final washPremiumCtrl = TextEditingController(
            text: _centsToEur((((addonsConfig['car_wash'] as Map?)?['options'] as List?)?.firstWhere(
                (o) => (o as Map)['id'] == 'premium', orElse: () => <String, dynamic>{})
                as Map?)?['price_cents'] as num?, 3000).toStringAsFixed(2));
        final fuelDieselCtrl = TextEditingController(
            text: _centsToEur((((addonsConfig['fuel'] as Map?)?['options'] as List?)?.firstWhere(
                (o) => (o as Map)['id'] == 'diesel', orElse: () => <String, dynamic>{})
                as Map?)?['price_cents'] as num?, 6000).toStringAsFixed(2));
        final fuelBenzinCtrl = TextEditingController(
            text: _centsToEur((((addonsConfig['fuel'] as Map?)?['options'] as List?)?.firstWhere(
                (o) => (o as Map)['id'] == 'benzin', orElse: () => <String, dynamic>{})
                as Map?)?['price_cents'] as num?, 5500).toStringAsFixed(2));
        final shuttlePriceCtrl = TextEditingController(
            text: _centsToEur((addonsConfig['shuttle'] as Map?)?['price_cents'] as num?, 200).toStringAsFixed(2));
        double pickupLat = ((addonsConfig['pickup_point'] as Map?)?['lat'] as num?)?.toDouble() ?? 0.0;
        double pickupLng = ((addonsConfig['pickup_point'] as Map?)?['lng'] as num?)?.toDouble() ?? 0.0;
        String pickupLabel = ((addonsConfig['pickup_point'] as Map?)?['label'] as String?) ?? '';
        final phoneSmsCtrl = TextEditingController(
            text: (addonsConfig['phone_sms'] as String?) ?? '+385 91 5963139');
        final lotZoneCtrl = TextEditingController(
            text: ((addonsConfig['valet'] as Map?)?['lot_zone'] as String?) ?? '');
        bool addonValetOn = (addonsConfig['valet'] as Map?)?['enabled'] == true;
        bool addonEvOn = (addonsConfig['ev_charging'] as Map?)?['enabled'] == true;
        bool addonWashOn = (addonsConfig['car_wash'] as Map?)?['enabled'] == true;
        bool addonFuelOn = (addonsConfig['fuel'] as Map?)?['enabled'] == true;
        bool addonShuttleOn = (addonsConfig['shuttle'] as Map?)?['enabled'] == true;
        // Listing detail section controllers
        final accessHoursCtrl = TextEditingController(
            text: (meta['access_hours'] as String?) ?? 'pon – pet: 6:00 – 23:00\nsub – ned: 7:00 – 23:00');
        final amenitiesCtrl = TextEditingController(
            text: (meta['amenities'] as String?) ?? 'Valet usluga, Garaža - Natkrivena, Osoblje na licu mjesta, EV punjenje, Pristup invalidskim kolicima');
        final thingsToKnowCtrl = TextEditingController(
            text: (meta['things_to_know'] as String?) ?? 'Zbog ograničenja veličine, ova lokacija ne može primiti kamionete i putničke kombije.\n\nZa egzotična vozila obratite se izravno servisu radi dostupnosti i cijene.\n\nKamioni, kombiji i veliki SUV-ovi smatraju se super velikim i podliježu dodatnim naknadama na licu mjesta.');
        final gettingThereCtrl = TextEditingController(
            text: (meta['getting_there'] as String?) ?? 'Unesite adresu lokacije u navigaciju. Ulaz je označen znakom za parkiranje.');
        final howItWorksCtrl = TextEditingController(
            text: (meta['how_it_works'] as String?) ?? '1. Pokažite službeniku svoju PayParq parkirnu propusnicu, ispisanu ili na mobilnom uređaju\n2. Samo uđite ako nema nikoga\n3. Odvezite se kad budete spremni otići');
        double pendingLatitude = (effectiveLoc['latitude'] is num)
            ? (effectiveLoc['latitude'] as num).toDouble()
            : double.tryParse('${effectiveLoc['latitude'] ?? 0.0}') ?? 0.0;
        double pendingLongitude = (effectiveLoc['longitude'] is num)
            ? (effectiveLoc['longitude'] as num).toDouble()
            : double.tryParse('${effectiveLoc['longitude'] ?? 0.0}') ?? 0.0;
        final bool canEdit = isSuperAdmin || isAdmin;

        return Dialog(
          insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: 660,
              maxHeight: MediaQuery.of(dialogContext).size.height * 0.92,
            ),
            child: StatefulBuilder(
              builder: (context, setState) {
                final messenger = ScaffoldMessenger.of(dialogContext);
                final navigator = Navigator.of(dialogContext);
                Future<void> pickLocationPhotos(ImageSource source) async {
                  if (!canEdit) return;
                  if (source == ImageSource.gallery) {
                    final picked = await picker.pickMultiImage(
                      imageQuality: 92,
                      maxWidth: 2560,
                      maxHeight: 2560,
                    );
                    if (picked.isEmpty) return;
                    setState(() {
                      newlySelectedPhotos.addAll(picked);
                    });
                    return;
                  }
                  final picked = await picker.pickImage(
                    source: source,
                    imageQuality: 92,
                    maxWidth: 2560,
                    maxHeight: 2560,
                  );
                  if (picked == null) return;
                  setState(() {
                    newlySelectedPhotos.add(picked);
                  });
                }

                Future<ImageProvider> previewProvider(XFile file) async {
                  final cached = localPhotoPreviewBytes[file.path];
                  if (cached != null) {
                    return MemoryImage(cached);
                  }
                  final bytes = await file.readAsBytes();
                  localPhotoPreviewBytes[file.path] = bytes;
                  return MemoryImage(bytes);
                }

                Future<void> _notifyLocationMove({
                  required String locationId,
                  required String locationName,
                  required String newAddress,
                  required double oldLat,
                  required double oldLng,
                  required double newLat,
                  required double newLng,
                  required String? reason,
                }) async {
                  try {
                    final webBase = AppConfig.webAppBaseUrl.replaceAll(RegExp(r'/$'), '');
                    final movedBy = Supabase.instance.client.auth.currentUser?.id ?? '';
                    await http.post(
                      Uri.parse('$webBase/api/admin/notify-location-move'),
                      headers: {
                        'Content-Type': 'application/json',
                        'x-moved-by': movedBy,
                      },
                      body: jsonEncode({
                        'location_id': locationId,
                        'location_name': locationName,
                        'new_address': newAddress,
                        'reason': reason,
                        'old_lat': oldLat,
                        'old_lng': oldLng,
                        'new_lat': newLat,
                        'new_lng': newLng,
                      }),
                    ).timeout(const Duration(seconds: 15));
                  } catch (_) {}
                }

                Future<bool> _showRelocationConfirmDialog({
                  required String? reason,
                }) async {
                  final reasonCtrl = TextEditingController(text: reason ?? '');
                  final confirmed = await showDialog<bool>(
                    context: dialogContext,
                    barrierDismissible: false,
                    builder: (ctx) => StatefulBuilder(
                      builder: (ctx, setLocalState) => AlertDialog(
                        title: Row(children: [
                          const Icon(Icons.warning_amber_rounded, color: Colors.orange),
                          const SizedBox(width: 8),
                          Expanded(child: Text(
                            Lang.sel(ref.watch(localeIsCroatianProvider),
                              'Relocate Verified Hub',
                              'Premještanje verificirane lokacije'),
                            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                          )),
                        ]),
                        content: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              Lang.sel(ref.watch(localeIsCroatianProvider),
                                'Changing the coordinates of a verified hub will:\n\n• Suspend the hub (status → pending)\n• Disable hub access until re-verified\n• Notify users with upcoming reservations\n\nThis action is logged.',
                                'Promjena koordinata verificirane lokacije će:\n\n• Suspendirati hub (status → na čekanju)\n• Onemogućiti pristup hubu do ponovne verifikacije\n• Obavijestiti korisnike s budućim rezervacijama\n\nOva radnja se bilježi.'),
                              style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: reasonCtrl,
                              maxLines: 2,
                              decoration: InputDecoration(
                                labelText: Lang.sel(ref.watch(localeIsCroatianProvider), 'Reason (required)', 'Razlog (obavezno)'),
                                filled: true,
                                fillColor: Colors.grey[100],
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                              ),
                            ),
                          ],
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(false),
                            child: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Cancel', 'Odustani')),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                            onPressed: () {
                              if (reasonCtrl.text.trim().isEmpty) {
                                ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
                                  content: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Reason is required', 'Razlog je obavezan')),
                                ));
                                return;
                              }
                              Navigator.of(ctx).pop(true);
                            },
                            child: Text(
                              Lang.sel(ref.watch(localeIsCroatianProvider), 'Confirm Relocation', 'Potvrdi premještanje'),
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                  if (confirmed == true) {
                    // expose reason back via side-channel
                    _pendingMoveReason = reasonCtrl.text.trim();
                  }
                  return confirmed == true;
                }

                Future<void> saveChanges() async {
                  if (!canEdit) return;
                  final newName = nameCtrl.text.trim();
                  final newAddress = addressCtrl.text.trim();
                  if (newName.isEmpty) {
                    messenger.showSnackBar(
                      SnackBar(
                          content: Text(Lang.sel(
                              ref.watch(localeIsCroatianProvider),
                              'Location name is required',
                              'Naziv lokacije je obavezan'))),
                    );
                    return;
                  }
                  // Detect whether hub coordinates changed
                  final origLat = (loc['latitude'] is num)
                      ? (loc['latitude'] as num).toDouble()
                      : double.tryParse('${loc['latitude'] ?? 0}') ?? 0.0;
                  final origLng = (loc['longitude'] is num)
                      ? (loc['longitude'] as num).toDouble()
                      : double.tryParse('${loc['longitude'] ?? 0}') ?? 0.0;
                  final coordsChanged = (pendingLatitude - origLat).abs() > 0.000001 ||
                      (pendingLongitude - origLng).abs() > 0.000001;
                  final currentStatus = (loc['verification_status'] ?? 'unverified') as String;
                  final isVerified = currentStatus == 'verified';

                  if (coordsChanged && isVerified) {
                    // Must confirm before proceeding
                    _pendingMoveReason = '';
                    final confirmed = await _showRelocationConfirmDialog(reason: null);
                    if (!confirmed) return;
                  }

                  setState(() => saving = true);
                  try {
                    final newCapacity =
                        int.tryParse(capacityCtrl.text.trim()) ??
                            currentCapacity;
                    final bool photosChanged = newlySelectedPhotos.isNotEmpty ||
                        editablePhotoUrls.length != originalPhotoUrls.length ||
                        editablePhotoUrls
                            .any((url) => !originalPhotoUrls.contains(url));
                    // Optimistically update override to prevent old value flicker
                    if (mounted) {
                      this.setState(() {
                        _locOverrides[loc['id'].toString()] = {
                          'name': newName,
                          'address': newAddress,
                          'latitude': pendingLatitude,
                          'longitude': pendingLongitude,
                          'capacity': newCapacity,
                          'total_spots': newCapacity,
                          'verification_photos': List<String>.from(
                            editablePhotoUrls,
                          ),
                        };
                      });
                    }
                    if (coordsChanged && isVerified) {
                      await ref
                          .read(locationsControllerProvider)
                          .relocateVerifiedLocation(
                            id: loc['id'].toString(),
                            name: newName,
                            address: newAddress,
                            latitude: pendingLatitude,
                            longitude: pendingLongitude,
                            capacity: newCapacity,
                            currentMetadata: meta,
                            oldLat: origLat,
                            oldLng: origLng,
                            reason: _pendingMoveReason,
                            invalidateStream: false,
                          );
                      // Fire-and-forget notification (don't block UI)
                      unawaited(_notifyLocationMove(
                        locationId: loc['id'].toString(),
                        locationName: newName,
                        newAddress: newAddress,
                        oldLat: origLat,
                        oldLng: origLng,
                        newLat: pendingLatitude,
                        newLng: pendingLongitude,
                        reason: _pendingMoveReason,
                      ));
                    } else {
                      await ref
                          .read(locationsControllerProvider)
                          .updateLocationDetails(
                            id: loc['id'].toString(),
                            name: newName,
                            address: newAddress,
                            latitude: pendingLatitude,
                            longitude: pendingLongitude,
                            capacity: newCapacity,
                            invalidateStream: false,
                          );
                    }
                    await ref
                        .read(locationsControllerProvider)
                        .updateAddonsConfig(
                          loc['id'].toString(),
                          _buildAddonsConfig(
                            valetOn: addonValetOn,
                            valetPrice: valetPriceCtrl.text,
                            evOn: addonEvOn,
                            evPrice: evPriceCtrl.text,
                            washOn: addonWashOn,
                            washBasic: washBasicCtrl.text,
                            washPremium: washPremiumCtrl.text,
                            fuelOn: addonFuelOn,
                            fuelDiesel: fuelDieselCtrl.text,
                            fuelBenzin: fuelBenzinCtrl.text,
                            shuttleOn: addonShuttleOn,
                            shuttlePrice: shuttlePriceCtrl.text,
                            pickupLat: pickupLat,
                            pickupLng: pickupLng,
                            pickupLabel: pickupLabel,
                            phoneSms: phoneSmsCtrl.text,
                            lotZone: lotZoneCtrl.text,
                          ),
                        );
                    // Save listing detail sections to verification_metadata
                    final updatedMeta = Map<String, dynamic>.from(meta);
                    updatedMeta['access_hours'] = accessHoursCtrl.text.trim();
                    updatedMeta['amenities'] = amenitiesCtrl.text.trim();
                    updatedMeta['things_to_know'] = thingsToKnowCtrl.text.trim();
                    updatedMeta['getting_there'] = gettingThereCtrl.text.trim();
                    updatedMeta['how_it_works'] = howItWorksCtrl.text.trim();
                    await ref.read(locationsControllerProvider).updateVerificationMetadata(
                      loc['id'].toString(), updatedMeta,
                    );
                    meta.addAll(updatedMeta);
                    if (photosChanged) {
                      setState(() {
                        uploadStatusText = Lang.sel(
                          ref.watch(localeIsCroatianProvider),
                          'Preparing upload...',
                          'Priprema uploada...',
                        );
                      });
                      final uploadedUrls = newlySelectedPhotos.isNotEmpty
                          ? await ref
                              .read(locationsControllerProvider)
                              .uploadVerificationPhotos(
                                locationId: loc['id'].toString(),
                                images: List<XFile>.from(newlySelectedPhotos),
                                onProgress: (current, total) {
                                  if (!dialogContext.mounted) return;
                                  final nowMs =
                                      DateTime.now().millisecondsSinceEpoch;
                                  final shouldUpdate = current >= total ||
                                      nowMs - lastProgressUiUpdateMs >= 250;
                                  if (!shouldUpdate) return;
                                  lastProgressUiUpdateMs = nowMs;
                                  setState(() {
                                    uploadStatusText = Lang.sel(
                                      ref.watch(localeIsCroatianProvider),
                                      'Uploading photo $current/$total...',
                                      'Upload fotografije $current/$total...',
                                    );
                                  });
                                },
                              )
                          : <String>[];
                      final nextPhotoUrls = [
                        ...editablePhotoUrls,
                        ...uploadedUrls,
                      ];
                      await ref
                          .read(locationsControllerProvider)
                          .updateVerificationPhotos(
                            id: loc['id'].toString(),
                            photoUrls: nextPhotoUrls,
                            invalidateStream: false,
                          );
                      editablePhotoUrls
                        ..clear()
                        ..addAll(nextPhotoUrls);
                      newlySelectedPhotos.clear();
                    }
                    setState(() {
                      currentName = newName;
                      loc['name'] = newName;
                      loc['address'] = newAddress;
                      loc['latitude'] = pendingLatitude;
                      loc['longitude'] = pendingLongitude;
                      currentCapacity = newCapacity;
                      loc['capacity'] = newCapacity;
                      loc['total_spots'] = newCapacity;
                      loc['verification_photos'] = List<String>.from(
                        editablePhotoUrls,
                      );
                      nameCtrl.text = newName;
                      addressCtrl.text = newAddress;
                      capacityCtrl.text = '$newCapacity';
                      uploadStatusText = null;
                    });
                    if (mounted) {
                      this.setState(() {
                        _locOverrides.remove(loc['id'].toString());
                      });
                    }
                    if (coordsChanged && isVerified) {
                      loc['verification_status'] = 'pending';
                      if (loc['verification_metadata'] is Map) {
                        final updatedMeta = Map<String, dynamic>.from(loc['verification_metadata'] as Map);
                        updatedMeta['hub_enabled'] = false;
                        loc['verification_metadata'] = updatedMeta;
                      }
                    }
                    ref.invalidate(locationsStreamProvider);
                    if (dialogContext.mounted) {
                      final msg = (coordsChanged && isVerified)
                          ? Lang.sel(ref.watch(localeIsCroatianProvider),
                              'Location moved — hub suspended, re-verification required',
                              'Lokacija premještena — hub suspendiran, potrebna re-verifikacija')
                          : Lang.sel(ref.watch(localeIsCroatianProvider),
                              'Location updated', 'Lokacija ažurirana');
                      messenger.showSnackBar(SnackBar(
                        content: Text(msg),
                        duration: Duration(seconds: coordsChanged && isVerified ? 5 : 3),
                        backgroundColor: coordsChanged && isVerified ? Colors.orange[800] : null,
                      ));
                      navigator.pop();
                    }
                  } catch (e) {
                    // Revert optimistic override on error
                    if (mounted) {
                      this.setState(() {
                        _locOverrides.remove(loc['id'].toString());
                      });
                    }
                    if (dialogContext.mounted) {
                      setState(() {
                        uploadStatusText = null;
                      });
                      messenger.showSnackBar(
                        SnackBar(
                            content: Text(Lang.sel(
                                ref.watch(localeIsCroatianProvider),
                                'Error: ${ErrorMapper.message(e)}',
                                'Greška: ${ErrorMapper.message(e)}'))),
                      );
                    }
                  } finally {
                    if (dialogContext.mounted) {
                      setState(() {
                        saving = false;
                        uploadStatusText = null;
                      });
                    }
                  }
                }

                Widget statusChip(String label, Color bg, Color fg) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
                  child: Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: fg)));
                final verStatus = (loc['verification_status'] ?? 'unverified').toString();
                final verBg = verStatus == 'verified'
                    ? Colors.green[400]!.withValues(alpha: 0.15)
                    : verStatus == 'pending'
                        ? Colors.orange.withValues(alpha: 0.15)
                        : Colors.grey[200]!;
                final verFg = verStatus == 'verified'
                    ? Colors.green[700]!
                    : verStatus == 'pending'
                        ? Colors.orange[800]!
                        : Colors.grey[600]!;
                final verLabel = verStatus == 'verified' ? 'VERIFIED' : verStatus == 'pending' ? 'PENDING' : 'UNVERIFIED';

                return ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [

                    // ────────────── HEADER ──────────────
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.fromLTRB(20, 20, 8, 16),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(currentName, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black)),
                          const SizedBox(height: 6),
                          Wrap(spacing: 6, runSpacing: 4, children: [
                            statusChip(verLabel, verBg, verFg),
                            statusChip('ID $displayId', Colors.grey[100]!, Colors.black45),
                            if (isHub) statusChip('HUB', Colors.black, Colors.white),
                            if (valetEnabled) statusChip('VALET', const Color(0xFF5F3DFC).withValues(alpha: 0.12), const Color(0xFF5F3DFC)),
                            if (shuttleEnabled) statusChip('SHUTTLE', const Color(0xFF0F6E56).withValues(alpha: 0.12), const Color(0xFF0F6E56)),
                          ]),
                        ])),
                        IconButton(
                          onPressed: () => Navigator.pop(dialogContext),
                          icon: const Icon(Icons.close, size: 20, color: Colors.black45),
                          padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
                      ]),
                    ),
                    const Divider(height: 1, thickness: 1, color: AppTheme.border),

                    // ────────────── SCROLLABLE BODY ──────────────
                    Flexible(child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                        // Basic info
                        if (!canEdit)
                          Row(children: [
                            Icon(Icons.edit_location_alt_outlined, size: 15, color: Colors.grey[400]),
                            const SizedBox(width: 8),
                            Expanded(child: Text('$currentName · $displayId',
                              style: GoogleFonts.inter(fontSize: 13, color: Colors.black, fontWeight: FontWeight.w500))),
                          ])
                        else
                          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Location Name', 'Naziv lokacije'),
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600, letterSpacing: 0.4)),
                            const SizedBox(height: 5),
                            TextField(controller: nameCtrl, style: GoogleFonts.inter(fontSize: 13),
                              decoration: InputDecoration(hintText: 'e.g. Parking Trogir', filled: true, fillColor: AppTheme.background,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                            const SizedBox(height: 10),
                            Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Address', 'Adresa'),
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600, letterSpacing: 0.4)),
                            const SizedBox(height: 5),
                            TextField(controller: addressCtrl, style: GoogleFonts.inter(fontSize: 13),
                              decoration: InputDecoration(hintText: 'e.g. City center', filled: true, fillColor: AppTheme.background,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                          ]),
                        const SizedBox(height: 10),
                        Row(children: [
                          Icon(Icons.local_parking, size: 15, color: Colors.grey[400]),
                          const SizedBox(width: 8),
                          if (!canEdit)
                            Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Capacity: $currentCapacity', 'Kapacitet: $currentCapacity'),
                              style: GoogleFonts.inter(fontSize: 13, color: Colors.black, fontWeight: FontWeight.w500))
                          else ...[
                            Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Capacity', 'Kapacitet'),
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                            const SizedBox(width: 10),
                            SizedBox(width: 90, child: TextField(controller: capacityCtrl,
                              keyboardType: TextInputType.number, style: GoogleFonts.inter(fontSize: 13),
                              decoration: InputDecoration(hintText: '150', filled: true, fillColor: AppTheme.background,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                          ],
                        ]),

                        const SizedBox(height: 16),
                        const Divider(height: 1, thickness: 1, color: AppTheme.border),

                        // Section 1: Maps
                        ExpansionTile(
                          tilePadding: EdgeInsets.zero,
                          childrenPadding: const EdgeInsets.only(bottom: 12),
                          leading: const Icon(Icons.map_outlined, size: 17, color: Colors.black54),
                          title: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Maps', 'Mape'),
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                          iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                          children: [
                            Text('${pendingLatitude.toStringAsFixed(6)}, ${pendingLongitude.toStringAsFixed(6)}',
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
                            const SizedBox(height: 8),
                            if (pendingLatitude != 0.0 && pendingLongitude != 0.0) ...[
                              Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Parking Location', 'Parking lokacija'),
                                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black45)),
                              const SizedBox(height: 4),
                              ClipRRect(borderRadius: BorderRadius.circular(10),
                                child: SizedBox(height: 150, child: FlutterMap(
                                  options: MapOptions(initialCenter: LatLng(pendingLatitude, pendingLongitude), initialZoom: 15,
                                    interactionOptions: const InteractionOptions(flags: InteractiveFlag.none)),
                                  children: [
                                    TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.payparq.ai'),
                                    MarkerLayer(markers: [Marker(point: LatLng(pendingLatitude, pendingLongitude), width: 34, height: 34,
                                      child: const Icon(Icons.location_on, color: Colors.red, size: 34))]),
                                  ]))),
                            ],
                            Builder(builder: (_) {
                              final pm = addonsConfig['pickup_point'] as Map?;
                              final pLat = (pm?['lat'] as num?)?.toDouble() ?? 0.0;
                              final pLng = (pm?['lng'] as num?)?.toDouble() ?? 0.0;
                              final pLabel = (pm?['label'] as String?) ?? '';
                              if (pLat == 0.0 && pLng == 0.0) return const SizedBox.shrink();
                              return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                const SizedBox(height: 10),
                                Row(children: [
                                  const Icon(Icons.directions_car, size: 13, color: Colors.black38),
                                  const SizedBox(width: 5),
                                  Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Pick-Up / Drop Off', 'Zona preuzimanja'),
                                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black45)),
                                  if (pLabel.isNotEmpty) Text(' · $pLabel', style: GoogleFonts.inter(fontSize: 11, color: Colors.black38)),
                                ]),
                                const SizedBox(height: 4),
                                ClipRRect(borderRadius: BorderRadius.circular(10),
                                  child: SizedBox(height: 150, child: FlutterMap(
                                    options: MapOptions(initialCenter: LatLng(pLat, pLng), initialZoom: 16,
                                      interactionOptions: const InteractionOptions(flags: InteractiveFlag.none)),
                                    children: [
                                      TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.payparq.ai'),
                                      MarkerLayer(markers: [Marker(point: LatLng(pLat, pLng), width: 34, height: 34,
                                        child: const Icon(Icons.location_on, color: Colors.red, size: 34))]),
                                    ]))),
                              ]);
                            }),
                          ],
                        ),
                        const Divider(height: 1, thickness: 1, color: AppTheme.border),

                        // Section 1b: Lot Boundary
                        if (canEdit || meta['boundary'] != null) ...[
                          Builder(builder: (_) {
                            final raw = meta['boundary'];
                            List<LatLng> boundaryPoints = raw != null
                              ? (raw as List).map((p) => LatLng((p['lat'] as num).toDouble(), (p['lng'] as num).toDouble())).toList()
                              : <LatLng>[];
                            bool drawMode = boundaryPoints.isEmpty && canEdit;
                            bool savingBoundary = false;
                            final locId = loc['id']?.toString() ?? '';

                            Future<void> saveBoundary(StateSetter setSt) async {
                              if (boundaryPoints.length < 3) return;
                              setSt(() => savingBoundary = true);
                              final newMeta = Map<String, dynamic>.from(meta);
                              newMeta['boundary'] = boundaryPoints.map((p) => {'lat': p.latitude, 'lng': p.longitude}).toList();
                              await Supabase.instance.client.from('locations').update({'verification_metadata': newMeta}).eq('id', locId);
                              meta['boundary'] = newMeta['boundary'];
                              setSt(() { savingBoundary = false; drawMode = false; });
                            }

                            return StatefulBuilder(builder: (_, setSt) {
                              final center = LatLng(pendingLatitude != 0.0 ? pendingLatitude : 43.51, pendingLongitude != 0.0 ? pendingLongitude : 16.44);
                              return ExpansionTile(
                                tilePadding: EdgeInsets.zero,
                                childrenPadding: const EdgeInsets.only(bottom: 12),
                                leading: const Icon(Icons.crop_free, size: 17, color: Colors.black54),
                                title: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Lot Boundary', 'Granica parcele'),
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                                iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                                children: [
                                  if (drawMode) ...[
                                    Text(Lang.sel(ref.watch(localeIsCroatianProvider),
                                      'Tap map to mark corners (${boundaryPoints.length} added)',
                                      'Tapni kartu za označavanje kutova (${boundaryPoints.length} dodano)'),
                                      style: GoogleFonts.inter(fontSize: 11, color: Colors.black45)),
                                    const SizedBox(height: 8),
                                    ClipRRect(borderRadius: BorderRadius.circular(10),
                                      child: SizedBox(height: 260, child: FlutterMap(
                                        options: MapOptions(
                                          initialCenter: center, initialZoom: 18,
                                          onTap: (_, latLng) => setSt(() => boundaryPoints.add(latLng))),
                                        children: [
                                          TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.payparq.ai'),
                                          if (boundaryPoints.length >= 3)
                                            PolygonLayer(polygons: [Polygon(points: boundaryPoints, color: const Color(0x225F3DFC), borderColor: const Color(0xFF5F3DFC), borderStrokeWidth: 2.0)]),
                                          MarkerLayer(markers: boundaryPoints.asMap().entries.map((e) => Marker(
                                            point: e.value, width: 22, height: 22,
                                            child: Container(
                                              decoration: BoxDecoration(
                                                color: e.key == 0 ? Colors.green.shade600 : const Color(0xFF5F3DFC),
                                                shape: BoxShape.circle,
                                                border: Border.all(color: Colors.white, width: 2)),
                                              alignment: Alignment.center,
                                              child: Text('${e.key + 1}', style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold))))).toList()),
                                        ]))),
                                    const SizedBox(height: 8),
                                    Row(children: [
                                      if (boundaryPoints.isNotEmpty) ...[
                                        OutlinedButton(
                                          onPressed: () => setSt(() => boundaryPoints.removeLast()),
                                          style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                                          child: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Undo', 'Poništi'), style: GoogleFonts.inter(fontSize: 12))),
                                        const SizedBox(width: 8),
                                      ],
                                      if (boundaryPoints.length >= 3) ...[
                                        ElevatedButton(
                                          onPressed: savingBoundary ? null : () => saveBoundary(setSt),
                                          style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                                          child: savingBoundary
                                            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                            : Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Save Boundary', 'Spremi granicu'), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600))),
                                        const SizedBox(width: 8),
                                      ],
                                      OutlinedButton(
                                        onPressed: () => setSt(() => drawMode = false),
                                        style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                                        child: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Cancel', 'Odustani'), style: GoogleFonts.inter(fontSize: 12))),
                                    ]),
                                  ] else if (boundaryPoints.isNotEmpty) ...[
                                    ClipRRect(borderRadius: BorderRadius.circular(10),
                                      child: SizedBox(height: 180, child: FlutterMap(
                                        options: MapOptions(initialCenter: center, initialZoom: 18, interactionOptions: const InteractionOptions(flags: InteractiveFlag.none)),
                                        children: [
                                          TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.payparq.ai'),
                                          PolygonLayer(polygons: [Polygon(points: boundaryPoints, color: const Color(0x225F3DFC), borderColor: const Color(0xFF5F3DFC), borderStrokeWidth: 2.0)]),
                                          MarkerLayer(markers: boundaryPoints.map((p) => Marker(point: p, width: 10, height: 10, child: Container(decoration: const BoxDecoration(color: Color(0xFF5F3DFC), shape: BoxShape.circle)))).toList()),
                                        ]))),
                                    const SizedBox(height: 8),
                                    Row(children: [
                                      Text('${boundaryPoints.length} ${Lang.sel(ref.watch(localeIsCroatianProvider), 'corners', 'kutova')}',
                                        style: GoogleFonts.inter(fontSize: 11, color: Colors.black45)),
                                      const Spacer(),
                                      OutlinedButton.icon(
                                        onPressed: () => setSt(() => drawMode = true),
                                        icon: const Icon(Icons.edit, size: 13),
                                        label: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Redraw', 'Nacrtaj ponovo'), style: GoogleFonts.inter(fontSize: 12)),
                                        style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap)),
                                      const SizedBox(width: 8),
                                      OutlinedButton(
                                        onPressed: () => setSt(() { boundaryPoints = []; meta['boundary'] = null; }),
                                        style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                                        child: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Clear', 'Obriši'), style: GoogleFonts.inter(fontSize: 12, color: Colors.red.shade400))),
                                    ]),
                                  ] else ...[
                                    Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'No boundary set. Draw it to enable GPS spot placement.', 'Granica nije postavljena. Nacrtajte je za GPS pozicioniranje spotova.'),
                                      style: GoogleFonts.inter(fontSize: 12, color: Colors.black45)),
                                    const SizedBox(height: 8),
                                    ElevatedButton.icon(
                                      onPressed: () => setSt(() => drawMode = true),
                                      icon: const Icon(Icons.edit_location_alt, size: 14),
                                      label: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Draw Boundary', 'Nacrtaj granicu'), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)))),
                                  ],
                                ],
                              );
                            });
                          }),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                        ],

                        // Section 2: Photos
                        if (canEdit || editablePhotoUrls.isNotEmpty) ...[
                          ExpansionTile(
                            tilePadding: EdgeInsets.zero,
                            childrenPadding: const EdgeInsets.only(bottom: 12),
                            leading: const Icon(Icons.photo_library_outlined, size: 17, color: Colors.black54),
                            title: Text(
                              '${Lang.sel(ref.watch(localeIsCroatianProvider), "Photos", "Fotografije")} (${editablePhotoUrls.length + newlySelectedPhotos.length})',
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                            children: [
                              if (editablePhotoUrls.isNotEmpty)
                                GridView.builder(
                                  shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4, crossAxisSpacing: 6, mainAxisSpacing: 6),
                                  itemCount: editablePhotoUrls.length > 24 ? 24 : editablePhotoUrls.length,
                                  itemBuilder: (context, index) {
                                    final url = editablePhotoUrls[index];
                                    return Stack(fit: StackFit.expand, children: [
                                      ClipRRect(borderRadius: BorderRadius.circular(6),
                                        child: Image.network(url, fit: BoxFit.cover,
                                          errorBuilder: (c, e, s) => Container(color: AppTheme.background, child: const Icon(Icons.broken_image, size: 14)))),
                                      if (canEdit) Positioned(top: 2, right: 2,
                                        child: InkWell(
                                          onTap: () => setState(() => editablePhotoUrls.removeAt(index)),
                                          child: Container(padding: const EdgeInsets.all(3),
                                            decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                            child: const Icon(Icons.close, size: 9, color: Colors.white)))),
                                    ]);
                                  }),
                              if (newlySelectedPhotos.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                GridView.builder(
                                  shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4, crossAxisSpacing: 6, mainAxisSpacing: 6),
                                  itemCount: newlySelectedPhotos.length > 24 ? 24 : newlySelectedPhotos.length,
                                  itemBuilder: (context, index) {
                                    final xf = newlySelectedPhotos[index];
                                    return FutureBuilder<Uint8List>(
                                      future: localPhotoPreviewBytes[xf.path] != null
                                        ? Future.value(localPhotoPreviewBytes[xf.path]!)
                                        : xf.readAsBytes().then((b) { localPhotoPreviewBytes[xf.path] = b; return b; }),
                                      builder: (c, snap) => ClipRRect(borderRadius: BorderRadius.circular(6),
                                        child: snap.hasData ? Image.memory(snap.data!, fit: BoxFit.cover) : Container(color: AppTheme.background)));
                                  }),
                              ],
                              if (canEdit) ...[
                                const SizedBox(height: 8),
                                Wrap(spacing: 8, children: [
                                  OutlinedButton.icon(
                                    onPressed: () => pickLocationPhotos(ImageSource.camera),
                                    icon: const Icon(Icons.camera_alt, size: 14, color: Colors.black),
                                    label: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Camera', 'Kamera'),
                                      style: GoogleFonts.inter(fontSize: 12, color: Colors.black)),
                                    style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border),
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7))),
                                  OutlinedButton.icon(
                                    onPressed: () => pickLocationPhotos(ImageSource.gallery),
                                    icon: const Icon(Icons.photo_library, size: 14, color: Colors.black),
                                    label: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Gallery', 'Galerija'),
                                      style: GoogleFonts.inter(fontSize: 12, color: Colors.black)),
                                    style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border),
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7))),
                                ]),
                              ],
                            ],
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                        ],

                        // Section 3: Services & Add-ons
                        if (canEdit) ...[
                          ExpansionTile(
                            tilePadding: EdgeInsets.zero,
                            childrenPadding: const EdgeInsets.only(bottom: 12),
                            leading: const Icon(Icons.extension_outlined, size: 17, color: Colors.black54),
                            title: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Services & Add-ons', 'Usluge i dodaci'),
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                            children: [
                              Row(children: [
                                Switch(value: valetEnabled, activeThumbColor: Colors.black,
                                  onChanged: (v) async { setState(() => valetEnabled = v); await ref.read(locationsControllerProvider).updateServiceFlags(idStr, valetEnabled: v, shuttleEnabled: shuttleEnabled); }),
                                Text('Valet', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)),
                                const SizedBox(width: 16),
                                Switch(value: shuttleEnabled, activeThumbColor: Colors.black,
                                  onChanged: (v) async { setState(() => shuttleEnabled = v); await ref.read(locationsControllerProvider).updateServiceFlags(idStr, valetEnabled: valetEnabled, shuttleEnabled: v); }),
                                Text('Shuttle', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)),
                              ]),
                              const SizedBox(height: 6),
                              Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'ADD-ON PRICES', 'CIJENE DODATAKA'),
                                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textSecondary, letterSpacing: 0.8)),
                              const SizedBox(height: 8),
                              _buildAddonRow(label: 'Valet', enabled: addonValetOn, priceCtrl: valetPriceCtrl, onToggle: (v) => setState(() => addonValetOn = v)),
                              const SizedBox(height: 6),
                              _buildAddonRow(label: Lang.sel(ref.watch(localeIsCroatianProvider), 'EV Charging', 'EV punjenje'), enabled: addonEvOn, priceCtrl: evPriceCtrl, onToggle: (v) => setState(() => addonEvOn = v)),
                              const SizedBox(height: 6),
                              Row(children: [
                                Switch(value: addonWashOn, activeThumbColor: Colors.black, onChanged: (v) => setState(() => addonWashOn = v)),
                                Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Car Wash', 'Pranje auta'), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)),
                              ]),
                              if (addonWashOn) Padding(padding: const EdgeInsets.only(top: 4),
                                child: Row(children: [
                                  Expanded(child: TextField(controller: washBasicCtrl, style: GoogleFonts.inter(fontSize: 13),
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: InputDecoration(labelText: 'Basic', suffixText: '€', filled: true, fillColor: AppTheme.background,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                                  const SizedBox(width: 8),
                                  Expanded(child: TextField(controller: washPremiumCtrl, style: GoogleFonts.inter(fontSize: 13),
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: InputDecoration(labelText: 'Premium', suffixText: '€', filled: true, fillColor: AppTheme.background,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                                ])),
                              const SizedBox(height: 6),
                              Row(children: [
                                Switch(value: addonFuelOn, activeThumbColor: Colors.black, onChanged: (v) => setState(() => addonFuelOn = v)),
                                Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Fuel', 'Gorivo'), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)),
                              ]),
                              if (addonFuelOn) Padding(padding: const EdgeInsets.only(top: 4),
                                child: Row(children: [
                                  Expanded(child: TextField(controller: fuelDieselCtrl, style: GoogleFonts.inter(fontSize: 13),
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: InputDecoration(labelText: 'Diesel', suffixText: '€', filled: true, fillColor: AppTheme.background,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                                  const SizedBox(width: 8),
                                  Expanded(child: TextField(controller: fuelBenzinCtrl, style: GoogleFonts.inter(fontSize: 13),
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: InputDecoration(labelText: 'Benzin', suffixText: '€', filled: true, fillColor: AppTheme.background,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                                ])),
                              const SizedBox(height: 6),
                              _buildAddonRow(label: Lang.sel(ref.watch(localeIsCroatianProvider), 'Shuttle (paid)', 'Shuttle (plaćeni)'), enabled: addonShuttleOn, priceCtrl: shuttlePriceCtrl, onToggle: (v) => setState(() => addonShuttleOn = v)),
                              const SizedBox(height: 10),
                              Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'PICK-UP / DROP OFF ZONE', 'ZONA PREUZIMANJA'),
                                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textSecondary, letterSpacing: 0.8)),
                              const SizedBox(height: 6),
                              LotLocationPicker(
                                initialLocation: LatLng(pickupLat != 0.0 ? pickupLat : pendingLatitude, pickupLng != 0.0 ? pickupLng : pendingLongitude),
                                onLocationSelected: (latLng, address) { setState(() { pickupLat = latLng.latitude; pickupLng = latLng.longitude; if (address.trim().isNotEmpty) pickupLabel = address.trim(); }); }),
                              const SizedBox(height: 6),
                              TextField(controller: phoneSmsCtrl, keyboardType: TextInputType.phone, style: GoogleFonts.inter(fontSize: 13),
                                decoration: InputDecoration(labelText: 'Telefon (SMS/WhatsApp)', filled: true, fillColor: AppTheme.background,
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                              if (addonValetOn) ...[
                                const SizedBox(height: 6),
                                TextField(controller: lotZoneCtrl, style: GoogleFonts.inter(fontSize: 13),
                                  decoration: InputDecoration(
                                    labelText: Lang.sel(ref.watch(localeIsCroatianProvider), 'Lot zone (valet)', 'Lot zona (valet)'),
                                    filled: true, fillColor: AppTheme.background,
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                              ],
                            ],
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                        ],

                        // Section 4: Spots (superadmin + admin)
                        if (isSuperAdmin || isAdmin) ...[
                          _SpotsSection(
                            locationId: loc['id']?.toString() ?? '',
                            boundary: meta['boundary'] as List?,
                            center: LatLng(pendingLatitude != 0.0 ? pendingLatitude : 43.51, pendingLongitude != 0.0 ? pendingLongitude : 16.44),
                            isCroatian: ref.watch(localeIsCroatianProvider),
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                        ],

                        // Section 5: Listing Details (admin editable)
                        if (canEdit) ...[
                          ExpansionTile(
                            tilePadding: EdgeInsets.zero,
                            childrenPadding: const EdgeInsets.only(bottom: 12),
                            leading: const Icon(Icons.schedule_outlined, size: 17, color: Colors.black54),
                            title: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Access Hours', 'Radno vrijeme'),
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                            children: [
                              TextField(controller: accessHoursCtrl, maxLines: 4, style: GoogleFonts.inter(fontSize: 12),
                                decoration: InputDecoration(filled: true, fillColor: AppTheme.background, hintText: 'e.g. pon – pet: 6:00 – 23:00',
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                            ],
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                          ExpansionTile(
                            tilePadding: EdgeInsets.zero,
                            childrenPadding: const EdgeInsets.only(bottom: 12),
                            leading: const Icon(Icons.star_outline, size: 17, color: Colors.black54),
                            title: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Amenities', 'Sadržaji'),
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                            children: [
                              TextField(controller: amenitiesCtrl, maxLines: 5, style: GoogleFonts.inter(fontSize: 12),
                                decoration: InputDecoration(filled: true, fillColor: AppTheme.background, hintText: 'e.g. EV punjenje, Pokriven, ...',
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                            ],
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                          ExpansionTile(
                            tilePadding: EdgeInsets.zero,
                            childrenPadding: const EdgeInsets.only(bottom: 12),
                            leading: const Icon(Icons.info_outline, size: 17, color: Colors.black54),
                            title: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Things You Should Know', 'Što trebate znati'),
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                            children: [
                              TextField(controller: thingsToKnowCtrl, maxLines: 6, style: GoogleFonts.inter(fontSize: 12),
                                decoration: InputDecoration(filled: true, fillColor: AppTheme.background, hintText: 'e.g. Ograničenja veličine vozila...',
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                            ],
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                          ExpansionTile(
                            tilePadding: EdgeInsets.zero,
                            childrenPadding: const EdgeInsets.only(bottom: 12),
                            leading: const Icon(Icons.directions_outlined, size: 17, color: Colors.black54),
                            title: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Getting There', 'Kako doći'),
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                            children: [
                              TextField(controller: gettingThereCtrl, maxLines: 4, style: GoogleFonts.inter(fontSize: 12),
                                decoration: InputDecoration(filled: true, fillColor: AppTheme.background, hintText: 'e.g. Unesite s ulice Riva...',
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                            ],
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                          ExpansionTile(
                            tilePadding: EdgeInsets.zero,
                            childrenPadding: const EdgeInsets.only(bottom: 12),
                            leading: const Icon(Icons.help_outline, size: 17, color: Colors.black54),
                            title: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'How It Works', 'Kako radi'),
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                            children: [
                              TextField(controller: howItWorksCtrl, maxLines: 5, style: GoogleFonts.inter(fontSize: 12),
                                decoration: InputDecoration(filled: true, fillColor: AppTheme.background, hintText: '1. Pokažite propusnicu\n2. Uđite\n3. Odvozte se',
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none))),
                            ],
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                        ],

                        // Section 6: Admin (super_admin only)
                        if (isSuperAdmin) ...[
                          ExpansionTile(
                            tilePadding: EdgeInsets.zero,
                            childrenPadding: const EdgeInsets.only(bottom: 12),
                            leading: const Icon(Icons.admin_panel_settings_outlined, size: 17, color: Colors.black54),
                            title: Text('Admin', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            iconColor: Colors.black45, collapsedIconColor: Colors.black45,
                            children: [
                              Row(children: [
                                Switch(value: isHub, activeThumbColor: Colors.black,
                                  onChanged: (v) async {
                                    setState(() {
                                      final meta = Map<String, dynamic>.from(loc['verification_metadata'] as Map? ?? {});
                                      meta['hub_enabled'] = v;
                                      loc['verification_metadata'] = meta;
                                    });
                                    await _toggleHub(loc, v);
                                    if (v == true) { try { await launchUrl(Uri.parse(_buildHubLocationUrl(loc))); } catch (_) {} }
                                    if (!dialogContext.mounted) return;
                                    Navigator.pop(dialogContext);
                                    _showLocationDetail(loc, isSuperAdmin, isAdmin);
                                  }),
                                Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Hub Enabled', 'Hub omogućen'),
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                              ]),
                              const SizedBox(height: 4),
                              Row(children: [
                                Text('Company', style: GoogleFonts.inter(fontSize: 11, color: Colors.black38, fontWeight: FontWeight.w600)),
                                Switch(value: isAgenticSettlement, activeThumbColor: Colors.black,
                                  onChanged: (v) async {
                                    setState(() {
                                      final meta = Map<String, dynamic>.from(loc['verification_metadata'] as Map? ?? {});
                                      meta['settlement_model'] = v ? 'agentic' : 'company';
                                      loc['verification_metadata'] = meta;
                                    });
                                    await ref.read(locationsControllerProvider).updateSettlementModel(loc, v ? 'agentic' : 'company');
                                  }),
                                Text('Agentic', style: GoogleFonts.inter(fontSize: 11, color: Colors.black38, fontWeight: FontWeight.w600)),
                              ]),
                              if (isHub) ...[
                                const SizedBox(height: 8),
                                Row(children: [
                                  const Icon(Icons.link, size: 14, color: Colors.black38),
                                  const SizedBox(width: 6),
                                  Expanded(child: SelectableText(_buildHubLocationUrl(loc),
                                    style: GoogleFonts.inter(fontSize: 11, color: Colors.blue[700], decoration: TextDecoration.underline))),
                                  const SizedBox(width: 8),
                                  ElevatedButton(
                                    onPressed: () async { await launchUrl(Uri.parse(_buildHubLocationUrl(loc))); },
                                    style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                                    child: Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Open Hub', 'Otvori Hub'), style: GoogleFonts.inter(fontSize: 12))),
                                ]),
                              ],
                              const SizedBox(height: 8),
                              OutlinedButton.icon(
                                onPressed: () => setState(() => showLocationPicker = !showLocationPicker),
                                icon: Icon(showLocationPicker ? Icons.expand_less : Icons.map_outlined, size: 14, color: Colors.black),
                                label: Text(showLocationPicker
                                  ? Lang.sel(ref.watch(localeIsCroatianProvider), 'Hide map', 'Sakrij mapu')
                                  : Lang.sel(ref.watch(localeIsCroatianProvider), 'Change location', 'Promijeni lokaciju'),
                                  style: GoogleFonts.inter(fontSize: 12, color: Colors.black, fontWeight: FontWeight.w600)),
                                style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8))),
                              if (showLocationPicker) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(color: AppTheme.background, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Tap to move pin', 'Klikni za promjenu pina'),
                                      style: GoogleFonts.inter(fontSize: 11, color: Colors.black54, fontWeight: FontWeight.w500)),
                                    const SizedBox(height: 8),
                                    LotLocationPicker(
                                      initialLocation: LatLng(pendingLatitude, pendingLongitude),
                                      onLocationSelected: (latLng, address) {
                                        setState(() { pendingLatitude = latLng.latitude; pendingLongitude = latLng.longitude; if (address.trim().isNotEmpty) addressCtrl.text = address.trim(); });
                                      }),
                                  ])),
                              ],
                            ],
                          ),
                          const Divider(height: 1, thickness: 1, color: AppTheme.border),
                        ],
                      ]),
                    )),

                    // ────────────── FOOTER ──────────────
                    if (canEdit) ...[
                      const Divider(height: 1, thickness: 1, color: AppTheme.border),
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          if (saving && uploadStatusText != null) ...[
                            Text(uploadStatusText!, style: GoogleFonts.inter(fontSize: 11, color: Colors.black38, fontWeight: FontWeight.w500)),
                            const SizedBox(height: 6),
                          ],
                          SizedBox(width: double.infinity,
                            child: ElevatedButton(
                              onPressed: saving ? null : saveChanges,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.black, foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 13),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                              child: saving
                                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Save Changes', 'Spremi promjene'),
                                    style: GoogleFonts.inter(fontWeight: FontWeight.w600)))),
                        ])),
                    ],
                  ]),
                );
              },
            ),
          ),
        );
      },
    );
  }

  Future<void> _showAddLocationDialog(
      BuildContext context, String? locationId, String? fallbackOwnerId) async {
    // Pre-fetch managers (Lot Partners) so the dropdown is ready when dialog opens
    List<Map<String, dynamic>> managers = [];
    try {
      final result = await Supabase.instance.client
          .from('profiles')
          .select('id, email')
          .eq('role', 'manager')
          .order('email');
      managers = List<Map<String, dynamic>>.from(result as List);
    } catch (_) {}

    if (!context.mounted) return;

    final nameCtrl = TextEditingController();
    final capacityCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;
    LatLng? selectedLatLng;
    String selectedAddress = '';
    LatLng? selectedPickupLatLng;
    String selectedPickupLabel = '';
    String? selectedManagerId;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(
            Lang.sel(
                ref.watch(localeIsCroatianProvider),
                'Register Professional Lot',
                'Registriraj profesionalno parkiralište'),
            style: GoogleFonts.inter(fontWeight: FontWeight.bold),
          ),
          content: SizedBox(
            width: 500,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextFormField(
                      controller: nameCtrl,
                      decoration: InputDecoration(
                          labelText: Lang.sel(
                              ref.watch(localeIsCroatianProvider),
                              'Location Name',
                              'Naziv lokacije'),
                          hintText: Lang.sel(
                              ref.watch(localeIsCroatianProvider),
                              'e.g. Downtown Garage',
                              'npr. Garaža Centar'),
                          border: const OutlineInputBorder()),
                      validator: (v) => v!.isEmpty
                          ? Lang.sel(ref.watch(localeIsCroatianProvider),
                              'Required', 'Obavezno')
                          : null,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      Lang.sel(ref.watch(localeIsCroatianProvider),
                          'Lot Capacity (Spaces)', 'Kapacitet (mjesta)'),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: capacityCtrl,
                      decoration: InputDecoration(
                        hintText: Lang.sel(ref.watch(localeIsCroatianProvider),
                            'e.g. 150', 'npr. 150'),
                        filled: true,
                        fillColor: AppTheme.surface,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        final value = (v ?? '').trim();
                        if (value.isEmpty) {
                          return Lang.sel(ref.watch(localeIsCroatianProvider),
                              'Required', 'Obavezno');
                        }
                        final parsed = int.tryParse(value);
                        if (parsed == null || parsed < 1) {
                          return Lang.sel(
                              ref.watch(localeIsCroatianProvider),
                              'Capacity must be at least 1',
                              'Kapacitet mora biti najmanje 1');
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    Text(
                      Lang.sel(ref.watch(localeIsCroatianProvider),
                          'Location on Map', 'Lokacija na karti'),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    LotLocationPicker(
                      onLocationSelected: (latLng, address) {
                        selectedLatLng = latLng;
                        selectedAddress = address;
                      },
                    ),
                    const SizedBox(height: 24),
                    Text(
                      Lang.sel(ref.watch(localeIsCroatianProvider),
                          'Pick-Up / Drop Off Zone', 'Zona preuzimanja / predaje'),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Lang.sel(ref.watch(localeIsCroatianProvider),
                          'Optional — where drivers hand over / collect their car',
                          'Neobavezno — gdje vozači predaju / preuzimaju auto'),
                      style: GoogleFonts.inter(fontSize: 12, color: Colors.black54),
                    ),
                    const SizedBox(height: 8),
                    LotLocationPicker(
                      onLocationSelected: (latLng, address) {
                        selectedPickupLatLng = latLng;
                        if (address.trim().isNotEmpty) selectedPickupLabel = address.trim();
                      },
                    ),
                    const SizedBox(height: 24),
                    Text(
                      Lang.sel(ref.watch(localeIsCroatianProvider),
                          'Lot Partner (receives payments)', 'Lot Partner (prima uplate)'),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: selectedManagerId,
                      decoration: InputDecoration(
                        hintText: Lang.sel(
                            ref.watch(localeIsCroatianProvider),
                            'Select Lot Partner',
                            'Odaberi Lot Partnera'),
                        filled: true,
                        fillColor: AppTheme.surface,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      items: managers.map((m) {
                        return DropdownMenuItem<String>(
                          value: m['id'] as String,
                          child: Text(
                            m['email'] as String? ?? m['id'] as String,
                            style: GoogleFonts.inter(fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: (val) =>
                          setDialogState(() => selectedManagerId = val),
                      validator: (_) => selectedManagerId == null
                          ? Lang.sel(ref.watch(localeIsCroatianProvider),
                              'Select a Lot Partner', 'Odaberi Lot Partnera')
                          : null,
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
                onPressed: isProcessing ? null : () => Navigator.pop(context),
                child: Text(Lang.sel(ref.watch(localeIsCroatianProvider),
                    'Cancel', 'Odustani'))),
            ElevatedButton(
              onPressed: isProcessing
                  ? null
                  : () async {
                      if (formKey.currentState!.validate()) {
                        if (selectedLatLng == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                                content: Text(Lang.sel(
                                    ref.watch(localeIsCroatianProvider),
                                    'Please select a location on the map',
                                    'Molimo odaberite lokaciju na karti'))),
                          );
                          return;
                        }

                        setDialogState(() => isProcessing = true);
                        try {
                          await ref
                              .read(locationsControllerProvider)
                              .createLocation(
                                name: nameCtrl.text,
                                address: selectedAddress,
                                latitude: selectedLatLng!.latitude,
                                longitude: selectedLatLng!.longitude,
                                capacity: int.tryParse(capacityCtrl.text) ?? 0,
                                ownerId: selectedManagerId ?? fallbackOwnerId,
                                addonsConfig: selectedPickupLatLng != null
                                    ? {
                                        'pickup_point': {
                                          'lat': selectedPickupLatLng!.latitude,
                                          'lng': selectedPickupLatLng!.longitude,
                                          if (selectedPickupLabel.isNotEmpty) 'label': selectedPickupLabel,
                                        },
                                      }
                                    : null,
                              );
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content: Text(Lang.sel(
                                      ref.watch(localeIsCroatianProvider),
                                      'Location created!',
                                      'Lokacija je kreirana!'))),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            final rawError = e.toString().toLowerCase();
                            final isDuplicateName =
                                rawError.contains('duplicate key') ||
                                    rawError.contains('unique constraint') ||
                                    rawError.contains('locations_name_key') ||
                                    rawError.contains('name');
                            final friendlyMessage = isDuplicateName
                                ? Lang.sel(
                                    ref.watch(localeIsCroatianProvider),
                                    'This name is taken. Try another name :)',
                                    'Ovaj naziv je zauzet. Pokušajte drugi naziv :)',
                                  )
                                : Lang.sel(
                                    ref.watch(localeIsCroatianProvider),
                                    'Error: ${ErrorMapper.message(e)}',
                                    'Greška: ${ErrorMapper.message(e)}',
                                  );
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(friendlyMessage)),
                            );
                          }
                        } finally {
                          if (context.mounted) {
                            setDialogState(() => isProcessing = false);
                          }
                        }
                      }
                    },
              child: isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : Text(Lang.sel(ref.watch(localeIsCroatianProvider),
                      'Register Lot', 'Registriraj parkiralište')),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Spots Section ────────────────────────────────────────────────────────────

class _SpotsSection extends StatefulWidget {
  final String locationId;
  final List<dynamic>? boundary;
  final LatLng center;
  final bool isCroatian;

  const _SpotsSection({
    required this.locationId,
    required this.boundary,
    required this.center,
    required this.isCroatian,
  });

  @override
  State<_SpotsSection> createState() => _SpotsSectionState();
}

class _SpotsSectionState extends State<_SpotsSection> {
  List<Map<String, dynamic>> _spotsData = [];
  bool _spotsLoaded = false;
  bool _generatingSpots = false;
  bool _sectorMode = false;
  final List<LatLng> _manualPins = [];
  bool _savingPins = false;
  final _rowsCtrl = TextEditingController(text: '4');
  final _colsCtrl = TextEditingController(text: '5');

  @override
  void dispose() {
    _rowsCtrl.dispose();
    _colsCtrl.dispose();
    super.dispose();
  }

  bool get _hasBoundary => widget.boundary != null && widget.boundary!.length >= 3;

  List<LatLng> get _boundaryLatLng => _hasBoundary
      ? widget.boundary!
          .map((p) => LatLng((p['lat'] as num).toDouble(), (p['lng'] as num).toDouble()))
          .toList()
      : <LatLng>[];

  Map<String, double> _interpolate(List<dynamic> corners, double u, double v) {
    final tl = corners[0]; final tr = corners[1];
    final br = corners[2]; final bl = corners[3];
    final topLat = (tl['lat'] as num) + u * ((tr['lat'] as num) - (tl['lat'] as num));
    final topLng = (tl['lng'] as num) + u * ((tr['lng'] as num) - (tl['lng'] as num));
    final botLat = (bl['lat'] as num) + u * ((br['lat'] as num) - (bl['lat'] as num));
    final botLng = (bl['lng'] as num) + u * ((br['lng'] as num) - (bl['lng'] as num));
    return {'lat': topLat + v * (botLat - topLat), 'lng': topLng + v * (botLng - topLng)};
  }

  Future<void> _fetchSpots() async {
    if (widget.locationId.isEmpty) return;
    final client = Supabase.instance.client;
    final res = await client
        .from('spots')
        .select('id,label,row_num,col_num,price_modifier_cents,lat,lng')
        .eq('location_id', widget.locationId)
        .order('row_num')
        .order('col_num');
    final rows = (res as List).cast<Map<String, dynamic>>();
    if (rows.isEmpty) {
      if (mounted) setState(() { _spotsData = []; _spotsLoaded = true; });
      return;
    }
    final assignRes = await client
        .from('spot_assignments')
        .select('spot_id')
        .eq('status', 'active')
        .inFilter('spot_id', rows.map((r) => r['id']).toList());
    final takenIds = Set<String>.from((assignRes as List).map((a) => a['spot_id']?.toString() ?? ''));
    if (mounted) setState(() {
      _spotsData = rows.map((r) => {...r, 'taken': takenIds.contains(r['id']?.toString())}).toList();
      _spotsLoaded = true;
    });
  }

  Future<void> _generateSpots() async {
    final rows = int.tryParse(_rowsCtrl.text.trim()) ?? 0;
    final cols = int.tryParse(_colsCtrl.text.trim()) ?? 0;
    if (rows <= 0 || cols <= 0 || widget.locationId.isEmpty) return;
    setState(() => _generatingSpots = true);
    try {
      final client = Supabase.instance.client;
      await client.from('spots').delete().eq('location_id', widget.locationId);
      final newSpots = <Map<String, dynamic>>[];
      final corners = _hasBoundary && widget.boundary!.length >= 4 ? widget.boundary! : null;
      for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
          final rowLetter = String.fromCharCode(65 + r);
          double? spotLat, spotLng;
          if (corners != null) {
            final u = cols > 1 ? c / (cols - 1) : 0.5;
            final v = rows > 1 ? r / (rows - 1) : 0.5;
            final pos = _interpolate(corners, u, v);
            spotLat = pos['lat']; spotLng = pos['lng'];
          }
          newSpots.add({'location_id': widget.locationId, 'label': '$rowLetter${c + 1}', 'row_num': r, 'col_num': c, 'lat': spotLat, 'lng': spotLng, 'active': true});
        }
      }
      await client.from('spots').insert(newSpots);
      await _fetchSpots();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(Lang.sel(widget.isCroatian, '${newSpots.length} spots saved', '${newSpots.length} spotova spremljeno')),
          backgroundColor: Colors.green,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(Lang.sel(widget.isCroatian, 'Error saving spots: $e', 'Greška pri spremanju spotova: $e')),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _generatingSpots = false);
    }
  }

  Future<void> _savePins() async {
    if (_manualPins.isEmpty || widget.locationId.isEmpty) return;
    setState(() => _savingPins = true);
    try {
      final client = Supabase.instance.client;
      await client.from('spots').delete().eq('location_id', widget.locationId);
      // 5 vertical lng-based columns (left→right = lane 1→5, each ~1 car width)
      final lngs = _manualPins.map((p) => p.longitude).toList()..sort();
      final minLng = lngs.first; final maxLng = lngs.last;
      final lngRange = maxLng - minLng;
      final sectorCounts = List.filled(5, 0);
      final newSpots = _manualPins.map((p) {
        final col = lngRange > 0 ? ((p.longitude - minLng) / lngRange * 4.99).floor().clamp(0, 4) : 0;
        sectorCounts[col]++;
        return {'location_id': widget.locationId, 'label': '${col + 1}-${sectorCounts[col]}', 'row_num': sectorCounts[col] - 1, 'col_num': col, 'lat': p.latitude, 'lng': p.longitude, 'active': true};
      }).toList();
      await client.from('spots').insert(newSpots);
      await _fetchSpots();
      if (mounted) {
        setState(() { _savingPins = false; _sectorMode = false; _manualPins.clear(); });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(Lang.sel(widget.isCroatian, '${newSpots.length} spots saved', '${newSpots.length} spotova spremljeno')),
          backgroundColor: Colors.green,
        ));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _savingPins = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(Lang.sel(widget.isCroatian, 'Error saving spots: $e', 'Greška pri spremanju spotova: $e')),
          backgroundColor: Colors.red,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.isCroatian;
    final sectorColors = [Colors.red.shade100, Colors.orange.shade100, Colors.yellow.shade100, Colors.green.shade100, Colors.blue.shade100];

    return ExpansionTile(
      tilePadding: EdgeInsets.zero,
      childrenPadding: const EdgeInsets.only(bottom: 12),
      leading: const Icon(Icons.grid_view_outlined, size: 17, color: Colors.black54),
      title: Text(Lang.sel(c, 'Spots', 'Spotovi'), style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
      iconColor: Colors.black45, collapsedIconColor: Colors.black45,
      onExpansionChanged: (expanded) { if (expanded && !_spotsLoaded) _fetchSpots(); },
      children: [
        if (!_sectorMode) ...[
          Row(children: [
            Expanded(child: ElevatedButton.icon(
              onPressed: _generatingSpots ? null : _generateSpots,
              icon: _generatingSpots
                  ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.auto_fix_high, size: 14),
              label: Text(Lang.sel(c, 'Auto fill', 'Auto popuni'), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))))),
            const SizedBox(width: 8),
            Expanded(child: Tooltip(
              message: _hasBoundary ? '' : Lang.sel(c, 'Draw lot boundary first', 'Prvo nacrtajte granicu parcele'),
              child: OutlinedButton.icon(
                onPressed: _hasBoundary ? () => setState(() => _sectorMode = true) : null,
                icon: const Icon(Icons.touch_app_outlined, size: 14),
                label: Text(Lang.sel(c, 'Manual', 'Ručno'), style: GoogleFonts.inter(fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: _hasBoundary ? AppTheme.border : Colors.black12),
                  foregroundColor: _hasBoundary ? Colors.black54 : Colors.black26,
                  padding: const EdgeInsets.symmetric(vertical: 10))))),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: TextField(
              controller: _rowsCtrl, keyboardType: TextInputType.number, style: GoogleFonts.inter(fontSize: 13),
              decoration: InputDecoration(labelText: Lang.sel(c, 'Rows', 'Redovi'), filled: true, fillColor: AppTheme.background, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
            const SizedBox(width: 8),
            Expanded(child: TextField(
              controller: _colsCtrl, keyboardType: TextInputType.number, style: GoogleFonts.inter(fontSize: 13),
              decoration: InputDecoration(labelText: Lang.sel(c, 'Cols', 'Stupci'), filled: true, fillColor: AppTheme.background, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
          ]),
          if (!_hasBoundary) ...[
            const SizedBox(height: 6),
            Text(Lang.sel(c, '⚠ Draw lot boundary to add GPS to each spot.', '⚠ Nacrtajte granicu za GPS koordinate spotova.'),
              style: GoogleFonts.inter(fontSize: 11, color: Colors.orange.shade700)),
          ],
        ] else ...[
          Text(Lang.sel(c,
            'Tap to place cars. Lane 1–5 left→right (~1 car width each). (${_manualPins.length} placed)',
            'Tapni za postavljanje auta. Trak 1–5 lijevo→desno (~1 auto širine). (${_manualPins.length} postavljeno)'),
            style: GoogleFonts.inter(fontSize: 11, color: Colors.black45)),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(10),
            child: SizedBox(height: 300, child: FlutterMap(
              options: MapOptions(
                initialCenter: widget.center, initialZoom: 18,
                onTap: (_, latLng) => setState(() => _manualPins.add(latLng))),
              children: [
                TileLayer(urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', userAgentPackageName: 'com.payparq.ai'),
                if (_hasBoundary) ...[
                  PolygonLayer(polygons: [Polygon(points: _boundaryLatLng, color: const Color(0x115F3DFC), borderColor: const Color(0xFF5F3DFC), borderStrokeWidth: 1.5)]),
                  // 5 vertical car-width columns (left→right, lane 1→5)
                  if (_boundaryLatLng.isNotEmpty) ...[
                    ...List.generate(5, (i) {
                      final lats = _boundaryLatLng.map((p) => p.latitude).toList()..sort();
                      final lngs = _boundaryLatLng.map((p) => p.longitude).toList()..sort();
                      final minLat = lats.first; final maxLat = lats.last;
                      final minLng = lngs.first; final maxLng = lngs.last;
                      final lngStep = (maxLng - minLng) / 5;
                      final sLng = minLng + i * lngStep;
                      final eLng = minLng + (i + 1) * lngStep;
                      return PolygonLayer(polygons: [Polygon(
                        points: [LatLng(maxLat, sLng), LatLng(maxLat, eLng), LatLng(minLat, eLng), LatLng(minLat, sLng)],
                        color: sectorColors[i].withOpacity(0.35), borderStrokeWidth: 0)]);
                    }),
                  ],
                ],
                MarkerLayer(markers: _manualPins.map((p) => Marker(
                  point: p, width: 20, height: 20,
                  child: Container(
                    decoration: const BoxDecoration(color: Color(0xFF5F3DFC), shape: BoxShape.circle, boxShadow: [BoxShadow(color: Color(0x445F3DFC), blurRadius: 4)]),
                    alignment: Alignment.center,
                    child: const Icon(Icons.local_parking, color: Colors.white, size: 12)))).toList()),
              ]))),
          const SizedBox(height: 8),
          Row(children: [
            if (_manualPins.isNotEmpty) ...[
              OutlinedButton(
                onPressed: () => setState(() => _manualPins.removeLast()),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                child: Text(Lang.sel(c, 'Undo', 'Poništi'), style: GoogleFonts.inter(fontSize: 12))),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _savingPins ? null : _savePins,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                child: _savingPins
                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(Lang.sel(c, 'Save spots', 'Spremi spotove'), style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600))),
              const SizedBox(width: 8),
            ],
            OutlinedButton(
              onPressed: () => setState(() { _sectorMode = false; _manualPins.clear(); }),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
              child: Text(Lang.sel(c, 'Cancel', 'Odustani'), style: GoogleFonts.inter(fontSize: 12))),
          ]),
        ],
        if (_spotsData.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text('${_spotsData.length} ${Lang.sel(c, 'spots', 'spotova')}',
            style: GoogleFonts.inter(fontSize: 11, color: Colors.black38, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          GridView.builder(
            shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 5, crossAxisSpacing: 4, mainAxisSpacing: 4, childAspectRatio: 1.6),
            itemCount: _spotsData.length,
            itemBuilder: (_, i) {
              final spot = _spotsData[i];
              final taken = spot['taken'] == true;
              final hasGps = spot['lat'] != null && spot['lng'] != null;
              return Container(
                decoration: BoxDecoration(
                  color: taken ? Colors.black12 : Colors.green.shade100,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: taken ? Colors.black26 : Colors.green.shade300, width: 1)),
                alignment: Alignment.center,
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(spot['label']?.toString() ?? '', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: taken ? Colors.black38 : Colors.green.shade800)),
                  if (hasGps) const Icon(Icons.location_on, size: 7, color: Colors.blue),
                ]));
            }),
          const SizedBox(height: 6),
          Row(children: [
            Container(width: 12, height: 12, decoration: BoxDecoration(color: Colors.green.shade100, borderRadius: BorderRadius.circular(3), border: Border.all(color: Colors.green.shade300))),
            const SizedBox(width: 4),
            Text(Lang.sel(c, 'Free', 'Slobodno'), style: GoogleFonts.inter(fontSize: 10, color: Colors.black45)),
            const SizedBox(width: 10),
            Container(width: 12, height: 12, decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(3), border: Border.all(color: Colors.black26))),
            const SizedBox(width: 4),
            Text(Lang.sel(c, 'Taken', 'Zauzeto'), style: GoogleFonts.inter(fontSize: 10, color: Colors.black45)),
            const SizedBox(width: 10),
            const Icon(Icons.location_on, size: 10, color: Colors.blue),
            const SizedBox(width: 3),
            Text('GPS', style: GoogleFonts.inter(fontSize: 10, color: Colors.black45)),
          ]),
        ],
        if (_spotsLoaded && _spotsData.isEmpty) ...[
          const SizedBox(height: 8),
          Text(Lang.sel(c, 'No spots yet. Generate a grid or use 5-sector above.', 'Nema spotova. Generirajte mrežu ili koristite 5-sektora.'),
            style: GoogleFonts.inter(fontSize: 12, color: Colors.black45)),
        ],
      ],
    );
  }
}
