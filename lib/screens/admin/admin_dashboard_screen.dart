import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../instructions_screen.dart';
import '../../theme.dart';
import '../../features/management/screens/pass_detail_screen.dart'
    as pass_detail;
import '../../logic/providers/dashboard_providers.dart';
import '../../logic/providers/auth_providers.dart';
import '../../widgets/admin_data_card.dart';
import '../../logic/providers/locale_provider.dart';
import '../../widgets/skeleton_loader.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
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

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final params = Uri.base.queryParameters;
    final bool forceMobile =
        (params['mobile'] == '1') || (params['render'] == 'mobile');
    final isDesktop = !forceMobile && size.width >= 1100;

    // Watch global lot selection to force a data refresh if it changes
    ref.listen(selectedLocationIdProvider, (previous, next) {
      if (next != null && next != previous) {
        ref.invalidate(unifiedDashboardProvider);
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: null,
      body: Column(
        children: [
          _buildHeader(isDesktop),
          Expanded(
            child: _buildDataList(isDesktop),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isDesktop) {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isDesktop ? 48 : 24,
        vertical: isDesktop ? 48 : 32,
      ),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isDesktop)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        Lang.sel(isHr, 'Home', 'Početna'),
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
                            isHr,
                            'Monitor all parking activity and lot occupancy.',
                            'Pratite sve aktivnosti parkiranja i popunjenost parkirališta.'),
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (kIsWeb)
                  Row(
                    children: [
                      _buildHeaderActionButton(
                        icon: Icons.menu_book_outlined,
                        label: Lang.sel(isHr, 'Instructions', 'Upute'),
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const InstructionsScreen()),
                          );
                        },
                        isDesktop: true,
                      ),
                      const SizedBox(width: 12),
                      _buildHeaderActionButton(
                        icon: Icons.android,
                        label: Lang.sel(
                            isHr, 'Download App', 'Preuzmi aplikaciju'),
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        onTap: () async {
                          final url = Uri.parse(
                              'https://mobile-scanner-flax-static.vercel.app/app-release.apk');
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url,
                                mode: LaunchMode.externalApplication);
                          }
                        },
                        isDesktop: true,
                      ),
                    ],
                  ),
              ],
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Lang.sel(isHr, 'Home', 'Početna'),
                  style: GoogleFonts.inter(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  Lang.sel(
                      isHr,
                      'Monitor all parking activity and lot occupancy.',
                      'Pratite sve aktivnosti parkiranja i popunjenost parkirališta.'),
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          // Ensure identical spacing before search as in Cases
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

  Widget _buildSearchAndFilter(bool isDesktop) {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: isDesktop ? 400 : double.infinity,
          child: TextField(
            controller: _searchController,
            onChanged: (v) {
              ref.read(dashboardSearchProvider.notifier).state = v;
              setState(() {
                _visibleCount = 20;
              });
            },
            decoration: InputDecoration(
              hintText: Lang.sel(isHr, 'Search...', 'Pretraži...'),
              prefixIcon: const Icon(Icons.search, size: 20),
              filled: true,
              fillColor: AppTheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(4),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(4),
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
              _buildFilterButton('All', Lang.sel(isHr, 'All', 'Sve')),
              const SizedBox(width: 12),
              _buildFilterButton('Active', Lang.sel(isHr, 'Active', 'Aktivno')),
              const SizedBox(width: 12),
              _buildFilterButton(
                  'Inactive', Lang.sel(isHr, 'Inactive', 'Neaktivno')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterButton(String key, String label) {
    final selectedFilter = ref.watch(dashboardFilterProvider);
    final isSelected = selectedFilter == key;
    final isDesktop = MediaQuery.of(context).size.width >= 1100;

    return InkWell(
      onTap: () {
        ref.read(dashboardFilterProvider.notifier).state = key;
        setState(() {
          _visibleCount = 20;
        });
      },
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: isDesktop ? 24 : 16,
          vertical: isDesktop ? 10 : 8,
        ),
        decoration: BoxDecoration(
          color: isSelected ? Colors.black : AppTheme.surface,
          borderRadius: BorderRadius.circular(4),
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

  Widget _buildDataList(bool isDesktop) {
    final unifiedDataAsync = ref.watch(unifiedDashboardProvider);
    final availableLocsAsync = ref.watch(availableLocationsProvider);
    final isHr = ref.watch(localeIsCroatianProvider);

    return availableLocsAsync.when(
      data: (locs) {
        return unifiedDataAsync.when(
          data: (items) {
            if (items.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.search_off_outlined,
                        size: 64, color: Colors.grey[300]),
                    const SizedBox(height: 16),
                    Text(
                      Lang.sel(isHr, 'No sessions or subscribers found.',
                          'Nema sesija ili pretplatnika.'),
                      style: GoogleFonts.inter(
                          color: Colors.grey[500], fontSize: 16),
                    ),
                  ],
                ),
              );
            }

            final visibleCount =
                _visibleCount > items.length ? items.length : _visibleCount;
            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(unifiedDashboardProvider);
              },
              child: ListView.builder(
                controller: _scrollController,
                padding: EdgeInsets.symmetric(horizontal: isDesktop ? 48 : 24),
                itemCount: visibleCount,
                itemBuilder: (context, index) =>
                    _buildSessionItem(items[index], isDesktop),
              ),
            );
          },
          loading: () => _buildSkeletonList(isDesktop),
          error: (e, _) => _buildErrorView(e.toString()),
        );
      },
      loading: () => _buildSkeletonList(isDesktop),
      error: (e, _) => _buildErrorView(e.toString()),
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

  Widget _buildErrorView(String error) {
    final isHr = ref.watch(localeIsCroatianProvider);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_outlined,
                size: 48, color: Colors.orangeAccent),
            const SizedBox(height: 16),
            Text(
                Lang.sel(isHr, 'Syncing data...', 'Sinkronizacija podataka...'),
                style:
                    GoogleFonts.inter(color: Colors.grey[600], fontSize: 16)),
            const SizedBox(height: 8),
            Text(
                Lang.sel(
                    isHr,
                    'We are having trouble connecting to the live stream.',
                    'Imamo poteškoća s povezivanjem na prijenos uživo.'),
                textAlign: TextAlign.center,
                style:
                    GoogleFonts.inter(color: Colors.grey[400], fontSize: 12)),
            const SizedBox(height: 24),
            TextButton.icon(
              onPressed: () {
                ref.invalidate(userProfileProvider);
                ref.invalidate(unifiedDashboardProvider);
              },
              icon: const Icon(Icons.refresh),
              label: Text(Lang.sel(
                  isHr, 'Retry Connection', 'Pokušaj ponovno povezivanje')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionItem(Map<String, dynamic> s, bool isDesktop) {
    if (s['ui_type'] == 'LINK') {
      return const SizedBox.shrink();
    }
    final isHr = ref.watch(localeIsCroatianProvider);
    final plate = s['plate'] ?? 'UNKNOWN';
    final amount = double.tryParse(s['price']?.toString() ?? '0') ?? 0.0;
    final paymentStatus =
        (s['payment_status'] ?? '').toString().trim().toLowerCase();
    final status = (s['status'] ?? '').toString().trim().toLowerCase();
    final isPending = status == 'pending';
    final isPaid = paymentStatus == 'paid' ||
        paymentStatus == 'succeeded' ||
        paymentStatus == 'complete' ||
        paymentStatus == 'completed' ||
        status == 'active' ||
        status == 'paid' ||
        status == 'succeeded' ||
        status == 'complete' ||
        status == 'completed' ||
        amount == 0.0;

    String? metadataEmail;
    String? metadataMobile;
    try {
      if (s['stripe_metadata'] != null) {
        final metaStr = s['stripe_metadata'].toString();
        if (metaStr.startsWith('{')) {
          final metaJson = jsonDecode(metaStr);
          metadataEmail = metaJson['email']?.toString();
          metadataMobile = metaJson['mobile']?.toString();
        }
      }
    } catch (_) {}

    final resolvedEmail =
        (s['email'] ?? s['contact_email'] ?? metadataEmail ?? '')
            .toString()
            .trim();
    final displayName = _nameFromEmail(resolvedEmail);
    final displayPhone =
        (s['mobile'] ?? s['contact_phone'] ?? metadataMobile ?? 'N/A')
            .toString()
            .trim();

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
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              displayName,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.black,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        displayPhone,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      _buildDurationRow(s),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _buildStatusBadge(
                        isPending
                            ? 'PENDING'
                            : (isPaid ? 'ACTIVE' : 'INACTIVE'),
                        isPaid,
                        isPending: isPending),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 26,
                      child: ElevatedButton(
                        onPressed: () => _navigateToDetail(s),
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
                          Lang.sel(isHr, 'View', 'Pogledaj'),
                          style: const TextStyle(fontSize: 11),
                        ),
                      ),
                    ),
                  ],
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
          Text(
            displayName,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            displayPhone,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          _buildDurationRow(s),
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildStatusBadge(
              isPending ? 'PENDING' : (isPaid ? 'ACTIVE' : 'INACTIVE'), isPaid,
              isPending: isPending),
          const SizedBox(width: 24),
          ElevatedButton(
            onPressed: () => _navigateToDetail(s),
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
            child: Text(Lang.sel(isHr, 'View', 'Pogledaj')),
          ),
        ],
      ),
    );
  }

  String _nameFromEmail(String email) {
    final normalized = email.trim();
    if (normalized.isEmpty) {
      return 'Guest User';
    }
    final atIndex = normalized.indexOf('@');
    if (atIndex <= 0) {
      return normalized;
    }
    return normalized.substring(0, atIndex);
  }

  Map<String, dynamic> _parseStripeMetadata(dynamic raw) {
    try {
      if (raw is Map<String, dynamic>) return raw;
      if (raw is Map) return Map<String, dynamic>.from(raw);
      if (raw is String) {
        final first = jsonDecode(raw);
        if (first is Map<String, dynamic>) return first;
        if (first is Map) return Map<String, dynamic>.from(first);
        if (first is String) {
          final second = jsonDecode(first);
          if (second is Map<String, dynamic>) return second;
          if (second is Map) return Map<String, dynamic>.from(second);
        }
      }
    } catch (_) {}
    return {};
  }

  int _parseQuantity(dynamic raw) {
    if (raw == null) return 1;
    final intValue = int.tryParse(raw.toString());
    if (intValue != null && intValue > 0) return intValue;
    final doubleValue = double.tryParse(raw.toString());
    if (doubleValue != null && doubleValue > 0) return doubleValue.round();
    return 1;
  }

  int _resolveQuantity(
      Map<String, dynamic> item, Map<String, dynamic> stripeMetadata) {
    // 1. Primary check: check session fields and metadata for explicit quantity
    final parsed = _parseQuantity(
      stripeMetadata['quantity'] ??
          stripeMetadata['qty'] ??
          stripeMetadata['duration_quantity'] ??
          item['quantity'],
    );

    // V17: Ensure we use the parsed quantity if it's > 1, as it represents the number of units (hours/days/months)
    if (parsed > 1) return parsed;

    // 2. Secondary check: check session fields and metadata for duration minutes
    final durationMinutes = _parseQuantity(
      stripeMetadata['duration_minutes'] ??
          stripeMetadata['duration'] ??
          item['duration_minutes'],
    );

    final type = (item['type'] ?? stripeMetadata['type'] ?? 'hourly')
        .toString()
        .toLowerCase();
    final unit =
        (stripeMetadata['duration_unit'] ?? item['duration_unit'] ?? '')
            .toString()
            .toLowerCase();

    if (durationMinutes > 1) {
      if (type == 'monthly' || type == 'subscription' || unit == 'month') {
        return (durationMinutes / (30 * 24 * 60)).round().clamp(1, 9999);
      }
      if (type == 'daily' || unit == 'day') {
        return (durationMinutes / (24 * 60)).round().clamp(1, 9999);
      }
      // V16: Fixed issue where 1.1h was rounded up to 2h, now using round() and ensuring it handles minutes correctly
      return (durationMinutes / 60).round().clamp(1, 9999);
    }

    // 3. Tertiary check: calculate from time difference
    final start = DateTime.tryParse(
        (item['entry_time'] ?? item['start_time'] ?? item['created_at'] ?? '')
            .toString());
    final end = DateTime.tryParse(
        (item['exit_time'] ?? item['end_time'] ?? '').toString());

    if (start != null && end != null && end.isAfter(start)) {
      final diffMinutes = end.difference(start).inMinutes;
      if (diffMinutes >= 1) {
        if (type == 'monthly' || type == 'subscription' || unit == 'month') {
          return (diffMinutes / (30 * 24 * 60)).round().clamp(1, 9999);
        }
        if (type == 'daily' || unit == 'day') {
          return (diffMinutes / (24 * 60)).round().clamp(1, 9999);
        }
        // V16: Standardized to use round() to avoid overcounting and handle partial durations better
        return (diffMinutes / 60).round().clamp(1, 9999);
      }
    }

    return parsed;
  }

  Widget _buildDurationRow(Map<String, dynamic> s) {
    final isHr = ref.watch(localeIsCroatianProvider);

    // 1. Extract raw data
    final String type = (s['type'] ?? 'hourly').toString().toLowerCase();
    final String billingType =
        (s['billing_type'] ?? '').toString().toLowerCase();

    // 2. Metadata fallback (for Stripe sessions)
    final stripeMetadata = _parseStripeMetadata(s['stripe_metadata']);
    final int quantity = _resolveQuantity(s, stripeMetadata);

    final String metadataType =
        (stripeMetadata['type'] ?? '').toString().toLowerCase();
    final String metadataUnit =
        (stripeMetadata['duration_unit'] ?? '').toString().toLowerCase();

    // 3. Determine display string
    String durationStr = '';

    // Check for monthly
    if (type == 'monthly' ||
        type == 'subscription' ||
        billingType == 'monthly' ||
        metadataType == 'monthly' ||
        metadataUnit == 'month') {
      durationStr =
          '$quantity ${quantity == 1 ? (isHr ? 'Mjesec' : 'Month') : (isHr ? 'Mjeseci' : 'Months')}';
    }
    // Check for daily
    else if (type == 'daily' ||
        billingType == 'daily' ||
        metadataType == 'daily' ||
        metadataUnit == 'day') {
      durationStr =
          '$quantity ${quantity == 1 ? (isHr ? 'Dan' : 'Day') : (isHr ? 'Dana' : 'Days')}';
    }
    // Default to hourly
    else {
      durationStr =
          '$quantity ${quantity == 1 ? (isHr ? 'Sat' : 'Hour') : (isHr ? 'Sati' : 'Hours')}';
    }

    return Row(
      children: [
        Icon(
          Icons.access_time,
          size: 14,
          color: AppTheme.textSecondary.withValues(alpha: 0.7),
        ),
        const SizedBox(width: 4),
        Text(
          durationStr,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppTheme.textSecondary,
          ),
        ),
      ],
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
      child: Text(
        plate.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: isDesktop ? 18 : 16,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          letterSpacing: 1,
        ),
      ),
    );
  }

  void _navigateToDetail(Map<String, dynamic> s) {
    // Decode metadata for quantity and billing_type fallback
    final stripeMetadata = _parseStripeMetadata(s['stripe_metadata']);
    final quantity = _resolveQuantity(s, stripeMetadata);

    final Map<String, dynamic> normalizedPermit = s['ui_type'] == 'SUB'
        ? s
        : {
            ...s,
            'type': (s['type'] ?? 'hourly').toString(),
            'start_time': s['entry_time'] ?? s['created_at'] ?? '',
            'end_time': s['exit_time'] ?? s['end_time'] ?? '',
            'price': double.tryParse(s['price']?.toString() ?? '0') ?? 0.0,
            'contact_email': s['email'] ?? s['contact_email'] ?? '',
            'contact_phone': s['mobile'] ?? s['contact_phone'] ?? '',
            'contact_name': _nameFromEmail(
                (s['email'] ?? s['contact_email'] ?? '').toString()),
          };

    // V15: Ensure end_time is calculated if missing for guest sessions (stripe)
    if (normalizedPermit['end_time'] == null ||
        normalizedPermit['end_time'].toString().isEmpty) {
      final startStr = normalizedPermit['start_time']?.toString() ?? '';
      if (startStr.isNotEmpty) {
        final start = DateTime.tryParse(startStr);
        if (start != null) {
          final type = (s['type'] ?? 'hourly').toString().toLowerCase();
          final bType = (s['billing_type'] ?? stripeMetadata['billing_type'])
              ?.toString()
              .toLowerCase();
          final metadataType =
              (stripeMetadata['type'] ?? '').toString().toLowerCase();
          final metadataUnit =
              (stripeMetadata['duration_unit'] ?? '').toString().toLowerCase();

          if (type == 'monthly' ||
              type == 'subscription' ||
              bType == 'monthly' ||
              metadataType == 'monthly' ||
              metadataUnit == 'month') {
            normalizedPermit['end_time'] =
                start.add(Duration(days: 30 * quantity)).toIso8601String();
          } else if (type == 'daily' ||
              bType == 'daily' ||
              metadataType == 'daily' ||
              metadataUnit == 'day') {
            normalizedPermit['end_time'] =
                start.add(Duration(days: 1 * quantity)).toIso8601String();
          } else {
            // Default to +1 hour * quantity for hourly or any unknown guest session
            normalizedPermit['end_time'] =
                start.add(Duration(hours: 1 * quantity)).toIso8601String();
          }
        }
      }
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => pass_detail.PassDetailScreen(
          permit: normalizedPermit,
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status, bool isPaid,
      {bool isPending = false}) {
    final isHr = ref.watch(localeIsCroatianProvider);
    final dotColor = isPending
        ? Colors.orange[400]
        : (isPaid ? Colors.green[400] : Colors.red[400]);
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
            (() {
              final s = status.toUpperCase();
              if (s == 'ACTIVE') {
                return Lang.sel(isHr, 'ACTIVE', 'AKTIVNO');
              }
              if (s == 'INACTIVE') {
                return Lang.sel(isHr, 'INACTIVE', 'NEAKTIVNO');
              }
              if (s == 'PENDING') {
                return Lang.sel(isHr, 'PENDING', 'NA ČEKANJU');
              }
              return s;
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
}
