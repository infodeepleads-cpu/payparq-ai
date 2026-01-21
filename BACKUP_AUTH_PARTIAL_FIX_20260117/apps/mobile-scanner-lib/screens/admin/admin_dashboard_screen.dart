import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme.dart';
import '../../features/management/screens/pass_detail_screen.dart';
import '../../features/management/repositories/parking_repository.dart';
import '../../widgets/skeleton_loader.dart';
import '../../logic/providers/dashboard_providers.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() =>
      _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 1100;

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: isDesktop
          ? null
          : AppBar(
              backgroundColor: AppTheme.primary,
              title: Text(
                'Dashboard',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              elevation: 0,
            ),
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
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Dashboard',
            style: GoogleFonts.inter(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Monitor all parking sessions and activity.',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          _buildSearchAndFilter(isDesktop),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter(bool isDesktop) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchController,
            onChanged: (v) =>
                ref.read(dashboardSearchProvider.notifier).state = v,
            decoration: InputDecoration(
              hintText: 'Search plate, email, or name...',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        _buildFilterChip('All', isDesktop),
        const SizedBox(width: 8),
        _buildFilterChip('Active', isDesktop),
        const SizedBox(width: 8),
        _buildFilterChip('Inactive', isDesktop),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    bool isLoading = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                isLoading
                    ? const SkeletonLoader(width: 60, height: 24)
                    : Text(
                        value,
                        style: GoogleFonts.inter(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: Colors.black,
                        ),
                      ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOccupancyCard() {
    final locsAsync = ref.watch(locationsStreamProvider);
    return locsAsync.when(
      data: (locs) {
        final occ =
            locs.fold<int>(0, (acc, e) => acc + ((e['occupancy'] ?? 0) as int));
        final total = locs.fold<int>(
            0, (acc, e) => acc + ((e['total_spots'] ?? 0) as int));
        return _buildStatCard(
          title: 'Occupancy',
          value: '$occ/$total',
          icon: Icons.pie_chart_outline,
          color: AppTheme.primary,
        );
      },
      loading: () => _buildStatCard(
        title: 'Occupancy',
        value: '...',
        icon: Icons.pie_chart_outline,
        color: AppTheme.primary,
        isLoading: true,
      ),
      error: (e, _) => _buildStatCard(
        title: 'Occupancy',
        value: 'Error',
        icon: Icons.error_outline,
        color: Colors.red,
      ),
    );
  }

  Widget _buildRevenueCard() {
    return _buildStatCard(
      title: 'Daily Revenue',
      value: '€1,240',
      icon: Icons.account_balance_wallet_outlined,
      color: Colors.green,
    );
  }

  Widget _buildActiveSessionsCard() {
    final sessionsAsync = ref.watch(sessionsStreamProvider);
    return sessionsAsync.when(
      data: (sessions) {
        final activeCount =
            sessions.where((s) => s['payment_status'] == 'paid').length;
        return _buildStatCard(
          title: 'Active Sessions',
          value: activeCount.toString(),
          icon: Icons.local_parking_outlined,
          color: Colors.blue,
        );
      },
      loading: () => _buildStatCard(
        title: 'Active Sessions',
        value: '...',
        icon: Icons.local_parking_outlined,
        color: Colors.blue,
        isLoading: true,
      ),
      error: (e, _) => _buildStatCard(
        title: 'Active Sessions',
        value: 'Error',
        icon: Icons.error_outline,
        color: Colors.red,
      ),
    );
  }

  Widget _buildViolationsCard() {
    return _buildStatCard(
      title: 'Violations',
      value: '3',
      icon: Icons.warning_amber_rounded,
      color: Colors.orange,
    );
  }

  Widget _buildTab(String title, bool active) {
    return InkWell(
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: active ? AppTheme.primary : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            color: active ? AppTheme.primary : Colors.grey[500],
          ),
        ),
      ),
    );
  }

  Widget _buildLastUpdated() {
    return Row(
      children: [
        const Icon(Icons.sync, size: 14, color: Colors.grey),
        const SizedBox(width: 4),
        Text(
          'Last updated: Just now',
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
        ),
      ],
    );
  }

  Widget _buildDataList(bool isDesktop) {
    final unifiedDataAsync = ref.watch(unifiedDashboardProvider);

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
                  'No sessions or subscribers found.',
                  style:
                      GoogleFonts.inter(color: Colors.grey[500], fontSize: 16),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            // Streams update automatically, but this provides a familiar UX
            ref.invalidate(unifiedDashboardProvider);
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(24),
            itemCount: items.length,
            itemBuilder: (context, index) =>
                _buildSessionItem(items[index], isDesktop),
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
            const SizedBox(height: 16),
            Text('Error loading data: $e',
                style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.invalidate(unifiedDashboardProvider),
              child: const Text('Retry Connection'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionItem(Map<String, dynamic> s, bool isDesktop) {
    final plate = s['plate'] ?? 'UNKNOWN';
    final type = s['ui_type'] ?? 'GUEST';

    // Support both guest and sub field names
    final userDetail = s['email'] ??
        s['contact_email'] ??
        s['mobile'] ??
        s['contact_phone'] ??
        'Guest User';
    final name = s['contact_name'];

    final price = s['price'] ?? '0.00';
    final isPaid = s['payment_status'] == 'paid' || s['status'] == 'active';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: type == 'SUB' ? Colors.purple[50] : Colors.blue[50],
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              type == 'SUB'
                  ? Icons.badge_outlined
                  : Icons.directions_car_filled_outlined,
              color: type == 'SUB' ? Colors.purple : Colors.blue,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      plate,
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: isPaid ? Colors.black : Colors.grey[600],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: type == 'SUB'
                            ? Colors.purple[100]
                            : Colors.blue[100],
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        type,
                        style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: type == 'SUB'
                                ? Colors.purple[700]
                                : Colors.blue[700]),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  name != null ? '$name ($userDetail)' : userDetail,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
          if (isDesktop) ...[
            _buildInfoColumn('Amount', type == 'SUB' ? 'Monthly' : '€$price'),
            const SizedBox(width: 40),
            _buildInfoColumn(
                'Source', type == 'SUB' ? 'Permit' : 'Stripe Checkout'),
            const SizedBox(width: 40),
          ],
          _buildStatusBadge(isPaid ? 'ACTIVE' : 'INACTIVE', isPaid),
          const SizedBox(width: 16),
          OutlinedButton(
            onPressed: () {
              // If it's a SUB, we can show details. For GUEST, we'll show what we have.
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => PassDetailScreen(
                    permit: type == 'SUB'
                        ? s
                        : {
                            ...s,
                            'type': 'guest_session',
                            'start_time': s['entry_time'] ??
                                s['created_at'] ??
                                DateTime.now().toIso8601String(),
                            'end_time': DateTime.now()
                                .toIso8601String(), // Guests usually don't have end time yet
                            'price': double.tryParse(
                                    s['price']?.toString() ?? '0') ??
                                0.0,
                          },
                  ),
                ),
              );
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.grey),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            child: const Text('View',
                style: TextStyle(
                    color: Colors.black, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: Colors.grey[400],
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status, bool isPaid) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isPaid ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: (isPaid ? const Color(0xFF10B981) : const Color(0xFFEF4444))
              .withOpacity(0.1),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: isPaid ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            status,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isPaid ? const Color(0xFF059669) : const Color(0xFFB91C1C),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isDesktop) {
    final selectedFilter = ref.watch(dashboardFilterProvider);
    final isSelected = selectedFilter == label;

    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (v) =>
          ref.read(dashboardFilterProvider.notifier).state = label,
      selectedColor: AppTheme.primary,
      labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
      backgroundColor: Colors.white,
    );
  }
}
