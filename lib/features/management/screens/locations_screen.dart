import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
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
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Cijena (centi, npr. 500 = 5,00 €)',
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
        'price_cents': int.tryParse(valetPrice) ?? 500,
        if (lotZone.trim().isNotEmpty) 'lot_zone': lotZone.trim(),
      },
      if (evOn) 'ev_charging': {'enabled': true, 'price_cents': int.tryParse(evPrice) ?? 2000},
      if (washOn) 'car_wash': {'enabled': true, 'options': [
        {'id': 'basic', 'label': 'Basic', 'price_cents': int.tryParse(washBasic) ?? 1500},
        {'id': 'premium', 'label': 'Premium', 'price_cents': int.tryParse(washPremium) ?? 3000},
      ]},
      if (fuelOn) 'fuel': {'enabled': true, 'options': [
        {'id': 'diesel', 'label': 'Diesel', 'price_cents': int.tryParse(fuelDiesel) ?? 6000},
        {'id': 'benzin', 'label': 'Benzin', 'price_cents': int.tryParse(fuelBenzin) ?? 5500},
      ]},
      if (shuttleOn) 'shuttle': {'enabled': true, 'price_cents': int.tryParse(shuttlePrice) ?? 200},
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
    final String displayId = (loc['display_id'] ?? '').toString();
    final String name = (loc['name'] ?? '')
        .toString()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9\\s-]'), '')
        .replaceAll(RegExp(r'\\s+'), '-');
    final String slug = name.isNotEmpty ? name : displayId.toLowerCase();
    return 'https://payparq.com/locations/$slug';
  }

  Future<void> _toggleHub(Map<String, dynamic> loc, bool enabled) async {
    final messenger = ScaffoldMessenger.of(context);
    final Map<String, dynamic> meta =
        (loc['verification_metadata'] ?? {}) as Map<String, dynamic>;
    final bool previous = meta['hub_enabled'] == true;
    try {
      final slug = await ref
          .read(locationsControllerProvider)
          .updateHubDesignation(loc, enabled);
      if (enabled) {
        final url = 'https://payparq.com/locations/$slug';
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
        (loc['verification_metadata'] ?? {}) as Map<String, dynamic>;
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
            (loc['verification_metadata'] ?? {}) as Map<String, dynamic>;
        final bool isHub = meta['hub_enabled'] == true;
        final bool isAgenticSettlement =
            _resolveSettlementModel(meta) == 'agentic';
        bool valetEnabled = effectiveLoc['valet_enabled'] == true;
        bool shuttleEnabled = effectiveLoc['shuttle_enabled'] == true;
        final Map<String, dynamic> addonsRaw =
            (effectiveLoc['addons_config'] ?? {}) as Map<String, dynamic>;
        final Map<String, dynamic> addonsConfig = Map<String, dynamic>.from(addonsRaw);
        // Price controllers for add-ons
        final valetPriceCtrl = TextEditingController(
            text: ((addonsConfig['valet'] as Map?)?['price_cents'] as num?)?.toString() ?? '500');
        final evPriceCtrl = TextEditingController(
            text: ((addonsConfig['ev_charging'] as Map?)?['price_cents'] as num?)?.toString() ?? '2000');
        final washBasicCtrl = TextEditingController(
            text: (((addonsConfig['car_wash'] as Map?)?['options'] as List?)?.firstWhere(
                (o) => (o as Map)['id'] == 'basic', orElse: () => <String, dynamic>{})
                as Map?)?['price_cents']?.toString() ?? '1500');
        final washPremiumCtrl = TextEditingController(
            text: (((addonsConfig['car_wash'] as Map?)?['options'] as List?)?.firstWhere(
                (o) => (o as Map)['id'] == 'premium', orElse: () => <String, dynamic>{})
                as Map?)?['price_cents']?.toString() ?? '3000');
        final fuelDieselCtrl = TextEditingController(
            text: (((addonsConfig['fuel'] as Map?)?['options'] as List?)?.firstWhere(
                (o) => (o as Map)['id'] == 'diesel', orElse: () => <String, dynamic>{})
                as Map?)?['price_cents']?.toString() ?? '6000');
        final fuelBenzinCtrl = TextEditingController(
            text: (((addonsConfig['fuel'] as Map?)?['options'] as List?)?.firstWhere(
                (o) => (o as Map)['id'] == 'benzin', orElse: () => <String, dynamic>{})
                as Map?)?['price_cents']?.toString() ?? '5500');
        final shuttlePriceCtrl = TextEditingController(
            text: ((addonsConfig['shuttle'] as Map?)?['price_cents'] as num?)?.toString() ?? '200');
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
        double pendingLatitude = (effectiveLoc['latitude'] is num)
            ? (effectiveLoc['latitude'] as num).toDouble()
            : double.tryParse('${effectiveLoc['latitude'] ?? 0.0}') ?? 0.0;
        double pendingLongitude = (effectiveLoc['longitude'] is num)
            ? (effectiveLoc['longitude'] as num).toDouble()
            : double.tryParse('${effectiveLoc['longitude'] ?? 0.0}') ?? 0.0;
        final bool canEdit = isSuperAdmin || isAdmin;

        return AlertDialog(
          title: Text(
              Lang.sel(ref.watch(localeIsCroatianProvider), 'Location Details',
                  'Detalji lokacije'),
              style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          content: SizedBox(
            width: 420,
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
                    ref.invalidate(locationsStreamProvider);
                    if (dialogContext.mounted) {
                      messenger.showSnackBar(
                        SnackBar(
                            content: Text(Lang.sel(
                                ref.watch(localeIsCroatianProvider),
                                'Location updated',
                                'Lokacija ažurirana'))),
                      );
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

                return ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(dialogContext).size.height * 0.78,
                  ),
                  child: SingleChildScrollView(
                    child: Column(
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
                              Text(
                                '$currentName • $displayId',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 12),
                              if (!canEdit)
                                Row(
                                  children: [
                                    Icon(Icons.edit_location_alt_outlined,
                                        size: 18, color: Colors.grey[600]),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        Lang.sel(
                                            ref.watch(localeIsCroatianProvider),
                                            'Location Name: $currentName',
                                            'Naziv lokacije: $currentName'),
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: Colors.black,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              else
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      Lang.sel(
                                          ref.watch(localeIsCroatianProvider),
                                          'Location Name',
                                          'Naziv lokacije'),
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: Colors.black,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextField(
                                      controller: nameCtrl,
                                      decoration: InputDecoration(
                                        hintText: Lang.sel(
                                            ref.watch(localeIsCroatianProvider),
                                            'e.g. Parking Trogir',
                                            'npr. Parking Trogir'),
                                        filled: true,
                                        fillColor: AppTheme.surface,
                                        border: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          borderSide: BorderSide.none,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      Lang.sel(
                                          ref.watch(localeIsCroatianProvider),
                                          'Address',
                                          'Adresa'),
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: Colors.black,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextField(
                                      controller: addressCtrl,
                                      decoration: InputDecoration(
                                        hintText: Lang.sel(
                                            ref.watch(localeIsCroatianProvider),
                                            'e.g. City center',
                                            'npr. Centar grada'),
                                        filled: true,
                                        fillColor: AppTheme.surface,
                                        border: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          borderSide: BorderSide.none,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Icon(Icons.local_parking,
                                      size: 18, color: Colors.grey[600]),
                                  const SizedBox(width: 8),
                                  if (!canEdit)
                                    Text(
                                      Lang.sel(
                                          ref.watch(localeIsCroatianProvider),
                                          'Capacity: $currentCapacity',
                                          'Kapacitet: $currentCapacity'),
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: Colors.black,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    )
                                  else ...[
                                    Text(
                                      Lang.sel(
                                          ref.watch(localeIsCroatianProvider),
                                          'Capacity',
                                          'Kapacitet'),
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: Colors.black,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    SizedBox(
                                      width: 120,
                                      child: TextField(
                                        controller: capacityCtrl,
                                        keyboardType: TextInputType.number,
                                        decoration: InputDecoration(
                                          hintText: 'e.g. 150',
                                          filled: true,
                                          fillColor: AppTheme.surface,
                                          border: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            borderSide: BorderSide.none,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Icon(Icons.location_on_outlined,
                                      size: 18, color: Colors.grey[600]),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      Lang.sel(
                                          ref.watch(localeIsCroatianProvider),
                                          'Coordinates: ${pendingLatitude.toStringAsFixed(6)}, ${pendingLongitude.toStringAsFixed(6)}',
                                          'Koordinate: ${pendingLatitude.toStringAsFixed(6)}, ${pendingLongitude.toStringAsFixed(6)}'),
                                      maxLines: 1,
                                      softWrap: false,
                                      overflow: TextOverflow.ellipsis,
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: Colors.black,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              Builder(builder: (_) {
                                final pickupMap = addonsConfig['pickup_point'] as Map?;
                                final pLat = (pickupMap?['lat'] as num?)?.toDouble() ?? 0.0;
                                final pLng = (pickupMap?['lng'] as num?)?.toDouble() ?? 0.0;
                                final pLabel = (pickupMap?['label'] as String?) ?? '';
                                if (pLat == 0.0 && pLng == 0.0) return const SizedBox.shrink();
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 12),
                                    Row(children: [
                                      Icon(Icons.directions_car, size: 18, color: Colors.grey[600]),
                                      const SizedBox(width: 8),
                                      Text(
                                        Lang.sel(ref.watch(localeIsCroatianProvider), 'Pick-Up / Drop Off Zone', 'Zona preuzimanja / predaje'),
                                        style: GoogleFonts.inter(fontSize: 14, color: Colors.black, fontWeight: FontWeight.w500),
                                      ),
                                    ]),
                                    if (pLabel.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Padding(
                                        padding: const EdgeInsets.only(left: 26),
                                        child: Text(pLabel, style: GoogleFonts.inter(fontSize: 12, color: Colors.black54)),
                                      ),
                                    ],
                                    const SizedBox(height: 8),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: SizedBox(
                                        height: 200,
                                        child: FlutterMap(
                                          options: MapOptions(
                                            initialCenter: LatLng(pLat, pLng),
                                            initialZoom: 16,
                                            interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                                          ),
                                          children: [
                                            TileLayer(
                                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                              userAgentPackageName: 'com.payparq.ai',
                                            ),
                                            MarkerLayer(markers: [
                                              Marker(
                                                point: LatLng(pLat, pLng),
                                                width: 40, height: 40,
                                                child: const Icon(Icons.location_on, color: Colors.red, size: 40),
                                              ),
                                            ]),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              }),
                              const SizedBox(height: 16),
                              Text(
                                Lang.sel(
                                    ref.watch(localeIsCroatianProvider),
                                    'Location Photos (${editablePhotoUrls.length + newlySelectedPhotos.length})',
                                    'Fotografije lokacije (${editablePhotoUrls.length + newlySelectedPhotos.length})'),
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: Colors.black,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Builder(builder: (_) {
                                const int maxPreviewPhotos = 24;
                                final existingHidden =
                                    editablePhotoUrls.length > maxPreviewPhotos
                                        ? editablePhotoUrls.length -
                                            maxPreviewPhotos
                                        : 0;
                                final selectedHidden =
                                    newlySelectedPhotos.length >
                                            maxPreviewPhotos
                                        ? newlySelectedPhotos.length -
                                            maxPreviewPhotos
                                        : 0;
                                if (existingHidden == 0 &&
                                    selectedHidden == 0) {
                                  return const SizedBox.shrink();
                                }
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: Text(
                                    Lang.sel(
                                      ref.watch(localeIsCroatianProvider),
                                      'Showing first 24 previews for smooth performance. Hidden: ${existingHidden + selectedHidden}',
                                      'Prikazujemo prvih 24 pregleda radi glatkog rada. Skriveno: ${existingHidden + selectedHidden}',
                                    ),
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: AppTheme.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                );
                              }),
                              if (editablePhotoUrls.isNotEmpty)
                                GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate:
                                      const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 3,
                                    crossAxisSpacing: 8,
                                    mainAxisSpacing: 8,
                                  ),
                                  itemCount: editablePhotoUrls.length > 24
                                      ? 24
                                      : editablePhotoUrls.length,
                                  itemBuilder: (context, index) {
                                    final photoUrl = editablePhotoUrls[index];
                                    return InkWell(
                                      onTap: () {
                                        showDialog(
                                          context: context,
                                          builder: (_) => Dialog.fullscreen(
                                            backgroundColor: Colors.black,
                                            child: Stack(
                                              children: [
                                                Center(
                                                  child:
                                                      Image.network(photoUrl),
                                                ),
                                                Positioned(
                                                  top: 40,
                                                  right: 20,
                                                  child: IconButton(
                                                    onPressed: () =>
                                                        Navigator.pop(context),
                                                    icon: const Icon(
                                                      Icons.close,
                                                      color: Colors.white,
                                                      size: 30,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        );
                                      },
                                      child: Stack(
                                        children: [
                                          ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(8),
                                            child: Image.network(
                                              photoUrl,
                                              fit: BoxFit.cover,
                                              width: double.infinity,
                                              height: double.infinity,
                                              errorBuilder:
                                                  (context, error, stackTrace) {
                                                return Container(
                                                  color: AppTheme.surface,
                                                  child: const Icon(
                                                      Icons.broken_image),
                                                );
                                              },
                                            ),
                                          ),
                                          if (canEdit)
                                            Positioned(
                                              top: 4,
                                              right: 4,
                                              child: InkWell(
                                                onTap: () {
                                                  setState(() {
                                                    editablePhotoUrls
                                                        .removeAt(index);
                                                  });
                                                },
                                                child: Container(
                                                  padding:
                                                      const EdgeInsets.all(4),
                                                  decoration:
                                                      const BoxDecoration(
                                                    color: Colors.black54,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: const Icon(
                                                    Icons.close,
                                                    size: 14,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              if (newlySelectedPhotos.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate:
                                      const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 3,
                                    crossAxisSpacing: 8,
                                    mainAxisSpacing: 8,
                                  ),
                                  itemCount: newlySelectedPhotos.length > 24
                                      ? 24
                                      : newlySelectedPhotos.length,
                                  itemBuilder: (context, index) {
                                    final localFile =
                                        newlySelectedPhotos[index];
                                    return FutureBuilder<ImageProvider>(
                                      future: previewProvider(localFile),
                                      builder: (context, snapshot) {
                                        if (!snapshot.hasData) {
                                          return Container(
                                            decoration: BoxDecoration(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              color: AppTheme.surface,
                                            ),
                                            child: const Center(
                                              child: CircularProgressIndicator(
                                                  strokeWidth: 2),
                                            ),
                                          );
                                        }
                                        return Stack(
                                          children: [
                                            Container(
                                              decoration: BoxDecoration(
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                                image: DecorationImage(
                                                  image: snapshot.data!,
                                                  fit: BoxFit.cover,
                                                ),
                                              ),
                                            ),
                                            Positioned(
                                              top: 4,
                                              right: 4,
                                              child: InkWell(
                                                onTap: () {
                                                  setState(() {
                                                    localPhotoPreviewBytes
                                                        .remove(localFile.path);
                                                    newlySelectedPhotos
                                                        .removeAt(index);
                                                  });
                                                },
                                                child: Container(
                                                  padding:
                                                      const EdgeInsets.all(4),
                                                  decoration:
                                                      const BoxDecoration(
                                                    color: Colors.black54,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: const Icon(
                                                    Icons.close,
                                                    size: 14,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        );
                                      },
                                    );
                                  },
                                ),
                              ],
                              if (canEdit) ...[
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    OutlinedButton.icon(
                                      onPressed: () => pickLocationPhotos(
                                          ImageSource.camera),
                                      icon: const Icon(Icons.camera_alt,
                                          color: Colors.black, size: 18),
                                      label: Text(
                                        Lang.sel(
                                            ref.watch(localeIsCroatianProvider),
                                            'Take photo',
                                            'Snimi fotografiju'),
                                        style: GoogleFonts.inter(
                                            color: Colors.black),
                                      ),
                                      style: OutlinedButton.styleFrom(
                                        side:
                                            BorderSide(color: AppTheme.border),
                                      ),
                                    ),
                                    OutlinedButton.icon(
                                      onPressed: () => pickLocationPhotos(
                                          ImageSource.gallery),
                                      icon: const Icon(Icons.photo_library,
                                          color: Colors.black, size: 18),
                                      label: Text(
                                        Lang.sel(
                                            ref.watch(localeIsCroatianProvider),
                                            'Choose gallery',
                                            'Odaberi iz galerije'),
                                        style: GoogleFonts.inter(
                                            color: Colors.black),
                                      ),
                                      style: OutlinedButton.styleFrom(
                                        side:
                                            BorderSide(color: AppTheme.border),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              if (canEdit) ...[
                                const SizedBox(height: 12),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: OutlinedButton.icon(
                                    onPressed: () {
                                      setState(() {
                                        showLocationPicker =
                                            !showLocationPicker;
                                      });
                                    },
                                    icon: Icon(
                                      showLocationPicker
                                          ? Icons.expand_less
                                          : Icons.map_outlined,
                                      color: Colors.black,
                                    ),
                                    label: Text(
                                      showLocationPicker
                                          ? Lang.sel(
                                              ref.watch(
                                                  localeIsCroatianProvider),
                                              'Hide map',
                                              'Sakrij mapu')
                                          : Lang.sel(
                                              ref.watch(
                                                  localeIsCroatianProvider),
                                              'Change location',
                                              'Promijeni lokaciju'),
                                      style: GoogleFonts.inter(
                                        color: Colors.black,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      side: BorderSide(color: AppTheme.border),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 14, vertical: 10),
                                    ),
                                  ),
                                ),
                                if (showLocationPicker) ...[
                                  const SizedBox(height: 12),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                      border:
                                          Border.all(color: AppTheme.border),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          Lang.sel(
                                              ref.watch(
                                                  localeIsCroatianProvider),
                                              'Map image: tap to move pin and save',
                                              'Slika mape: klikni za promjenu pina i spremi'),
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            color: Colors.black87,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        LotLocationPicker(
                                          initialLocation: LatLng(
                                              pendingLatitude,
                                              pendingLongitude),
                                          onLocationSelected:
                                              (latLng, address) {
                                            setState(() {
                                              pendingLatitude = latLng.latitude;
                                              pendingLongitude =
                                                  latLng.longitude;
                                              if (address.trim().isNotEmpty) {
                                                addressCtrl.text =
                                                    address.trim();
                                              }
                                            });
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                              const SizedBox(height: 12),
                              if (isSuperAdmin)
                                Row(
                                  children: [
                                    Text(
                                      Lang.sel(
                                          ref.watch(localeIsCroatianProvider),
                                          'Hub Enabled',
                                          'Hub omogućen'),
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: Colors.black,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Switch(
                                      value: isHub,
                                      activeThumbColor: Colors.black,
                                      onChanged: (v) async {
                                        setState(() {
                                          final Map<String, dynamic> meta =
                                              (loc['verification_metadata'] ??
                                                  {}) as Map<String, dynamic>;
                                          meta['hub_enabled'] = v;
                                        });
                                        await _toggleHub(loc, v);
                                        if (v == true) {
                                          final String url =
                                              _buildHubLocationUrl(loc);
                                          try {
                                            await launchUrl(Uri.parse(url));
                                          } catch (_) {}
                                        }
                                        if (!dialogContext.mounted) return;
                                        Navigator.pop(dialogContext);
                                        _showLocationDetail(
                                            loc, isSuperAdmin, isAdmin);
                                      },
                                    ),
                                  ],
                                ),
                              if (isSuperAdmin) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Text(
                                      Lang.sel(
                                          ref.watch(localeIsCroatianProvider),
                                          'Settlement Model',
                                          'Model poravnanja'),
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        color: Colors.black,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'Company',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: Colors.black54,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Switch(
                                      value: isAgenticSettlement,
                                      activeThumbColor: Colors.black,
                                      onChanged: (v) async {
                                        setState(() {
                                          final Map<String, dynamic> meta =
                                              (loc['verification_metadata'] ??
                                                  {}) as Map<String, dynamic>;
                                          meta['settlement_model'] =
                                              v ? 'agentic' : 'company';
                                        });
                                        await _toggleSettlementModel(
                                            loc, v ? 'agentic' : 'company');
                                        if (!dialogContext.mounted) return;
                                        Navigator.pop(dialogContext);
                                        _showLocationDetail(
                                            loc, isSuperAdmin, isAdmin);
                                      },
                                    ),
                                    Text(
                                      'Agentic',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: Colors.black54,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              if (isSuperAdmin && isHub) ...[
                                const SizedBox(height: 8),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.link,
                                        size: 18, color: Colors.black),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: SelectableText(
                                        _buildHubLocationUrl(loc),
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          color: Colors.blue[800],
                                          decoration: TextDecoration.underline,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    ElevatedButton(
                                      onPressed: () async {
                                        final String url =
                                            _buildHubLocationUrl(loc);
                                        await launchUrl(Uri.parse(url));
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.black,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 16, vertical: 10),
                                      ),
                                      child: Text(Lang.sel(
                                          ref.watch(localeIsCroatianProvider),
                                          'Open Hub Page',
                                          'Otvori Hub stranicu')),
                                    )
                                  ],
                                ),
                              ],
                              if (canEdit) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Text(
                                      Lang.sel(ref.watch(localeIsCroatianProvider), 'Valet parking', 'Valet parking'),
                                      style: GoogleFonts.inter(fontSize: 14, color: Colors.black, fontWeight: FontWeight.w500),
                                    ),
                                    const SizedBox(width: 12),
                                    Switch(
                                      value: valetEnabled,
                                      activeThumbColor: Colors.black,
                                      onChanged: (v) async {
                                        setState(() => valetEnabled = v);
                                        await ref.read(locationsControllerProvider).updateServiceFlags(
                                          idStr, valetEnabled: v, shuttleEnabled: shuttleEnabled,
                                        );
                                      },
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(
                                      Lang.sel(ref.watch(localeIsCroatianProvider), 'Shuttle transport', 'Shuttle prijevoz'),
                                      style: GoogleFonts.inter(fontSize: 14, color: Colors.black, fontWeight: FontWeight.w500),
                                    ),
                                    const SizedBox(width: 12),
                                    Switch(
                                      value: shuttleEnabled,
                                      activeThumbColor: Colors.black,
                                      onChanged: (v) async {
                                        setState(() => shuttleEnabled = v);
                                        await ref.read(locationsControllerProvider).updateServiceFlags(
                                          idStr, valetEnabled: valetEnabled, shuttleEnabled: v,
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              ],
                              if (canEdit) ...[
                                const SizedBox(height: 12),
                                Text(
                                  Lang.sel(ref.watch(localeIsCroatianProvider), 'Add-on Services & Prices', 'Dodaci & cijene'),
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.black),
                                ),
                                const SizedBox(height: 8),
                                _buildAddonRow(
                                  label: Lang.sel(ref.watch(localeIsCroatianProvider), 'Valet parking', 'Valet parking'),
                                  enabled: addonValetOn,
                                  priceCtrl: valetPriceCtrl,
                                  onToggle: (v) => setState(() => addonValetOn = v),
                                ),
                                const SizedBox(height: 6),
                                _buildAddonRow(
                                  label: Lang.sel(ref.watch(localeIsCroatianProvider), 'EV Charging', 'EV punjenje'),
                                  enabled: addonEvOn,
                                  priceCtrl: evPriceCtrl,
                                  onToggle: (v) => setState(() => addonEvOn = v),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  Lang.sel(ref.watch(localeIsCroatianProvider), 'Car Wash', 'Pranje auta'),
                                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
                                ),
                                Row(
                                  children: [
                                    Switch(value: addonWashOn, activeThumbColor: Colors.black, onChanged: (v) => setState(() => addonWashOn = v)),
                                    Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Enabled', 'Omogućeno'), style: GoogleFonts.inter(fontSize: 12)),
                                  ],
                                ),
                                if (addonWashOn) ...[
                                  Row(children: [
                                    Expanded(child: TextField(controller: washBasicCtrl, keyboardType: TextInputType.number,
                                      decoration: InputDecoration(labelText: 'Basic (cents)', filled: true, fillColor: AppTheme.surface, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                                    const SizedBox(width: 8),
                                    Expanded(child: TextField(controller: washPremiumCtrl, keyboardType: TextInputType.number,
                                      decoration: InputDecoration(labelText: 'Premium (cents)', filled: true, fillColor: AppTheme.surface, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                                  ]),
                                ],
                                const SizedBox(height: 6),
                                Text(
                                  Lang.sel(ref.watch(localeIsCroatianProvider), 'Fuel', 'Gorivo'),
                                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
                                ),
                                Row(
                                  children: [
                                    Switch(value: addonFuelOn, activeThumbColor: Colors.black, onChanged: (v) => setState(() => addonFuelOn = v)),
                                    Text(Lang.sel(ref.watch(localeIsCroatianProvider), 'Enabled', 'Omogućeno'), style: GoogleFonts.inter(fontSize: 12)),
                                  ],
                                ),
                                if (addonFuelOn) ...[
                                  Row(children: [
                                    Expanded(child: TextField(controller: fuelDieselCtrl, keyboardType: TextInputType.number,
                                      decoration: InputDecoration(labelText: 'Diesel (cents)', filled: true, fillColor: AppTheme.surface, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                                    const SizedBox(width: 8),
                                    Expanded(child: TextField(controller: fuelBenzinCtrl, keyboardType: TextInputType.number,
                                      decoration: InputDecoration(labelText: 'Benzin (cents)', filled: true, fillColor: AppTheme.surface, border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none)))),
                                  ]),
                                ],
                                const SizedBox(height: 6),
                                _buildAddonRow(
                                  label: Lang.sel(ref.watch(localeIsCroatianProvider), 'Shuttle (paid)', 'Shuttle (plaćeni)'),
                                  enabled: addonShuttleOn,
                                  priceCtrl: shuttlePriceCtrl,
                                  onToggle: (v) => setState(() => addonShuttleOn = v),
                                ),
                                if (addonValetOn || addonShuttleOn) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    Lang.sel(ref.watch(localeIsCroatianProvider), 'Pick-Up / Drop Off Zone', 'Zona preuzimanja / predaje'),
                                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87),
                                  ),
                                  const SizedBox(height: 6),
                                  LotLocationPicker(
                                    initialLocation: LatLng(
                                      pickupLat != 0.0 ? pickupLat : pendingLatitude,
                                      pickupLng != 0.0 ? pickupLng : pendingLongitude,
                                    ),
                                    onLocationSelected: (latLng, address) {
                                      setState(() {
                                        pickupLat = latLng.latitude;
                                        pickupLng = latLng.longitude;
                                        if (address.trim().isNotEmpty) pickupLabel = address.trim();
                                      });
                                    },
                                  ),
                                  const SizedBox(height: 6),
                                  TextField(
                                    controller: phoneSmsCtrl,
                                    keyboardType: TextInputType.phone,
                                    decoration: InputDecoration(
                                      labelText: 'Telefon (SMS/WhatsApp)',
                                      filled: true,
                                      fillColor: AppTheme.surface,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                                    ),
                                  ),
                                ],
                                if (addonValetOn) ...[
                                  const SizedBox(height: 6),
                                  TextField(
                                    controller: lotZoneCtrl,
                                    decoration: InputDecoration(
                                      labelText: Lang.sel(ref.watch(localeIsCroatianProvider), 'Lot zone (valet)', 'Lot zona (valet)'),
                                      filled: true,
                                      fillColor: AppTheme.surface,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                                    ),
                                  ),
                                ],
                              ],
                              if (canEdit) ...[
                                const SizedBox(height: 16),
                                if (saving && uploadStatusText != null) ...[
                                  Text(
                                    uploadStatusText!,
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: Colors.black54,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                ],
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: saving ? null : saveChanges,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.black,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 24, vertical: 12),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8)),
                                    ),
                                    child: saving
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                                color: Colors.white,
                                                strokeWidth: 2),
                                          )
                                        : Text(Lang.sel(
                                            ref.watch(localeIsCroatianProvider),
                                            'Save Changes',
                                            'Spremi promjene')),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
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
