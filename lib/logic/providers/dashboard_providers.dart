import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../../features/management/repositories/parking_repository.dart';
import '../../utils/date_sort_helpers.dart';
import 'dart:convert';

/// Provider for the search query in the dashboard.
final dashboardSearchProvider = StateProvider.autoDispose<String>((ref) => '');

/// Provider for the selected filter in the dashboard.
final dashboardFilterProvider =
    StateProvider.autoDispose<String>((ref) => 'All');

/// Global provider for optimistic violations (to ensure instant UX across screens).
final optimisticViolationsProvider =
    StateProvider.autoDispose<List<Map<String, dynamic>>>((ref) => []);

/// Unified provider that merges Permits (Subscribers) and Guest Sessions.
final unifiedDashboardProvider =
    Provider.autoDispose<AsyncValue<List<Map<String, dynamic>>>>((ref) {
  final sessionsAsync = ref.watch(sessionsStreamProvider);
  final permitsAsync = ref.watch(permitsStreamProvider);
  final search = ref.watch(dashboardSearchProvider).toLowerCase();
  final filter = ref.watch(dashboardFilterProvider);

  // Helper to extract data or return empty list on error/loading
  DateTime? parseAnyDate(dynamic raw) {
    if (raw == null) return null;
    if (raw is DateTime) return raw.toUtc();
    final parsed = DateTime.tryParse(raw.toString());
    return parsed?.toUtc();
  }

  Map<String, dynamic> parseStripeMetadata(dynamic raw) {
    try {
      if (raw is Map<String, dynamic>) return raw;
      if (raw is Map) return Map<String, dynamic>.from(raw);
      if (raw is String && raw.trim().startsWith('{')) {
        final decoded = jsonDecode(raw);
        if (decoded is Map<String, dynamic>) return decoded;
        if (decoded is Map) return Map<String, dynamic>.from(decoded);
      }
    } catch (_) {}
    return {};
  }

  Map<String, DateTime?> resolveSessionWindow(Map<String, dynamic> item) {
    final stripeMeta = parseStripeMetadata(item['stripe_metadata']);
    final flow = (stripeMeta['flow'] ?? stripeMeta['flow_type'] ?? '')
        .toString()
        .trim()
        .toLowerCase();
    final entryFromRow = parseAnyDate(item['entry_time']) ??
        parseAnyDate(item['start_time']) ??
        parseAnyDate(item['created_at']);
    final entryFromMeta = parseAnyDate(stripeMeta['check_in']);
    final prefersMetadataWindow = flow == 'reserve' && entryFromMeta != null;
    final checkIn =
        prefersMetadataWindow ? entryFromMeta : (entryFromRow ?? entryFromMeta);

    final exitFromRow =
        parseAnyDate(item['exit_time']) ?? parseAnyDate(item['end_time']);
    final exitFromMeta = parseAnyDate(stripeMeta['check_out']);
    DateTime? checkOut;
    if (prefersMetadataWindow && exitFromMeta != null) {
      checkOut = exitFromMeta;
    } else if (exitFromRow != null) {
      checkOut = exitFromRow;
    } else {
      checkOut = exitFromMeta;
    }
    return {'check_in': checkIn, 'check_out': checkOut};
  }

  String deriveEffectiveStatus(Map<String, dynamic> item) {
    final paymentStatus =
        (item['payment_status'] ?? '').toString().trim().toLowerCase();
    final status = (item['status'] ?? '').toString().trim().toLowerCase();
    final window = resolveSessionWindow(item);
    final nowUtc = DateTime.now().toUtc();
    final checkIn = window['check_in'];
    final checkOut = window['check_out'];
    final isPending =
        paymentStatus == 'pending' || status == 'pending' || status == 'open';
    if (checkIn != null && checkOut != null) {
      if (nowUtc.isBefore(checkIn)) {
        return 'upcoming';
      }
      if (nowUtc.isAtSameMomentAs(checkOut) || nowUtc.isAfter(checkOut)) {
        return 'expired';
      }
      return 'active';
    }
    if (isPending) return 'pending';
    return 'inactive';
  }

  List<Map<String, dynamic>> extractData(
      AsyncValue<List<Map<String, dynamic>>> asyncVal, String type) {
    return asyncVal.maybeWhen(
      data: (data) => data.map((item) {
        DateSortHelpers.ensureCachedDate(
          item,
          'created_at',
          'ui_created_at',
          fallback: DateTime(2000),
        );
        final effectiveStatus = deriveEffectiveStatus(item);
        final window = resolveSessionWindow(item);
        final stripeMeta = parseStripeMetadata(item['stripe_metadata']);
        final metadataEmail =
            (stripeMeta['email'] ?? '').toString().toLowerCase();
        final metadataMobile =
            (stripeMeta['mobile'] ?? '').toString().toLowerCase();
        final metadataCoupon =
            (stripeMeta['coupon_code'] ?? '').toString().toLowerCase();
        final uiEmail =
            (item['email'] ?? item['contact_email'] ?? metadataEmail)
                .toString()
                .toLowerCase();
        final uiMobile =
            (item['mobile'] ?? item['contact_phone'] ?? metadataMobile)
                .toString()
                .toLowerCase();
        final uiCoupon =
            (item['coupon_code'] ?? metadataCoupon).toString().toLowerCase();
        final uiPlate = (item['plate'] ?? '').toString().toLowerCase();
        final uiName = (item['contact_name'] ?? '').toString().toLowerCase();
        final uiLocationDisplayId =
            (item['location_display_id'] ?? '').toString().toLowerCase();
        return {
          ...item,
          'ui_type': type,
          'ui_effective_status': effectiveStatus,
          'ui_entry_time': window['check_in']?.toIso8601String(),
          'ui_exit_time': window['check_out']?.toIso8601String(),
          'ui_search_plate': uiPlate,
          'ui_search_email': uiEmail,
          'ui_search_mobile': uiMobile,
          'ui_search_name': uiName,
          'ui_search_location_display_id': uiLocationDisplayId,
          'ui_search_coupon': uiCoupon,
        };
      }).toList(),
      orElse: () => [],
    );
  }

  final List<Map<String, dynamic>> combined = [
    ...extractData(sessionsAsync, 'GUEST'),
    ...extractData(permitsAsync, 'SUB'),
  ];

  // If both are loading, return loading.
  // But if one has data and the other is just taking time, show what we have.
  if (sessionsAsync.isLoading && permitsAsync.isLoading) {
    return const AsyncValue.loading();
  }

  // If one has an error but the other has data, we should still show the data
  // rather than crashing the whole dashboard.
  if (sessionsAsync.hasError && permitsAsync.hasError) {
    return AsyncValue.error(
        sessionsAsync.error ?? permitsAsync.error!, StackTrace.current);
  }

  // Apply filtering
  final filtered = combined.where((item) {
    final plate = (item['ui_search_plate'] ?? '').toString();
    final email = (item['ui_search_email'] ?? '').toString();
    final mobile = (item['ui_search_mobile'] ?? '').toString();
    final name = (item['ui_search_name'] ?? '').toString();
    final locationDisplayId =
        (item['ui_search_location_display_id'] ?? '').toString();
    final coupon = (item['ui_search_coupon'] ?? '').toString();

    // V14: Multi-term search support (e.g. "ivo 56071")
    final searchTerms = search.split(' ').where((t) => t.isNotEmpty).toList();
    bool matchesSearch = true;

    if (searchTerms.isEmpty) {
      matchesSearch = true;
    } else {
      for (final term in searchTerms) {
        final termMatches = plate.contains(term) ||
            email.contains(term) ||
            mobile.contains(term) ||
            name.contains(term) ||
            locationDisplayId.contains(term) ||
            coupon.contains(term);
        if (!termMatches) {
          matchesSearch = false;
          break;
        }
      }
    }

    if (!matchesSearch) return false;

    final effectiveStatus =
        (item['ui_effective_status'] ?? '').toString().toLowerCase();
    final isPending = effectiveStatus == 'pending';
    final isActive = effectiveStatus == 'active';
    final isGuest = (item['ui_type'] ?? '').toString().toUpperCase() == 'GUEST';

    // Session expiry logic: hide stale pending Stripe checkout session cards.
    if (isGuest && isPending && !isActive) {
      final createdAt = (item['ui_created_at'] as DateTime?) ?? DateTime(2000);
      final age = DateTime.now().difference(createdAt);
      if (age.inMinutes > 15) {
        return false;
      }
    }

    if (filter == 'Active') return isActive;
    if (filter == 'Other') {
      return effectiveStatus == 'upcoming' ||
          effectiveStatus == 'expired' ||
          effectiveStatus == 'inactive' ||
          effectiveStatus == 'pending';
    }
    return true;
  }).toList();

  // Sorting: most recent first
  filtered.sort((a, b) {
    final da = (a['ui_created_at'] as DateTime?) ?? DateTime(2000);
    final db = (b['ui_created_at'] as DateTime?) ?? DateTime(2000);
    return db.compareTo(da);
  });

  return AsyncValue.data(filtered);
});

/// Provider for locations awaiting verification (Super Admin only).
final verificationApplicantsProvider =
    Provider.autoDispose<AsyncValue<List<Map<String, dynamic>>>>((ref) {
  final locationsAsync = ref.watch(locationsStreamProvider);
  final search = ref.watch(dashboardSearchProvider).toLowerCase();

  return locationsAsync.when(
    data: (locs) {
      final pending = locs.where((l) {
        final isPending = l['verification_status'] == 'pending';
        if (!isPending) return false;

        final name = (l['name'] ?? '').toString().toLowerCase();
        final address = (l['address'] ?? '').toString().toLowerCase();
        final displayId = (l['display_id'] ?? '').toString().toLowerCase();

        return name.contains(search) ||
            address.contains(search) ||
            displayId.contains(search);
      }).toList();

      return AsyncValue.data(pending);
    },
    loading: () => const AsyncValue.loading(),
    error: (e, st) => AsyncValue.error(e, st),
  );
});
