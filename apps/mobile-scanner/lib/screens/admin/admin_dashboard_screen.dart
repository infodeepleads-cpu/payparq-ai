import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
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
              _buildFilterButton(Lang.sel(isHr, 'All', 'Sve')),
              const SizedBox(width: 12),
              _buildFilterButton(Lang.sel(isHr, 'Active', 'Aktivno')),
              const SizedBox(width: 12),
              _buildFilterButton(Lang.sel(isHr, 'Inactive', 'Neaktivno')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterButton(String label) {
    final selectedFilter = ref.watch(dashboardFilterProvider);
    final isSelected = selectedFilter == label;
    final isDesktop = MediaQuery.of(context).size.width >= 1100;

    return InkWell(
      onTap: () {
        ref.read(dashboardFilterProvider.notifier).state = label;
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
    final profile = ref.watch(userProfileProvider).value;
    final isAdmin = profile?['role'] == 'admin';
    final isHr = ref.watch(localeIsCroatianProvider);

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

  Widget _buildFirstTimeAdminView() {
    final isHr = ref.watch(localeIsCroatianProvider);
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
            Lang.sel(isHr, 'Welcome to PayParq!', 'Dobrodošli u PayParq!'),
            style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(Lang.sel(
              isHr,
              'To get started, you need to register your first lot.',
              'Za početak, potrebno je registrirati vaše prvo parkiralište.')),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {
              // Navigate to Add Location tab (index 4)
              // This is a bit tricky since we are in MasterScaffold.
              // In a real app we'd use a router or a callback.
              // For now, let's just show a message.
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                    content: Text(Lang.sel(
                        isHr,
                        'Please click "Add Location" in the sidebar.',
                        'Molimo kliknite "Dodaj lokaciju" u bočnoj traci.'))),
              );
            },
            icon: const Icon(Icons.add),
            label: Text(Lang.sel(
                isHr, 'Register First Lot', 'Registriraj prvo parkiralište')),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4)),
            ),
          ),
        ],
      ),
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
    final isHr = ref.watch(localeIsCroatianProvider);
    final plate = s['plate'] ?? 'UNKNOWN';
    final isPaid = s['payment_status'] == 'paid' || s['status'] == 'active';

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
                      Text(
                        s['contact_name'] ??
                            s['email'] ??
                            s['contact_email'] ??
                            'Guest User',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        s['mobile'] ?? s['contact_phone'] ?? 'N/A',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
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
                    child: const Text('View', style: TextStyle(fontSize: 11)),
                  ),
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
            s['contact_name'] ??
                s['email'] ??
                s['contact_email'] ??
                Lang.sel(isHr, 'Guest User', 'Gost korisnik'),
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
            s['mobile'] ?? s['contact_phone'] ?? 'N/A',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildStatusBadge(isPaid ? 'ACTIVE' : 'INACTIVE', isPaid),
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
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => pass_detail.PassDetailScreen(
          permit: s['ui_type'] == 'SUB'
              ? s
              : {
                  ...s,
                  'type': 'guest_session',
                  'start_time': s['entry_time'] ??
                      s['created_at'] ??
                      DateTime.now().toIso8601String(),
                  'end_time': DateTime.now().toIso8601String(),
                  'price':
                      double.tryParse(s['price']?.toString() ?? '0') ?? 0.0,
                },
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status, bool isPaid) {
    final isHr = ref.watch(localeIsCroatianProvider);
    final dotColor = isPaid ? Colors.green[400] : Colors.red[400];
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
