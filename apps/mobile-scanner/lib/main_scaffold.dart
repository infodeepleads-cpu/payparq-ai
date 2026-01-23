import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../responsive/responsive_layout.dart';
import '../logic/providers/auth_providers.dart';
import '../logic/providers/update_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/pulsating_loading_screen.dart';
import '../screens/hud_screen.dart'; // Mobile Scanner
import '../screens/admin/admin_dashboard_screen.dart'; // Users List
import '../features/enforcement/screens/cases_list_view.dart';
import '../features/enforcement/screens/upload_case_form.dart';
import '../features/management/screens/passes_list_screen.dart';
import '../features/management/screens/locations_screen.dart';
import '../features/management/screens/add_staff_screen.dart';
import '../features/intelligence/screens/dynamic_pricing_screen.dart';
import '../features/intelligence/screens/analytics_dashboard_screen.dart';
import '../features/intelligence/screens/finance_screen.dart';
import '../features/management/screens/verification_inbox_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/ocr_test_screen.dart';
import '../theme.dart';

class MasterScaffold extends ConsumerStatefulWidget {
  const MasterScaffold({super.key});

  @override
  ConsumerState<MasterScaffold> createState() => _MasterScaffoldState();
}

class _MasterScaffoldState extends ConsumerState<MasterScaffold> {
  // Default to 2 (Main Dashboard) to match new order
  int _selectedIndex = 2;

  @override
  void initState() {
    super.initState();
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Widget _getDesktopPage(int index) {
    switch (index) {
      case 0:
        return const CasesListView();
      case 1:
        return const OCRScanScreen();
      case 2:
        return const AdminDashboardScreen();
      case 3:
        return const PassesListScreen();
      case 4:
        return const LocationsScreen();
      case 5:
        return const AddStaffScreen();
      case 6:
        return const DynamicPricingScreen();
      case 7:
        return const AnalyticsDashboardScreen();
      case 8:
        return const SettingsScreen();
      case 9:
        return const FinanceScreen();
      case 10:
        return const VerificationInboxScreen();
      default:
        return const AdminDashboardScreen();
    }
  }

  Future<void> _handleLogout() async {
    // 1. Reset all lot-related state
    ref.read(selectedLocationIdProvider.notifier).state = null;

    // 2. Invalidate critical providers to clear caches
    ref.invalidate(userProfileProvider);
    ref.invalidate(availableLocationsProvider);
    ref.invalidate(authStateProvider);

    // 3. Sign out from Supabase
    await Supabase.instance.client.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    // Force Light Theme for this layout as per design images
    return Theme(
      data: AppTheme.lightTheme,
      child: ResponsiveLayout(
        mobileBody: _buildMobileScaffold(),
        desktopBody: _buildDesktopScaffold(),
      ),
    );
  }

  Widget _buildMobileScaffold() {
    final availableLocsAsync = ref.watch(availableLocationsProvider);
    final selectedLocId = ref.watch(selectedLocationIdProvider);
    final profile = ref.watch(userProfileProvider).value;
    final isOfficer = profile?['role'] == 'officer';

    if (profile == null) return _buildFinalizingScreen();

    final displayLocId = selectedLocId ?? profile?['location_id'];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        centerTitle: false,
        titleSpacing: 20, // Give some breathing room on the left
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('payparq.ai',
                style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                    letterSpacing: -1)),
            if (displayLocId != null)
              Padding(
                padding: const EdgeInsets.only(top: 0),
                child: RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: 'LOT ',
                        style: GoogleFonts.inter(
                          color: Colors.white.withOpacity(0.4),
                          fontWeight: FontWeight.w800,
                          fontSize: 9,
                          letterSpacing: 2.0,
                        ),
                      ),
                      TextSpan(
                        text: displayLocId,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        actions: [
          if (!isOfficer)
            availableLocsAsync.when(
              data: (locs) => locs.isEmpty
                  ? const SizedBox()
                  : IconButton(
                      icon: const Icon(Icons.location_on_outlined,
                          color: Colors.white),
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          shape: const RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.vertical(top: Radius.circular(20)),
                          ),
                          builder: (context) => Container(
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('Select Active Lot',
                                    style: GoogleFonts.inter(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18)),
                                const SizedBox(height: 16),
                                ...locs.map((l) => ListTile(
                                      leading: const Icon(Icons.location_on),
                                      title: Text(l['name']),
                                      subtitle: Text(l['display_id']),
                                      onTap: () {
                                        ref
                                            .read(selectedLocationIdProvider
                                                .notifier)
                                            .state = l['display_id'];
                                        Navigator.pop(context);
                                      },
                                    )),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
              loading: () => const SizedBox(),
              error: (_, __) => const SizedBox(),
            ),
          IconButton(
            icon: const Icon(Icons.logout_outlined, color: Colors.white),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _buildMobileBody(isOfficer),
      bottomNavigationBar: _buildMobileBottomNav(isOfficer),
    );
  }

  Widget _buildMobileBody(bool isOfficer) {
    // Shared indices for both mobile and desktop:
    // 2: Dashboard (Home)
    // 1: Scanner
    // 0: Cases
    return IndexedStack(
      index: _selectedIndex == 2 ? 0 : (_selectedIndex == 1 ? 1 : 2),
      children: const [
        AdminDashboardScreen(),
        HudScreen(),
        CasesListView(),
      ],
    );
  }

  Widget _buildMobileBottomNav(bool isOfficer) {
    return BottomNavigationBar(
      backgroundColor: Colors.white,
      selectedItemColor: AppTheme.primary,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      currentIndex: _selectedIndex == 2 ? 0 : (_selectedIndex == 1 ? 1 : 2),
      onTap: (index) {
        if (index == 0)
          _onItemTapped(2); // Dashboard (Home)
        else if (index == 1)
          _onItemTapped(1); // Scanner
        else if (index == 2) _onItemTapped(0); // Cases
      },
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard_outlined),
          activeIcon: Icon(Icons.dashboard),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.qr_code_scanner_outlined),
          activeIcon: Icon(Icons.qr_code_scanner),
          label: 'Scanner',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.assignment_outlined),
          activeIcon: Icon(Icons.assignment),
          label: 'Cases',
        ),
      ],
    );
  }

  // Desktop: Custom Sidebar Navigation
  Widget _buildDesktopScaffold() {
    final profileAsync = ref.watch(userProfileProvider);

    return profileAsync.when(
      loading: () => const PulsatingLoadingScreen(),
      error: (err, stack) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              Text(
                'Could not load your profile',
                style: GoogleFonts.inter(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Check your connection or contact support.',
                style: GoogleFonts.inter(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () async {
                  await Supabase.instance.client.auth.refreshSession();
                  ref.invalidate(userProfileProvider);
                  ref.invalidate(availableLocationsProvider);
                },
                child: const Text('Retry Connection'),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => Supabase.instance.client.auth.signOut(),
                child: const Text('Sign Out'),
              ),
            ],
          ),
        ),
      ),
      data: (profile) {
        if (profile == null) {
          // If we have a user but no profile, and it's not loading anymore,
          // something is wrong with the database connection.
          return _buildErrorScreen(
              'Account profile not found. Please try signing out and back in.');
        }

        final role = profile['role'] ?? 'guest';
        final isOfficer = role == 'officer';
        final isManager = role == 'manager';
        final isSuperAdmin = role == 'super_admin';
        final isAdmin = role == 'admin';

        // Helper to determine if a menu item should be visible based on role
        bool shouldShow(int index) {
          if (index == 10) return isSuperAdmin; // Verification Inbox
          if (isSuperAdmin || isAdmin) return true;
          if (isManager) {
            // Managers see everything except Add Location (4) and Finance (9)
            return index != 4 && index != 9;
          }
          if (isOfficer) {
            // Officers see: Cases (0), OCR (1), Dashboard (2), Settings (8)
            return [0, 1, 2, 8].contains(index);
          }
          return false;
        }

        return Scaffold(
          backgroundColor: AppTheme.background,
          body: Column(
            children: [
              // Top Header (Pure Black)
              Container(
                height: 64,
                width: double.infinity,
                color: AppTheme.headerBackground,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Center(
                            child: Text(
                              'P',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                height: 1.1,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'payparq.ai',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                    if (!isOfficer) _buildHeaderLocationSelector(),
                  ],
                ),
              ),
              Expanded(
                child: Row(
                  children: [
                    // Sidebar (Dark Gray)
                    Container(
                      width: 260,
                      color: AppTheme.sidebarBackground,
                      child: Column(
                        children: [
                          const SizedBox(height: 24),
                          Expanded(
                            child: ListView(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              children: [
                                if (shouldShow(2))
                                  _buildSidebarItem(
                                      2, 'Home', Icons.dashboard_outlined),
                                if (shouldShow(1))
                                  _buildSidebarItem(1, 'Upload Case',
                                      Icons.drive_folder_upload_outlined),
                                if (shouldShow(0))
                                  _buildSidebarItem(
                                      0, 'Cases', Icons.folder_outlined),
                                if (shouldShow(3) ||
                                    shouldShow(4) ||
                                    shouldShow(5)) ...[
                                  const SizedBox(height: 16),
                                  if (shouldShow(3))
                                    _buildSidebarItem(3, 'Permits',
                                        Icons.card_membership_outlined),
                                  if (shouldShow(4))
                                    _buildSidebarItem(4, 'Locations',
                                        Icons.location_on_outlined),
                                  if (shouldShow(5))
                                    _buildSidebarItem(
                                        5, 'Staff', Icons.people_outline),
                                  if (shouldShow(10))
                                    _buildSidebarItem(
                                        10, 'Inbox', Icons.mail_outline),
                                ],
                                if (shouldShow(6) ||
                                    shouldShow(7) ||
                                    shouldShow(9)) ...[
                                  const SizedBox(height: 16),
                                  if (shouldShow(6))
                                    _buildSidebarItem(6, 'Pricing',
                                        Icons.price_change_outlined),
                                  if (shouldShow(7))
                                    _buildSidebarItem(7, 'Analytics',
                                        Icons.insights_outlined),
                                  if (shouldShow(9))
                                    _buildSidebarItem(9, 'Finance',
                                        Icons.account_balance_outlined),
                                ],
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: _buildSidebarItem(
                                99, 'Sign Out', Icons.logout,
                                onTapOverride: _handleLogout),
                          ),
                          const SizedBox(height: 12),
                          // Profile info at the bottom (Redesigned for perfect alignment)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              children: [
                                ListTile(
                                  mouseCursor: SystemMouseCursors.basic,
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16),
                                  leading: Container(
                                    width: 20,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Icon(Icons.person_outline,
                                        size: 14, color: Colors.white),
                                  ),
                                  title: Text(
                                    profile['name'] ?? 'Admin User',
                                    style: GoogleFonts.inter(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold),
                                  ),
                                  subtitle: Text(
                                    profile['email'] ?? 'admin@payparq.ai',
                                    style: GoogleFonts.inter(
                                        color: Colors.white60,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500),
                                  ),
                                ),
                                const SizedBox(height: 12),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Main Content Area
                    Expanded(
                      child: Column(
                        children: [
                          Expanded(
                            child: IndexedStack(
                              index: _selectedIndex,
                              children: [
                                const CasesListView(),
                                const UploadCaseForm(),
                                const AdminDashboardScreen(),
                                const PassesListScreen(),
                                const LocationsScreen(),
                                const AddStaffScreen(),
                                const DynamicPricingScreen(),
                                const AnalyticsDashboardScreen(),
                                const SettingsScreen(),
                                const FinanceScreen(),
                                const VerificationInboxScreen(),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeaderLocationSelector() {
    final availableLocsAsync = ref.watch(availableLocationsProvider);
    final selectedLocId = ref.watch(selectedLocationIdProvider);

    return Row(
      children: [
        IconButton(
          icon: const Icon(Icons.settings_outlined,
              color: Colors.white70, size: 20),
          onPressed: () => _onItemTapped(8), // Navigate to Settings
          tooltip: 'Settings',
        ),
        const SizedBox(width: 8),
        const VerticalDivider(
            color: Colors.white24, indent: 20, endIndent: 20, width: 1),
        const SizedBox(width: 8),
        const Icon(Icons.location_on_outlined, color: Colors.white70, size: 18),
        const SizedBox(width: 8),
        availableLocsAsync.when(
          data: (locs) {
            if (locs.isEmpty) return const SizedBox();

            final validLocs =
                locs.where((l) => l['display_id'] != null).toList();

            return Theme(
              data: Theme.of(context).copyWith(
                canvasColor: AppTheme.headerBackground,
              ),
              child: DropdownButton<String>(
                value: selectedLocId,
                underline: const SizedBox(),
                dropdownColor: AppTheme.headerBackground,
                iconEnabledColor: Colors.white70,
                onChanged: (id) {
                  if (id != null) {
                    ref.read(selectedLocationIdProvider.notifier).state = id;
                  }
                },
                items: validLocs
                    .map((l) => DropdownMenuItem(
                          value: l['display_id'] as String,
                          child: Text(
                            '${l['name']} (${l['display_id']})',
                            style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Colors.white),
                          ),
                        ))
                    .toList(),
              ),
            );
          },
          loading: () => const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: Colors.white70)),
          error: (err, __) => const SizedBox(),
        ),
      ],
    );
  }

  Widget _buildLogo() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.white, size: 24),
          const SizedBox(width: 12),
          Text(
            'payparq.ai',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileSection(Map<String, dynamic> profile) {
    final name = profile['name'] ?? 'Admin User';
    final email = profile['email'] ?? 'admin@payparq.ai';
    final locationId = profile['location_id'] ?? '-----';
    final isSuperAdmin = profile['role'] == 'super_admin';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: Color(0xFFE5E7EB)),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child:
                const Icon(Icons.person_outline, size: 20, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (!isSuperAdmin)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.blue[100]!),
                        ),
                        child: Text(
                          locationId,
                          style: GoogleFonts.robotoMono(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue[700],
                          ),
                        ),
                      ),
                  ],
                ),
                Text(
                  email,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorScreen(String message) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 24),
              Text(
                'Connection Error',
                style: GoogleFonts.inter(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: Colors.grey[600]),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(userProfileProvider);
                  ref.invalidate(availableLocationsProvider);
                },
                child: const Text('Retry Connection'),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: _handleLogout,
                child: const Text('Sign Out'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFinalizingScreen() {
    return const PulsatingLoadingScreen();
  }

  Widget _buildSidebarHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 12,
          color: Colors.grey[500],
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildSidebarItem(int index, String title, IconData icon,
      {bool isSelected = false, int? badgeCount, VoidCallback? onTapOverride}) {
    final bool active = isSelected || _selectedIndex == index;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: active ? Colors.white.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: active ? Colors.white : Colors.grey[500],
          size: 20,
        ),
        title: Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: active ? FontWeight.bold : FontWeight.w500,
            color: active ? Colors.white : Colors.grey[400],
          ),
        ),
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        onTap: onTapOverride ?? () => _onItemTapped(index),
      ),
    );
  }
}
