import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../responsive/responsive_layout.dart';
import '../logic/providers/auth_providers.dart';
import '../logic/providers/locale_provider.dart';
import '../logic/providers/auth_controller.dart';
import '../utils/async_action_handler.dart';
import '../services/error_mapper.dart';
import '../screens/deferred/hud_loader.dart' deferred as hud_mod;
import '../features/enforcement/deferred/cases_loader.dart'
    deferred as cases_mod;
import '../features/enforcement/deferred/upload_case_loader.dart'
    deferred as upload_case_mod;
import '../features/management/deferred/passes_loader.dart'
    deferred as passes_mod;
import '../features/management/deferred/add_staff_loader.dart'
    deferred as staff_mod;
import '../features/management/deferred/verification_inbox_loader.dart'
    deferred as verification_mod;
import '../features/management/deferred/locations_loader.dart'
    deferred as locations_mod;
import '../screens/deferred/settings_loader.dart' deferred as settings_mod;
import '../widgets/skeleton_loader.dart';
import '../theme.dart';
import '../features/intelligence/deferred/analytics_loader.dart'
    deferred as analytics_mod;
import '../features/intelligence/deferred/dynamic_pricing_loader.dart'
    deferred as pricing_mod;
import '../features/intelligence/deferred/finance_loader.dart'
    deferred as finance_mod;
import '../screens/admin/deferred/admin_loader.dart' deferred as admin_mod;
import 'package:shared_preferences/shared_preferences.dart';

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
    // Pre-load dashboard and other critical deferred modules
    Future.delayed(const Duration(milliseconds: 500), () {
      admin_mod.loadLibrary().catchError((_) {});
      hud_mod.loadLibrary().catchError((_) {});
      cases_mod.loadLibrary().catchError((_) {});
    });
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  String _selectedLocationDisplayKeyFor(String userId) =>
      'selected_location_display_id_$userId';

  String _selectedLocationUuidKeyFor(String userId) =>
      'selected_location_uuid_$userId';

  Future<void> _handleLogout() async {
    final isHr = ref.read(localeIsCroatianProvider);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(Lang.sel(isHr, 'Sign Out', 'Odjava')),
        content: Text(Lang.sel(
            isHr, 'Are you sure you want to sign out?', 'Jeste li sigurni?')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(Lang.sel(isHr, 'Cancel', 'Odustani')),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(Lang.sel(isHr, 'Sign Out', 'Odjava')),
          ),
        ],
      ),
    );
    if (!mounted) return;
    if (confirm != true) return;

    final currentUserId = ref.read(authControllerProvider).currentUserId();
    ref.read(selectedLocationIdProvider.notifier).state = null;
    _selectedIndex = 2;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('selected_location_display_id');
    await prefs.remove('selected_location_uuid');
    if (currentUserId != null && currentUserId.isNotEmpty) {
      await prefs.remove(_selectedLocationDisplayKeyFor(currentUserId));
      await prefs.remove(_selectedLocationUuidKeyFor(currentUserId));
    }

    ref.invalidate(userProfileProvider);
    ref.invalidate(availableLocationsProvider);
    ref.invalidate(authStateProvider);

    if (!mounted) return;
    await AsyncActionHandler.run<void>(
      context: context,
      action: () => ref.read(authControllerProvider).signOut(),
      successMessage: Lang.sel(isHr, 'Signed out', 'Odjavljeni ste'),
      errorBuilder: ErrorMapper.message,
    );
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

    final profileAsync = ref.watch(userProfileProvider);
    final profile = profileAsync.value;

    final isOfficer = profile?['role'] == 'officer';

    // Handle profile loading states
    if (profile == null) {
      if (profileAsync.isLoading) {
        final user = ref.read(authControllerProvider).currentUser();
        if (user != null) {
          final warmProfile = {
            'id': user.id,
            'email': user.email,
            'role': user.userMetadata?['role'] ?? 'officer',
            'location_id': user.userMetadata?['location_id'],
            'full_name': user.userMetadata?['name'] ?? 'User',
            '_warm_fallback': true,
          };
          final warmIsOfficer = warmProfile['role'] == 'officer';
          return _buildScaffoldWithProfile(
              warmProfile, availableLocsAsync, selectedLocId, warmIsOfficer);
        }
        return Scaffold(
          backgroundColor: AppTheme.background,
          body: Center(
            child: Text(
              'payparq.ai',
              style: GoogleFonts.inter(
                color: Colors.black,
                fontWeight: FontWeight.w900,
                fontSize: 22,
                letterSpacing: -0.6,
              ),
            ),
          ),
        );
      } else {
        // Profile is null and not loading - this shouldn't happen with immediate fallback
        // Emergency fallback - use basic user data from session
        final user = ref.read(authControllerProvider).currentUser();
        if (user != null) {
          final emergencyProfile = {
            'id': user.id,
            'email': user.email,
            'role': user.userMetadata?['role'] ?? 'officer',
            'location_id': user.userMetadata?['location_id'],
            'full_name': user.userMetadata?['name'] ?? 'User',
            '_emergency_fallback': true,
          };
          // Continue with emergency profile
          return _buildScaffoldWithProfile(
              emergencyProfile, availableLocsAsync, selectedLocId, isOfficer);
        }
      }
    }

    // Final null check - if profile is still null, show loading
    if (profile == null) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(
          child: Text(
            'payparq.ai',
            style: GoogleFonts.inter(
              color: Colors.black,
              fontWeight: FontWeight.w900,
              fontSize: 22,
              letterSpacing: -0.6,
            ),
          ),
        ),
      );
    }

    return _buildScaffoldWithProfile(
        profile, availableLocsAsync, selectedLocId, isOfficer);
  }

  Widget _buildScaffoldWithProfile(
      Map<String, dynamic> profile,
      AsyncValue<List<Map<String, dynamic>>> availableLocsAsync,
      String? selectedLocId,
      bool isOfficer) {
    final displayLocId = selectedLocId;
    final isHr = ref.watch(localeIsCroatianProvider);

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
                          color: Colors.white.withValues(alpha: 0.4),
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
          IconButton(
            icon: const Icon(Icons.location_on_outlined, color: Colors.white),
            onPressed: () {
              final fallbackId = ref.read(userLocationIdProvider) ??
                  (profile['location_id']?.toString());
              availableLocsAsync.when(
                data: (locs) {
                  showModalBottomSheet(
                    context: context,
                    shape: const RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    builder: (context) => SafeArea(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          maxHeight: MediaQuery.of(context).size.height * 0.7,
                        ),
                        child: SingleChildScrollView(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                    Lang.sel(isHr, 'Select Active Lot',
                                        'Odaberite aktivno parkiralište'),
                                    style: GoogleFonts.inter(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18)),
                                const SizedBox(height: 16),
                                if (locs.isEmpty && (fallbackId == null))
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 24),
                                    child: Text(
                                      Lang.sel(isHr, 'No lots available yet.',
                                          'Još nema dostupnih parkirališta.'),
                                      style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: Colors.white
                                              .withValues(alpha: 0.7)),
                                    ),
                                  ),
                                if (locs.isEmpty && (fallbackId != null))
                                  ListTile(
                                    leading: const Icon(Icons.location_on),
                                    title: Text(Lang.sel(
                                        isHr, 'Fallback Lot', 'Rezervno')),
                                    subtitle: Text(fallbackId),
                                    onTap: () {
                                      ref
                                          .read(selectedLocationIdProvider
                                              .notifier)
                                          .state = fallbackId;
                                      () async {
                                        final prefs = await SharedPreferences
                                            .getInstance();
                                        final isDid = RegExp(r'^\d{5}$')
                                            .hasMatch(fallbackId);
                                        final userId = ref
                                            .read(authControllerProvider)
                                            .currentUserId();
                                        if (isDid) {
                                          await prefs.setString(
                                              'selected_location_display_id',
                                              fallbackId);
                                          if (userId != null &&
                                              userId.isNotEmpty) {
                                            await prefs.setString(
                                                _selectedLocationDisplayKeyFor(
                                                    userId),
                                                fallbackId);
                                          }
                                        }
                                      }();
                                      Navigator.pop(context);
                                    },
                                  ),
                                ...locs.map((l) => ListTile(
                                      leading: const Icon(Icons.location_on),
                                      title: Text(l['name']),
                                      subtitle: Text(l['display_id']),
                                      onTap: () {
                                        final did =
                                            (l['display_id'] ?? '').toString();
                                        final uuid = (l['id'] ?? '').toString();
                                        ref
                                            .read(selectedLocationIdProvider
                                                .notifier)
                                            .state = did;
                                        () async {
                                          final prefs = await SharedPreferences
                                              .getInstance();
                                          final userId = ref
                                              .read(authControllerProvider)
                                              .currentUserId();
                                          if (did.isNotEmpty) {
                                            await prefs.setString(
                                                'selected_location_display_id',
                                                did);
                                            if (userId != null &&
                                                userId.isNotEmpty) {
                                              await prefs.setString(
                                                  _selectedLocationDisplayKeyFor(
                                                      userId),
                                                  did);
                                            }
                                          }
                                          if (uuid.isNotEmpty) {
                                            await prefs.setString(
                                                'selected_location_uuid', uuid);
                                            if (userId != null &&
                                                userId.isNotEmpty) {
                                              await prefs.setString(
                                                  _selectedLocationUuidKeyFor(
                                                      userId),
                                                  uuid);
                                            }
                                          }
                                        }();
                                        Navigator.pop(context);
                                      },
                                    )),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
                loading: () {
                  showModalBottomSheet(
                    context: context,
                    shape: const RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    builder: (context) => Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SkeletonLoader(height: 24, width: 180),
                          const SizedBox(height: 24),
                          const SkeletonLoader(height: 60),
                          const SizedBox(height: 12),
                          const SkeletonLoader(height: 60),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  );
                },
                error: (_, __) {
                  showModalBottomSheet(
                    context: context,
                    shape: const RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(20)),
                    ),
                    builder: (context) => Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Text(
                        Lang.sel(isHr, 'Failed to load locations.',
                            'Ne mogu učitati parkirališta.'),
                        style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.white.withValues(alpha: 0.7)),
                      ),
                    ),
                  );
                },
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            tooltip: Lang.sel(isHr, 'Settings', 'Postavke'),
            onPressed: () async {
              await settings_mod.loadLibrary();
              if (!mounted) return;
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => settings_mod.buildSettingsScreen(),
                ),
              );
            },
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
  } // End of _buildScaffoldWithProfile

  Widget _buildMobileBody(bool isOfficer) {
    return IndexedStack(
      index: _selectedIndex == 2 ? 0 : (_selectedIndex == 1 ? 1 : 2),
      children: [
        _DeferredPage(
          load: () => admin_mod.loadLibrary(),
          build: () => admin_mod.buildAdminDashboard(),
        ),
        _DeferredPage(
          load: () => hud_mod.loadLibrary(),
          build: () => hud_mod.buildHudScreen(),
        ),
        _DeferredPage(
          load: () => cases_mod.loadLibrary(),
          build: () => cases_mod.buildCasesListView(),
        ),
      ],
    );
  }

  Widget _buildMobileBottomNav(bool isOfficer) {
    final isHr = ref.watch(localeIsCroatianProvider);
    return BottomNavigationBar(
      backgroundColor: Colors.white,
      selectedItemColor: AppTheme.primary,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      currentIndex: _selectedIndex == 2 ? 0 : (_selectedIndex == 1 ? 1 : 2),
      onTap: (index) {
        if (index == 0) {
          _onItemTapped(2); // Dashboard (Home)
        } else if (index == 1) {
          _onItemTapped(1); // Scanner
        } else if (index == 2) {
          _onItemTapped(0); // Cases
        }
      },
      items: [
        BottomNavigationBarItem(
          icon: const Icon(Icons.dashboard_outlined),
          activeIcon: const Icon(Icons.dashboard),
          label: Lang.sel(isHr, 'Home', 'Početna'),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.qr_code_scanner_outlined),
          activeIcon: const Icon(Icons.qr_code_scanner),
          label: Lang.sel(isHr, 'Scanner', 'Skeniranje'),
        ),
        BottomNavigationBarItem(
          icon: const Icon(Icons.assignment_outlined),
          activeIcon: const Icon(Icons.assignment),
          label: Lang.sel(isHr, 'Cases', 'Predmeti'),
        ),
      ],
    );
  }

  // Desktop: Custom Sidebar Navigation
  Widget _buildDesktopScaffold() {
    final availableLocsAsync = ref.watch(availableLocationsProvider);
    final selectedLocId = ref.watch(selectedLocationIdProvider);
    final profileAsync = ref.watch(userProfileProvider);
    final profile = profileAsync.value;

    if (profile == null) {
      final user = ref.read(authControllerProvider).currentUser();
      if (user != null) {
        final emergencyProfile = {
          'id': user.id,
          'email': user.email,
          'role': user.userMetadata?['role'] ?? 'admin',
          'location_id': user.userMetadata?['location_id'],
          'full_name': user.userMetadata?['name'] ?? 'User',
          '_emergency_fallback': true,
        };
        return _buildScaffoldWithProfileDesktop(
            emergencyProfile, profileAsync, availableLocsAsync, selectedLocId);
      }
      return Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(
          child: Text(
            'payparq.ai',
            style: GoogleFonts.inter(
              color: Colors.black,
              fontWeight: FontWeight.w900,
              fontSize: 24,
              letterSpacing: -0.6,
            ),
          ),
        ),
      );
    }

    return _buildScaffoldWithProfileDesktop(
        profile, profileAsync, availableLocsAsync, selectedLocId);
  }

  Widget _buildScaffoldWithProfileDesktop(
      Map<String, dynamic> profile,
      AsyncValue<Map<String, dynamic>?> profileAsync,
      AsyncValue<List<Map<String, dynamic>>> availableLocsAsync,
      String? selectedLocId) {
    final user = ref.read(authControllerProvider).currentUser();
    final roleRaw = (profile['role'] ?? user?.userMetadata?['role'] ?? 'admin')
        .toString()
        .trim()
        .toLowerCase();
    final role = (roleRaw == 'super_admin' ||
            roleRaw == 'admin' ||
            roleRaw == 'manager' ||
            roleRaw == 'officer')
        ? roleRaw
        : 'admin';
    final isOfficer = role == 'officer';
    final isManager = role == 'manager';
    final isSuperAdmin = role == 'super_admin';
    final isAdmin = role == 'admin';
    final showAdvanced = ref.watch(showAdvancedTabsProvider);
    final isHr = ref.watch(localeIsCroatianProvider);

    // Helper to determine if a menu item should be visible based on role
    bool shouldShow(int index) {
      if (showAdvanced && (index == 6 || index == 7)) return true;
      if (index == 10) return isSuperAdmin; // Verification Inbox
      if (isSuperAdmin || isAdmin) return true;
      if (isManager) {
        // Managers align with assigned-location data access
        return [0, 1, 2, 3, 5, 8].contains(index);
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
                _buildHeaderLocationSelector(),
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
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          children: [
                            if (shouldShow(2))
                              _buildSidebarItem(
                                  2,
                                  Lang.sel(isHr, 'Home', 'Početna'),
                                  Icons.dashboard_outlined),
                            if (shouldShow(1))
                              _buildSidebarItem(
                                  1,
                                  Lang.sel(
                                      isHr, 'Upload Case', 'Prenesi predmet'),
                                  Icons.drive_folder_upload_outlined),
                            if (shouldShow(0))
                              _buildSidebarItem(
                                  0,
                                  Lang.sel(isHr, 'Cases', 'Predmeti'),
                                  Icons.folder_outlined),
                            if (shouldShow(3) ||
                                shouldShow(4) ||
                                shouldShow(5)) ...[
                              const SizedBox(height: 16),
                              if (shouldShow(3))
                                _buildSidebarItem(
                                    3,
                                    Lang.sel(isHr, 'Permits', 'Dozvole'),
                                    Icons.card_membership_outlined),
                              if (shouldShow(4))
                                _buildSidebarItem(
                                    4,
                                    Lang.sel(isHr, 'Locations', 'Lokacije'),
                                    Icons.location_on_outlined),
                              if (shouldShow(5))
                                _buildSidebarItem(
                                    5,
                                    Lang.sel(isHr, 'Staff', 'Osoblje'),
                                    Icons.people_outline),
                              if (shouldShow(10))
                                _buildSidebarItem(
                                    10,
                                    Lang.sel(isHr, 'Inbox', 'Sandučić'),
                                    Icons.mail_outline),
                            ],
                            if (shouldShow(6) ||
                                shouldShow(7) ||
                                shouldShow(9)) ...[
                              const SizedBox(height: 16),
                              if (shouldShow(6))
                                _buildSidebarItem(
                                    6,
                                    Lang.sel(isHr, 'Pricing', 'Cijene'),
                                    Icons.price_change_outlined),
                              if (shouldShow(7))
                                _buildSidebarItem(
                                    7,
                                    Lang.sel(isHr, 'Analytics', 'Analitika'),
                                    Icons.insights_outlined),
                              if (shouldShow(9))
                                _buildSidebarItem(
                                    9,
                                    Lang.sel(isHr, 'Finance', 'Financije'),
                                    Icons.account_balance_outlined),
                            ],
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _buildSidebarItem(99,
                            Lang.sel(isHr, 'Sign Out', 'Odjava'), Icons.logout,
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
                              contentPadding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              leading: Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Icon(Icons.person_outline,
                                    size: 14, color: Colors.white),
                              ),
                              title: Text(
                                (() {
                                  final roleKey =
                                      (profile['role'] ?? 'user').toString();
                                  final roleLabel = {
                                        'super_admin': 'Super Admin',
                                        'admin': 'Admin',
                                        'manager': 'Manager',
                                        'officer': 'Officer',
                                      }[roleKey] ??
                                      'User';
                                  return roleLabel;
                                })(),
                                style: GoogleFonts.inter(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text(
                                (profile['email'] ?? 'admin@payparq.ai')
                                    .toString(),
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
                            _DeferredPage(
                              load: () => cases_mod.loadLibrary(),
                              build: () => cases_mod.buildCasesListView(),
                            ),
                            _DeferredPage(
                              load: () => upload_case_mod.loadLibrary(),
                              build: () =>
                                  upload_case_mod.buildUploadCaseForm(),
                            ),
                            _DeferredPage(
                              load: () => admin_mod.loadLibrary(),
                              build: () => admin_mod.buildAdminDashboard(),
                            ),
                            _DeferredPage(
                              load: () => passes_mod.loadLibrary(),
                              build: () => passes_mod.buildPassesListScreen(),
                            ),
                            _DeferredPage(
                              load: () => locations_mod.loadLibrary(),
                              build: () => locations_mod.buildLocationsScreen(),
                            ),
                            _DeferredPage(
                              load: () => staff_mod.loadLibrary(),
                              build: () => staff_mod.buildAddStaffScreen(),
                            ),
                            _DeferredPage(
                              load: () => pricing_mod.loadLibrary(),
                              build: () => pricing_mod.buildDynamicPricing(),
                            ),
                            _DeferredPage(
                              load: () => analytics_mod.loadLibrary(),
                              build: () => analytics_mod.buildAnalytics(),
                            ),
                            _DeferredPage(
                              load: () => settings_mod.loadLibrary(),
                              build: () => settings_mod.buildSettingsScreen(),
                            ),
                            _DeferredPage(
                              load: () => finance_mod.loadLibrary(),
                              build: () => finance_mod.buildFinance(),
                            ),
                            _DeferredPage(
                              load: () => verification_mod.loadLibrary(),
                              build: () => verification_mod
                                  .buildVerificationInboxScreen(),
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
        ],
      ),
    );
  }

  Widget _buildHeaderLocationSelector() {
    final availableLocsAsync = ref.watch(availableLocationsProvider);
    final selectedLocId = ref.watch(selectedLocationIdProvider);
    final isHr = ref.watch(localeIsCroatianProvider);

    return Row(
      children: [
        IconButton(
          icon: const Icon(Icons.settings_outlined,
              color: Colors.white70, size: 20),
          onPressed: () => _onItemTapped(8), // Navigate to Settings
          tooltip: Lang.sel(isHr, 'Settings', 'Postavke'),
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
            final Map<String, Map<String, dynamic>> byDid = {};
            for (final l in validLocs) {
              final did = (l['display_id'] ?? '').toString();
              if (did.isNotEmpty) {
                byDid[did] = l;
              }
            }
            final uniqueLocs = byDid.values.toList();
            final displayIds = byDid.keys.toSet();
            final currentValue =
                (selectedLocId != null && displayIds.contains(selectedLocId))
                    ? selectedLocId
                    : null;

            return Theme(
              data: Theme.of(context).copyWith(
                canvasColor: AppTheme.headerBackground,
              ),
              child: DropdownButton<String>(
                value: currentValue,
                underline: const SizedBox(),
                dropdownColor: AppTheme.headerBackground,
                iconEnabledColor: Colors.white70,
                onChanged: (id) {
                  if (id != null) {
                    ref.read(selectedLocationIdProvider.notifier).state = id;
                    () async {
                      final prefs = await SharedPreferences.getInstance();
                      final userId =
                          ref.read(authControllerProvider).currentUserId();
                      await prefs.setString('selected_location_display_id', id);
                      if (userId != null && userId.isNotEmpty) {
                        await prefs.setString(
                            _selectedLocationDisplayKeyFor(userId), id);
                      }
                    }();
                  }
                },
                items: uniqueLocs
                    .map((l) => DropdownMenuItem(
                          value: (l['display_id'] ?? '').toString(),
                          child: Text(
                            '${l['name']} (${(l['display_id'] ?? '').toString()})',
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
          loading: () => const SizedBox(width: 16, height: 16),
          error: (err, __) => const SizedBox(),
        ),
      ],
    );
  }

  Widget _buildSidebarItem(int index, String title, IconData icon,
      {bool isSelected = false, VoidCallback? onTapOverride}) {
    final bool active = isSelected || _selectedIndex == index;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color:
            active ? Colors.white.withValues(alpha: 0.1) : Colors.transparent,
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

class _DeferredPage extends StatefulWidget {
  final Future<void> Function() load;
  final Widget Function() build;
  const _DeferredPage({required this.load, required this.build});
  @override
  State<_DeferredPage> createState() => _DeferredPageState();
}

class _DeferredPageState extends State<_DeferredPage> {
  bool _loaded = false;
  @override
  void initState() {
    super.initState();
    widget.load().then((_) {
      if (mounted) {
        setState(() {
          _loaded = true;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) {
      return Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SkeletonLoader(height: 40, width: 200),
            const SizedBox(height: 16),
            const SkeletonLoader(height: 20, width: double.infinity),
            const SizedBox(height: 32),
            Expanded(
              child: ListView.separated(
                itemCount: 5,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, __) => const SkeletonLoader(height: 80),
              ),
            ),
          ],
        ),
      );
    }
    return widget.build();
  }
}
