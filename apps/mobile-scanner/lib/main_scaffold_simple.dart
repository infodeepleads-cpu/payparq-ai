import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../logic/providers/auth_providers_simple.dart';
import '../screens/hud_screen.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/settings_screen.dart';
import '../theme.dart';

class MasterScaffold extends ConsumerStatefulWidget {
  const MasterScaffold({super.key});

  @override
  ConsumerState<MasterScaffold> createState() => _MasterScaffoldState();
}

class _MasterScaffoldState extends ConsumerState<MasterScaffold> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Future<void> _handleLogout() async {
    await Supabase.instance.client.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    
    if (profileAsync.isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final profile = profileAsync.value;
    if (profile == null) {
      return const Scaffold(
        body: Center(child: Text('No profile found')),
      );
    }

    final role = profile['role'] ?? 'officer';
    
    // Simple navigation based on role
    Widget getScreenForIndex(int index) {
      if (role == 'admin') {
        switch (index) {
          case 0:
            return const AdminDashboardScreen();
          case 1:
            return const HudScreen();
          case 2:
            return const SettingsScreen();
          default:
            return const AdminDashboardScreen();
        }
      } else {
        // Officer or other roles
        switch (index) {
          case 0:
            return const HudScreen();
          case 1:
            return const SettingsScreen();
          default:
            return const HudScreen();
        }
      }
    }

    List<BottomNavigationBarItem> getNavItems() {
      if (role == 'admin') {
        return const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.camera), label: 'Scanner'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ];
      } else {
        return const [
          BottomNavigationBarItem(icon: Icon(Icons.camera), label: 'Scanner'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ];
      }
    }

    return Scaffold(
      body: getScreenForIndex(_selectedIndex),
      bottomNavigationBar: BottomNavigationBar(
        items: getNavItems(),
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
      ),
    );
  }
}