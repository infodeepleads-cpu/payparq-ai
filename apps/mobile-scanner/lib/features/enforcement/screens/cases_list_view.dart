import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../theme.dart';
import '../../../widgets/admin_data_card.dart';
import '../../management/repositories/parking_repository.dart';
import '../../../logic/providers/auth_providers.dart';
import '../../../logic/providers/dashboard_providers.dart';

class CasesListView extends ConsumerStatefulWidget {
  const CasesListView({super.key});

  @override
  ConsumerState<CasesListView> createState() => _CasesListViewState();
}

class _CasesListViewState extends ConsumerState<CasesListView> {
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedFilter = 'All';
  bool _isProcessing = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleQuickAction({required bool isWarning}) async {
    final profile = ref.read(userProfileProvider).value;
    if (profile == null) return;

    // Priority: 1. Manually selected location, 2. Profile location
    final locationDisplayId =
        ref.read(selectedLocationIdProvider) ?? profile['location_id'];

    if (locationDisplayId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Error: No Location ID selected or assigned.')),
      );
      return;
    }

    // Use the centralized UUID resolver
    final locUuid = await ref.read(selectedLocationUuidProvider.future);
    final supabase = Supabase.instance.client;

    if (locUuid == null) {
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
        title: Text(isWarning ? 'Quick Warning' : 'Quick Ticket',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Enter License Plate (e.g. MA679XX)',
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
                final cleaned =
                    v.trim().replaceAll(RegExp(r'[^A-Z0-9]'), '').toUpperCase();
                if (cleaned.isNotEmpty) Navigator.pop(context, cleaned);
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel',
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
              backgroundColor: isWarning ? Colors.orange : Colors.black,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Next: Take Photo'),
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

    setState(() => _isProcessing = true);

    try {
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$plate.jpg';
      final issuedAt = DateTime.now().toIso8601String();

      // 1. Resolve daily price for the selected location
      double dailyPrice = 50.0;
      try {
        final List rows = await supabase
            .from('locations')
            .select('base_price_daily')
            .eq('id', locUuid)
            .limit(1);
        if (rows.isNotEmpty) {
          final v = rows.first['base_price_daily'];
          if (v != null) {
            dailyPrice = (v is num)
                ? v.toDouble()
                : double.tryParse(v.toString()) ?? 50.0;
          }
        }
      } catch (_) {}

      // 2. Immediate Optimistic UI Update
      final optimisticRecord = {
        'plate': plate,
        'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
        'fine_amount': isWarning ? 0.00 : dailyPrice,
        'status': isWarning ? 'warning' : 'issued',
        'issued_at': issuedAt,
        'evidence_r2_url': fileName,
        'location_id': locUuid,
      };

      ref.read(optimisticViolationsProvider.notifier).update((state) => [
            optimisticRecord,
            ...state,
          ]);

      final bytes = await image.readAsBytes();

      await Future.wait<dynamic>([
        supabase.storage.from('evidence').uploadBinary(
              fileName,
              bytes,
              fileOptions: const FileOptions(contentType: 'image/jpeg'),
            ),
        supabase.from('violations').insert({
          'plate': plate,
          'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
          'fine_amount': isWarning ? 0.00 : dailyPrice,
          'status': isWarning ? 'warning' : 'issued',
          'location_id': locUuid,
          'evidence_r2_url': fileName,
          'issued_at': issuedAt,
          'is_lpr_scan': false,
        }),
      ]).timeout(const Duration(seconds: 25));

      ref.invalidate(violationsStreamProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isWarning ? 'Warning Issued!' : 'Ticket Issued!'),
            backgroundColor: isWarning ? Colors.orange : Colors.red,
          ),
        );
      }

      ref.listen(violationsStreamProvider, (prev, next) {
        final violations = next.value ?? [];
        final exists = violations.any((v) =>
            (v['plate'] ?? '') == plate &&
            (v['evidence_r2_url'] ?? '') == fileName &&
            (v['issued_at'] ?? '') != null);
        if (exists) {
          ref.read(optimisticViolationsProvider.notifier).update((state) =>
              state
                  .where((v) =>
                      (v['plate'] ?? '') != plate ||
                      (v['evidence_r2_url'] ?? '') != fileName)
                  .toList());
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          // Keep optimistic item until the real stream shows the inserted record,
          // then remove it in the listener above. This prevents flicker/disappear.
        });
      }
    }
  }

  Future<void> _showEvidence(Map<String, dynamic> violation) async {
    final plate = violation['plate'] ?? 'UNKNOWN';
    final evidenceUrl = violation['evidence_r2_url'];

    String? fullImageUrl;
    if (evidenceUrl != null) {
      try {
        fullImageUrl = await Supabase.instance.client.storage
            .from('evidence')
            .createSignedUrl(evidenceUrl, 3600);
      } catch (_) {
        fullImageUrl = Supabase.instance.client.storage
            .from('evidence')
            .getPublicUrl(evidenceUrl);
      }
    }

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text('Evidence: $plate',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        content: Column(
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
                                  color: Colors.black));
                        },
                        errorBuilder: (context, error, stackTrace) =>
                            const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.broken_image_outlined,
                                  size: 48, color: Colors.grey),
                              SizedBox(height: 8),
                              Text('Image not found',
                                  style: TextStyle(
                                      color: Colors.grey, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                    )
                  : const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.image_not_supported_outlined,
                              size: 48, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('No photo attached',
                              style:
                                  TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Violation:',
                    style: GoogleFonts.inter(color: AppTheme.textSecondary)),
                Text(violation['violation_type'] ?? 'General',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Fine Amount:',
                    style: GoogleFonts.inter(color: AppTheme.textSecondary)),
                Text('€${violation['fine_amount'] ?? 0}',
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold, color: Colors.red)),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close',
                style: GoogleFonts.inter(
                    color: Colors.black, fontWeight: FontWeight.bold)),
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
    final selectedLocId = ref.watch(selectedLocationIdProvider);
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
          _buildHeader(isDesktop, selectedLocId),
          Expanded(
            child: _buildDataList(
                isDesktop, violationsAsync, optimisticViolations),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isDesktop, String? selectedLocId) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isDesktop ? 48 : 24,
        vertical: isDesktop ? 48 : 32,
      ),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cases',
                      style: GoogleFonts.inter(
                        fontSize: isDesktop ? 40 : 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      selectedLocId != null
                          ? 'Monitoring all enforcement activity.'
                          : 'Please select a lot in the top bar.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (selectedLocId != null && isDesktop)
                Row(
                  children: [
                    _buildHeaderActionButton(
                      icon: Icons.warning_amber_rounded,
                      label: 'Quick Warning',
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      onTap: () => _handleQuickAction(isWarning: true),
                      isDesktop: true,
                    ),
                    const SizedBox(width: 12),
                    _buildHeaderActionButton(
                      icon: Icons.receipt_long,
                      label: 'Quick Ticket',
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      onTap: () => _handleQuickAction(isWarning: false),
                      isDesktop: true,
                    ),
                  ],
                ),
            ],
          ),
          if (selectedLocId != null && !isDesktop) ...[
            const SizedBox(height: 24),
            _buildQuickActions(isDesktop),
          ],
          SizedBox(height: isDesktop ? 48 : 32),
          _buildSearchAndFilter(isDesktop),
        ],
      ),
    );
  }

  Widget _buildHeaderActionButton({
    required IconData icon,
    required String label,
    required Color backgroundColor,
    required Color foregroundColor,
    required VoidCallback onTap,
    required bool isDesktop,
  }) {
    final hasBorder = backgroundColor == Colors.white;

    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: isDesktop ? 18 : 16),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        foregroundColor: foregroundColor,
        side: hasBorder ? const BorderSide(color: AppTheme.border) : null,
        padding: EdgeInsets.symmetric(
          horizontal: isDesktop ? 20 : 12,
          vertical: isDesktop ? 12 : 8,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
        elevation: 0,
        textStyle: GoogleFonts.inter(
          fontSize: isDesktop ? 14 : 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildQuickActions(bool isDesktop) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_isProcessing)
          const Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: Colors.black),
            ),
          ),
        _buildHeaderActionButton(
          icon: Icons.warning_amber_rounded,
          label: 'Quick Warning',
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          onTap: () => _handleQuickAction(isWarning: true),
          isDesktop: isDesktop,
        ),
        const SizedBox(width: 12),
        _buildHeaderActionButton(
          icon: Icons.receipt_long,
          label: 'Quick Ticket',
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          onTap: () => _handleQuickAction(isWarning: false),
          isDesktop: isDesktop,
        ),
      ],
    );
  }

  Widget _buildSearchAndFilter(bool isDesktop) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: isDesktop ? 400 : double.infinity,
          child: TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            onSubmitted: (v) {
              setState(() {
                _searchQuery = v.trim().toLowerCase();
              });
            },
            onChanged: (v) {
              setState(() {
                _searchQuery = v.trim().toLowerCase();
              });
            },
            decoration: InputDecoration(
              hintText: 'Search...',
              prefixIcon: const Icon(Icons.search, size: 20),
              filled: true,
              fillColor: AppTheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterButton('All', isDesktop),
              const SizedBox(width: 12),
              _buildFilterButton('Tickets', isDesktop),
              const SizedBox(width: 12),
              _buildFilterButton('Warnings', isDesktop),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterButton(String label, bool isDesktop) {
    final isSelected = _selectedFilter == label;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedFilter = label;
        });
      },
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: isDesktop ? 24 : 16,
          vertical: isDesktop ? 10 : 8,
        ),
        decoration: BoxDecoration(
          color: isSelected ? Colors.black : AppTheme.surface,
          borderRadius: BorderRadius.circular(8),
          border: isSelected ? null : Border.all(color: AppTheme.border),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: isDesktop ? 14 : 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : Colors.black,
          ),
        ),
      ),
    );
  }

  Widget _buildDataList(
      bool isDesktop,
      AsyncValue<List<Map<String, dynamic>>> violationsAsync,
      List<Map<String, dynamic>> optimisticViolations) {
    return violationsAsync.when(
      loading: () =>
          const Center(child: CircularProgressIndicator(color: Colors.black)),
      error: (err, stack) => Center(child: Text('Error: $err')),
      data: (violations) {
        // Deduplicate: keep optimistic item unless the SAME record (by evidence + timestamp) arrived
        final optimisticItems = optimisticViolations.where((ov) {
          final ovPlate = ov['plate'];
          final ovEvidence = ov['evidence_r2_url'];
          final ovIssuedAt = ov['issued_at'];
          return !violations.any((v) =>
              v['plate'] == ovPlate &&
              v['evidence_r2_url'] == ovEvidence &&
              v['issued_at'] == ovIssuedAt);
        }).toList();

        var allViolations = [
          ...optimisticItems,
          ...violations,
        ];

        // 1. Filter by Search Query
        if (_searchQuery.isNotEmpty) {
          allViolations = allViolations.where((v) {
            final plate = (v['plate'] ?? '').toString().toLowerCase();
            final type = (v['violation_type'] ?? '').toString().toLowerCase();
            return plate.contains(_searchQuery) || type.contains(_searchQuery);
          }).toList();
        }

        // 2. Filter by Tab Selection
        if (_selectedFilter != 'All') {
          allViolations = allViolations.where((v) {
            final status = (v['status'] ?? '').toString().toLowerCase();
            if (_selectedFilter == 'Tickets') {
              return status == 'issued' || status == 'paid';
            } else if (_selectedFilter == 'Warnings') {
              return status == 'warning';
            }
            return true;
          }).toList();
        }

        // Put second place plates first (newest first)
        allViolations.sort((a, b) {
          final aTime = DateTime.tryParse(a['issued_at'] ?? '') ??
              DateTime.fromMillisecondsSinceEpoch(0);
          final bTime = DateTime.tryParse(b['issued_at'] ?? '') ??
              DateTime.fromMillisecondsSinceEpoch(0);
          return bTime.compareTo(
              aTime); // Show newest first (second place plates first)
        });

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
                        ? 'No matches for "$_searchQuery"'
                        : 'No active cases found.',
                    style: TextStyle(color: Colors.grey[400])),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(violationsStreamProvider);
          },
          child: ListView.builder(
            padding: EdgeInsets.symmetric(horizontal: isDesktop ? 48 : 24),
            itemCount: allViolations.length,
            itemBuilder: (context, index) {
              final violation = allViolations[index];

              return _buildViolationItem(violation, isDesktop);
            },
          ),
        );
      },
    );
  }

  Widget _buildViolationItem(Map<String, dynamic> violation, bool isDesktop) {
    final status = violation['status'] ?? 'issued';
    final issuedAtStr = violation['issued_at'];
    final issuedAt =
        issuedAtStr != null ? DateTime.parse(issuedAtStr) : DateTime.now();
    final plate = (violation['plate'] ?? 'UNKNOWN').toUpperCase();

    if (!isDesktop) {
      return Container(
        margin: const EdgeInsets.only(bottom: 4),
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          children: [
            Row(
              children: [
                _buildPlateBadge(plate),
                const SizedBox(width: 8),
                _buildStatusBadge(status),
                const Spacer(),
                SizedBox(
                  height: 28,
                  child: ElevatedButton(
                    onPressed: () => _showEvidence(violation),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                      elevation: 0,
                    ),
                    child: const Text('View', style: TextStyle(fontSize: 11)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
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
                        '${_formatDate(issuedAt)} • €${violation['fine_amount'] ?? 0}',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return AdminDataCard(
      leading: _buildPlateBadge(plate),
      mainContent: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _highlightText(
            violation['violation_type'] ?? 'General',
            _searchQuery,
            Colors.black,
            Colors.yellow,
          ),
          Text(
            _formatDate(issuedAt),
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
          _buildStatusBadge(status),
          const SizedBox(width: 24),
          Text(
            '€${violation['fine_amount'] ?? 0}',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color: Colors.black,
            ),
          ),
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
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('View'),
          ),
        ],
      ),
    );
  }

  Widget _buildPlateBadge(String plate) {
    return Container(
      width: 160,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(4),
      ),
      child: _highlightText(
          plate.toUpperCase(), _searchQuery, Colors.white, Colors.yellow,
          fontSize: 18),
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
    final s = status.toLowerCase();
    final isPaid = s == 'paid' || s == 'active';
    final isWarning = s == 'warning';

    final dotColor = isPaid
        ? Colors.green[400]
        : isWarning
            ? Colors.orange[400]
            : Colors.red[400];

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
              color: dotColor,
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

  String _formatDate(DateTime date) {
    return "${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}";
  }
}
