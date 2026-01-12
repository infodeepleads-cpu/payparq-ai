import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../responsive/responsive_layout.dart';
import '../screens/hud_screen.dart'; // Mobile Scanner
import '../screens/admin/admin_dashboard_screen.dart'; // Users List
import '../screens/admin/cases_screen.dart';
import '../screens/admin/upload_case_screen.dart';
import '../screens/placeholder_screen.dart';
import '../theme.dart';

class MasterScaffold extends StatefulWidget {
  const MasterScaffold({super.key});

  @override
  State<MasterScaffold> createState() => _MasterScaffoldState();
}

class _MasterScaffoldState extends State<MasterScaffold> {
  // Default to 4 (Users/Add User) to match previous demo state
  int _selectedIndex = 4; 

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Widget _getDesktopPage(int index) {
    switch (index) {
      // Enforcement
      case 0: return const CasesScreen();
      case 1: return const UploadCaseScreen();
      
      // Intelligence
      case 2: return const PlaceholderScreen(title: 'AI Analytics', description: 'Deep insights into parking utilization and violations.', icon: Icons.analytics_outlined);
      case 3: return const PlaceholderScreen(title: 'DeepSeek Chatbot', description: 'Ask the AI anything about your parking lot status.', icon: Icons.chat_bubble_outline);
      
      // Management
      case 4: return const AdminDashboardScreen(); // Users
      case 5: return const PlaceholderScreen(title: 'Locations & Lots', description: 'Manage your parking zones and capacities.', icon: Icons.map_outlined);
      case 6: return const PlaceholderScreen(title: 'Add Guest/Pass', description: 'Issue temporary passes for visitors.', icon: Icons.person_add_alt_1_outlined);
      
      // Financials
      case 7: return const PlaceholderScreen(title: 'Billing', description: 'View invoices and subscription status.', icon: Icons.receipt_long_outlined);
      case 8: return const PlaceholderScreen(title: 'Payouts', description: 'Manage stripe payouts and bank accounts.', icon: Icons.payments_outlined);
      case 9: return const PlaceholderScreen(title: 'Revenue', description: 'Real-time revenue tracking dashboard.', icon: Icons.attach_money);
      
      // System
      case 10: return const PlaceholderScreen(title: 'Pricing Rules', description: 'Configure dynamic pricing engines.', icon: Icons.price_change_outlined);
      case 11: return const PlaceholderScreen(title: 'System Logs', description: 'Audit trails and system health logs.', icon: Icons.list_alt);
      case 12: return const PlaceholderScreen(title: 'Settings', description: 'Global system configuration.', icon: Icons.settings_outlined);
      case 13: return const PlaceholderScreen(title: 'Suspicious Alerts', description: 'AI-detected anomalies and security alerts.', icon: Icons.warning_amber_rounded);
      
      // Integrations
      case 14: return const PlaceholderScreen(title: 'LPR Config', description: 'Manage License Plate Recognition cameras.', icon: Icons.camera_alt_outlined);
      case 15: return const PlaceholderScreen(title: 'Smart Sign', description: 'Configure digital signage integrations.', icon: Icons.signpost_outlined);
      case 16: return const PlaceholderScreen(title: 'Sticker Download', description: 'Download QR codes and smart stickers.', icon: Icons.download_outlined);
      
      default: return const AdminDashboardScreen();
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

  // Mobile: Bottom Navigation
  Widget _buildMobileScaffold() {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: const [
          AdminDashboardScreen(), // Users List
          HudScreen(), // Scanner
          Center(child: Text('Settings')),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: Colors.white,
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: Colors.grey,
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Users'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner), label: 'Scanner'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }

  // Desktop: Custom Sidebar Navigation
  Widget _buildDesktopScaffold() {
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
                      const Icon(Icons.check_circle, color: AppTheme.primary),
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
                // Navigation Items
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _buildSidebarHeader('Enforcement'),
                      _buildSidebarItem(0, 'Cases', Icons.folder_outlined),
                      _buildSidebarItem(1, 'Upload Case', Icons.cloud_upload_outlined),
                      
                      const SizedBox(height: 16),
                      _buildSidebarHeader('Intelligence'),
                      _buildSidebarItem(2, 'AI Analytics', Icons.analytics_outlined),
                      _buildSidebarItem(3, 'DeepSeek Chatbot', Icons.chat_bubble_outline),

                      const SizedBox(height: 16),
                      _buildSidebarHeader('Management'),
                      _buildSidebarItem(4, 'Users (Admins)', Icons.people_outline),
                      _buildSidebarItem(5, 'Locations & Lots', Icons.map_outlined),
                      _buildSidebarItem(6, 'Add Guest/Pass', Icons.person_add_alt_1_outlined),

                      const SizedBox(height: 16),
                      _buildSidebarHeader('Financials'),
                      _buildSidebarItem(7, 'Billing', Icons.receipt_long_outlined),
                      _buildSidebarItem(8, 'Payouts', Icons.payments_outlined),
                      _buildSidebarItem(9, 'Revenue', Icons.attach_money),

                      const SizedBox(height: 16),
                      _buildSidebarHeader('System'),
                      _buildSidebarItem(10, 'Pricing Rules', Icons.price_change_outlined),
                      _buildSidebarItem(11, 'Logs', Icons.list_alt),
                      _buildSidebarItem(12, 'Settings', Icons.settings_outlined),
                      _buildSidebarItem(13, 'Suspicious Alerts', Icons.warning_amber_rounded, badgeCount: 3),

                      const SizedBox(height: 16),
                      _buildSidebarHeader('Integrations'),
                      _buildSidebarItem(14, 'LPR Config', Icons.camera_alt_outlined),
                      _buildSidebarItem(15, 'Smart Sign', Icons.signpost_outlined),
                      _buildSidebarItem(16, 'Sticker Download', Icons.download_outlined),
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
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '[location_id]',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              '[Email]',
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
            child: _getDesktopPage(_selectedIndex),
          ),
        ],
      ),
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

  Widget _buildSidebarItem(int index, String title, IconData icon, {bool isSelected = false, int? badgeCount}) {
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
