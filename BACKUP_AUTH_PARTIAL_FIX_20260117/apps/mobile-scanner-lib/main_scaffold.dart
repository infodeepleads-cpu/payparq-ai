import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../responsive/responsive_layout.dart';
import '../logic/providers/auth_providers.dart';
import '../screens/hud_screen.dart'; // Mobile Scanner
import '../screens/admin/admin_dashboard_screen.dart'; // Users List
import '../features/enforcement/screens/cases_list_view.dart';
import '../features/enforcement/screens/upload_case_form.dart';
import '../features/management/screens/passes_list_screen.dart';
import '../features/management/screens/locations_screen.dart';
import '../features/management/screens/add_staff_screen.dart';
import '../features/intelligence/screens/dynamic_pricing_screen.dart';
import '../features/intelligence/screens/analytics_dashboard_screen.dart';
import '../screens/settings_screen.dart';
import '../theme.dart';

class MasterScaffold extends ConsumerStatefulWidget {
  const MasterScaffold({super.key});

  @override
  ConsumerState<MasterScaffold> createState() => _MasterScaffoldState();
}

class _MasterScaffoldState extends ConsumerState<MasterScaffold> {
  // Default to 2 (Main Dashboard) to match new order
  int _selectedIndex = 2;

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
        return const UploadCaseForm();
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
      default:
        return const AdminDashboardScreen();
    }
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
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex == 2 ? 0 : (_selectedIndex == 0 ? 1 : 2),
        children: const [
          AdminDashboardScreen(),
          HudScreen(),
          SettingsScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: Colors.white,
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: Colors.grey,
        currentIndex: _selectedIndex == 2 ? 0 : (_selectedIndex == 0 ? 1 : 2),
        onTap: (index) {
          if (index == 0)
            _onItemTapped(2);
          else if (index == 1)
            _onItemTapped(0);
          else
            _onItemTapped(7);
        },
        items: const [
          BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
          BottomNavigationBarItem(
              icon: Icon(Icons.qr_code_scanner), label: 'Scanner'),
          BottomNavigationBarItem(
              icon: Icon(Icons.settings_outlined), label: 'Settings'),
        ],
      ),
    );
  }

  // Desktop: Custom Sidebar Navigation
  Widget _buildDesktopScaffold() {
    final profileAsync = ref.watch(userProfileProvider);

    return profileAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
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
                onPressed: () => ref.refresh(userProfileProvider),
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
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 24),
                  Text(
                    'Finalizing your account...',
                    style: GoogleFonts.inter(
                        fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text('This usually takes a few seconds.'),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => ref.refresh(userProfileProvider),
                    child: const Text('Refresh Now'),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Supabase.instance.client.auth.signOut(),
                    child: const Text('Sign Out'),
                  ),
                ],
              ),
            ),
          );
        }

        final name = profile['name'] ?? 'Admin User';
        final email = profile['email'] ?? 'admin@payparq.ai';

        return Scaffold(
          backgroundColor: AppTheme.lightBackground,
          body: Row(
            children: [
              // Sidebar
              Container(
                width: 250,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    right: BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                ),
                child: Column(
                  children: [
                    // Logo
                    Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle,
                              color: AppTheme.primary),
                          const SizedBox(width: 8),
                          Text(
                            'payparq.ai',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          _buildSidebarHeader('Enforcement'),
                          _buildSidebarItem(0, 'Cases', Icons.folder_outlined),
                          _buildSidebarItem(
                              1, 'Upload Case', Icons.cloud_upload_outlined),
                          const SizedBox(height: 16),
                          _buildSidebarHeader('Management'),
                          _buildSidebarItem(
                              2, 'Dashboard', Icons.dashboard_outlined),
                          _buildSidebarItem(3, 'Add Pass/Sub',
                              Icons.card_membership_outlined),
                          _buildSidebarItem(4, 'Add Location',
                              Icons.add_location_alt_outlined),
                          _buildSidebarItem(5, 'Add Admin/Officer',
                              Icons.admin_panel_settings_outlined),
                          const SizedBox(height: 16),
                          _buildSidebarHeader('Intelligence'),
                          _buildSidebarItem(6, 'Dynamic Pricing',
                              Icons.price_change_outlined),
                          _buildSidebarItem(
                              7, 'Analytics', Icons.insights_outlined),
                          const SizedBox(height: 16),
                          _buildSidebarHeader('Settings'),
                          _buildSidebarItem(
                              8, 'System Settings', Icons.settings_outlined),
                        ],
                      ),
                    ),
                    // Profile Section
                    Container(
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
                              color: Colors.purple[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.person_outline,
                                size: 20, color: Colors.purple),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  email,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: Colors.grey,
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
              ),
              // Main Content Area
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
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
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
      {bool isSelected = false, int? badgeCount}) {
    // Determine active state based on selected index OR explicit isSelected flag for demo
    // In a real app, you'd map these indices to routes
    final bool active = isSelected || _selectedIndex == index;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: active ? Colors.grey[100] : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: active ? Colors.black : Colors.grey[600],
          size: 20,
        ),
        title: Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: active ? FontWeight.w600 : FontWeight.w400,
            color: active ? Colors.black : Colors.grey[700],
          ),
        ),
        trailing: badgeCount != null
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badgeCount.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              )
            : null,
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
        onTap: () => _onItemTapped(index),
      ),
    );
  }
}
