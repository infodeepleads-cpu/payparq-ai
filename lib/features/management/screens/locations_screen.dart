import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../theme.dart';
import '../../../widgets/admin_data_card.dart';
import '../repositories/parking_repository.dart';
import '../../../widgets/lot_location_picker.dart';
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
        final role = profile?['role'];
        final isSuperAdmin = role == 'super_admin';
        final isAdmin = role == 'admin';

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
                                      ? Lang.sel(
                                          isCroatian,
                                          'Active Parking Hub',
                                          'Aktivni parking hub')
                                      : Lang.sel(
                                          isCroatian,
                                          'Active Parking Lot',
                                          'Aktivno parkiralište'),
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
                                  child: _buildVerificationBadge(loc, isAdmin),
                                ),
                                const SizedBox(width: 12),
                                _buildStatusBadge('ACTIVE'),
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

  Widget _buildVerificationBadge(Map<String, dynamic> loc, bool isAdmin) {
    final isHr = ref.read(localeIsCroatianProvider);
    final rawStatus = loc['verification_status'] ?? 'unverified';
    final status =
        rawStatus == 'video_required' ? 'contact_required' : rawStatus;

    Color badgeColor;
    String label;
    bool showAction = false;
    IconData icon;

    switch (status) {
      case 'verified':
        badgeColor = Colors.green[400]!;
        label = Lang.sel(isHr, 'VERIFIED', 'VERIFICIRANO');
        icon = Icons.verified;
        break;
      case 'pending':
        badgeColor = const Color(0xFF635BFF);
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
        showAction = isAdmin;
        break;
      case 'unverified':
      default:
        badgeColor = AppTheme.sidebarBackground;
        label = Lang.sel(isHr, 'SETUP REQUIRED', 'KONFIGURIRAJ');
        icon = Icons.info_outline;
        showAction = isAdmin;
    }

    final bool fixedWidthRequired = status == 'contact_required' ||
        status == 'call_scheduled' ||
        status == 'unverified';

    return InkWell(
      onTap: showAction
          ? () {
              if (status == 'contact_required') {
                _showCallDialog(loc);
              } else if (status == 'unverified' ||
                  status == 'pending' ||
                  status == 'rejected') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        VerificationUploadScreen(location: loc),
                  ),
                );
              }
            }
          : null,
      child: Container(
        constraints: BoxConstraints(
          minWidth: status == 'verified' ? 0 : (fixedWidthRequired ? 160 : 140),
          maxWidth: 160,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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

  Widget _buildStatusBadge(String status) {
    final isActive = status.toLowerCase() == 'active';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isActive ? Colors.green[400] : Colors.red[400],
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            status.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
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
        final url = 'https://payparqai.vercel.app/locations/$slug';
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
        final name = (loc['name'] ?? 'Unnamed Lot').toString();
        final displayId = (loc['display_id'] ?? 'N/A').toString();
        final String idStr = loc['id'].toString();
        final Map<String, dynamic>? override = _locOverrides[idStr];
        final effectiveLoc = override != null ? {...loc, ...override} : loc;
        final capacity = (effectiveLoc['capacity'] ?? 0) is int
            ? effectiveLoc['capacity'] as int
            : int.tryParse((effectiveLoc['capacity'] ?? '0').toString()) ?? 0;
        final Map<String, dynamic> meta =
            (loc['verification_metadata'] ?? {}) as Map<String, dynamic>;
        final bool isHub = meta['hub_enabled'] == true;
        final double latitude = (loc['latitude'] is num)
            ? (loc['latitude'] as num).toDouble()
            : double.tryParse('${loc['latitude'] ?? 0.0}') ?? 0.0;
        final double longitude = (loc['longitude'] is num)
            ? (loc['longitude'] as num).toDouble()
            : double.tryParse('${loc['longitude'] ?? 0.0}') ?? 0.0;
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
                final capacityCtrl = TextEditingController(text: '$capacity');
                bool saving = false;
                final messenger = ScaffoldMessenger.of(dialogContext);
                final navigator = Navigator.of(dialogContext);
                Future<void> saveChanges() async {
                  if (!canEdit) return;
                  setState(() => saving = true);
                  try {
                    final newCapacity =
                        int.tryParse(capacityCtrl.text.trim()) ?? capacity;
                    // Optimistically update override to prevent old value flicker
                    if (mounted) {
                      this.setState(() {
                        _locOverrides[loc['id'].toString()] = {
                          'capacity': newCapacity,
                          'total_spots': newCapacity,
                        };
                      });
                    }
                    await ref
                        .read(locationsControllerProvider)
                        .updateCapacity(loc['id'].toString(), newCapacity);
                    setState(() {
                      loc['capacity'] = newCapacity;
                      loc['total_spots'] = newCapacity;
                    });
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
                      messenger.showSnackBar(
                        SnackBar(
                            content: Text(Lang.sel(
                                ref.watch(localeIsCroatianProvider),
                                'Error: ${ErrorMapper.message(e)}',
                                'Greška: ${ErrorMapper.message(e)}'))),
                      );
                    }
                  } finally {
                    if (dialogContext.mounted) setState(() => saving = false);
                  }
                }

                return Column(
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
                            '$name • $displayId',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
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
                                      'Capacity: $capacity',
                                      'Kapacitet: $capacity'),
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    color: Colors.black,
                                    fontWeight: FontWeight.w500,
                                  ),
                                )
                              else ...[
                                Text(
                                  Lang.sel(ref.watch(localeIsCroatianProvider),
                                      'Capacity', 'Kapacitet'),
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
                                        borderRadius: BorderRadius.circular(8),
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
                                      'Coordinates: $latitude, $longitude',
                                      'Koordinate: $latitude, $longitude'),
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
                          const SizedBox(height: 12),
                          if (isSuperAdmin)
                            Row(
                              children: [
                                Text(
                                  Lang.sel(ref.watch(localeIsCroatianProvider),
                                      'Hub Enabled', 'Hub omogućen'),
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
                                          (loc['verification_metadata'] ?? {})
                                              as Map<String, dynamic>;
                                      meta['hub_enabled'] = v;
                                    });
                                    await _toggleHub(loc, v);
                                    if (v == true) {
                                      final String displayId =
                                          (loc['display_id'] ?? '').toString();
                                      final String name = (loc['name'] ?? '')
                                          .toString()
                                          .toLowerCase()
                                          .replaceAll(
                                              RegExp(r'[^a-z0-9\\s-]'), '')
                                          .replaceAll(RegExp(r'\\s+'), '-');
                                      final String slug = name.isNotEmpty
                                          ? name
                                          : displayId.toLowerCase();
                                      final String url =
                                          'https://payparqai.vercel.app/locations/$slug';
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
                                    () {
                                      final String displayId =
                                          (loc['display_id'] ?? '').toString();
                                      final String name = (loc['name'] ?? '')
                                          .toString()
                                          .toLowerCase()
                                          .replaceAll(
                                              RegExp(r'[^a-z0-9\\s-]'), '')
                                          .replaceAll(RegExp(r'\\s+'), '-');
                                      final String slug = name.isNotEmpty
                                          ? name
                                          : displayId.toLowerCase();
                                      return 'https://payparqai.vercel.app/locations/$slug';
                                    }(),
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
                                    final String displayId =
                                        (loc['display_id'] ?? '').toString();
                                    final String name = (loc['name'] ?? '')
                                        .toString()
                                        .toLowerCase()
                                        .replaceAll(
                                            RegExp(r'[^a-z0-9\\s-]'), '')
                                        .replaceAll(RegExp(r'\\s+'), '-');
                                    final String slug = name.isNotEmpty
                                        ? name
                                        : displayId.toLowerCase();
                                    final String url =
                                        'https://payparqai.vercel.app/locations/$slug';
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
                            const SizedBox(height: 16),
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
                                      borderRadius: BorderRadius.circular(8)),
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

  void _showAddLocationDialog(
      BuildContext context, String? locationId, String? ownerId) {
    final nameCtrl = TextEditingController();
    final capacityCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;
    LatLng? selectedLatLng;
    String selectedAddress = '';

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
                                ownerId: ownerId,
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
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content: Text(Lang.sel(
                                      ref.watch(localeIsCroatianProvider),
                                      'Error: ${ErrorMapper.message(e)}',
                                      'Greška: ${ErrorMapper.message(e)}'))),
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
