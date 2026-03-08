import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../../../widgets/admin_data_card.dart';
import '../repositories/parking_repository.dart';
import '../../../logic/providers/auth_providers.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../logic/providers/locale_provider.dart';
import '../../../widgets/skeleton_loader.dart';
import '../../../utils/list_search_filter.dart';
import '../../../utils/async_action_handler.dart';
import '../../../widgets/confirm_delete_dialog.dart';
import '../providers/staff_controller.dart';
import '../../../services/error_mapper.dart';

class AddStaffScreen extends ConsumerStatefulWidget {
  const AddStaffScreen({super.key});

  @override
  ConsumerState<AddStaffScreen> createState() => _AddStaffScreenState();
}

class _AddStaffScreenState extends ConsumerState<AddStaffScreen> {
  String _searchQuery = '';
  Timer? _searchDebounce;
  final Set<String> _optimisticDeletedIds = {};
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
    _searchDebounce?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);
    final staffAsync = ref.watch(staffStreamProvider);
    final isCroatian = ref.watch(localeIsCroatianProvider);

    return profileAsync.when(
      loading: () => Scaffold(
        backgroundColor: AppTheme.background,
        body: Padding(
          padding: const EdgeInsets.all(48.0),
          child: _buildSkeletonList(),
        ),
      ),
      error: (err, stack) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text(Lang.sel(isCroatian, 'Failed to load access profile: $err',
                  'Neuspjelo učitavanje profila pristupa: $err')),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(userProfileProvider),
                child: Text(Lang.sel(isCroatian, 'Retry', 'Pokušaj ponovo')),
              ),
            ],
          ),
        ),
      ),
      data: (profile) {
        final role = profile?['role'];
        final isSuperAdmin = role == 'super_admin';
        final isAdmin = role == 'admin';
        final isManager = role == 'manager';

        return Scaffold(
          backgroundColor: AppTheme.background,
          body: Padding(
            padding: const EdgeInsets.all(48.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // --- HEADER ---
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Lang.sel(isCroatian, 'Staff Accounts',
                              'Korisnički računi osoblja'),
                          style: GoogleFonts.inter(
                            fontSize: 40,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                            letterSpacing: -1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isSuperAdmin
                              ? Lang.sel(
                                  isCroatian,
                                  'Super Admin Mode: Full access to all team members.',
                                  'Super Admin način: Potpun pristup svim članovima tima.')
                              : Lang.sel(
                                  isCroatian,
                                  'Manage your team, managers, and officers.',
                                  'Upravljajte timom, menadžerima i službenicima.'),
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    if (isAdmin || isSuperAdmin || isManager)
                      ElevatedButton.icon(
                        onPressed: () => _showAddStaffDialog(context),
                        icon: const Icon(Icons.add, size: 18),
                        label: Text(
                            Lang.sel(isCroatian, 'Add Staff', 'Dodaj osoblje')),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4)),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 48),

                // --- SEARCH BAR ---
                SizedBox(
                  width: 400,
                  child: TextField(
                    onChanged: (val) {
                      _searchDebounce?.cancel();
                      _searchDebounce = Timer(
                        const Duration(milliseconds: 250),
                        () {
                          if (!mounted) return;
                          setState(() {
                            _searchQuery = val.trim().toLowerCase();
                            _visibleCount = 20;
                          });
                        },
                      );
                    },
                    decoration: InputDecoration(
                      hintText: Lang.sel(isCroatian, 'Search', 'Pretraži'),
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
                const SizedBox(height: 48),

                // --- STAFF LIST ---
                Expanded(
                  child: staffAsync.when(
                    loading: () => _buildSkeletonList(),
                    error: (err, stack) => Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error_outline,
                              color: Colors.red, size: 48),
                          const SizedBox(height: 16),
                          Text(Lang.sel(isCroatian, 'Error loading staff: $err',
                              'Greška pri učitavanju osoblja: $err')),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () =>
                                ref.invalidate(staffStreamProvider),
                            child: Text(Lang.sel(
                                isCroatian, 'Retry', 'Pokušaj ponovo')),
                          ),
                        ],
                      ),
                    ),
                    data: (allStaff) {
                      final filteredStaff = ListSearchFilter.filter(
                        items: allStaff,
                        query: _searchQuery,
                        fields: (user) => [
                          user['name']?.toString(),
                          user['email']?.toString(),
                        ],
                      ).where((user) {
                        final id = user['id']?.toString();
                        if (id == null) return true;
                        return !_optimisticDeletedIds.contains(id);
                      }).toList();

                      if (filteredStaff.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.people_outline,
                                  size: 64, color: Colors.grey[200]),
                              const SizedBox(height: 16),
                              Text(
                                  Lang.sel(
                                      isCroatian,
                                      'No staff members found.',
                                      'Nije pronađen nijedan član osoblja.'),
                                  style: TextStyle(color: Colors.grey[400])),
                            ],
                          ),
                        );
                      }

                      final visibleCount = _visibleCount > filteredStaff.length
                          ? filteredStaff.length
                          : _visibleCount;
                      return ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(0),
                        itemCount: visibleCount,
                        itemBuilder: (context, index) {
                          final user = filteredStaff[index];
                          final isOfficer = (user['role'] == 'officer');
                          final id = user['id'].toString();

                          return AdminDataCard(
                            leading: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: Colors.black,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Icon(
                                isOfficer
                                    ? Icons.local_police
                                    : Icons.admin_panel_settings,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            mainContent: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user['name'] ??
                                      Lang.sel(isCroatian, 'Unknown Name',
                                          'Nepoznato ime'),
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Colors.black,
                                  ),
                                ),
                                Text(
                                  user['email'] ??
                                      Lang.sel(isCroatian, 'No Email',
                                          'Bez e-pošte'),
                                  style: GoogleFonts.inter(
                                    color: AppTheme.textSecondary,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildStatusBadge(
                                  (user['role'] ?? 'officer').toUpperCase(),
                                ),
                                const SizedBox(width: 24),
                                ElevatedButton(
                                  onPressed: () => _showCredentialsDialog(
                                    user['email'] ?? '',
                                    user['raw_password'] ??
                                        Lang.sel(isCroatian, 'Already Changed',
                                            'Već promijenjeno'),
                                  ),
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
                                  child: Text(Lang.sel(isCroatian,
                                      'Credentials', 'Pristupni podaci')),
                                ),
                                const SizedBox(width: 12),
                                IconButton(
                                  icon: const Icon(
                                    Icons.delete_outline,
                                    color: Colors.black,
                                  ),
                                  onPressed: () => _confirmDelete(id),
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSkeletonList() {
    return ListView.builder(
      itemCount: 8,
      itemBuilder: (context, index) {
        return AdminDataCard(
          leading: SkeletonLoader(width: 160, height: 48),
          mainContent: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonLoader(width: 220, height: 14),
              const SizedBox(height: 8),
              SkeletonLoader(width: 140, height: 12),
            ],
          ),
          trailing: SkeletonLoader(width: 90, height: 32),
        );
      },
    );
  }

  Widget _buildStatusBadge(String role) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(
        role,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
    );
  }

  void _showCredentialsDialog(String email, String password) {
    final isCroatian = ref.read(localeIsCroatianProvider);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
            Lang.sel(isCroatian, 'Staff Credentials', 'Podaci za osoblje')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(Lang.sel(
                isCroatian,
                'These credentials can be used to log in immediately.',
                'Ovi podaci se mogu odmah koristiti za prijavu.')),
            const SizedBox(height: 16),
            _buildCredentialBox(
                Lang.sel(isCroatian, 'Email Address', 'Email adresa'), email),
            const SizedBox(height: 12),
            _buildCredentialBox(
                Lang.sel(
                    isCroatian, 'Generated Password', 'Generirana lozinka'),
                password),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final subject = Uri.encodeComponent(Lang.sel(
                      isCroatian,
                      'Your payparq.ai staff credentials',
                      'Vaši payparq.ai pristupni podaci'));
                  final body = Uri.encodeComponent(Lang.sel(
                      isCroatian,
                      'Welcome,\n\nHere are your login details:\n\nEmail: $email\nPassword: $password\n\nUse the app to sign in and begin.\n',
                      'Dobrodošli,\n\nVaši pristupni podaci:\n\nEmail: $email\nLozinka: $password\n\nKoristite aplikaciju za prijavu i početak rada.\n'));
                  final mailto = 'mailto:$email?subject=$subject&body=$body';
                  final uri = Uri.parse(mailto);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  } else {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(Lang.sel(
                            isCroatian,
                            'Unable to open email client',
                            'Nije moguće otvoriti email klijent')),
                      ),
                    );
                  }
                  if (!context.mounted) return;
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.email_outlined),
                label: Text(Lang.sel(isCroatian, 'Notify User via Email',
                    'Obavijesti korisnika putem e-pošte')),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(Lang.sel(isCroatian, 'Close', 'Zatvori')),
          ),
        ],
      ),
    );
  }

  Widget _buildCredentialBox(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600])),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Row(
            children: [
              Expanded(
                child: SelectableText(
                  value,
                  style: GoogleFonts.robotoMono(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[900],
                  ),
                ),
              ),
              const Icon(Icons.copy_all, size: 18, color: Colors.grey),
            ],
          ),
        ),
      ],
    );
  }

  void _confirmDelete(String id) {
    final isCroatian = ref.read(localeIsCroatianProvider);
    AsyncActionHandler.run<void>(
      context: context,
      action: () async {
        final confirm = await showConfirmDeleteDialog(
          context: context,
          title: Lang.sel(
              isCroatian, 'Delete Staff Member', 'Obriši člana osoblja'),
          message: Lang.sel(
              isCroatian,
              'Are you sure you want to delete this staff member?',
              'Jeste li sigurni da želite obrisati ovog člana osoblja?'),
          confirmLabel: Lang.sel(isCroatian, 'Delete', 'Obriši'),
          cancelLabel: Lang.sel(isCroatian, 'Cancel', 'Odustani'),
        );
        if (confirm != true) return;
        setState(() {
          _optimisticDeletedIds.add(id);
        });
        await ref.read(staffControllerProvider).deleteStaff(id);
      },
      errorBuilder: ErrorMapper.message,
      onError: (_) {
        if (!mounted) return;
        setState(() {
          _optimisticDeletedIds.remove(id);
        });
      },
    );
  }

  // --- ADD STAFF DIALOG ---
  void _showAddStaffDialog(BuildContext parentContext) async {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();

    final profile = ref.read(userProfileProvider).value;
    final isSuperAdmin = profile?['role'] == 'super_admin';

    final isManagerCreator = profile?['role'] == 'manager';

    // Fetch locations owned or assigned to this user
    final locations = await ref.read(availableLocationsProvider.future);

    // Default values
    String selectedRole = 'officer';
    List<String> selectedLocationIds = [];

    final formKey = GlobalKey<FormState>();
    bool isProcessing = false;

    if (parentContext.mounted) {
      showDialog(
        context: parentContext,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Text(Lang.sel(ref.read(localeIsCroatianProvider),
                'Add Staff Member', 'Dodaj člana osoblja')),
            content: SizedBox(
              width: 450,
              child: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        controller: nameCtrl,
                        decoration: InputDecoration(
                          labelText: Lang.sel(
                              ref.read(localeIsCroatianProvider),
                              'Full Name',
                              'Puno ime'),
                          prefixIcon: const Icon(Icons.person_outline),
                          border: const OutlineInputBorder(),
                        ),
                        validator: (v) => v == null || v.isEmpty
                            ? Lang.sel(ref.read(localeIsCroatianProvider),
                                'Name is required', 'Ime je obavezno')
                            : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: emailCtrl,
                        decoration: InputDecoration(
                          labelText: Lang.sel(
                              ref.read(localeIsCroatianProvider),
                              'Email Address',
                              'Email adresa'),
                          prefixIcon: const Icon(Icons.email_outlined),
                          border: const OutlineInputBorder(),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) {
                            return Lang.sel(ref.read(localeIsCroatianProvider),
                                'Email is required', 'Email je obavezan');
                          }
                          final emailRegex =
                              RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                          if (!emailRegex.hasMatch(v)) {
                            return Lang.sel(
                                ref.read(localeIsCroatianProvider),
                                'Enter a valid email address',
                                'Unesite valjanu email adresu');
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: selectedRole,
                        decoration: InputDecoration(
                          labelText: Lang.sel(
                              ref.read(localeIsCroatianProvider),
                              'Role',
                              'Uloga'),
                          prefixIcon: const Icon(Icons.shield_outlined),
                          border: const OutlineInputBorder(),
                        ),
                        items: [
                          if (isSuperAdmin)
                            DropdownMenuItem(
                                value: 'admin',
                                child: Text(Lang.sel(
                                    ref.read(localeIsCroatianProvider),
                                    'Admin (Full Access)',
                                    'Admin (potpuni pristup)'))),
                          if (!isManagerCreator)
                            DropdownMenuItem(
                                value: 'manager',
                                child: Text(Lang.sel(
                                    ref.read(localeIsCroatianProvider),
                                    'Manager (Full Access)',
                                    'Menadžer (potpuni pristup)'))),
                          DropdownMenuItem(
                              value: 'officer',
                              child: Text(Lang.sel(
                                  ref.read(localeIsCroatianProvider),
                                  'Officer (Enforcement Only)',
                                  'Službenik (samo nadzor)'))),
                        ],
                        onChanged: (v) =>
                            setDialogState(() => selectedRole = v!),
                      ),
                      if (selectedRole == 'officer' ||
                          selectedRole == 'manager') ...[
                        const SizedBox(height: 20),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            Lang.sel(ref.read(localeIsCroatianProvider),
                                'Assign Locations:', 'Dodijeli lokacije:'),
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          constraints: const BoxConstraints(maxHeight: 200),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey[300]!),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: ListView.builder(
                            shrinkWrap: true,
                            itemCount: locations.length,
                            itemBuilder: (context, index) {
                              final loc = locations[index];
                              final locId = (loc['id'] ?? '').toString();
                              final displayId = (loc['display_id'] ?? '').toString();
                              final isSelected =
                                  selectedLocationIds.contains(locId);

                              return CheckboxListTile(
                                title: Text(loc['name'] ??
                                    Lang.sel(ref.read(localeIsCroatianProvider),
                                        'Lot $displayId', 'Parkiralište $displayId')),
                                subtitle: Text(Lang.sel(
                                    ref.read(localeIsCroatianProvider),
                                    'ID: $displayId',
                                    'ID: $displayId')),
                                value: isSelected,
                                onChanged: (val) {
                                  setDialogState(() {
                                    if (val == true) {
                                      selectedLocationIds.add(locId);
                                    } else {
                                      selectedLocationIds.remove(locId);
                                    }
                                  });
                                },
                              );
                            },
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(Lang.sel(
                    ref.read(localeIsCroatianProvider), 'Cancel', 'Odustani')),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                ),
                onPressed: isProcessing
                    ? null
                    : () async {
                        if (formKey.currentState!.validate()) {
                          final requiresAssignment =
                              selectedRole == 'manager' ||
                                  selectedRole == 'officer';
                          if (requiresAssignment &&
                              selectedLocationIds.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(Lang.sel(
                                    ref.read(localeIsCroatianProvider),
                                    'Please select at least one location.',
                                    'Molimo odaberite barem jednu lokaciju.')),
                                backgroundColor: Colors.orange,
                              ),
                            );
                            return;
                          }

                          setDialogState(() => isProcessing = true);

                          try {
                            final controller =
                                ref.read(staffControllerProvider);
                            await controller.createStaff(
                              email: emailCtrl.text.trim(),
                              name: nameCtrl.text.trim(),
                              role: selectedRole,
                              locationIds: selectedLocationIds,
                            );

                            // On success:
                            if (context.mounted) {
                              Navigator.pop(context); // Close dialog

                              // Show success message
                              showDialog(
                                context: parentContext,
                                builder: (context) => AlertDialog(
                                  title: Text(Lang.sel(
                                      ref.read(localeIsCroatianProvider),
                                      'Account Created!',
                                      'Račun je kreiran!')),
                                  content: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(Lang.sel(
                                          ref.read(localeIsCroatianProvider),
                                          'The staff account is now active and ready for use.',
                                          'Korisnički račun je sada aktivan i spreman za korištenje.')),
                                      SizedBox(height: 16),
                                      Text(
                                          Lang.sel(
                                              ref.read(
                                                  localeIsCroatianProvider),
                                              'You can view and manage their credentials directly from the staff list.',
                                              'Podatke možete pregledati i upravljati njima iz liste osoblja.'),
                                          style: const TextStyle(
                                              fontSize: 13,
                                              color: Colors.grey)),
                                    ],
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: Text(Lang.sel(
                                          ref.read(localeIsCroatianProvider),
                                          'Great',
                                          'Odlično')),
                                    ),
                                  ],
                                ),
                              );
                            }
                          } catch (e) {
                            // On error:
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(Lang.sel(
                                      ref.read(localeIsCroatianProvider),
                                      'Error: ${ErrorMapper.message(e)}',
                                      'Greška: ${ErrorMapper.message(e)}')),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          } finally {
                            // Reset processing state
                            if (context.mounted) {
                              setDialogState(() => isProcessing = false);
                            }
                          }
                        }
                      },
                child: isProcessing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : Text(Lang.sel(ref.read(localeIsCroatianProvider),
                        'Create Account', 'Kreiraj račun')),
              ),
            ],
          ),
        ),
      );
    }
  }
}
