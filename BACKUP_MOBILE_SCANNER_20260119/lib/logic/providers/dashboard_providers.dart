import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/management/repositories/parking_repository.dart';

/// Provider for the search query in the dashboard.
final dashboardSearchProvider = StateProvider<String>((ref) => '');

/// Provider for the selected filter in the dashboard.
final dashboardFilterProvider = StateProvider<String>((ref) => 'All');

/// Unified provider that merges Permits (Subscribers) and Guest Sessions.
final unifiedDashboardProvider =
    Provider<AsyncValue<List<Map<String, dynamic>>>>((ref) {
  final sessionsAsync = ref.watch(sessionsStreamProvider);
  final permitsAsync = ref.watch(permitsStreamProvider);
  final search = ref.watch(dashboardSearchProvider).toLowerCase();
  final filter = ref.watch(dashboardFilterProvider);

  // Helper to extract data or return empty list on error/loading
  List<Map<String, dynamic>> extractData(
      AsyncValue<List<Map<String, dynamic>>> asyncVal, String type) {
    return asyncVal.maybeWhen(
      data: (data) => data.map((item) => {...item, 'ui_type': type}).toList(),
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
    final plate = (item['plate'] ?? '').toString().toLowerCase();
    // Support both guest (email/mobile) and subscriber (contact_email/contact_phone) fields
    final email =
        (item['email'] ?? item['contact_email'] ?? '').toString().toLowerCase();
    final mobile = (item['mobile'] ?? item['contact_phone'] ?? '')
        .toString()
        .toLowerCase();
    final name = (item['contact_name'] ?? '').toString().toLowerCase();

    final matchesSearch = plate.contains(search) ||
        email.contains(search) ||
        mobile.contains(search) ||
        name.contains(search);

    if (!matchesSearch) return false;

    final isPaid =
        item['payment_status'] == 'paid' || item['status'] == 'active';
    if (filter == 'Active') return isPaid;
    if (filter == 'Inactive') return !isPaid;

    return true;
  }).toList();

  // Sort by created_at
  filtered.sort((a, b) {
    final dateA =
        DateTime.tryParse(a['created_at']?.toString() ?? '') ?? DateTime(2000);
    final dateB =
        DateTime.tryParse(b['created_at']?.toString() ?? '') ?? DateTime(2000);
    return dateB.compareTo(dateA);
  });

  return AsyncValue.data(filtered);
});
