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

  String deriveEffectiveStatus(Map<String, dynamic> item) {
    final amount = double.tryParse((item['price'] ?? 0).toString()) ?? 0.0;
    final paymentStatus =
        (item['payment_status'] ?? '').toString().trim().toLowerCase();
    final status = (item['status'] ?? '').toString().trim().toLowerCase();
    final isPaid = paymentStatus == 'paid' ||
        paymentStatus == 'succeeded' ||
        paymentStatus == 'complete' ||
        paymentStatus == 'completed' ||
        status == 'active' ||
        status == 'paid' ||
        status == 'succeeded' ||
        status == 'complete' ||
        status == 'completed' ||
        amount == 0.0 ||
        (item['stripe_metadata'] != null &&
            (item['stripe_metadata']
                    .toString()
                    .contains('"status":"complete"') ||
                item['stripe_metadata']
                    .toString()
                    .contains('"payment_status":"paid"') ||
                item['stripe_metadata']
                    .toString()
                    .contains('"checkout.session.completed"') ||
                item['stripe_metadata']
                    .toString()
                    .contains('"checkout_session_id"')));

    final isPending =
        paymentStatus == 'pending' || status == 'pending' || status == 'open';
    if (isPending) return 'pending';

    final stripeMeta = parseStripeMetadata(item['stripe_metadata']);
    final nowUtc = DateTime.now().toUtc();
    final activationAt = parseAnyDate(item['activation_at']) ??
        parseAnyDate(item['start_time']) ??
        parseAnyDate(stripeMeta['activation_at']) ??
        parseAnyDate(stripeMeta['check_in']);
    final endTime =
        parseAnyDate(item['end_time']) ?? parseAnyDate(item['exit_time']);

    if (endTime != null && nowUtc.isAfter(endTime)) {
      return 'expired';
    }
    if (activationAt != null && nowUtc.isBefore(activationAt)) {
      return 'inactive';
    }
    return isPaid ? 'active' : 'inactive';
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
        return {
          ...item,
          'ui_type': type,
          'ui_effective_status': effectiveStatus,
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
    // V14: Extract metadata for search if available
    String? metadataEmail;
    String? metadataMobile;
    String? couponCode;
    try {
      if (item['stripe_metadata'] != null) {
        final metaStr = item['stripe_metadata'].toString();
        if (metaStr.startsWith('{')) {
          final metaJson = jsonDecode(metaStr);
          metadataEmail = metaJson['email']?.toString();
          metadataMobile = metaJson['mobile']?.toString();
          couponCode = metaJson['coupon_code']?.toString();
        }
      }
    } catch (_) {}

    final plate = (item['plate'] ?? '').toString().toLowerCase();
    // Support both guest (email/mobile) and subscriber (contact_email/contact_phone) fields + metadata
    final email =
        (item['email'] ?? item['contact_email'] ?? metadataEmail ?? '')
            .toString()
            .toLowerCase();
    final mobile =
        (item['mobile'] ?? item['contact_phone'] ?? metadataMobile ?? '')
            .toString()
            .toLowerCase();
    final name = (item['contact_name'] ?? '').toString().toLowerCase();
    final locationDisplayId =
        (item['location_display_id'] ?? '').toString().toLowerCase();
    final coupon =
        (item['coupon_code'] ?? couponCode ?? '').toString().toLowerCase();

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

    final paymentStatus =
        (item['payment_status'] ?? '').toString().trim().toLowerCase();
    final status = (item['status'] ?? '').toString().trim().toLowerCase();
    final effectiveStatus =
        (item['ui_effective_status'] ?? '').toString().toLowerCase();
    final isPending = effectiveStatus == 'pending' ||
        paymentStatus == 'pending' ||
        status == 'pending' ||
        status == 'open';
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

    if (filter == 'Active') return isActive || isPending;
    if (filter == 'Inactive') {
      return effectiveStatus == 'inactive' || effectiveStatus == 'expired';
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
