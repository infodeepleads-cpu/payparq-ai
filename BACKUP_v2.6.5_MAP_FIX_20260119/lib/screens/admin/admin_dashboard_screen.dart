import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme.dart';
import '../../features/management/screens/pass_detail_screen.dart';
import '../../features/management/repositories/parking_repository.dart';
import '../../widgets/skeleton_loader.dart';
import '../../logic/providers/dashboard_providers.dart';
import '../../logic/providers/auth_providers.dart';

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

    // Watch global lot selection to force a data refresh if it changes
    ref.listen(selectedLocationIdProvider, (previous, next) {
      if (next != null && next != previous) {
        ref.invalidate(unifiedDashboardProvider);
      }
    });

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
      padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 48),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Dashboard',
                    style: GoogleFonts.inter(
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Monitor all parking activity and lot occupancy in real-time.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 48),
          _buildSearchAndFilter(isDesktop),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter(bool isDesktop) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 400,
          child: TextField(
            controller: _searchController,
            onChanged: (v) =>
                ref.read(dashboardSearchProvider.notifier).state = v,
            decoration: InputDecoration(
              hintText: 'Search',
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
        const SizedBox(height: 24),
        Row(
          children: [
            _buildFilterButton('All'),
            const SizedBox(width: 12),
            _buildFilterButton('Active'),
            const SizedBox(width: 12),
            _buildFilterButton('Inactive'),
          ],
        ),
      ],
    );
  }

  Widget _buildFilterButton(String label) {
    final selectedFilter = ref.watch(dashboardFilterProvider);
    final isSelected = selectedFilter == label;

    return InkWell(
      onTap: () => ref.read(dashboardFilterProvider.notifier).state = label,
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
    final availableLocsAsync = ref.watch(availableLocationsProvider);
    final profile = ref.watch(userProfileProvider).value;
    final isAdmin = profile?['role'] == 'admin';

    return availableLocsAsync.when(
      data: (locs) {
        if (locs.isEmpty && isAdmin) {
          return _buildFirstTimeAdminView();
        }

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
                      style: GoogleFonts.inter(
                          color: Colors.grey[500], fontSize: 16),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
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
          error: (e, _) => _buildErrorView(e.toString()),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _buildErrorView(e.toString()),
    );
  }

  Widget _buildFirstTimeAdminView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.add_location_alt_outlined,
                size: 64, color: Colors.blue),
          ),
          const SizedBox(height: 24),
          Text(
            'Welcome to PayParq!',
            style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text('To get started, you need to register your first lot.'),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {
              // Navigate to Add Location tab (index 4)
              // This is a bit tricky since we are in MasterScaffold.
              // In a real app we'd use a router or a callback.
              // For now, let's just show a message.
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content:
                        Text('Please click "Add Location" in the sidebar.')),
              );
            },
            icon: const Icon(Icons.add),
            label: const Text('Register First Lot'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_outlined,
                size: 48, color: Colors.orangeAccent),
            const SizedBox(height: 16),
            Text('Syncing data...',
                style:
                    GoogleFonts.inter(color: Colors.grey[600], fontSize: 16)),
            const SizedBox(height: 8),
            Text('We are having trouble connecting to the live stream.',
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
              label: const Text('Retry Connection'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionItem(Map<String, dynamic> s, bool isDesktop) {
    final plate = s['plate'] ?? 'UNKNOWN';
    final isPaid = s['payment_status'] == 'paid' || s['status'] == 'active';

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
          SizedBox(
            width: 160, // Standardized width for alignment
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(4),
              ),
              alignment: Alignment.center,
              child: Text(
                plate.toUpperCase(),
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: isDesktop
                ? Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: _buildInfoColumn(
                            'Amount',
                            s['ui_type'] == 'SUB'
                                ? 'Monthly'
                                : '€${s['price']}'),
                      ),
                      Expanded(
                        flex: 3,
                        child: _buildInfoColumn(
                            'User',
                            s['contact_name'] ??
                                s['email'] ??
                                s['contact_email'] ??
                                'Guest User'),
                      ),
                      Expanded(
                        flex: 3,
                        child: _buildInfoColumn('Phone',
                            s['mobile'] ?? s['contact_phone'] ?? 'N/A'),
                      ),
                      Expanded(
                        flex: 4,
                        child: _buildInfoColumn(
                            'Email', s['email'] ?? s['contact_email'] ?? 'N/A'),
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s['contact_name'] ??
                            s['email'] ??
                            s['contact_email'] ??
                            'Guest User',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                      Text(
                        '${s['mobile'] ?? s['contact_phone'] ?? 'N/A'} • ${s['email'] ?? s['contact_email'] ?? 'N/A'}',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
          ),
          _buildStatusBadge(isPaid ? 'ACTIVE' : 'INACTIVE', isPaid),
          const SizedBox(width: 24),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => PassDetailScreen(
                    permit: s['ui_type'] == 'SUB'
                        ? s
                        : {
                            ...s,
                            'type': 'guest_session',
                            'start_time': s['entry_time'] ??
                                s['created_at'] ??
                                DateTime.now().toIso8601String(),
                            'end_time': DateTime.now().toIso8601String(),
                            'price': double.tryParse(
                                    s['price']?.toString() ?? '0') ??
                                0.0,
                          },
                  ),
                ),
              );
            },
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
              color: isPaid ? Colors.black : Colors.grey[300],
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            status,
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
