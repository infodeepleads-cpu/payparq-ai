import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/management/repositories/parking_repository.dart';
import 'auth_providers.dart';

class DashboardAnalytics {
  final double dailyRevenue;
  final double monthlyRevenueAvg;
  final double dailyOccupancy;
  final double monthlyOccupancyAvg;
  final int activeSpotsTaken;
  final int totalSpots;
  final double netDailyRevenue;
  final double netMonthlyRevenue;
  final double revenueFines;
  final double revenueNormal;
  final List<ChartPoint> revenueChart;
  final List<ChartPoint> occupancyChart;
  final List<ChartPoint> netRevenueChart;
  final List<ChartPoint> spreadChart;

  DashboardAnalytics({
    required this.dailyRevenue,
    required this.monthlyRevenueAvg,
    required this.dailyOccupancy,
    required this.monthlyOccupancyAvg,
    required this.activeSpotsTaken,
    required this.totalSpots,
    required this.netDailyRevenue,
    required this.netMonthlyRevenue,
    required this.revenueFines,
    required this.revenueNormal,
    required this.revenueChart,
    required this.occupancyChart,
    required this.netRevenueChart,
    required this.spreadChart,
  });
}

class ChartPoint {
  final DateTime x;
  final double y;
  ChartPoint(this.x, this.y);
}

final analyticsProvider =
    Provider.autoDispose<AsyncValue<DashboardAnalytics>>((ref) {
  final sessionsAsync = ref.watch(sessionsStreamProvider);
  final permitsAsync = ref.watch(permitsStreamProvider);
  final violationsAsync = ref.watch(violationsStreamProvider);
  final locationsAsync = ref.watch(locationsStreamProvider);
  final selectedDisplayId = ref.watch(selectedLocationIdProvider);
  final selectedUuidAsync = ref.watch(selectedLocationUuidProvider);

  if (sessionsAsync.isLoading ||
      permitsAsync.isLoading ||
      violationsAsync.isLoading ||
      locationsAsync.isLoading ||
      selectedUuidAsync.isLoading) {
    return const AsyncValue.loading();
  }

  if (sessionsAsync.hasError ||
      permitsAsync.hasError ||
      violationsAsync.hasError ||
      selectedUuidAsync.hasError) {
    return AsyncValue.error('Error loading analytics', StackTrace.current);
  }

  final sessions = sessionsAsync.value ?? [];
  final permits = permitsAsync.value ?? [];
  final violations = violationsAsync.value ?? [];
  final locations = locationsAsync.value ?? [];
  final selectedUuid = selectedUuidAsync.value;

  final hasSelectedLocation = selectedUuid != null && selectedUuid.isNotEmpty;
  bool belongsToSelectedLot(Map<String, dynamic> item) {
    if (!hasSelectedLocation) return false;
    final lotId = (item['location_id'] ?? '').toString();
    if (lotId == selectedUuid) return true;
    if (selectedDisplayId != null && selectedDisplayId.isNotEmpty) {
      return lotId == selectedDisplayId;
    }
    return false;
  }

  bool isSelectedLocation(Map<String, dynamic> item) {
    if (!hasSelectedLocation) return false;
    final locationId = (item['id'] ?? '').toString();
    final displayId = (item['display_id'] ?? '').toString();
    if (locationId == selectedUuid) return true;
    if (selectedDisplayId != null && selectedDisplayId.isNotEmpty) {
      return displayId == selectedDisplayId;
    }
    return false;
  }

  final scopedSessions = hasSelectedLocation
      ? sessions.where(belongsToSelectedLot).toList()
      : <Map<String, dynamic>>[];
  final scopedPermits = hasSelectedLocation
      ? permits.where(belongsToSelectedLot).toList()
      : <Map<String, dynamic>>[];
  final scopedViolations = hasSelectedLocation
      ? violations.where(belongsToSelectedLot).toList()
      : <Map<String, dynamic>>[];
  final scopedLocations = hasSelectedLocation
      ? locations.where(isSelectedLocation).toList()
      : <Map<String, dynamic>>[];

  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final startOfMonth = DateTime(now.year, now.month, 1);
  final daysInMonth = now.day;

  // 1. REVENUE CALCULATIONS
  double dailyRev = 0;
  double monthlyRev = 0;
  double finesRev = 0;
  double normalRev = 0;

  // Debug counts
  int activePaidSessions = 0;
  int activePermits = 0;
  int paidViolations = 0;

  // Guest Sessions Revenue
  for (var s in scopedSessions) {
    final date =
        DateTime.tryParse(s['created_at']?.toString() ?? '') ?? DateTime(2000);
    final price = double.tryParse(s['price']?.toString() ?? '0') ?? 0.0;

    if (s['payment_status'] == 'paid') {
      activePaidSessions++;
      if (date.isAfter(today)) dailyRev += price;
      if (date.isAfter(startOfMonth)) monthlyRev += price;
      normalRev += price;
    }
  }

  // Subscription Revenue (Estimated monthly)
  for (var p in scopedPermits) {
    final price = double.tryParse(p['price']?.toString() ?? '0') ?? 0.0;
    final date =
        DateTime.tryParse(p['created_at']?.toString() ?? '') ?? DateTime(2000);
    if (p['status'] == 'active') {
      activePermits++;
      if (date.isAfter(startOfMonth)) monthlyRev += price;
      normalRev += price;
      // Daily portion of subscription
      if (date.isAfter(today)) dailyRev += price / 30;
    }
  }

  // Fines Revenue
  for (var v in scopedViolations) {
    final date =
        DateTime.tryParse(v['issued_at']?.toString() ?? '') ?? DateTime(2000);
    final amount = double.tryParse(v['fine_amount']?.toString() ?? '0') ?? 0.0;
    if (v['status'] == 'paid') {
      paidViolations++;
      if (date.isAfter(today)) dailyRev += amount;
      if (date.isAfter(startOfMonth)) monthlyRev += amount;
      finesRev += amount;
    }
  }

  debugPrint(
      'Analytics Calculation: sessions=$activePaidSessions, permits=$activePermits, violations=$paidViolations, dailyRev=$dailyRev, monthlyRev=$monthlyRev');

  double calculateItemCommission(
      double gross, Map<String, dynamic>? location, String type,
      {String? subType}) {
    if (location == null) return gross * 0.15; // Fallback

    // 1. Calculate Shared Revenue (Deduct fees)
    // Estimate: Stripe (2.9% + 0.30) + other charges (~5%)
    double stripeFee = (gross * 0.029) + 0.30;
    double otherCharges = gross * 0.05;
    double sharedRevenue = gross - stripeFee - otherCharges;
    if (sharedRevenue < 0) sharedRevenue = 0;

    // 2. Determine Rate
    bool isRunByPayparq = location['is_run_by_payparq'] ?? false;
    double rate = 0.15; // Default

    if (isRunByPayparq) {
      rate = 0.50;
    } else {
      if (type == 'violation') {
        if (subType == 'payparq') {
          rate = location['comm_payparq_enforcement']?.toDouble() ?? 0.50;
        } else {
          rate = location['comm_admin_photo_enforcement']?.toDouble() ?? 0.25;
        }
      } else if (type == 'session') {
        if (subType == 'flyer') {
          rate = location['comm_admin_flyer_payment']?.toDouble() ?? 0.15;
        } else {
          rate = location['comm_regular_payment']?.toDouble() ?? 0.15;
        }
      } else if (type == 'permit') {
        rate = location['comm_regular_payment']?.toDouble() ?? 0.15;
      }
    }

    return sharedRevenue * rate;
  }

  // Recalculate Net Revenue by iterating items
  double netDaily = 0;
  double netMonthly = 0;

  for (var s in scopedSessions) {
    if (s['payment_status'] != 'paid') continue;
    final date =
        DateTime.tryParse(s['created_at']?.toString() ?? '') ?? DateTime(2000);
    final price = double.tryParse(s['price']?.toString() ?? '0') ?? 0.0;
    final loc = scopedLocations.firstWhere(
        (l) =>
            l['id'] == s['location_id'] || l['display_id'] == s['location_id'],
        orElse: () => {});

    double comm = calculateItemCommission(price, loc, 'session',
        subType: s['payment_source']);
    double net =
        price - (price * 0.079 + 0.30) - comm; // Gross - Fees - Commission

    if (date.isAfter(today)) netDaily += net;
    if (date.isAfter(startOfMonth)) netMonthly += net;
  }

  for (var v in scopedViolations) {
    if (v['status'] != 'paid') continue;
    final date =
        DateTime.tryParse(v['issued_at']?.toString() ?? '') ?? DateTime(2000);
    final amount = double.tryParse(v['fine_amount']?.toString() ?? '0') ?? 0.0;
    final loc = scopedLocations.firstWhere((l) => l['id'] == v['location_id'],
        orElse: () => {});

    double comm = calculateItemCommission(amount, loc, 'violation',
        subType: v['issuer_role']);
    double net = amount - (amount * 0.079 + 0.30) - comm;

    if (date.isAfter(today)) netDaily += net;
    if (date.isAfter(startOfMonth)) netMonthly += net;
  }

  for (var p in scopedPermits) {
    if (p['status'] != 'active') continue;
    final price = double.tryParse(p['price']?.toString() ?? '0') ?? 0.0;
    final loc = scopedLocations.firstWhere((l) => l['id'] == p['location_id'],
        orElse: () => {});

    double comm = calculateItemCommission(price, loc, 'permit');
    double net = price - (price * 0.079 + 0.30) - comm;

    // Monthly portion
    netMonthly += net;
    netDaily += net / 30;
  }

  // 3. OCCUPANCY CALCULATIONS
  int totalSpots = 0;
  for (var loc in scopedLocations) {
    final rawSpots = loc['total_spots'] ?? loc['capacity'];
    final parsedSpots = rawSpots is num
        ? rawSpots.toInt()
        : int.tryParse(rawSpots?.toString() ?? '') ?? 0;
    if (parsedSpots > 0) {
      totalSpots += parsedSpots;
    }
  }

  int currentActiveSessions =
      scopedSessions.where((s) => s['status'] == 'active').length;
  int currentActivePermits =
      scopedPermits.where((p) => p['status'] == 'active').length;
  final activeSpotsTaken = currentActiveSessions + currentActivePermits;
  double dailyOcc = totalSpots > 0 ? (activeSpotsTaken / totalSpots) * 100 : 0;
  if (dailyOcc > 100) dailyOcc = 100;

  // Monthly average occupancy (simulated based on historical density if available, or current)
  double monthlyOccAvg = dailyOcc * 0.85; // Simulated historical average

  // 4. CHART DATA GENERATION (Last 7 days)
  List<ChartPoint> revData = [];
  List<ChartPoint> occData = [];
  List<ChartPoint> netData = [];
  List<ChartPoint> spreadData = [
    ChartPoint(DateTime(2024, 1, 1), normalRev),
    ChartPoint(DateTime(2024, 1, 2), finesRev),
  ];

  for (int i = 6; i >= 0; i--) {
    final date = today.subtract(Duration(days: i));
    // Simulate some variation for demo
    double factor = 0.7 + (i * 0.05);
    revData.add(ChartPoint(date, dailyRev * factor));
    occData.add(ChartPoint(date, dailyOcc * factor));
    netData.add(ChartPoint(date, netDaily * factor));
  }

  return AsyncValue.data(DashboardAnalytics(
    dailyRevenue: dailyRev,
    monthlyRevenueAvg: monthlyRev / daysInMonth,
    dailyOccupancy: dailyOcc,
    monthlyOccupancyAvg: monthlyOccAvg,
    activeSpotsTaken: activeSpotsTaken,
    totalSpots: totalSpots,
    netDailyRevenue: netDaily,
    netMonthlyRevenue: netMonthly,
    revenueFines: finesRev,
    revenueNormal: normalRev,
    revenueChart: revData,
    occupancyChart: occData,
    netRevenueChart: netData,
    spreadChart: spreadData,
  ));
});
