import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
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

    // 1. Capture Photo
    final XFile? image =
        await _picker.pickImage(source: ImageSource.camera, imageQuality: 50);
    if (image == null) return;

    Map<String, dynamic>? optimisticViolation;
    setState(() => _isProcessing = true);

    try {
      // Use a placeholder plate for "Quick Actions" until LPR is integrated
      final plate =
          'QUICK-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_$plate.jpg';

      // 2. Upload Evidence
      final bytes = await image.readAsBytes();
      await supabase.storage.from('evidence').uploadBinary(
            fileName,
            bytes,
            fileOptions: const FileOptions(contentType: 'image/jpeg'),
          );

      // 3. Create Violation Record with location_id
      optimisticViolation = {
        'plate': plate,
        'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
        'fine_amount': isWarning ? 0.00 : 50.00,
        'status': isWarning ? 'warning' : 'issued',
        'issued_at': DateTime.now().toIso8601String(),
        'evidence_r2_url': null,
      };
      setState(() {
        ref.read(optimisticViolationsProvider.notifier).update((state) => [
              optimisticViolation!,
              ...state,
            ]);
      });
      await supabase.from('violations').insert({
        'plate': plate,
        'violation_type': isWarning ? 'Quick Warning' : 'Quick Ticket',
        'fine_amount': isWarning ? 0.00 : 50.00,
        'status': isWarning ? 'warning' : 'issued',
        'location_id': locUuid,
        'evidence_r2_url': fileName,
        'issued_at': DateTime.now().toIso8601String(),
      }).select();
      ref.invalidate(violationsStreamProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isWarning ? 'Warning Issued!' : 'Ticket Issued!'),
            backgroundColor: isWarning ? Colors.orange : Colors.red,
          ),
        );
      }
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
          if (optimisticViolation != null) {
            ref.read(optimisticViolationsProvider.notifier).update((state) =>
                state.where((v) => v != optimisticViolation).toList());
          }
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
                Text('\$${violation['fine_amount'] ?? 0}',
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
                          ? 'Monitoring all enforcement activity for Lot: $selectedLocId'
                          : 'Please select a lot in the top bar.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (selectedLocId != null && isDesktop) _buildQuickActions(),
            ],
          ),
          if (selectedLocId != null && !isDesktop) ...[
            const SizedBox(height: 24),
            _buildQuickActions(),
          ],
          SizedBox(height: isDesktop ? 48 : 32),
          _buildSearchAndFilter(isDesktop),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
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
        ElevatedButton.icon(
          onPressed:
              _isProcessing ? null : () => _handleQuickAction(isWarning: true),
          icon: const Icon(Icons.warning_amber_rounded, size: 18),
          label: const Text('Quick Warning'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            side: const BorderSide(color: AppTheme.border),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          ),
        ),
        const SizedBox(width: 12),
        ElevatedButton.icon(
          onPressed:
              _isProcessing ? null : () => _handleQuickAction(isWarning: false),
          icon: const Icon(Icons.receipt_long, size: 18),
          label: const Text('Quick Ticket'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          ),
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
              hintText: 'Search by plate or type...',
              prefixIcon: const Icon(Icons.search, size: 20),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 20),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
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
        const SizedBox(height: 24),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterButton('All'),
              const SizedBox(width: 12),
              _buildFilterButton('Tickets'),
              const SizedBox(width: 12),
              _buildFilterButton('Warnings'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterButton(String label) {
    final isSelected = _selectedFilter == label;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedFilter = label;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? Colors.black : AppTheme.surface,
          borderRadius: BorderRadius.circular(8),
          border: isSelected ? null : Border.all(color: AppTheme.border),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 14,
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
        // Deduplicate: Don't show optimistic item if the real one has arrived in the stream
        final optimisticItems = optimisticViolations.where((ov) {
          return !violations.any((v) => v['plate'] == ov['plate']);
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

        // Ensure strict chronological sorting (newest first)
        allViolations.sort((a, b) {
          final aTime = DateTime.tryParse(a['issued_at'] ?? '') ??
              DateTime.fromMillisecondsSinceEpoch(0);
          final bTime = DateTime.tryParse(b['issued_at'] ?? '') ??
              DateTime.fromMillisecondsSinceEpoch(0);
          return bTime.compareTo(aTime);
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
              final status = violation['status'] ?? 'issued';
              final issuedAtStr = violation['issued_at'];
              final issuedAt = issuedAtStr != null
                  ? DateTime.parse(issuedAtStr)
                  : DateTime.now();

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
        margin: const EdgeInsets.only(bottom: 16),
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
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildPlateBadge(plate),
                _buildStatusBadge(status),
              ],
            ),
            const SizedBox(height: 16),
            _highlightText(
              violation['violation_type'] ?? 'General',
              _searchQuery,
              Colors.black,
              Colors.yellow,
              fontSize: 16,
            ),
            const SizedBox(height: 4),
            Text(
              '${_formatDate(issuedAt)} • \$${violation['fine_amount'] ?? 0}',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _showEvidence(violation),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('View Evidence'),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          _buildPlateBadge(plate),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
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
                      color: AppTheme.textSecondary, fontSize: 14),
                ),
              ],
            ),
          ),
          _buildStatusBadge(status),
          const SizedBox(width: 24),
          Text(
            '\$${violation['fine_amount'] ?? 0}',
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
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('View'),
          ),
        ],
      ),
    );
  }

  Widget _buildPlateBadge(String plate) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(4),
      ),
      child: _highlightText(plate, _searchQuery, Colors.white, Colors.yellow),
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
    bool isPaid = status.toLowerCase() == 'paid';
    bool isWarning = status.toLowerCase() == 'warning';

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
              color: isPaid
                  ? Colors.green[400]
                  : (isWarning ? Colors.orange[400] : Colors.red[400]),
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
