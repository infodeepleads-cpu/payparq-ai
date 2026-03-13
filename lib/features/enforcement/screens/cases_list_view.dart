import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../theme.dart';
import '../../../widgets/admin_data_card.dart';
import '../../../widgets/skeleton_loader.dart';
import '../widgets/cases_header.dart';
import '../providers/enforcement_controller.dart';
import '../../management/repositories/parking_repository.dart';
import '../../../logic/providers/auth_providers.dart';
import '../../../logic/providers/dashboard_providers.dart';
import '../../../logic/providers/locale_provider.dart';
import '../../../logic/utils/location_resolver.dart';
import '../../../utils/list_search_filter.dart';
import '../../../utils/date_sort_helpers.dart';
import '../../../utils/async_action_handler.dart';
import '../../../widgets/confirm_delete_dialog.dart';
import '../../../services/error_mapper.dart';

class CasesListView extends ConsumerStatefulWidget {
  const CasesListView({super.key});

  @override
  ConsumerState<CasesListView> createState() => _CasesListViewState();
}

class _CasesListViewState extends ConsumerState<CasesListView> {
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _searchQuery = '';
  String _selectedFilterKey = 'all';
  Timer? _searchDebounce;
  final Set<String> _optimisticDeletedIds = {};
  int _visibleCount = 20;

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

  Future<void> _deleteViolation(Map<String, dynamic> violation) async {
    final profile = ref.read(userProfileProvider).value;
    if (profile == null || (profile['role'] ?? '') != 'super_admin') {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Only super admin can delete cases'),
            backgroundColor: Colors.black,
          ),
        );
      }
      return;
    }
    final id = violation['id'];
    if (id == null) return;
    final isHr = ref.read(localeIsCroatianProvider);
    final confirm = await showConfirmDeleteDialog(
      context: context,
      title: Lang.sel(isHr, 'Delete Case', 'Obriši predmet'),
      message: Lang.sel(
        isHr,
        'Are you sure you want to permanently delete this case?',
        'Jeste li sigurni da želite trajno obrisati ovaj predmet?',
      ),
      confirmLabel: Lang.sel(isHr, 'Delete', 'Obriši'),
      cancelLabel: Lang.sel(isHr, 'Cancel', 'Odustani'),
    );
    if (confirm != true) return;
    if (!mounted) return;
    setState(() {
      _optimisticDeletedIds.add(id.toString());
    });
    final controller = ref.read(enforcementControllerProvider);
    await AsyncActionHandler.run<void>(
      context: context,
      action: () => controller.deleteViolation(id.toString()),
      successMessage: Lang.sel(isHr, 'Case deleted', 'Predmet obrisan'),
      successColor: Colors.black,
      errorBuilder: ErrorMapper.message,
      onError: (_) {
        if (!mounted) return;
        setState(() {
          _optimisticDeletedIds.remove(id.toString());
        });
      },
    );
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _handleQuickAction({required bool isWarning}) async {
    final isHr = ref.read(localeIsCroatianProvider);
    final profile = ref.read(userProfileProvider).value;
    if (profile == null) return;

    final resolution = await LocationResolver.resolve(ref);
    final locationDisplayId = resolution.effectiveDisplayId;

    if (locationDisplayId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Error: No Location ID selected or assigned.')),
      );
      return;
    }

    final locationUuid =
        await ref.read(selectedEffectiveLocationUuidProvider.future);
    if (locationUuid == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error: Invalid Location selected.')),
        );
      }
      return;
    }

    // Mandatory Plate Entry for Desktop
    if (!mounted) return;
    final plateController = TextEditingController();
    final plate = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(
            isWarning
                ? Lang.sel(isHr, 'Quick Warning', 'Brzo upozorenje')
                : Lang.sel(isHr, 'Quick Ticket', 'Brza kazna'),
            style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                  Lang.sel(isHr, 'Enter License Plate (e.g. MA679XX)',
                      'Unesite registarsku oznaku (npr. MA679XX)'),
                  style: GoogleFonts.inter(
                      fontSize: 14, color: AppTheme.textSecondary)),
              const SizedBox(height: 12),
              TextField(
                controller: plateController,
                autofocus: true,
                textCapitalization: TextCapitalization.characters,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9]')),
                ],
                decoration: InputDecoration(
                  hintText: 'MA679XX',
                  filled: true,
                  fillColor: AppTheme.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                ),
                onSubmitted: (v) {
                  final cleaned = v
                      .trim()
                      .replaceAll(RegExp(r'[^A-Z0-9]'), '')
                      .toUpperCase();
                  if (cleaned.isNotEmpty) Navigator.pop(context, cleaned);
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(Lang.sel(isHr, 'Cancel', 'Odustani'),
                style: GoogleFonts.inter(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              final cleaned = plateController.text
                  .trim()
                  .replaceAll(RegExp(r'[^A-Z0-9]'), '')
                  .toUpperCase();
              if (cleaned.isNotEmpty) {
                Navigator.pop(context, cleaned);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(Lang.sel(
                isHr, 'Next: Take Photo', 'Sljedeće: Snimi fotografiju')),
          ),
        ],
      ),
    );

    if (plate == null || plate.isEmpty) return;
    if (!context.mounted) return;

    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: kIsWeb ? 15 : 20,
      maxWidth: kIsWeb ? 800 : 1024,
      maxHeight: kIsWeb ? 800 : 1024,
    );
    if (image == null) return;
    if (!context.mounted) return;

    final controller = ref.read(enforcementControllerProvider);
    final bytes = await image.readAsBytes();
    if (!mounted) return;
    await AsyncActionHandler.run<void>(
      context: context,
      action: () => controller.issueQuickAction(
        plate: plate,
        isWarning: isWarning,
        locationUuid: locationUuid,
        bytes: bytes,
        isLprScan: false,
        issuerRole: profile['role']?.toString(),
      ),
      successMessage: isWarning
          ? Lang.sel(isHr, 'Warning Issued!', 'Upozorenje izdano!')
          : Lang.sel(isHr, 'Ticket Issued!', 'Kazna izdana!'),
      successColor: isWarning ? Colors.orange : Colors.red,
      errorBuilder: ErrorMapper.message,
    );
  }

  Future<void> _showEvidence(Map<String, dynamic> violation) async {
    final plate = violation['plate'] ?? 'UNKNOWN';
    final caseNumber = (violation['case_number'] ?? '').toString();
    final evidenceUrl = violation['evidence_r2_url'];
    final issuedAtIso = (violation['issued_at'] ?? '').toString();
    final issuedAtDt = DateTime.tryParse(issuedAtIso);
    final rawLocId = (violation['location_id'] ?? '').toString();
    final enrichedDid = (violation['location_display_id'] ?? '').toString();
    final selectedDid = ref.read(selectedLocationIdProvider) ??
        ref.read(userLocationIdProvider);
    String locationDisplayId =
        enrichedDid.isNotEmpty ? enrichedDid : rawLocId.toString();
    final uuidRegExp = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false);
    if (uuidRegExp.hasMatch(locationDisplayId.toLowerCase())) {
      final locsAsync = ref.read(availableLocationsProvider);
      if (locsAsync.hasValue) {
        final idToDisplay = <String, String>{};
        for (final l in (locsAsync.value ?? [])) {
          final id = (l['id'] ?? '').toString();
          final did = (l['display_id'] ?? '').toString();
          if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
        }
        locationDisplayId =
            idToDisplay[rawLocId] ?? (selectedDid?.toString() ?? 'N/A');
      } else {
        locationDisplayId = selectedDid?.toString() ?? 'N/A';
      }
    }

    String? fullImageUrl;
    if (evidenceUrl != null) {
      final controller = ref.read(enforcementControllerProvider);
      fullImageUrl = await controller.getEvidenceUrl(evidenceUrl);
    }

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(
            '${Lang.sel(ref.read(localeIsCroatianProvider), 'Evidence', 'Dokaz')}: $plate',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: 300,
                width: 300,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.border),
                ),
                child: fullImageUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          fullImageUrl,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return const Center(
                              child: CircularProgressIndicator(
                                  color: Colors.black),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) =>
                              const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.broken_image_outlined,
                                    size: 48, color: Colors.grey),
                                SizedBox(height: 8),
                                Text(
                                  'Slika nije pronađena',
                                  style: TextStyle(
                                      color: Colors.grey, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    : Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.image_not_supported_outlined,
                                size: 48, color: Colors.grey),
                            const SizedBox(height: 16),
                            Text(
                              Lang.sel(
                                  ref.read(localeIsCroatianProvider),
                                  'No photo attached',
                                  'Nema priložene fotografije'),
                              style: const TextStyle(
                                  color: Colors.grey, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                      Lang.sel(ref.read(localeIsCroatianProvider), 'Violation:',
                          'Prekršaj:'),
                      style: GoogleFonts.inter(color: AppTheme.textSecondary)),
                  Text(violation['violation_type'] ?? 'General',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    Lang.sel(ref.read(localeIsCroatianProvider), 'Case Number:',
                        'Broj slučaja:'),
                    style: GoogleFonts.inter(color: AppTheme.textSecondary),
                  ),
                  Text(
                    caseNumber.isNotEmpty ? caseNumber : '—',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold, color: Colors.black),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    Lang.sel(ref.read(localeIsCroatianProvider), 'Fine Amount:',
                        'Iznos kazne:'),
                    style: GoogleFonts.inter(color: AppTheme.textSecondary),
                  ),
                  Text(
                    '€${violation['fine_amount'] ?? 0}',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold, color: Colors.red),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    Lang.sel(ref.read(localeIsCroatianProvider), 'Location ID:',
                        'ID lokacije:'),
                    style: GoogleFonts.inter(color: AppTheme.textSecondary),
                  ),
                  Text(
                    locationDisplayId,
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold, color: Colors.black),
                  ),
                ],
              ),
              if (MediaQuery.of(context).size.width < 1100) ...[
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    issuedAtDt != null
                        ? Lang.sel(
                            ref.read(localeIsCroatianProvider),
                            'Issued: ${issuedAtDt.day}/${issuedAtDt.month}/${issuedAtDt.year} ${issuedAtDt.hour}:${issuedAtDt.minute.toString().padLeft(2, '0')}',
                            'Izdano: ${issuedAtDt.day}/${issuedAtDt.month}/${issuedAtDt.year} ${issuedAtDt.hour}:${issuedAtDt.minute.toString().padLeft(2, '0')}')
                        : Lang.sel(ref.read(localeIsCroatianProvider),
                            'Issued: —', 'Izdano: —'),
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.black,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              Lang.sel(ref.read(localeIsCroatianProvider), 'Close', 'Zatvori'),
              style: GoogleFonts.inter(
                  color: Colors.black, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 1100;
    final violationsAsync = ref.watch(violationsStreamProvider);
    final selectedLocId = ref.watch(selectedLocationIdProvider) ??
        ref.watch(userLocationIdProvider);
    final optimisticViolations = ref.watch(optimisticViolationsProvider);

    // Watch global selection
    ref.listen(selectedLocationIdProvider, (previous, next) {
      if (next != null && next != previous) {
        ref.invalidate(violationsStreamProvider);
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      body: Column(
        children: [
          CasesHeader(
            isDesktop: isDesktop,
            selectedLocId: selectedLocId,
            searchController: _searchController,
            selectedFilterKey: _selectedFilterKey,
            onSearchSubmitted: (v) {
              setState(() {
                _searchQuery = v.trim().toLowerCase();
                _visibleCount = 20;
              });
            },
            onSearchChanged: (v) {
              _searchDebounce?.cancel();
              _searchDebounce = Timer(
                const Duration(milliseconds: 250),
                () {
                  if (!mounted) return;
                  setState(() {
                    _searchQuery = v.trim().toLowerCase();
                    _visibleCount = 20;
                  });
                },
              );
            },
            onFilterSelected: (key) {
              setState(() {
                _selectedFilterKey = key;
                _visibleCount = 20;
              });
            },
            onQuickWarning: () => _handleQuickAction(isWarning: true),
            onQuickTicket: () => _handleQuickAction(isWarning: false),
          ),
          Expanded(
            child: _buildDataList(
                isDesktop, violationsAsync, optimisticViolations),
          ),
        ],
      ),
    );
  }

  Widget _buildDataList(
      bool isDesktop,
      AsyncValue<List<Map<String, dynamic>>> violationsAsync,
      List<Map<String, dynamic>> optimisticViolations) {
    return violationsAsync.when(
      loading: () => _buildSkeletonList(isDesktop),
      error: (err, stack) => Center(
          child: Text(Lang.sel(ref.watch(localeIsCroatianProvider),
              'Error: $err', 'Greška: $err'))),
      // Translate empty states and search messages
      data: (violations) {
        // Deduplicate: keep optimistic item unless the SAME record (by evidence + timestamp) arrived
        final optimisticItems = optimisticViolations.where((ov) {
          final ovEvidence = ov['evidence_r2_url'];
          if (ovEvidence == null || ovEvidence.toString().isEmpty) {
            return true;
          }
          return !violations.any(
              (v) => (v['evidence_r2_url'] ?? '').toString() == ovEvidence);
        }).toList();

        var allViolations = [
          ...optimisticItems,
          ...violations,
        ];
        final Set<String> seen = {};
        allViolations = allViolations.where((v) {
          final id = (v['id'] ?? '').toString();
          final evidence = (v['evidence_r2_url'] ?? '').toString();
          final key = id.isNotEmpty ? 'id:$id' : 'k:$evidence';
          if (seen.contains(key)) return false;
          seen.add(key);
          return true;
        }).toList();
        allViolations = allViolations.where((v) {
          final vId = v['id']?.toString();
          if (vId == null) return true;
          return !_optimisticDeletedIds.contains(vId);
        }).toList();
        final selectedDid = ref.read(selectedLocationIdProvider) ??
            ref.read(userLocationIdProvider);
        final effUuid = ref.read(selectedEffectiveLocationUuidProvider).value;
        final locsAsync = ref.read(availableLocationsProvider);
        final idToDisplay = <String, String>{};
        if (locsAsync.hasValue) {
          for (final l in (locsAsync.value ?? [])) {
            final id = (l['id'] ?? '').toString();
            final did = (l['display_id'] ?? '').toString();
            if (id.isNotEmpty && did.isNotEmpty) idToDisplay[id] = did;
          }
        }
        allViolations = allViolations.where((v) {
          final raw = (v['location_id'] ?? '').toString();
          final did =
              (v['location_display_id'] ?? idToDisplay[raw])?.toString();
          if (effUuid != null && effUuid.isNotEmpty && raw == effUuid) {
            return true;
          }
          if (selectedDid != null &&
              selectedDid.isNotEmpty &&
              did == selectedDid) {
            return true;
          }
          if (selectedDid != null &&
              selectedDid.isNotEmpty &&
              raw == selectedDid) {
            return true;
          }
          return false;
        }).toList();
        for (final v in allViolations) {
          DateSortHelpers.ensureCachedDate(
            v,
            'issued_at',
            'ui_issued_at',
            fallback: DateTime.fromMillisecondsSinceEpoch(0),
          );
        }

        allViolations = ListSearchFilter.filter(
          items: allViolations,
          query: _searchQuery,
          fields: (v) => [
            v['plate']?.toString(),
            v['violation_type']?.toString(),
            v['status']?.toString(),
          ],
        );

        // 2. Filter by Tab Selection (language-agnostic keys)
        if (_selectedFilterKey != 'all') {
          allViolations = allViolations.where((v) {
            final status = (v['status'] ?? '').toString().toLowerCase();
            if (_selectedFilterKey == 'tickets') {
              return status == 'issued' || status == 'paid';
            } else if (_selectedFilterKey == 'warnings') {
              return status == 'warning';
            }
            return true;
          }).toList();
        }

        DateSortHelpers.sortByCachedDate(allViolations, 'ui_issued_at');

        if (allViolations.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.search_off_outlined,
                    size: 64, color: Colors.grey[200]),
                const SizedBox(height: 16),
                Text(
                    _searchQuery.isNotEmpty
                        ? Lang.sel(
                            ref.read(localeIsCroatianProvider),
                            'No matches for "$_searchQuery"',
                            'Nema podudaranja za "$_searchQuery"')
                        : Lang.sel(
                            ref.read(localeIsCroatianProvider),
                            'No active cases found.',
                            'Nema aktivnih predmeta.'),
                    style: TextStyle(color: Colors.grey[400])),
              ],
            ),
          );
        }

        final visibleCount = min(_visibleCount, allViolations.length);
        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(violationsStreamProvider);
          },
          child: ListView.builder(
            controller: _scrollController,
            padding: EdgeInsets.symmetric(horizontal: isDesktop ? 48 : 24),
            itemCount: visibleCount,
            itemBuilder: (context, index) {
              final violation = allViolations[index];

              return _buildViolationItem(violation, isDesktop);
            },
          ),
        );
      },
    );
  }

  Widget _buildSkeletonList(bool isDesktop) {
    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: isDesktop ? 48 : 24),
      itemCount: 8,
      itemBuilder: (context, index) {
        return AdminDataCard(
          leading: SkeletonLoader(
            width: isDesktop ? 160 : 120,
            height: isDesktop ? 48 : 40,
          ),
          mainContent: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonLoader(width: isDesktop ? 220 : 160, height: 14),
              const SizedBox(height: 8),
              SkeletonLoader(width: isDesktop ? 160 : 120, height: 12),
            ],
          ),
          trailing: SkeletonLoader(width: isDesktop ? 90 : 70, height: 32),
        );
      },
    );
  }

  Widget _buildViolationItem(Map<String, dynamic> violation, bool isDesktop) {
    final status = violation['status'] ?? 'issued';
    final caseNumber = (violation['case_number'] ?? '').toString();
    final issuedAtStr = violation['issued_at'];
    final issuedAt =
        issuedAtStr != null ? DateTime.parse(issuedAtStr) : DateTime.now();
    final plate = (violation['plate'] ?? 'UNKNOWN').toUpperCase();

    if (!isDesktop) {
      return Container(
        margin: const EdgeInsets.only(bottom: 2),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          children: [
            Row(
              children: [
                _buildPlateBadge(plate, isDesktop: false),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _highlightText(
                        violation['violation_type'] ?? 'General',
                        _searchQuery,
                        Colors.black,
                        Colors.yellow,
                        fontSize: 12,
                      ),
                      Text(
                        _formatDate(issuedAt),
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (caseNumber.isNotEmpty)
                        Text(
                          '${Lang.sel(ref.read(localeIsCroatianProvider), 'Case', 'Slučaj')}: $caseNumber',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 26,
                  child: ElevatedButton(
                    onPressed: () => _showEvidence(violation),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      Lang.sel(ref.read(localeIsCroatianProvider), 'View',
                          'Pogledaj'),
                      style: const TextStyle(fontSize: 11),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return AdminDataCard(
      leading: _buildPlateBadge(plate, isDesktop: true),
      mainContent: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _highlightText(
            violation['violation_type'] ?? 'General',
            _searchQuery,
            Colors.black,
            Colors.yellow,
            fontSize: 16,
          ),
          Text(
            _formatDate(issuedAt),
            style: GoogleFonts.inter(
              color: AppTheme.textSecondary,
              fontSize: 14,
            ),
          ),
          if (caseNumber.isNotEmpty)
            Text(
              '${Lang.sel(ref.read(localeIsCroatianProvider), 'Case', 'Slučaj')}: $caseNumber',
              style: GoogleFonts.inter(
                color: AppTheme.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildStatusBadge(status),
          const SizedBox(width: 24),
          ElevatedButton(
            onPressed: () => _showEvidence(violation),
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
            child: Text(Lang.sel(
                ref.read(localeIsCroatianProvider), 'View', 'Pogledaj')),
          ),
          const SizedBox(width: 12),
          if ((ref.watch(userProfileProvider).value?['role'] ?? '') ==
              'super_admin')
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              tooltip: 'Delete Case',
              onPressed: () => _deleteViolation(violation),
            ),
        ],
      ),
    );
  }

  Widget _buildPlateBadge(String plate, {bool isDesktop = false}) {
    return Container(
      width: isDesktop ? 160 : 120,
      height: isDesktop ? 48 : 40,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(4),
      ),
      child: _highlightText(
        plate.toUpperCase(),
        _searchQuery,
        Colors.white,
        Colors.yellow,
        fontSize: isDesktop ? 18 : 16,
      ),
    );
  }

  Widget _highlightText(
      String text, String query, Color baseColor, Color highlightColor,
      {double fontSize = 18}) {
    if (query.isEmpty || !text.toLowerCase().contains(query)) {
      return Text(
        text,
        style: GoogleFonts.inter(
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          color: baseColor,
          letterSpacing: fontSize == 18 ? 1 : 0,
        ),
      );
    }

    final matches = query.toLowerCase();
    final parts = text.split(RegExp(matches, caseSensitive: false));
    final List<TextSpan> spans = [];

    int currentIndex = 0;
    for (int i = 0; i < parts.length; i++) {
      if (parts[i].isNotEmpty) {
        spans.add(TextSpan(text: parts[i]));
      }
      currentIndex += parts[i].length;
      if (i < parts.length - 1) {
        final actualMatch =
            text.substring(currentIndex, currentIndex + matches.length);
        spans.add(TextSpan(
          text: actualMatch,
          style:
              TextStyle(backgroundColor: highlightColor, color: Colors.black),
        ));
        currentIndex += matches.length;
      }
    }

    return RichText(
      text: TextSpan(
        style: GoogleFonts.inter(
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          color: baseColor,
          letterSpacing: fontSize == 18 ? 1 : 0,
        ),
        children: spans,
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final isHr = ref.watch(localeIsCroatianProvider);
    final s = status.toLowerCase();
    final isPaid = s == 'paid' || s == 'active';
    final isWarning = s == 'warning';
    final isIssued = s == 'issued';

    final dotColor = isPaid
        ? Colors.green[400]
        : isWarning
            ? Colors.orange[400]
            : Colors.red[400];

    final fixedBadgeWidth = (isHr && (isWarning || isIssued))
        ? 140.0
        : ((isWarning || isIssued) ? 110.0 : 0.0);
    return Container(
      constraints: BoxConstraints(minWidth: fixedBadgeWidth),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            (() {
              final up = status.toUpperCase();
              if (up == 'ISSUED') return Lang.sel(isHr, 'ISSUED', 'IZDANO');
              if (up == 'WARNING') {
                return Lang.sel(isHr, 'WARNING', 'UPOZORENJE');
              }
              if (up == 'PAID') return Lang.sel(isHr, 'PAID', 'PLAĆENO');
              if (up == 'ACTIVE') return Lang.sel(isHr, 'ACTIVE', 'AKTIVNO');
              return up;
            })(),
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

  String _formatDate(DateTime date) {
    return "${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}";
  }
}
