import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/management/repositories/parking_repository.dart';
import 'auth_providers.dart';

class DashboardAnalytics {
  final double dailyRevenue;
  final double monthlyRevenueAvg;
  final double dailyOccupancy;
  final double monthlyOccupancyAvg;
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

final analyticsProvider = Provider<AsyncValue<DashboardAnalytics>>((ref) {
  final sessionsAsync = ref.watch(sessionsStreamProvider);
  final permitsAsync = ref.watch(permitsStreamProvider);
  final violationsAsync = ref.watch(violationsStreamProvider);
  final locationsAsync = ref.watch(locationsStreamProvider);

  if (sessionsAsync.isLoading || permitsAsync.isLoading || violationsAsync.isLoading || locationsAsync.isLoading) {
    return const AsyncValue.loading();
  }

  if (sessionsAsync.hasError || permitsAsync.hasError || violationsAsync.hasError) {
    return AsyncValue.error('Error loading analytics', StackTrace.current);
  }

  final sessions = sessionsAsync.value ?? [];
  final permits = permitsAsync.value ?? [];
  final violations = violationsAsync.value ?? [];
  final locations = locationsAsync.value ?? [];
  
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final startOfMonth = DateTime(now.year, now.month, 1);
  final daysInMonth = now.day;

  // 1. REVENUE CALCULATIONS
  double dailyRev = 0;
  double monthlyRev = 0;
  double finesRev = 0;
  double normalRev = 0;

  // Guest Sessions Revenue
  for (var s in sessions) {
    final date = DateTime.tryParse(s['created_at']?.toString() ?? '') ?? DateTime(2000);
    final price = double.tryParse(s['price']?.toString() ?? '0') ?? 0.0;
    
    if (s['payment_status'] == 'paid') {
      if (date.isAfter(today)) dailyRev += price;
      if (date.isAfter(startOfMonth)) monthlyRev += price;
      normalRev += price;
    }
  }

  // Subscription Revenue (Estimated monthly)
  for (var p in permits) {
    final price = double.tryParse(p['price']?.toString() ?? '0') ?? 0.0;
    if (p['status'] == 'active') {
      monthlyRev += price;
      normalRev += price;
      // Daily portion of subscription
      dailyRev += price / 30;
    }
  }

  // Fines Revenue
  for (var v in violations) {
    final date = DateTime.tryParse(v['issued_at']?.toString() ?? '') ?? DateTime(2000);
    final amount = double.tryParse(v['fine_amount']?.toString() ?? '0') ?? 0.0;
    if (v['status'] == 'paid') {
      if (date.isAfter(today)) dailyRev += amount;
      if (date.isAfter(startOfMonth)) monthlyRev += amount;
      finesRev += amount;
    }
  }

  // 2. NET REVENUE (Commission Logic 5-50% depending on package)
  // Logic: 15% flat commission for now as a baseline
  double calculateNet(double gross) => gross * 0.85;
  double netDaily = calculateNet(dailyRev);
  double netMonthly = calculateNet(monthlyRev);

  // 3. OCCUPANCY CALCULATIONS
  double totalSpots = 0;
  for (var loc in locations) {
    totalSpots += (loc['total_spots'] ?? 0).toDouble();
  }
  if (totalSpots == 0) totalSpots = 100; // Fallback

  int activeSessions = sessions.where((s) => s['status'] == 'active').length;
  int activePermits = permits.where((p) => p['status'] == 'active').length;
  double dailyOcc = ((activeSessions + activePermits) / totalSpots) * 100;
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
